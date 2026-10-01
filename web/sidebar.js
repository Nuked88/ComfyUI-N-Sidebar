import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { MODULES, settingId, syncModules, migrateLegacy, mergeGroups, groupMap, inspectWorkflow, templateClipboard } from "./core.js";

const DATA_FILE = "n-sidebar-extras.json";
const BOOKMARKS = "Comfy.NodeLibrary.Bookmarks.V2";
const COLORS = "Comfy.NodeLibrary.BookmarksCustomization";
const mounted = new Set();
const panels = new Set();
let ready = false;

function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    return node;
}

function notify(error) {
    app.extensionManager.toast.add({ severity: "error", summary: "N-Sidebar", detail: error.message, life: 6000 });
}

function button(label, action) {
    const node = element("button", label);
    node.type = "button";
    node.onclick = async () => {
        node.disabled = true;
        try { await action(); } catch (error) { notify(error); }
        finally { node.disabled = false; }
    };
    return node;
}

function input(placeholder, type = "text") {
    const node = element("input");
    node.type = type;
    node.placeholder = placeholder;
    node.setAttribute("aria-label", placeholder);
    return node;
}

function select(options, label) {
    const node = element("select");
    node.setAttribute("aria-label", label);
    options.forEach(([value, text]) => {
        const option = element("option", text);
        option.value = value;
        node.append(option);
    });
    return node;
}

function row(...nodes) {
    const node = element("div", null, "ns-row");
    node.append(...nodes);
    return node;
}

async function json(route, options = {}) {
    const response = await api.fetchApi(route, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`);
    return data;
}

const post = (route, data = {}) => json(route, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
});

async function readData() {
    const response = await api.getUserData(DATA_FILE);
    if (response.status === 404) return {};
    if (!response.ok) throw new Error("Cannot read N-Sidebar user data");
    return response.json();
}

async function saveData(data) {
    await api.storeUserData(DATA_FILE, data);
}

function registeredTypes() {
    return new Set(Object.keys(globalThis.LiteGraph.registered_node_types));
}

function preview(workflow) {
    const node = element("details", null, "ns-preview");
    node.append(element("summary", "Used nodes"));
    const list = element("ul");
    for (const item of inspectWorkflow(workflow, registeredTypes())) {
        const text = `${item.type} × ${item.count}${item.missing ? " — missing" : ""}`;
        list.append(element("li", text, item.missing && app.extensionManager.setting.get("NSidebar.HighlightMissing") ? "ns-missing" : ""));
    }
    node.append(list);
    return node;
}

function downloadJson(name, data) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = element("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function lifecycle(container, key) {
    const root = element("section", null, "ns-panel");
    root.dataset.module = key;
    container.replaceChildren(root);
    const controller = new AbortController();
    let active = true;
    const cleanup = [];
    return { root, signal: controller.signal, alive: () => active,
        onCleanup(fn) { cleanup.push(fn); },
        dispose() { active = false; controller.abort(); cleanup.forEach(fn => fn()); root.remove(); },
    };
}

async function collections(ctx, key) {
    const templates = key === "Templates";
    const groupKey = templates ? "templateGroups" : "workflowGroups";
    const colorKey = templates ? "templateColors" : "workflowColors";
    const root = ctx.root;
    root.append(element("h3", templates ? "Template collections" : "External workflows"));
    const search = input("Search name or collection");
    const createName = input("New collection");
    const list = element("div", null, "ns-list");
    const status = element("p", "Loading…", "ns-status");
    let data, items = [], roots = [], queryVersion = 0;
    const keyFor = item => templates ? item.name : `${roots[item.root].replaceAll("\\", "/").replace(/\/$/, "")}/${item.path}`;

    async function persist() {
        await saveData(data);
        draw();
    }
    const create = button("Create", async () => {
        const name = createName.value.trim();
        if (!name || Object.hasOwn(data[groupKey], name)) return;
        Object.defineProperty(data[groupKey], name, { value: [], enumerable: true, configurable: true, writable: true });
        createName.value = "";
        await persist();
    });
    root.append(search, row(createName, create), status, list);

    async function workflowFor(item) {
        if (templates) return templateClipboard(item.data);
        return json(`/n-sidebar/workflow?${new URLSearchParams({ root: item.root, path: item.path })}`, { signal: ctx.signal });
    }

    async function open(item) {
        const graph = await workflowFor(item);
        if (!ctx.alive()) return;
        if (templates) {
            const clipboardKey = "litegrapheditor_clipboard";
            const previous = localStorage.getItem(clipboardKey);
            try {
                localStorage.setItem(clipboardKey, JSON.stringify(graph));
                const canvas = app.canvas;
                const position = [(-canvas.ds.offset[0] + canvas.canvas.width / canvas.ds.scale / 2),
                    (-canvas.ds.offset[1] + canvas.canvas.height / canvas.ds.scale / 2)];
                canvas.pasteFromClipboard({ position });
            } finally {
                if (previous == null) localStorage.removeItem(clipboardKey);
                else localStorage.setItem(clipboardKey, previous);
            }
        } else {
            // A named load opens a native workflow tab and preserves the current workflow.
            await app.loadGraphData(graph, true, true, item.name + ".json");
        }
    }

    function draw() {
        if (!ctx.alive()) return;
        list.replaceChildren();
        const query = search.value.toLocaleLowerCase();
        const groups = [["", []], ...Object.entries(data[groupKey])];
        for (const [name, members] of groups) {
            const section = element("details", null, "ns-collection");
            section.open = true;
            section.append(element("summary", name || "Uncategorized"));
            const color = data[colorKey]?.[name];
            if (typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)) section.style.borderInlineStartColor = color;
            if (name) {
                const colorInput = input("Collection color", "color");
                colorInput.value = typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color) ? color : "#808080";
                colorInput.onchange = async () => {
                    data[colorKey] = { ...data[colorKey], [name]: colorInput.value };
                    try { await persist(); } catch (error) { notify(error); }
                };
                const rename = input("Rename collection");
                rename.value = name;
                const options = element("details", null, "ns-collection-options");
                options.append(element("summary", "Collection options"), row(rename, button("Rename", async () => {
                    const next = rename.value.trim();
                    if (!next || next === name) return;
                    if (Object.hasOwn(data[groupKey], next)) throw new Error("Collection already exists");
                    data[groupKey] = groupMap({ ...data[groupKey], [next]: members });
                    delete data[groupKey][name];
                    data[colorKey] = { ...data[colorKey], [next]: data[colorKey]?.[name] };
                    delete data[colorKey][name];
                    await persist();
                })), row(colorInput, button("Remove collection", async () => {
                    delete data[groupKey][name];
                    if (data[colorKey]) delete data[colorKey][name];
                    await persist();
                })));
                section.append(options);
            }
            const membersFor = item => members.includes(keyFor(item)) || (!templates && members.includes(item.name));
            const matching = items.filter(item => name ? membersFor(item)
                : !Object.values(data[groupKey]).some(values => values.includes(keyFor(item)) || (!templates && values.includes(item.name))));
            if (!name && !matching.length && groups.length > 1) continue;
            if (name) matching.sort((a, b) => members.findIndex(member => member === keyFor(a) || member === a.name)
                - members.findIndex(member => member === keyFor(b) || member === b.name));
            let shown = 0;
            for (const item of matching) {
                if (query && !`${item.name} ${name} ${item.path ?? ""}`.toLocaleLowerCase().includes(query)) continue;
                shown++;
                const card = element("article", null, "ns-card");
                card.append(element("strong", item.name));
                if (!templates) card.append(element("small", item.path));
                const membership = select([["", "Add to collection…"], ...Object.keys(data[groupKey]).map(group => [group, group])], "Add to collection");
                membership.onchange = async () => {
                    if (!membership.value) return;
                    data[groupKey][membership.value] = [...new Set([...data[groupKey][membership.value], keyFor(item)])];
                    try { await persist(); } catch (error) { notify(error); }
                };
                card.append(row(button(templates ? "Insert" : "Open in tab", () => open(item)), membership));
                if (name) card.append(row(button("↑", async () => {
                    const index = members.findIndex(member => member === keyFor(item) || member === item.name);
                    if (index > 0) [members[index - 1], members[index]] = [members[index], members[index - 1]];
                    await persist();
                }), button("Remove from collection", async () => {
                    data[groupKey][name] = members.filter(member => member !== keyFor(item) && member !== item.name);
                    await persist();
                })));
                if (app.extensionManager.setting.get("NSidebar.Previews")) {
                    const holder = element("div");
                    card.append(button("Preview nodes", async () => {
                        const graph = await workflowFor(item);
                        if (ctx.alive() && card.isConnected) {
                            const details = preview(graph);
                            details.open = true;
                            holder.replaceChildren(details);
                        }
                    }), holder);
                }
                section.append(card);
            }
            if (!shown) section.append(element("p", "No matching items", "ns-muted"));
            list.append(section);
        }
    }

    async function refresh() {
        const version = ++queryVersion;
        status.textContent = "Loading…";
        try {
            const nextData = await readData();
            let nextItems, nextRoots = [];
            if (templates) {
                const response = await api.getUserData("comfy.templates.json", { signal: ctx.signal });
                if (response.status === 404) nextItems = [];
                else if (!response.ok) throw new Error("Cannot read native node templates");
                else nextItems = await response.json();
                if (!Array.isArray(nextItems)) throw new Error("Invalid native template file");
            } else {
                const library = await json("/n-sidebar/workflows", { signal: ctx.signal });
                nextItems = library.files;
                nextRoots = library.roots;
            }
            if (!ctx.alive() || version !== queryVersion) return;
            data = nextData;
            data[groupKey] = groupMap(data[groupKey]);
            roots = nextRoots;
            // Sort collection items by their saved order before falling back to library order.
            items = nextItems;
            status.textContent = templates ? `${items.length} native node templates. Save templates from the canvas context menu.`
                : roots.length ? `${items.length} workflows in ${roots.length} external libraries.`
                    : "Set NSIDEBAR_WORKFLOW_ROOTS on the server (one directory per line), or keep the old workflow paths in app/settings.json.";
            draw();
        } catch (error) {
            if (error.name !== "AbortError" && ctx.alive()) status.textContent = error.message;
        }
    }
    root.insertBefore(button("Refresh", refresh), status);
    search.oninput = draw;
    create.disabled = true;
    await refresh();
    create.disabled = !data;
}

function inspector(ctx) {
    const root = ctx.root;
    root.append(element("h3", "Workflow inspector"));
    const search = input("Filter node types");
    const output = element("div");
    let source;
    function draw() {
        const graph = source ?? app.graph.serialize();
        const entries = inspectWorkflow(graph, registeredTypes());
        const missing = entries.filter(item => item.missing).length;
        output.replaceChildren(element("p", `${entries.length} node types · ${missing} missing`));
        const list = element("ul", null, "ns-node-list");
        for (const item of entries.filter(item => item.type.toLowerCase().includes(search.value.toLowerCase()))) {
            const li = element("li", `${item.type} × ${item.count}${item.missing ? " — missing" : ""}`,
                item.missing && app.extensionManager.setting.get("NSidebar.HighlightMissing") ? "ns-missing" : "");
            const nodes = app.graph._nodes.filter(node => node.type === item.type);
            if (!source && nodes.length) li.append(button("Locate", () => {
                app.canvas.selectNodes(nodes);
                app.canvas.centerOnNode(nodes[0]);
            }));
            list.append(li);
        }
        output.append(list);
    }
    const file = input("Inspect workflow JSON", "file");
    file.accept = ".json,application/json";
    file.onchange = async () => {
        try {
            const candidate = JSON.parse(await file.files[0].text());
            if (!Array.isArray(candidate.nodes)) throw new Error("Choose a ComfyUI workflow JSON");
            source = candidate;
            draw();
        } catch (error) { notify(error); }
    };
    root.append(row(button("Inspect current workflow", () => { source = undefined; draw(); }),
        button("Export node report", () => downloadJson("workflow-node-report.json", inspectWorkflow(source ?? app.graph.serialize(), registeredTypes())))),
        file, search, output);
    search.oninput = draw;
    api.addEventListener("graphChanged", draw, { signal: ctx.signal });
    draw();
}

function civitai(ctx) {
    const root = ctx.root;
    root.append(element("h3", "Civitai downloader"));
    const query = input("Search Civitai models");
    const type = select([["", "All types"], ...["Checkpoint", "LORA", "VAE", "Controlnet", "Upscaler", "TextualInversion"].map(value => [value, value])], "Model type");
    const versionInput = input("Model version ID", "number");
    const results = element("div", null, "ns-list");
    const files = element("div");
    const jobs = element("div");
    const integrity = element("div");
    let page = 1;
    let queryVersion = 0;
    let fileVersion = 0;
    async function showVersion(id) {
        const requestVersion = ++fileVersion;
        const version = await json(`/n-sidebar/civitai/version/${id}`, { signal: ctx.signal });
        const destinations = await json(`/n-sidebar/model-paths?${new URLSearchParams({ type: version.model.type })}`, { signal: ctx.signal });
        if (!ctx.alive() || requestVersion !== fileVersion) return;
        files.replaceChildren(element("h4", `${version.model.name} · ${version.name}`));
        if (!destinations.paths.length) {
            files.append(element("p", "No ComfyUI model folder configured for this type."));
            return;
        }
        const destination = select(destinations.paths.map((path, index) => [index, path]), "Model destination");
        destination.value = String(destinations.default);
        files.append(destination);
        for (const file of version.files) {
            const size = Math.round((file.sizeKB ?? 0) / 1024);
            files.append(row(element("span", `${file.name} (${size} MiB)`), button("Download", async () => {
                await post("/n-sidebar/downloads", { version: version.id, file: file.id, destination: Number(destination.value) });
                await progress();
            })));
        }
    }
    async function search() {
        const version = ++queryVersion;
        const data = await json(`/n-sidebar/civitai/search?${new URLSearchParams({ query: query.value, types: type.value, page })}`, { signal: ctx.signal });
        if (!ctx.alive() || version !== queryVersion) return;
        results.replaceChildren();
        for (const model of data.items ?? []) {
            const card = element("article", null, "ns-card");
            card.append(element("strong", model.name), element("small", `${model.type} · ${model.creator?.username ?? ""}`));
            const versions = select(model.modelVersions.map(item => [item.id, `${item.name} · ${item.baseModel}`]), "Model version");
            card.append(versions, button("Choose file", () => showVersion(versions.value)));
            results.append(card);
        }
        if (!data.items?.length) results.append(element("p", "No matching models"));
        next.disabled = !data.metadata?.nextPage;
        previous.disabled = page <= 1;
    }
    async function progress() {
        const data = await json("/n-sidebar/downloads", { signal: ctx.signal });
        if (!ctx.alive()) return;
        jobs.replaceChildren(element("h4", "Downloads"));
        for (const job of data) {
            const card = element("article", null, "ns-card");
            card.append(element("strong", job.name), element("span", `${job.status} · ${Math.round(job.received / 1048576)} MiB${job.total ? ` / ${Math.round(job.total / 1048576)} MiB` : ""}`));
            if (job.error) card.append(element("p", job.error, "ns-missing"));
            if (["queued", "running", "paused"].includes(job.status)) {
                const bar = element("progress");
                if (job.total) { bar.max = job.total; bar.value = job.received; }
                card.append(bar, row(button(job.status === "paused" ? "Resume" : "Pause", async () => {
                    await post(`/n-sidebar/downloads/${job.id}/${job.status === "paused" ? "resume" : "pause"}`);
                    await progress();
                }), button("Cancel", async () => { await post(`/n-sidebar/downloads/${job.id}/cancel`); await progress(); })));
            }
            jobs.append(card);
        }
    }
    const previous = button("Previous", async () => { page = Math.max(1, page - 1); await search(); });
    previous.disabled = true;
    const next = button("Next", async () => { page++; await search(); });
    next.disabled = true;
    const form = element("form");
    const submit = button("Search", async () => { page = 1; await search(); });
    form.append(query, row(type, submit));
    form.onsubmit = event => { event.preventDefault(); submit.click(); };
    root.append(form, row(versionInput, button("Look up version", () => showVersion(versionInput.value))),
        files, results, row(previous, next), jobs, integrity);
    if (app.extensionManager.setting.get("NSidebar.Integrity")) {
        const library = element("div", null, "ns-list");
        integrity.append(element("h4", "Downloaded model integrity"),
            button("Scan downloaded models", async () => {
                const models = await json("/n-sidebar/models", { signal: ctx.signal });
                if (!ctx.alive()) return;
                library.replaceChildren();
                for (const model of models) {
                    const status = element("span", model.status);
                    library.append(row(element("span", model.name), status, button("Verify SHA256", async () => {
                        const result = await post(`/n-sidebar/models/${model.id}/verify`);
                        if (ctx.alive()) status.textContent = result.status;
                    })));
                }
                if (!models.length) library.append(element("p", "No models downloaded by N-Sidebar v2 yet."));
            }), library);
    }
    progress().catch(error => { if (error.name !== "AbortError" && ctx.alive()) notify(error); });
    // Poll only while this native sidebar tab is mounted.
    const timer = setInterval(() => progress().catch(error => {
        if (error.name !== "AbortError" && ctx.alive()) jobs.textContent = error.message;
    }), 2000);
    ctx.onCleanup(() => clearInterval(timer));
}

function migration(ctx) {
    const root = ctx.root;
    root.append(element("h3", "Import & export"), element("p", "Import old pinned nodes and colored categories into the official node library. Existing bookmarks are kept. Template and external workflow collections are preserved here."));
    const status = element("p", null, "ns-status");
    async function applyLegacy(legacy) {
        const migrated = migrateLegacy(legacy, app.extensionManager.setting.get(BOOKMARKS) ?? [], app.extensionManager.setting.get(COLORS) ?? {});
        const data = await readData();
        // Save a reversible backup before changing native bookmarks or collections.
        await api.storeUserData("n-sidebar-before-import.json", {
            bookmarks: app.extensionManager.setting.get(BOOKMARKS) ?? [],
            colors: app.extensionManager.setting.get(COLORS) ?? {}, data,
        });
        for (const key of ["templateGroups", "workflowGroups"]) data[key] = mergeGroups(data[key], migrated[key]);
        for (const key of ["templateColors", "workflowColors"]) data[key] = { ...data[key], ...migrated[key] };
        await saveData(data);
        await app.extensionManager.setting.set(BOOKMARKS, migrated.bookmarks);
        await app.extensionManager.setting.set(COLORS, migrated.colors);
        status.textContent = "Imported. Open the official node library to see your bookmarks and categories.";
    }
    const legacyFile = input("Import old settings.json", "file");
    legacyFile.accept = ".json,application/json";
    legacyFile.onchange = async () => {
        try { await applyLegacy(JSON.parse(await legacyFile.files[0].text())); }
        catch (error) { notify(error); }
    };
    const extrasFile = input("Import N-Sidebar extras JSON", "file");
    extrasFile.accept = ".json,application/json";
    extrasFile.onchange = async () => {
        try {
            const incoming = JSON.parse(await extrasFile.files[0].text());
            if (incoming.version !== 2 || !incoming.data) throw new Error("Choose an N-Sidebar v2 export");
            const data = await readData();
            for (const key of ["templateGroups", "workflowGroups"]) data[key] = mergeGroups(data[key], incoming.data[key]);
            for (const key of ["templateColors", "workflowColors"]) data[key] = { ...data[key], ...incoming.data[key] };
            await saveData(data);
            for (const [id, value] of Object.entries(incoming.settings ?? {})) {
                if (settings.some(setting => setting.id === id) && typeof value === "boolean") await app.extensionManager.setting.set(id, value);
            }
            status.textContent = "Extra collections and module settings imported.";
        } catch (error) { notify(error); }
    };
    root.append(button("Import old server settings", async () => {
        const legacy = await json("/n-sidebar/legacy", { signal: ctx.signal });
        if (!Object.keys(legacy).length) throw new Error("No legacy settings found. Choose your old settings.json file instead.");
        await applyLegacy(legacy);
    }), legacyFile, element("hr"), button("Export extras & settings", async () => downloadJson("n-sidebar-extras.json", {
        version: 2, data: await readData(),
        settings: Object.fromEntries(settings.map(setting => [setting.id, app.extensionManager.setting.get(setting.id)])),
    })), extrasFile, status);
}

function diagnostics(ctx) {
    const root = ctx.root;
    root.append(element("h3", "Server diagnostics"));
    const output = element("pre");
    async function refresh() {
        const stats = await json("/system_stats", { signal: ctx.signal });
        if (ctx.alive()) output.textContent = JSON.stringify(stats, null, 2);
    }
    root.append(button("Refresh", refresh), output);
    refresh().catch(error => { if (error.name !== "AbortError" && ctx.alive()) notify(error); });
}

function createPanel(key, container) {
    const ctx = lifecycle(container, key);
    panels.add(ctx);
    const render = { Templates: () => collections(ctx, key), Workflows: () => collections(ctx, key),
        Inspector: () => inspector(ctx), Civitai: () => civitai(ctx), Migration: () => migration(ctx), Diagnostics: () => diagnostics(ctx) };
    Promise.resolve().then(render[key]).catch(error => { if (error.name !== "AbortError" && ctx.alive()) notify(error); });
    return () => { panels.delete(ctx); ctx.dispose(); };
}

function reconcile() {
    if (ready) syncModules(app.extensionManager, id => app.extensionManager.setting.get(id), createPanel, mounted);
}

function refreshPanels() {
    // Render only the visible panels again after a preview/display setting changes.
    for (const ctx of [...panels]) {
        const parent = ctx.root.parentElement;
        const key = ctx.root.dataset.module;
        panels.delete(ctx);
        ctx.dispose();
        if (parent) {
            const tab = app.extensionManager.getSidebarTabs().find(tab => tab.id === `n-sidebar-${key.toLowerCase()}`);
            tab?.render(parent);
        }
    }
}

const settings = [
    ...MODULES.map(module => ({ id: settingId(module.key), name: module.title.replace("N · ", "") + " — enabled",
        category: ["N-Sidebar", "Modules", module.key], type: "boolean", defaultValue: module.enabled, onChange: reconcile })),
    { id: "NSidebar.Previews", name: "Show node previews in template and workflow collections", category: ["N-Sidebar", "Display", "Previews"],
        type: "boolean", defaultValue: true, onChange: refreshPanels },
    { id: "NSidebar.HighlightMissing", name: "Highlight missing node types", category: ["N-Sidebar", "Display", "Missing nodes"],
        type: "boolean", defaultValue: true, onChange: refreshPanels },
    { id: "NSidebar.Integrity", name: "Show downloaded model integrity checks", category: ["N-Sidebar", "Modules", "Integrity"],
        type: "boolean", defaultValue: true, onChange: refreshPanels },
];

app.registerExtension({
    name: "Nuked.NSidebar.Extras", settings,
    setup() {
        const stylesheet = element("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = new URL("./sidebar.css", import.meta.url).href;
        document.head.append(stylesheet);
        ready = true;
        reconcile();
    },
});
