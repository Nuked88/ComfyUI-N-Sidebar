export const MODULES = [
    { key: "Templates", title: "N · Template collections", icon: "pi pi-th-large", enabled: true },
    { key: "Workflows", title: "N · External workflows", icon: "pi pi-folder-open", enabled: true },
    { key: "Inspector", title: "N · Workflow inspector", icon: "pi pi-search-plus", enabled: true },
    { key: "Civitai", title: "N · Civitai downloader", icon: "pi pi-download", enabled: true },
    { key: "Migration", title: "N · Import & export", icon: "pi pi-file-import", enabled: true },
    { key: "Diagnostics", title: "N · Diagnostics", icon: "pi pi-info-circle", enabled: false },
];

export const settingId = key => `NSidebar.${key}.Enabled`;

export function syncModules(manager, getSetting, createPanel, mounted) {
    for (const module of MODULES) {
        const id = `n-sidebar-${module.key.toLowerCase()}`;
        if (getSetting(settingId(module.key)) && !mounted.has(id)) {
            let dispose;
            manager.registerSidebarTab({
                id, title: module.title, tooltip: module.title, icon: module.icon, type: "custom",
                render(container) { dispose?.(); dispose = createPanel(module.key, container); },
                destroy() { dispose?.(); dispose = undefined; },
            });
            mounted.add(id);
        } else if (!getSetting(settingId(module.key)) && mounted.has(id)) {
            manager.unregisterSidebarTab(id);
            mounted.delete(id);
        }
    }
}

export function parseLegacy(value, fallback) {
    if (value == null) return fallback;
    return typeof value === "string" ? JSON.parse(value) : value;
}

export function groupMap(value) {
    const source = parseLegacy(value, {});
    if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("Invalid collection data");
    const result = {};
    for (const [name, members] of Object.entries(source)) {
        if (!Array.isArray(members) || !members.every(item => typeof item === "string")) throw new Error("Invalid collection members");
        Object.defineProperty(result, name, { value: [...new Set(members)], enumerable: true, writable: true, configurable: true });
    }
    return result;
}

export function migrateLegacy(data, currentBookmarks = [], currentColors = {}) {
    const pinned = parseLegacy(data.sb_pinnedItems, []);
    if (!Array.isArray(pinned) || !pinned.every(item => typeof item === "string")) throw new Error("Invalid pinned nodes");
    const bookmarks = new Set(currentBookmarks);
    pinned.forEach(type => bookmarks.add(type));
    const colors = { ...currentColors };
    const oldColors = parseLegacy(data.sb_ColorCustomCategories, {});
    for (const [name, types] of Object.entries(groupMap(data.sb_categoryNodeMap))) {
        const folder = `N-Sidebar/${name.replaceAll("/", " ∕ ")}/`;
        bookmarks.add(folder);
        types.forEach(type => bookmarks.add(folder + type));
        if (oldColors?.[name]) colors[folder] = { ...colors[folder], color: oldColors[name] };
    }
    const workflowGroups = groupMap(data.sb_workflowNodeMap);
    for (const [name, members] of Object.entries(workflowGroups)) {
        workflowGroups[name] = [...new Set(members.map(legacyWorkflowPath))];
    }
    return {
        bookmarks: [...bookmarks], colors,
        templateGroups: groupMap(data.sb_templateNodeMap),
        workflowGroups,
        templateColors: parseLegacy(data.sb_ColorCustomTemplates, {}),
        workflowColors: parseLegacy(data.sb_ColorCustomWorkflows, {}),
    };
}

export function legacyWorkflowPath(value) {
    try {
        const bytes = Uint8Array.from(atob(value), character => character.charCodeAt(0));
        const path = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        if (/^(\/|[a-z]:[\\/]|\\\\)/i.test(path)) return path.replaceAll("\\", "/");
    } catch { /* Early versions stored names rather than encoded absolute paths. */ }
    return value;
}

export function inspectWorkflow(workflow, registeredTypes) {
    const definitions = workflow.definitions?.subgraphs ?? [];
    const subgraphTypes = new Set(definitions.map(graph => graph.id));
    const counts = new Map();
    const visit = nodes => {
        for (const node of nodes ?? []) {
            if (typeof node.type !== "string") continue;
            counts.set(node.type, (counts.get(node.type) ?? 0) + 1);
        }
    };
    visit(workflow.nodes);
    definitions.forEach(graph => visit(graph.nodes));
    return [...counts].map(([type, count]) => ({
        type, count, missing: !registeredTypes.has(type) && !subgraphTypes.has(type),
    })).sort((a, b) => Number(b.missing) - Number(a.missing) || a.type.localeCompare(b.type));
}

export function templateClipboard(value) {
    const data = typeof value === "string" ? JSON.parse(value) : structuredClone(value);
    if (!Array.isArray(data.nodes)) throw new Error("Invalid node template");
    if (data.reroutes) return data;
    // The old LiteGraph format stores links by node-array index rather than node ID.
    const nodes = data.nodes.map((node, index) => ({ ...node, id: String(index + 1) }));
    const links = (data.links ?? []).filter(link => link[0] != null && nodes[link[0]] && nodes[link[2]])
        .map((link, index) => ({ id: index + 1, origin_id: String(link[0] + 1), origin_slot: link[1],
            target_id: String(link[2] + 1), target_slot: link[3], type: link[4] ?? "*" }));
    return { nodes, links, groups: [], reroutes: [], subgraphs: [] };
}

export function mergeGroups(existing, incoming) {
    const result = groupMap(existing);
    for (const [name, members] of Object.entries(groupMap(incoming))) {
        Object.defineProperty(result, name, { value: [...new Set([...(Object.hasOwn(result, name) ? result[name] : []), ...members])],
            enumerable: true, writable: true, configurable: true });
    }
    return result;
}
