import test from "node:test";
import assert from "node:assert/strict";
import { MODULES, syncModules, migrateLegacy, inspectWorkflow, templateClipboard, mergeGroups } from "../web/core.js";

test("module settings register once and immediately remove an active panel", () => {
    const settings = Object.fromEntries(MODULES.map(module => [`NSidebar.${module.key}.Enabled`, true]));
    const tabs = new Map();
    let destroyed = 0;
    const manager = {
        registerSidebarTab(tab) { assert.ok(!tabs.has(tab.id)); tabs.set(tab.id, tab); },
        unregisterSidebarTab(id) { tabs.get(id).destroy(); tabs.delete(id); },
    };
    const mounted = new Set();
    const sync = () => syncModules(manager, id => settings[id], () => () => destroyed++, mounted);
    sync();
    sync();
    assert.equal(tabs.size, MODULES.length);
    tabs.get("n-sidebar-civitai").render({});
    settings["NSidebar.Civitai.Enabled"] = false;
    sync();
    assert.equal(destroyed, 1);
    assert.ok(!tabs.has("n-sidebar-civitai"));
    settings["NSidebar.Civitai.Enabled"] = true;
    sync();
    assert.equal(tabs.size, MODULES.length);
});

test("legacy import merges native bookmarks and preserves collection colors and order", () => {
    const source = {
        sb_pinnedItems: '["KSampler","KSampler"]',
        sb_categoryNodeMap: '{"Video/Helpers":["LoadImage","MissingNode"]}',
        sb_ColorCustomCategories: '{"Video/Helpers":"#abcdef"}',
        sb_templateNodeMap: '{"Video":["Decode","Load"]}',
    };
    const result = migrateLegacy(source, ["Existing"], { Existing: { color: "#111111" } });
    assert.deepEqual(result.bookmarks, ["Existing", "KSampler", "N-Sidebar/Video ∕ Helpers/", "N-Sidebar/Video ∕ Helpers/LoadImage", "N-Sidebar/Video ∕ Helpers/MissingNode"]);
    assert.equal(result.colors["N-Sidebar/Video ∕ Helpers/"].color, "#abcdef");
    assert.deepEqual(result.templateGroups.Video, ["Decode", "Load"]);
    const again = migrateLegacy(source, result.bookmarks, result.colors);
    assert.deepEqual(again.bookmarks, result.bookmarks);
});

test("collection names cannot modify the object's prototype", () => {
    const data = JSON.parse('{"__proto__":["Sample"],"constructor":["Other"]}');
    const result = mergeGroups({}, data);
    assert.deepEqual(result.__proto__, ["Sample"]);
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
    assert.deepEqual(mergeGroups(result, { constructor: ["More"] }).constructor, ["Other", "More"]);
});

test("legacy workflow IDs decode UTF-8 and Windows paths without corrupting plain names", () => {
    const unix = Buffer.from("/work/日本/image.json").toString("base64");
    const windows = Buffer.from("C:\\Workflows\\image.json").toString("base64");
    const result = migrateLegacy({ sb_workflowNodeMap: JSON.stringify({ Examples: [unix, windows, "Plain name"] }) });
    assert.deepEqual(result.workflowGroups.Examples, ["/work/日本/image.json", "C:/Workflows/image.json", "Plain name"]);
});

test("inspector counts nodes inside subgraphs and distinguishes missing implementations", () => {
    const graph = { nodes: [{ type: "KSampler" }, { type: "Missing" }, { type: "subgraph-id" }],
        definitions: { subgraphs: [{ id: "subgraph-id", nodes: [{ type: "KSampler" }, { type: "InnerMissing" }] }] } };
    const entries = inspectWorkflow(graph, new Set(["KSampler"]));
    assert.equal(entries.find(entry => entry.type === "KSampler").count, 2);
    assert.equal(entries.find(entry => entry.type === "subgraph-id").missing, false);
    assert.deepEqual(entries.filter(entry => entry.missing).map(entry => entry.type), ["InnerMissing", "Missing"]);
});

test("old node templates reconnect by array index, skipping external links", () => {
    const source = { nodes: [{ id: 12, type: "A", pos: [0, 0] }, { id: 78, type: "B", pos: [1, 1] }],
        links: [[0, 2, 1, 0, "IMAGE"], [null, 0, 1, 2, "IMAGE"]] };
    const converted = templateClipboard(JSON.stringify(source));
    assert.deepEqual(converted.nodes.map(node => node.id), ["1", "2"]);
    assert.deepEqual(converted.links, [{ id: 1, origin_id: "1", origin_slot: 2, target_id: "2", target_slot: 0, type: "IMAGE" }]);
    assert.deepEqual(templateClipboard(converted), converted);
    assert.equal(source.nodes[0].id, 12);
});

test("malformed imports are rejected before settings are changed", () => {
    assert.throws(() => migrateLegacy({ sb_pinnedItems: "invalid json" }));
    assert.throws(() => mergeGroups({}, { Collection: "not an array" }));
    assert.throws(() => templateClipboard("{}"));
});
