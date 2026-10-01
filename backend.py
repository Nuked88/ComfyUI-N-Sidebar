"""Local workflow libraries and explicitly requested Civitai downloads."""

import asyncio
import hashlib
import json
import os
from pathlib import Path
import uuid
from urllib.parse import urlsplit

import aiohttp
from aiohttp import web

BASE = Path(__file__).resolve().parent
MODEL_TYPES = {
    "Checkpoint": "checkpoints", "LORA": "loras", "LoCon": "loras",
    "DoRA": "loras", "TextualInversion": "embeddings", "VAE": "vae",
    "Controlnet": "controlnet", "Upscaler": "upscale_models",
    "Hypernetwork": "hypernetworks", "MotionModule": "animatediff_models",
}
MAX_WORKFLOW_BYTES = 16 * 1024 * 1024


def legacy_settings():
    path = BASE / "app" / "settings.json"
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def workflow_roots():
    configured = os.environ.get("NSIDEBAR_WORKFLOW_ROOTS", "")
    configured += "\n" + str(legacy_settings().get("sb_wf_path", ""))
    roots = []
    for line in configured.splitlines():
        if line.strip():
            path = Path(line.strip()).expanduser().resolve()
            if path.is_dir() and path not in roots:
                roots.append(path)
    return roots


def workflow_path(root, relative):
    candidate = (root / relative).resolve()
    if not candidate.is_relative_to(root) or candidate.suffix.lower() != ".json":
        raise ValueError("Workflow must be a JSON file inside the selected library")
    if candidate.stat().st_size > MAX_WORKFLOW_BYTES:
        raise ValueError("Workflow exceeds the 16 MiB limit")
    return candidate


def read_workflow(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("nodes"), list):
        raise ValueError("This JSON is not a ComfyUI workflow")
    return data


def list_workflows(roots):
    files = []
    for index, root in enumerate(roots):
        for path in sorted(root.rglob("*.json")):
            try:
                relative = path.relative_to(root).as_posix()
                read_workflow(workflow_path(root, relative))
            except (OSError, ValueError):
                continue
            files.append({"root": index, "path": relative, "name": path.stem})
    return files


def safe_filename(name):
    if (not isinstance(name, str) or not name or name in {".", ".."}
            or any(char in name for char in '/\\\x00:') or name != Path(name).name):
        raise ValueError("Invalid model filename")
    if Path(name).suffix.lower() not in {".safetensors", ".ckpt", ".pt", ".pth", ".bin", ".gguf"}:
        raise ValueError("Unsupported model file type")
    return name


def managed_models(folder_paths):
    """Only files downloaded by this extension have verifiable sidecar metadata."""
    roots = set()
    for folder in set(MODEL_TYPES.values()):
        try:
            roots.update(Path(root).resolve() for root in folder_paths.get_folder_paths(folder))
        except KeyError:
            continue
    models = []
    for root in sorted(roots):
        for sidecar in root.rglob("*.n-sidebar.json"):
            try:
                if not sidecar.resolve().is_relative_to(root) or sidecar.stat().st_size > 65536:
                    continue
                metadata = json.loads(sidecar.read_text(encoding="utf-8"))
                model = sidecar.with_name(sidecar.name.removesuffix(".n-sidebar.json"))
                if not model.resolve().is_relative_to(root):
                    continue
                expected = metadata.get("size")
                status = "missing" if not model.is_file() else "valid size" if model.stat().st_size == expected else "size mismatch"
                models.append({"id": hashlib.sha256(str(sidecar).encode()).hexdigest()[:24],
                               "name": model.name, "path": str(model), "status": status,
                               "model": metadata.get("model", {}).get("name", ""),
                               "sha256": metadata.get("sha256", "")})
            except (OSError, ValueError, TypeError, AttributeError):
                continue
    return models


def model_digest(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as model:
        for chunk in iter(lambda: model.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


class Downloads:
    def __init__(self, folder_paths):
        self.folder_paths = folder_paths
        self.jobs = {}
        self.tasks = {}
        self.start_lock = asyncio.Lock()

    def owner(self, request):
        import server
        return server.PromptServer.instance.user_manager.get_request_user_id(request)

    def public(self, job):
        return {key: value for key, value in job.items() if key not in {"owner", "gate", "token"}}

    async def version(self, version_id, token=""):
        if not isinstance(version_id, int) or isinstance(version_id, bool) or version_id <= 0:
            raise ValueError("Use a positive Civitai model version ID")
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        async with aiohttp.ClientSession(headers=headers, timeout=aiohttp.ClientTimeout(total=60)) as session:
            async with session.get(f"https://civitai.com/api/v1/model-versions/{version_id}") as response:
                response.raise_for_status()
                data = await response.json()
        files = [file for file in data.get("files", []) if file.get("type") == "Model"]
        return {
            "id": data["id"], "name": data.get("name", ""),
            "model": data.get("model", {}), "baseModel": data.get("baseModel", ""),
            "files": [{key: file.get(key) for key in ("id", "name", "sizeKB", "hashes", "primary", "downloadUrl")} for file in files],
        }

    def destination(self, model_type, name, selected=None):
        folder = MODEL_TYPES.get(model_type)
        if folder is None:
            raise ValueError("Unsupported Civitai model type")
        paths = self.folder_paths.get_folder_paths(folder)
        if not paths:
            raise ValueError(f"No ComfyUI model directory configured for {folder}")
        local = Path(self.folder_paths.models_dir) / folder
        if selected is not None:
            if not isinstance(selected, int) or isinstance(selected, bool) or not 0 <= selected < len(paths):
                raise ValueError("Unknown model destination")
            root = Path(paths[selected])
        else:
            root = local if str(local) in paths else Path(paths[0])
        root.mkdir(parents=True, exist_ok=True)
        destination = root / safe_filename(name)
        if destination.exists() or destination.is_symlink():
            raise ValueError("A file with this name already exists")
        return destination

    async def start(self, payload, owner):
        async with self.start_lock:
            return await self._start(payload, owner)

    async def _start(self, payload, owner):
        if not isinstance(payload, dict):
            raise ValueError("Invalid download request")
        if any(job["status"] in {"queued", "running", "paused"} for job in self.jobs.values()):
            raise ValueError("Finish or cancel the active download first")
        token = os.environ.get("CIVITAI_TOKEN", "")
        version = await self.version(payload.get("version"), token)
        file = next((f for f in version["files"] if f["id"] == payload.get("file")), None)
        if file is None:
            raise ValueError("Choose a file from this model version")
        url = urlsplit(file.get("downloadUrl") or "")
        if url.scheme != "https" or url.netloc != "civitai.com" or url.path != f"/api/download/models/{version['id']}":
            raise ValueError("Invalid Civitai file download URL")
        destination = self.destination(version["model"].get("type"), file["name"], payload.get("destination"))
        job_id = uuid.uuid4().hex
        job = {
            "id": job_id, "owner": owner, "name": file["name"], "status": "queued",
            "received": 0, "total": 0, "error": "", "gate": asyncio.Event(),
        }
        job["gate"].set()
        self.jobs[job_id] = job
        for old_id in list(self.jobs)[:-20]:
            if old_id not in self.tasks:
                self.jobs.pop(old_id)
        self.tasks[job_id] = asyncio.create_task(self.run(job, destination, version, file, token))
        def finished(task):
            if task.cancelled():
                job["status"] = "cancelled"
            self.tasks.pop(job_id, None)
        self.tasks[job_id].add_done_callback(finished)
        return self.public(job)

    async def run(self, job, destination, version, file, token):
        temporary = destination.with_name(destination.name + f".{job['id']}.part")
        digest = hashlib.sha256()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        try:
            if job["status"] == "queued":
                job["status"] = "running"
            timeout = aiohttp.ClientTimeout(total=None, connect=60, sock_read=120)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(file["downloadUrl"], headers=headers) as response:
                    response.raise_for_status()
                    job["total"] = int(response.headers.get("Content-Length", 0))
                    with temporary.open("xb") as output:
                        async for chunk in response.content.iter_chunked(1024 * 1024):
                            await job["gate"].wait()
                            write = asyncio.create_task(asyncio.to_thread(output.write, chunk))
                            try:
                                await asyncio.shield(write)
                            except asyncio.CancelledError:
                                await write
                                raise
                            digest.update(chunk)
                            job["received"] += len(chunk)
            if not job["received"]:
                raise ValueError("Empty model download")
            if job["total"] and job["received"] != job["total"]:
                raise ValueError("Incomplete download")
            expected = (file.get("hashes") or {}).get("SHA256")
            if expected and digest.hexdigest().lower() != expected.lower():
                raise ValueError("SHA256 verification failed")
            os.link(temporary, destination)
            temporary.unlink()
            metadata = {"version": version["id"], "model": version["model"],
                        "baseModel": version["baseModel"], "size": job["received"],
                        "sha256": digest.hexdigest()}
            destination.with_name(destination.name + ".n-sidebar.json").write_text(json.dumps(metadata, indent=2))
            job["status"] = "completed"
        except asyncio.CancelledError:
            job["status"] = "cancelled"
        except (aiohttp.ClientError, OSError, ValueError, asyncio.TimeoutError) as error:
            job["status"] = "failed"
            job["error"] = str(error)
        finally:
            temporary.unlink(missing_ok=True)
            self.tasks.pop(job["id"], None)


def register_routes():
    import folder_paths
    import server

    routes = server.PromptServer.instance.routes
    downloads = Downloads(folder_paths)

    @routes.get("/n-sidebar/legacy")
    async def legacy(request):
        data = legacy_settings()
        keys = ("sb_pinnedItems", "sb_categoryNodeMap", "sb_ColorCustomCategories",
                "sb_templateNodeMap", "sb_ColorCustomTemplates", "sb_workflowNodeMap", "sb_ColorCustomWorkflows")
        return web.json_response({key: data[key] for key in keys if key in data})

    @routes.get("/n-sidebar/workflows")
    async def workflows(request):
        roots = workflow_roots()
        files = await asyncio.to_thread(list_workflows, roots)
        return web.json_response({"roots": [str(root) for root in roots], "files": files})

    @routes.get("/n-sidebar/workflow")
    async def workflow(request):
        try:
            roots = workflow_roots()
            index = int(request.query.get("root", "-1"))
            if not 0 <= index < len(roots):
                raise ValueError("Unknown workflow library")
            path = workflow_path(roots[index], request.query.get("path", ""))
            data = await asyncio.to_thread(read_workflow, path)
            return web.json_response(data)
        except (ValueError, OSError) as error:
            return web.json_response({"error": str(error)}, status=400)

    @routes.get("/n-sidebar/civitai/search")
    async def search(request):
        params = {"limit": "12", "nsfw": "false"}
        for key in ("query", "types", "page"):
            if request.query.get(key):
                params[key] = request.query[key]
        try:
            token = os.environ.get("CIVITAI_TOKEN", "")
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            async with aiohttp.ClientSession(headers=headers, timeout=aiohttp.ClientTimeout(total=60)) as session:
                async with session.get("https://civitai.com/api/v1/models", params=params) as response:
                    response.raise_for_status()
                    data = await response.json()
            return web.json_response(data)
        except (aiohttp.ClientError, ValueError, asyncio.TimeoutError) as error:
            return web.json_response({"error": str(error)}, status=502)

    @routes.get("/n-sidebar/civitai/version/{version}")
    async def version(request):
        try:
            data = await downloads.version(int(request.match_info["version"]), os.environ.get("CIVITAI_TOKEN", ""))
            data["files"] = [{key: value for key, value in file.items() if key != "downloadUrl"} for file in data["files"]]
            return web.json_response(data)
        except (ValueError, aiohttp.ClientError, asyncio.TimeoutError) as error:
            return web.json_response({"error": str(error)}, status=400)

    @routes.get("/n-sidebar/model-paths")
    async def model_paths(request):
        folder = MODEL_TYPES.get(request.query.get("type"))
        if folder is None:
            return web.json_response({"error": "Unsupported model type"}, status=400)
        try:
            paths = folder_paths.get_folder_paths(folder)
        except KeyError:
            paths = []
        local = str(Path(folder_paths.models_dir) / folder)
        return web.json_response({"paths": paths, "default": paths.index(local) if local in paths else 0})

    @routes.get("/n-sidebar/downloads")
    async def progress(request):
        owner = downloads.owner(request)
        return web.json_response([downloads.public(job) for job in downloads.jobs.values() if job["owner"] == owner])

    @routes.get("/n-sidebar/models")
    async def models(request):
        entries = await asyncio.to_thread(managed_models, folder_paths)
        return web.json_response([{key: value for key, value in entry.items() if key != "path"} for entry in entries])

    @routes.post("/n-sidebar/models/{id}/verify")
    async def verify(request):
        entries = await asyncio.to_thread(managed_models, folder_paths)
        model = next((entry for entry in entries if entry["id"] == request.match_info["id"]), None)
        if model is None:
            raise web.HTTPNotFound()
        if model["status"] == "missing":
            return web.json_response({"status": "missing"})
        try:
            digest = await asyncio.to_thread(model_digest, model["path"])
            return web.json_response({"status": "verified" if digest == model["sha256"] else "hash mismatch"})
        except OSError as error:
            return web.json_response({"error": str(error)}, status=400)

    @routes.post("/n-sidebar/downloads")
    async def download(request):
        try:
            return web.json_response(await downloads.start(await request.json(), downloads.owner(request)), status=202)
        except (ValueError, OSError, aiohttp.ClientError, asyncio.TimeoutError) as error:
            return web.json_response({"error": str(error)}, status=400)

    @routes.post("/n-sidebar/downloads/{id}/{action}")
    async def control(request):
        job = downloads.jobs.get(request.match_info["id"])
        if job is None or job["owner"] != downloads.owner(request):
            raise web.HTTPNotFound()
        action = request.match_info["action"]
        if action not in {"pause", "resume", "cancel"} or job["status"] not in {"queued", "running", "paused"}:
            return web.json_response({"error": "Invalid download action"}, status=400)
        if action == "cancel":
            downloads.tasks[job["id"]].cancel()
        elif action == "pause":
            job["gate"].clear()
            job["status"] = "paused"
        else:
            job["gate"].set()
            job["status"] = "running"
        return web.json_response(downloads.public(job))
