"""Exercise the extension in an existing ComfyUI frontend with isolated browser writes.

Requires Playwright and its Chromium browser. All mutations and Civitai calls are
intercepted; this does not install the extension or download models on the server.
"""

import argparse
import asyncio
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit

from playwright.async_api import async_playwright

REPO = Path(__file__).resolve().parents[1]
WORKFLOW = {"id": "sidebar-test", "version": 0.4, "last_node_id": 1, "last_link_id": 0,
            "nodes": [{"id": 1, "type": "CLIPTextEncode", "pos": [100, 100], "size": [400, 200],
                       "flags": {}, "order": 0, "mode": 0, "inputs": [], "outputs": [],
                       "properties": {}, "widgets_values": ["N-Sidebar browser test"]}],
            "links": [], "groups": [], "config": {}, "extra": {}}
TEMPLATE = {"name": "Browser test template", "data": json.dumps({
    "nodes": WORKFLOW["nodes"], "links": [], "groups": [], "reroutes": [], "subgraphs": []})}


async def run(args):
    async with async_playwright() as playwright:
        launch = {"headless": True, "args": ["--no-sandbox"]}
        if args.chromium:
            launch["executable_path"] = args.chromium
        browser = await playwright.chromium.launch(**launch)
        for mobile in (False, True):
            context = await browser.new_context(viewport={"width": 412 if mobile else 1440, "height": 915 if mobile else 1000},
                                                is_mobile=mobile, has_touch=mobile, device_scale_factor=1)
            page = await context.new_page()
            errors = []
            console_errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
            shadow_settings = {"Comfy.UseNewMenu": "Top", "Comfy.NodeLibrary.Bookmarks.V2": ["KSampler"],
                               "Comfy.VueNodes.Enabled": False, "Comfy.OnboardingCoachmarks.Seen": True,
                               "Comfy.TutorialCompleted": True}
            user_data = {"comfy.templates.json": [TEMPLATE]}
            download_jobs = []
            writes = []

            async def intercept(route):
                request = route.request
                url = urlsplit(request.url)
                path = unquote(url.path)
                if path.startswith("/api/"):
                    path = path[4:]

                async def response(data, status=200):
                    await route.fulfill(status=status, content_type="application/json", body=json.dumps(data))

                if url.netloc != urlsplit(args.url).netloc:
                    await route.abort()
                    return
                if path == "/extensions":
                    await response(["/extensions/n-sidebar/sidebar.js"])
                elif path.startswith("/extensions/n-sidebar/"):
                    file = REPO / "web" / path.rsplit("/", 1)[-1]
                    await route.fulfill(path=str(file), content_type="text/css" if file.suffix == ".css" else "text/javascript")
                elif path == "/settings" or path.startswith("/settings/"):
                    if request.method == "POST":
                        value = request.post_data_json
                        if path == "/settings": shadow_settings.update(value)
                        else: shadow_settings[path.split("/", 2)[-1]] = value
                        writes.append(path)
                        await response({})
                    else:
                        await response(shadow_settings if path == "/settings" else shadow_settings.get(path.split("/", 2)[-1]))
                elif path.startswith("/userdata/"):
                    name = path[len("/userdata/"):]
                    if request.method == "POST":
                        user_data[name] = request.post_data_json
                        writes.append(path)
                        await response({})
                    elif name in user_data:
                        await response(user_data[name])
                    else:
                        await response({"error": "not found"}, 404)
                elif path == "/userdata":
                    await response([])
                elif path == "/n-sidebar/workflows":
                    await response({"roots": ["/test/library"], "files": [{"root": 0, "path": "Demo.json", "name": "Demo"}]})
                elif path == "/n-sidebar/workflow":
                    await response(WORKFLOW)
                elif path == "/n-sidebar/legacy":
                    await response({"sb_pinnedItems": '["LoadImage"]', "sb_categoryNodeMap": '{"My nodes":["KSampler"]}',
                                    "sb_templateNodeMap": '{"Imported":["Browser test template"]}'})
                elif path == "/n-sidebar/civitai/search":
                    await response({"items": [{"name": "Test Civitai model", "type": "LORA", "creator": {"username": "Tester"},
                                               "modelVersions": [{"id": 123, "name": "v1", "baseModel": "SDXL"}]}], "metadata": {}})
                elif path.startswith("/n-sidebar/civitai/version/"):
                    await response({"id": 123, "name": "v1", "model": {"name": "Test Civitai model", "type": "LORA"},
                                    "files": [{"id": 456, "name": "sample.safetensors", "sizeKB": 1024}]})
                elif path == "/n-sidebar/model-paths":
                    await response({"paths": ["/test/models/loras"], "default": 0})
                elif path == "/n-sidebar/downloads":
                    if request.method == "POST":
                        download_jobs.append({"id": "test", "name": "sample.safetensors", "status": "running", "received": 512, "total": 1024})
                        await response(download_jobs[-1], 202)
                    else:
                        await response(download_jobs)
                elif path.startswith("/n-sidebar/downloads/"):
                    action = path.rsplit("/", 1)[-1]
                    download_jobs[0]["status"] = {"pause": "paused", "resume": "running", "cancel": "cancelled"}[action]
                    await response(download_jobs[0])
                elif path == "/n-sidebar/models":
                    await response([{"id": "sample", "name": "sample.safetensors", "status": "valid size"}])
                elif path == "/n-sidebar/models/sample/verify":
                    await response({"status": "verified"})
                elif request.method not in {"GET", "HEAD", "OPTIONS"}:
                    writes.append(path)
                    await response({})
                else:
                    await route.continue_()

            await page.route("**/*", intercept)
            await page.goto(args.url, wait_until="domcontentloaded")
            await page.wait_for_function("() => !!window.comfyAPI?.app?.app?.extensionManager", timeout=90000)
            try:
                await page.wait_for_function("() => !!window.comfyAPI.app.app.extensionManager.getSidebarTabs().find(tab => tab.id === 'n-sidebar-templates')", timeout=30000)
            except Exception:
                print("Boot errors:", errors, console_errors, flush=True)
                print("Boot state:", await page.evaluate("({tabs: window.comfyAPI.app.app.extensionManager.getSidebarTabs().map(tab => tab.id), text: document.body.innerText.slice(-2000)})"), flush=True)
                raise
            print("Frontend loaded:", "touch" if mobile else "desktop", flush=True)
            await page.evaluate("async () => { window.sidebarTestApp = (await import('/scripts/app.js')).app; }")
            await page.wait_for_function("() => !!sidebarTestApp.canvas?.graph", timeout=60000)
            await page.locator("#graph-canvas").wait_for(state="visible", timeout=60000)
            await page.keyboard.press("Escape")

            async def show(key):
                await page.evaluate("key => sidebarTestApp.extensionManager.command.execute('Workspace.ToggleSidebarTab.n-sidebar-' + key)", key)
                await page.locator(f".ns-panel[data-module='{key.title()}']").wait_for(state="visible")

            async def activate(locator):
                if mobile:
                    await locator.tap()
                else:
                    await locator.click()

            await show("templates")
            await page.get_by_text("Browser test template", exact=True).wait_for()
            await page.get_by_placeholder("New collection").fill("Touch collection")
            await activate(page.get_by_role("button", name="Create", exact=True))
            await page.locator(".ns-card select").select_option("Touch collection")
            await page.locator(".ns-card").wait_for()
            assert "Touch collection" in user_data["n-sidebar-extras.json"]["templateGroups"]
            await activate(page.get_by_role("button", name="Insert", exact=True))
            assert await page.evaluate("sidebarTestApp.graph._nodes.some(node => node.widgets?.some(widget => widget.value === 'N-Sidebar browser test'))")
            await activate(page.get_by_role("button", name="Preview nodes", exact=True))
            await page.get_by_text("CLIPTextEncode × 1", exact=True).wait_for()

            await show("inspector")
            await activate(page.get_by_role("button", name="Locate", exact=True).first)
            await page.get_by_placeholder("Inspect workflow JSON").set_input_files({"name": "missing.json", "mimeType": "application/json", "buffer": b'{"nodes":[{"type":"MissingTestNode"}]}'})
            await page.get_by_text("MissingTestNode × 1 — missing", exact=True).wait_for()

            await show("workflows")
            await activate(page.get_by_role("button", name="Open in tab", exact=True))
            await page.wait_for_function("sidebarTestApp.extensionManager.workflow.activeWorkflow?.path?.includes('Demo')")

            await show("migration")
            await activate(page.get_by_role("button", name="Import old server settings", exact=True))
            await page.get_by_text("Imported. Open the official node library", exact=False).wait_for()
            assert "LoadImage" in shadow_settings["Comfy.NodeLibrary.Bookmarks.V2"]
            assert "KSampler" in shadow_settings["Comfy.NodeLibrary.Bookmarks.V2"]
            assert "N-Sidebar/My nodes/KSampler" in shadow_settings["Comfy.NodeLibrary.Bookmarks.V2"]

            await show("civitai")
            await page.get_by_placeholder("Search Civitai models").fill("Demo")
            await activate(page.get_by_role("button", name="Search", exact=True))
            await activate(page.get_by_role("button", name="Choose file", exact=True))
            await activate(page.get_by_role("button", name="Download", exact=True))
            await activate(page.get_by_role("button", name="Pause", exact=True))
            await activate(page.get_by_role("button", name="Resume", exact=True))
            await activate(page.get_by_role("button", name="Cancel", exact=True))
            await page.get_by_text("cancelled ·", exact=False).wait_for()
            await activate(page.get_by_role("button", name="Scan downloaded models", exact=True))
            await activate(page.get_by_role("button", name="Verify SHA256", exact=True))
            await page.get_by_text("verified", exact=True).wait_for()
            await page.evaluate("sidebarTestApp.extensionManager.setting.set('NSidebar.Civitai.Enabled', false)")
            assert await page.locator(".ns-panel[data-module='Civitai']").count() == 0
            assert not await page.evaluate("sidebarTestApp.extensionManager.getSidebarTabs().some(tab => tab.id === 'n-sidebar-civitai')")
            await page.evaluate("sidebarTestApp.extensionManager.setting.set('NSidebar.Civitai.Enabled', true)")
            for module in ("Templates", "Workflows", "Inspector", "Civitai", "Migration", "Diagnostics"):
                await page.evaluate("key => sidebarTestApp.extensionManager.setting.set('NSidebar.' + key + '.Enabled', false)", module)
                assert not await page.evaluate("key => sidebarTestApp.extensionManager.getSidebarTabs().some(tab => tab.id === 'n-sidebar-' + key.toLowerCase())", module)
                await page.evaluate("key => sidebarTestApp.extensionManager.setting.set('NSidebar.' + key + '.Enabled', true)", module)
                assert await page.evaluate("key => sidebarTestApp.extensionManager.getSidebarTabs().filter(tab => tab.id === 'n-sidebar-' + key.toLowerCase()).length === 1", module)

            await show("templates")
            await page.get_by_text("Browser test template", exact=True).first.wait_for()
            overflow = await page.locator(".ns-panel").evaluate("node => node.scrollWidth > node.clientWidth + 1")
            assert not overflow, "Panel overflows its native sidebar container"
            screenshot = Path(args.artifacts) / ("sidebar-android.png" if mobile else "sidebar-desktop.png")
            screenshot.parent.mkdir(parents=True, exist_ok=True)
            await page.screenshot(path=str(screenshot))
            assert not errors, "Browser errors: " + "; ".join(errors)
            print(f"{'Android touch' if mobile else 'Desktop'}: passed; {len(writes)} writes intercepted; screenshot {screenshot}")
            await context.close()
        await browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8188")
    parser.add_argument("--chromium", default=None)
    parser.add_argument("--artifacts", default="/tmp/n-sidebar-artifacts")
    asyncio.run(run(parser.parse_args()))
