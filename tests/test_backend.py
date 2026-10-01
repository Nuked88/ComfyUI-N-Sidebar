import asyncio
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from aiohttp import web
from aiohttp.test_utils import AioHTTPTestCase

spec = importlib.util.spec_from_file_location("n_sidebar_backend", Path(__file__).parents[1] / "backend.py")
backend = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend)


class WorkflowFiles(unittest.TestCase):
    def test_scan_excludes_secrets_and_links_outside_library(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            root = base / "library"
            root.mkdir()
            (root / "valid.json").write_text('{"nodes":[]}')
            (root / "credentials.json").write_text('{"secret":"do not serve"}')
            (base / "outside.json").write_text('{"nodes":[]}')
            (root / "escape.json").symlink_to(base / "outside.json")
            self.assertEqual([item["name"] for item in backend.list_workflows([root])], ["valid"])
            with self.assertRaises(ValueError):
                backend.workflow_path(root, "../outside.json")
            with self.assertRaises(ValueError):
                backend.workflow_path(root, "escape.json")

    def test_model_filename_validation(self):
        for name in ["../a.safetensors", "a\\b.pt", "a:stream.pt", "model.py", ".", ""]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                backend.safe_filename(name)
        self.assertEqual(backend.safe_filename("model v2.safetensors"), "model v2.safetensors")


class BackendRoutes(AioHTTPTestCase):
    async def get_application(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.base = Path(self.directory.name)
        self.library = self.base / "library"
        self.library.mkdir()
        (self.library / "demo.json").write_text('{"nodes":[{"type":"Test"}]}')
        self.models = self.base / "models" / "loras"
        self.models.mkdir(parents=True)
        self.routes = web.RouteTableDef()
        self.folder_paths = SimpleNamespace(models_dir=str(self.base / "models"),
            get_folder_paths=lambda key: [str(self.models)] if key == "loras" else [])
        self.prompt_server = SimpleNamespace(instance=SimpleNamespace(routes=self.routes,
            user_manager=SimpleNamespace(get_request_user_id=lambda request: request.headers.get("Comfy-User", "default"))))
        self.patch_modules = patch.dict(sys.modules, {"server": SimpleNamespace(PromptServer=self.prompt_server), "folder_paths": self.folder_paths})
        self.patch_modules.start()
        self.addCleanup(self.patch_modules.stop)
        self.patch_base = patch.object(backend, "BASE", self.base)
        self.patch_base.start()
        self.addCleanup(self.patch_base.stop)
        self.patch_env = patch.dict(backend.os.environ, {"NSIDEBAR_WORKFLOW_ROOTS": str(self.library)})
        self.patch_env.start()
        self.addCleanup(self.patch_env.stop)
        backend.register_routes()
        app = web.Application()
        app.add_routes(self.routes)
        return app

    async def test_workflow_routes_validate_root_and_file(self):
        response = await self.client.get("/n-sidebar/workflows")
        self.assertEqual(response.status, 200)
        self.assertEqual((await response.json())["files"][0]["name"], "demo")
        response = await self.client.get("/n-sidebar/workflow?root=0&path=demo.json")
        self.assertEqual((await response.json())["nodes"][0]["type"], "Test")
        for url in ["/n-sidebar/workflow?root=-1&path=demo.json", "/n-sidebar/workflow?root=0&path=../private.json"]:
            self.assertEqual((await self.client.get(url)).status, 400)

    async def test_legacy_route_never_exposes_api_token(self):
        (self.base / "app").mkdir()
        (self.base / "app" / "settings.json").write_text(json.dumps({"sb_w_API_key": "SECRET", "sb_pinnedItems": '["Test"]'}))
        response = await self.client.get("/n-sidebar/legacy")
        self.assertEqual(await response.json(), {"sb_pinnedItems": '["Test"]'})

    async def test_integrity_detects_same_size_corruption_and_missing_file(self):
        model = self.models / "sample.safetensors"
        model.write_bytes(b"correct")
        sidecar = self.models / "sample.safetensors.n-sidebar.json"
        sidecar.write_text(json.dumps({"model": {"name": "Demo"}, "size": 7, "sha256": hashlib.sha256(b"correct").hexdigest()}))
        response = await self.client.get("/n-sidebar/models")
        entry = (await response.json())[0]
        self.assertNotIn("path", entry)
        response = await self.client.post(f"/n-sidebar/models/{entry['id']}/verify")
        self.assertEqual((await response.json())["status"], "verified")
        model.write_bytes(b"changed")
        response = await self.client.post(f"/n-sidebar/models/{entry['id']}/verify")
        self.assertEqual((await response.json())["status"], "hash mismatch")
        model.unlink()
        response = await self.client.post(f"/n-sidebar/models/{entry['id']}/verify")
        self.assertEqual((await response.json())["status"], "missing")


class DownloadLifecycle(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.manager = backend.Downloads(SimpleNamespace(models_dir=str(self.root), get_folder_paths=lambda _: [str(self.root)]))
        self.body = b"model-contents"
        self.version = {"id": 123, "name": "v1", "model": {"name": "Demo", "type": "LORA"}, "baseModel": "SDXL",
            "files": [{"id": 456, "name": "test.safetensors", "hashes": {"SHA256": hashlib.sha256(self.body).hexdigest()},
                       "downloadUrl": "https://civitai.com/api/download/models/123?type=Model&format=SafeTensor"}]}
        async def version(version_id, token):
            await asyncio.sleep(0)
            return self.version
        self.manager.version = version

    def session(self, slow=False):
        body = self.body
        class Response:
            headers = {"Content-Length": str(len(body))}
            def raise_for_status(self): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            @property
            def content(self): return self
            async def iter_chunked(self, size):
                if slow:
                    await asyncio.sleep(10)
                yield body
        class Session:
            def __init__(self, **kwargs): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            def get(self, url, **kwargs):
                if "format=SafeTensor" not in url:
                    raise AssertionError("Must request the API's file-specific URL")
                return Response()
        return Session

    async def test_download_hash_and_metadata_and_no_overwrite(self):
        with patch.object(backend.aiohttp, "ClientSession", self.session()):
            job = await self.manager.start({"version": 123, "file": 456}, "alice")
            await self.manager.tasks[job["id"]]
        self.assertEqual(self.manager.jobs[job["id"]]["status"], "completed")
        self.assertEqual((self.root / "test.safetensors").read_bytes(), self.body)
        self.assertTrue((self.root / "test.safetensors.n-sidebar.json").exists())
        with self.assertRaisesRegex(ValueError, "already exists"):
            await self.manager.start({"version": 123, "file": 456}, "alice")

    async def test_bad_hash_removes_partial_file(self):
        self.version["files"][0]["hashes"]["SHA256"] = "bad"
        with patch.object(backend.aiohttp, "ClientSession", self.session()):
            job = await self.manager.start({"version": 123, "file": 456}, "alice")
            await self.manager.tasks[job["id"]]
        self.assertEqual(self.manager.jobs[job["id"]]["status"], "failed")
        self.assertEqual(list(self.root.iterdir()), [])

    async def test_concurrent_starts_only_create_one_download(self):
        with patch.object(backend.aiohttp, "ClientSession", self.session(slow=True)):
            jobs = await asyncio.gather(self.manager.start({"version": 123, "file": 456}, "alice"),
                self.manager.start({"version": 123, "file": 456}, "bob"), return_exceptions=True)
            self.assertEqual(sum(isinstance(job, ValueError) for job in jobs), 1)
            task = next(iter(self.manager.tasks.values()))
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)
            await asyncio.sleep(0)
        self.assertEqual(next(iter(self.manager.jobs.values()))["status"], "cancelled")
        self.assertEqual(self.manager.tasks, {})

    async def test_pause_and_cancel_clean_up(self):
        with patch.object(backend.aiohttp, "ClientSession", self.session()):
            job = await self.manager.start({"version": 123, "file": 456}, "alice")
            state = self.manager.jobs[job["id"]]
            state["gate"].clear()
            task = self.manager.tasks[job["id"]]
            await asyncio.sleep(0.02)
            self.assertEqual(state["received"], 0)
            task.cancel()
            await task
        self.assertEqual(state["status"], "cancelled")
        self.assertEqual(list(self.root.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
