# ComfyUI N-Sidebar Extras

Version 2 extends ComfyUI’s official sidebar through `app.extensionManager.registerSidebarTab`. It is still a custom node: no patch to ComfyUI or frontend build is required.

This branch targets the current sidebar API and was developed against frontend **1.52.7**. The old floating sidebar, layout editor, search, pinned-node UI and keyboard shortcuts have been removed because ComfyUI provides those features.

| Extra | What it adds | Default |
| --- | --- | --- |
| Template collections | Named, colored, ordered collections of native node templates; insert and inspect them from the sidebar | On |
| External workflows | Read-only libraries outside the native user workflow directory, with virtual collections and node previews | On |
| Workflow inspector | Node-type counts, missing-node detection, subgraph inspection, locate nodes on the canvas, JSON report export | On |
| Civitai downloader | Search, choose a model version and file, download into ComfyUI model folders, progress, pause/resume/cancel | On |
| Import & export | Migrate legacy bookmarks/categories into the official node library, preserve template/workflow collections, export extra settings | On |
| Diagnostics | Read-only server, RAM and GPU information from ComfyUI’s existing system stats endpoint | Off |

Model integrity controls, collection previews and missing-node highlighting also have separate switches. Module switches take effect immediately and stop their panel’s polling when hidden. Disabling the downloader panel does not cancel a server download; use Cancel first when needed.

## Installation

Inside `ComfyUI/custom_nodes`:

```sh
git clone --branch feat/native-sidebar-extras https://github.com/Nuked88/ComfyUI-N-Sidebar.git
```

Restart ComfyUI and reload the browser. Open **Settings → N-Sidebar** to enable or disable each module. The extension uses ComfyUI’s existing `aiohttp`; it never installs packages at startup. Python 3.10 or newer is required.

For an existing checkout, back up `app/settings.json` and switch to this branch. No automatic data migration runs. Open **N · Import & export** and select **Import old server settings**, or choose an old settings JSON file. Import merges bookmarks, keeps missing node names, and saves a per-user backup in `n-sidebar-before-import.json` before changing data. Repeated imports do not duplicate bookmarks.

Extra collections are stored per ComfyUI user in `n-sidebar-extras.json`. Templates continue to use native `comfy.templates.json`. Save templates with ComfyUI’s existing **Save Selected as Template** canvas menu, then refresh the template collections panel. Old LiteGraph templates are converted when inserted; the source template is not rewritten.

## External workflow libraries

Set `NSIDEBAR_WORKFLOW_ROOTS` in the ComfyUI process environment, with one absolute directory per line. Existing `sb_wf_path` entries in `app/settings.json` are also recognized. In Docker, use paths visible inside the container. Refresh the panel after changing the libraries.

Only valid ComfyUI workflow JSON files within those roots are listed and served. Library files are read-only: **Open in tab** loads a native workflow tab; save through ComfyUI to create your own copy. Collections do not move or rename library files. Legacy name-based workflow collections are supported; new memberships use the complete library path.

## Civitai downloads

Network requests happen only when you search, look up a version or start a download. Set `CIVITAI_TOKEN` on the server for files requiring authentication. The token is not returned to the browser or included in exports. The selected API file URL is used; arbitrary download URLs are not accepted.

Choose a destination from ComfyUI’s registered model paths; the local model directory is selected by default when registered. Existing files are never overwritten. Partial files are removed on cancellation or error. Completed downloads are checked against Civitai’s SHA256 when available and receive a `.n-sidebar.json` sidecar. **Scan downloaded models** checks those sidecars; **Verify SHA256** detects same-size corruption. Existing models without v2 sidecars remain in the native model library.

One active download is allowed at a time. Pause applies to the current stream; it is not a persistent resumable download and a prolonged pause can expire the remote connection. Restarting ComfyUI interrupts active downloads. Supported destinations are checkpoints, LoRA/LoCon/DoRA, embeddings, VAE, ControlNet, upscalers, hypernetworks and motion modules.

The old remote shell console is replaced by optional read-only diagnostics. Bulk Civitai metadata rebuilding, arbitrary model deletion and the old floating layout are not included.

## Validation

```sh
node tests/core.test.mjs
python -m unittest discover -s tests -p 'test_*.py' -v
```

The Python tests need `aiohttp` (already supplied by ComfyUI). They cover route validation, symlink/path confinement, legacy token filtering, corruption detection, download hashes, concurrent starts, pause and cancellation.

The optional browser integration test uses the actual running frontend and Playwright:

```sh
python tests/browser_smoke.py --url http://127.0.0.1:8188
```

It exercises desktop and Android-style touch viewports, native tab registration, template insertion, previews, external workflow opening, legacy migration, downloader controls and module switches. Browser writes and Civitai requests are intercepted, so it does not install the extension, modify production settings or download models. Screenshots are saved under `/tmp/n-sidebar-artifacts`.

## Support and license

Created by [Nuked88](https://github.com/Nuked88). Support the project on [Ko-fi](https://ko-fi.com/C0C0AJECJ) or [Patreon](https://patreon.com/DreamingAIChannel). Licensed under [MIT](LICENSE).
