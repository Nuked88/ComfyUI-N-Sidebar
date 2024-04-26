
import { api } from "../../../../scripts/api.js"
import { app } from "../../../../scripts/app.js";
import { $el } from "../../../../scripts/ui.js";
import { fuzzyMatch } from "./fts_fuzzy_match.js";

//import {settingsSetup} from './functions/settings.jsb';
console.time('execution time');
const cnPath = "../extensions/ComfyUI-N-Sidebar/"
function jsloader(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.type = "text/javascript";
        script.onload = () => resolve(script);
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
}




jsloader(cnPath + "js/functions/sb_fn.js");
jsloader(cnPath + "js/functions/utils.js");
jsloader(cnPath + "js/functions/settings.js");




let CUSTOM_COLORS;
try {
    var response = await api.fetchApi("/jovimetrix/config", { cache: "no-store" })
    const CONFIG_CORE =  await response.json()
    CUSTOM_COLORS = CONFIG_CORE?.user?.default?.color?.theme;
} catch (err) {
    console.log(err)
}

let categorySearchToggle = false;






function getSidebarItemIds() {
    const sidebarItems = document.querySelectorAll("#sidebarBookmarks .sidebarItem");
    const itemIds = [];

    sidebarItems.forEach(function (item) {
        itemIds.push(item.id);
    });

    return itemIds;
}
function postPinned() {


    var dragItem = null;

    const pinnedElement = document.getElementById("sidebarBookmarks");
    let sidebad_view_width = document.getElementById("sidebar_views").offsetWidth;
    pinnedElement.querySelectorAll(".sidebarItem").forEach(function (item) {

        item.addEventListener("dragstart", function (event) {
            dragItem = event.target;
        });

        item.addEventListener('mouseover', function () {

            if (this.classList.contains('sidebarItem') && this.tagName === 'LI') {
                let descriptionDiv = "";
                const itemPosition = getElementPosition(this);
                let previewDivTop = 0;
                const [previewContent, node_description] = createNodePreview(item.id);
                if (node_description) {
                    descriptionDiv = "<div class='sb_description'>" + node_description + "</div>";
                }
                previewDiv.innerHTML = previewContent + descriptionDiv;
                previewDiv.style.display = 'block';
                const correction_offset = 45;

                if (itemPosition.top - this.offsetHeight >= 0 && itemPosition.top + previewDiv.offsetHeight < document.body.offsetHeight) {
                    previewDivTop = itemPosition.top - this.offsetHeight

                } else if (itemPosition.top - this.offsetHeight - previewDiv.offsetHeight <= 0) {
                    previewDivTop = 0 + correction_offset;


                }
                else {

                    previewDivTop = (itemPosition.top + this.offsetHeight) - previewDiv.offsetHeight;
                }
                let sidebar_width = parseInt(getVar("sidebarWidth")) || 300;
                previewDiv.style.top = `${previewDivTop}px`;
                const previewDivLeft = sidebar_width - sidebad_view_width;

                if (sbPosition == "left") {
                    previewDiv.style.left = `${previewDivLeft}px`;
                } else {
                    previewDiv.style.right = `${previewDivLeft}px`;
                }



            }
        });

        item.addEventListener('mouseout', function () {
            previewDiv.style.display = 'none';
        })




        reloadCtxMenu()




    });

    pinnedElement.addEventListener("dragover", function (event) {
        event.preventDefault();
    });

    pinnedElement.addEventListener("drop", function (event) {
        event.preventDefault();
        if (dragItem) {
            var dropZone = event.target.closest("ul");
            dropZone.insertBefore(dragItem, event.target);
            dragItem = null;
            //list element in sidebarBookmarks

            savePinnedItems(getSidebarItemIds());
        }
    });




}



function saveSidebarWidth(sideb) {
    const width = sideb.style.width;
    document.cookie = setVar("sidebarWidth", width);
}


function restoreSidebarWidth() {
    let width_sidebar = "auto";
    let cookieValue = getVar("sidebarWidth");
    if (cookieValue) {
        width_sidebar = cookieValue;
    }
    return width_sidebar;

}


async function pinItem(itemId) {

    const item = document.getElementById(itemId);
    const sidebarBookmarks = document.getElementById("sidebarBookmarks");
    const pinnedItems = await loadPinnedItems();
    if (!pinnedItems.includes(itemId)) {
        let addedItem = sidebarBookmarks.appendChild(item.cloneNode(true));

        addedItem.lastChild.lastChild.childNodes[1].classList.add("pinned");
        pinnedItems.push(itemId);
        savePinnedItems(pinnedItems);
        postPinned();
    }

}



async function unpinItem(itemId) {
    const item = document.getElementById(itemId);
    const sidebarBookmarks = document.getElementById("sidebarBookmarks");
    const pinnedItems = await loadPinnedItems();
    if (pinnedItems.includes(itemId)) {
        sidebarBookmarks.removeChild(item);
        pinnedItems.splice(pinnedItems.indexOf(itemId), 1);
        savePinnedItems(pinnedItems);
    }
}


function removePinnedClass(itemId) {

    const sidebarItems = document.querySelectorAll(".sidebarItem");


    sidebarItems.forEach(function (item) {

        if (item.id === itemId) {

            const path = item.querySelector("path");
            if (path) {
                path.classList.remove("pinned");
            }
        }
    });
}


async function loadPinnedItemsAndAddToBookmarks() {
    const pinnedItems = await loadPinnedItems();


    const sidebarBookmarks = document.getElementById("sidebarBookmarks");


    // delete pinned
    const sidebarCategories = sidebarBookmarks.querySelectorAll(".sidebarItem");
    sidebarCategories.forEach(category => { category.remove(); });


    pinnedItems.forEach(itemId => {
        pinItem(itemId);
        const item = document.getElementById(itemId);


        if (item) {
            let addedItem = sidebarBookmarks.appendChild(item.cloneNode(true));
            addedItem.lastChild.lastChild.classList.add("pinned");
        }
    });


    postPinned();
}





function toggleCollapsePinned() {

    // expand/collapse pinned
    const sidebarBookmarks = document.getElementById('sidebarBookmarks');

    if (sidebarBookmarks.style.display === 'none') {
        sidebarBookmarks.style.display = 'block';
        setVar('sb_pinned_collapsed', 'block');
    } else {
        sidebarBookmarks.style.display = 'none';
        setVar('sb_pinned_collapsed', 'none');
    }

}


function toggleCollapseCustom() {

    if (sidebarCustomNodes.style.display === 'none') {
        sidebarCustomNodes.style.display = 'block';
        setVar('sb_custom_collapsed', 'block');
    } else {
        sidebarCustomNodes.style.display = 'none';
        setVar('sb_custom_collapsed', 'none');
    }

}

async function createCategoryList() {

    const data = LiteGraph.registered_node_types;
    let categories = {};
    // const pinnedItems = loadPinnedItems();

    //search init
    //get class content_sidebar element
    const categoriesList = document.getElementsByClassName("content_sidebar")[0];

    const sidebar_main = document.getElementById('sidebar');
    //const categoriesList = document.getElementById("content_sidebar");
    const itemSearchInput = document.getElementById("searchInput");

    itemSearchInput.addEventListener("input", async function () {
        // defaultSearchToggle = await getConfiguration("sb_search_type")
        if (defaultSearchToggle == "original" && itemSearchInput.value != "") {
            //search in all .sidebarItem
            handleSearch(categorySearchToggle, "#content_sidebar_home", "searchInput")


        }
        else {
            updateList();
        }
    });


    const clearIcon = document.querySelector(".clearIcon");
    const searchCategoryIcon = document.querySelector(".searchCategoryIcon");
    clearIcon.addEventListener("click", async function () {
        try {

            itemSearchInput.value = "";
            const searchTerm = updateList();
        } catch (error) {
            console.error("Error occurred during search:", error);
        }
    });

    searchCategoryIcon.addEventListener("click", async function () {
        try {

            categorySearchToggle = !categorySearchToggle;
            searchCategoryIcon.style.opacity = categorySearchToggle ? "1" : "0.5";
            const searchTerm = updateList();

        } catch (error) {

            console.error("Error occurred during search:", error);
        }
    });
    //end search init


    async function updateList() {


        return new Promise(async (resolve, reject) => {
            categories = {};

            const itemSearchString = itemSearchInput.value.toLowerCase();

            // delete all element conaining sidebarCategory class

            const sidebarCategories = categoriesList.querySelectorAll(".sidebarCategory");
            sidebarCategories.forEach(category => {
                category.remove();
            });

            let shortedArray = {};
            for (const objKey in data) {
                try {
                    let searchable;
                    const category = data[objKey].category.toLowerCase();
                    if (!categorySearchToggle) {
                        searchable = data[objKey].title.toLowerCase();
                    } else {
                        searchable = category;
                    }


                    if (defaultSearchToggle == "normal") {
                        if (searchable.includes(itemSearchString) || itemSearchString === "") {
                            if (!categories[category]) {
                                categories[category] = [];
                            }
                            categories[category].push(data[objKey]);
                            //remove category if empty

                            // if (categories[category].length === 0) {
                            //     delete categories[category];
                            // }

                        }
                    } else {
                        if (itemSearchString === "") {
                            if (!categories[category]) {
                                categories[category] = [];
                            }
                            categories[category].push(data[objKey]);

                        } else {



                            // fuzzy search for eng
                            const [accepted, rank] = fuzzyMatch(itemSearchString, reverseAndAppend(cleanText(searchable)));



                            if (accepted && rank >= 130) {

                                if (!shortedArray[rank]) {
                                    shortedArray[rank] = [];
                                }
                                shortedArray[rank].push(data[objKey]);



                            }


                        }
                    }

                } catch (err) {
                    console.log(err);
                }
            }
            if (itemSearchString != "") {
                if (defaultSearchToggle !== "normal") {

                    const ranks = Object.keys(shortedArray);
                    ranks.sort((a, b) => b - a);

                    ranks.forEach(rank => {

                        const dataArr = shortedArray[rank];
                        dataArr.forEach(item => {

                            if (!categories[item.category]) {
                                categories[item.category] = [];
                            }
                            categories[item.category].push(item);
                        });
                    });
                }
            } else {
                defaultSearchOrder = await getConfiguration("sb_order_type")
                if (defaultSearchOrder == "alphabetical") {

                    const sortedCategoriesData = {};
                    const sortedCategories = Object.keys(categories).sort();
                    sortedCategories.forEach(category => {

                        sortedCategoriesData[category] = categories[category];

                    });

                    categories = sortedCategoriesData;

                }

            }



            renderList();

            resolve(itemSearchString);

        });
    }


    async function renderList() {

        return new Promise(async (resolve, reject) => {
            const pinnedItems = await loadPinnedItems();
            //
            const sidebarCustomNodes = document.getElementById("sidebarCustomNodes");
            for (const category in categories) {
                const categoryItem = document.createElement("li");
                categoryItem.classList.add("sidebarCategory");
                categoryItem.textContent = category;

                const displayNamesList = document.createElement("ul");
                displayNamesList.style.display = "none";
                categoryItem.appendChild(displayNamesList);

                categories[category].forEach(displayName => {
                    try {
                        const displayNameItem = document.createElement("li");
                        displayNameItem.classList.add("sidebarItem");
                        displayNameItem.textContent = displayName.title;
                        displayNameItem.title = displayName.title;
                        displayNameItem.draggable = true;

                        // JOVIMETRIX CUT-OUT FOR CUSTOM COLORED NODES
                        //
                        if (CUSTOM_COLORS) {

                            let color = CUSTOM_COLORS[displayName.title];
                            if (color === undefined) {
                                const segments = displayName.nodeData.category.split('/')
                                let k = segments.join('/')
                                while (k) {
                                    color = CUSTOM_COLORS[k]
                                    if (color) {
                                        color = color.title
                                        break
                                    }
                                    const last = k.lastIndexOf('/')
                                    k = last !== -1 ? k.substring(0, last) : ''
                                }
                            } else {
                                color = color.title
                            }
                            if (color) {
                                displayNameItem.style = `background: ${color}`;
                            }
                        }
                        //

                        displayNameItem.id = displayName.type;

                        /* Create Pin Button */
                        const pinButton = document.createElement("button");
                        pinButton.classList.add("pinButton");

                        let add_class = "";

                        if (pinnedItems.includes(displayName.type)) {
                            add_class = "pinned";
                        }
                        pinButton.innerHTML = `<svg class="svg_class" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path class="pin_normal ${add_class}" d="M19.1835 7.80516L16.2188 4.83755C14.1921 2.8089 13.1788 1.79457 12.0904 2.03468C11.0021 2.2748 10.5086 3.62155 9.5217 6.31506L8.85373 8.1381C8.59063 8.85617 8.45908 9.2152 8.22239 9.49292C8.11619 9.61754 7.99536 9.72887 7.86251 9.82451C7.56644 10.0377 7.19811 10.1392 6.46145 10.3423C4.80107 10.8 3.97088 11.0289 3.65804 11.5721C3.5228 11.8069 3.45242 12.0735 3.45413 12.3446C3.45809 12.9715 4.06698 13.581 5.28476 14.8L6.69935 16.2163L2.22345 20.6964C1.92552 20.9946 1.92552 21.4782 2.22345 21.7764C2.52138 22.0746 3.00443 22.0746 3.30236 21.7764L7.77841 17.2961L9.24441 18.7635C10.4699 19.9902 11.0827 20.6036 11.7134 20.6045C11.9792 20.6049 12.2404 20.5358 12.4713 20.4041C13.0192 20.0914 13.2493 19.2551 13.7095 17.5825C13.9119 16.8472 14.013 16.4795 14.2254 16.1835C14.3184 16.054 14.4262 15.9358 14.5468 15.8314C14.8221 15.593 15.1788 15.459 15.8922 15.191L17.7362 14.4981C20.4 13.4973 21.7319 12.9969 21.9667 11.9115C22.2014 10.826 21.1954 9.81905 19.1835 7.80516Z" />
                    <rect class="pin_node" style="opacity:0" x="0" y="0" width="24" height="24"  />
                    </svg>`;


                        displayNameItem.appendChild(pinButton);
                        /* End Pin Button */


                        displayNamesList.appendChild(displayNameItem);
                    } catch (err) {
                        console.log(err);
                    }
                });

                categoryItem.addEventListener("click", function (event) {

                    if (event.target === event.currentTarget) {

                        displayNamesList.style.display = displayNamesList.style.display === "none" ? "block" : "none";
                    }
                });



                sidebarCustomNodes.appendChild(categoryItem);



            }
            if (!categorySearchToggle && itemSearchInput.value != "") {
                sdExpandAll(1);

            }

            loadPinnedItemsAndAddToBookmarks();


            /* preview */

            const sidebarItems_cat = document.querySelectorAll('.sidebarItem');
            const previewDiv = document.getElementById('previewDiv');
            let sidebad_view_width = document.getElementById("sidebar_views").offsetWidth;
            sidebarItems_cat.forEach(item => {

                item.addEventListener('mouseover', function () {

                    if (this.classList.contains('sidebarItem') && this.tagName === 'LI') {
                        let descriptionDiv = "";
                        const itemPosition = getElementPosition(this);
                        let previewDivTop = 0;
                        const [previewContent, node_description] = createNodePreview(item.id);
                        if (node_description) {
                            descriptionDiv = "<div class='sb_description'>" + node_description + "</div>";
                        }
                        previewDiv.innerHTML = previewContent + descriptionDiv;
                        previewDiv.style.display = 'block';
                        const correction_offset = 45;

                        if (itemPosition.top - this.offsetHeight >= 0 && itemPosition.top + previewDiv.offsetHeight < document.body.offsetHeight) {
                            previewDivTop = itemPosition.top - this.offsetHeight

                        } else if (itemPosition.top - this.offsetHeight - previewDiv.offsetHeight <= 0) {
                            previewDivTop = 0 + correction_offset;


                        }
                        else {

                            previewDivTop = (itemPosition.top + this.offsetHeight) - previewDiv.offsetHeight;
                        }

                        let sidebar_width = parseInt(getVar("sidebarWidth")) || 300;


                        previewDiv.style.top = `${previewDivTop}px`;


                        const previewDivLeft = sidebar_width - sidebad_view_width;

                        if (sbPosition == "left") {
                            previewDiv.style.left = `${previewDivLeft}px`;
                        } else {
                            previewDiv.style.right = `${previewDivLeft}px`;
                        }

                    }
                });

                item.addEventListener('mouseout', function () {
                    previewDiv.style.display = 'none';
                })

            });

            categoriesList.addEventListener('scroll', function () {
                previewDiv.style.display = 'none';
            });

            window.addEventListener('click', function (event) {

                if (!event.target.classList.contains('sidebarItem')) {
                    previewDiv.style.display = 'none';

                }
            });


            reloadCtxMenu()
            resolve();
        });
    }
    let udata = await updateList();






    const dragHandle = document.getElementById("dragHandle");

    let isDragging = false;
    let startX;
    let startWidth;


    dragHandle.addEventListener("mousedown", function (event) {
        isDragging = true;
        startX = event.clientX;
        startWidth = parseInt(window.getComputedStyle(sidebar_main).width);

    });


    document.addEventListener("mouseup", function () {

        if (isDragging) {
            isDragging = false;

            saveSidebarWidth(sidebar_main);

        }
    });


    document.addEventListener("mousemove", function (event) {
        if (!isDragging) return;

        const delta = event.clientX - startX;
        if (sbPosition === "left") {
            sidebar_main.style.width = (startWidth + delta) + "px";
        } else {
            sidebar_main.style.width = (startWidth - delta) + "px";
        }
    });







}




async function addSidebar() {

    let draggedElementId;
    const sidebar_width = restoreSidebarWidth();
    const response = await fetch(cnPath + 'html/sidebar.html');
    let html = await response.text();

    html = html.replace(/{{sidebar_width}}/g, sidebar_width);
    html = html.replace(/{{node_path}}/g, cnPath);
    const canvas = $el("sidebar", {
        parent: document.body,
        innerHTML: html
    });

    document.getElementById("content_sidebar_home").addEventListener("click", async function (event) {
        const clickedElement = event.target;
        const pinnedItems = await loadPinnedItems();
        const pinButton = clickedElement.tagName;


        if (pinButton == "rect" && clickedElement.classList.contains("pin_node")) {
            let itemId;
            try {
                itemId = clickedElement.parentElement.parentElement.parentElement.id;
            } catch (err) {
                console.log(err);
            }

            if (!pinnedItems.includes(itemId)) {

                const sidebarItemId = itemId;
                pinItem(sidebarItemId);
                clickedElement.parentElement.getElementsByClassName("pin_normal")[0].classList.add("pinned");

            }//remove from sidebar
            else {
                if (clickedElement.parentElement.parentElement.parentElement.parentElement.id == "sidebarBookmarks") {
                    clickedElement.parentElement.parentElement.parentElement.remove();

                    const itemIndex = pinnedItems.indexOf(itemId);


                    removePinnedClass(itemId);

                    if (itemIndex !== -1) {
                        pinnedItems.splice(itemIndex, 1);
                        savePinnedItems(pinnedItems);
                    }
                } else {

                    unpinItem(itemId);
                }

                clickedElement.parentElement.getElementsByClassName("pin_normal")[0].classList.remove("pinned");
            }


        }
        else if ((pinButton == "rect") && clickedElement.classList.contains("expand_node")) {

            sdExpandAll();
        }
        else if ((pinButton == "LABEL") && clickedElement.id === "sb_label_custom") {


            toggleCollapseCustom();

        }




    });


    const sidebarItems = document.querySelectorAll(".sidebar li ul li");
    sidebarItems.forEach(item => {
        item.draggable = true;
    });


    function convertCanvasToOffset(canvas, pos, out) {
        out = out || [0, 0];
        out[0] = pos[0] / canvas.scale - canvas.offset[0];
        out[1] = pos[1] / canvas.scale - canvas.offset[1];
        return out;
    };


    function handleDrop(event) {
        event.preventDefault();

        if (event.srcElement.tagName.toLowerCase() != "canvas") {
            return;
        }
        const coord = convertCanvasToOffset(app.canvasEl.data.ds, [event.clientX, event.clientY]);
        const x = coord[0];
        const y = coord[1];
        sidebarAddNode(draggedElementId, draggedElementId, x, y);
        draggedElementId = null;
    }


    function allowDrop(event) {
        event.preventDefault();
    }


    // const search_bar = document.getElementById('searchInput');


    canvas.addEventListener("dragstart", function (event) {

        draggedElementId = event.target.id;
        previewDiv.style.display = 'none';
    });



    document.getElementById('switch_sidebar').addEventListener('click', function () {
        toggleSHSB();

    });

    document.addEventListener('drop', handleDrop);


    canvas.addEventListener('dragover', allowDrop);


    // expand/collapse pinned
    const pinnedLabel = document.getElementById("sb_label_pinned");


    pinnedLabel.addEventListener('click', function () {
        toggleCollapsePinned();
    });



    createCategoryList();
    SidebarPostBoot();
}


function toggleSHSB(force = undefined) {
    const side_bars = document.querySelectorAll(".content_sidebar");
    const main_sidebar = document.getElementById('sidebar');
    const search_bar = document.getElementById('searchInput');
    const scrollToTopButton = document.getElementById("sb_scrollToTopButton");
    const clearIcon = document.querySelector(".clearIcon");
    const searchCategoryIcon = document.querySelector(".searchCategoryIcon");
    const switch_sidebar = document.getElementById('switch_sidebar');
    //search_bar.classList.toggle('closed',force);

    side_bars.forEach(side_bar => {
        //side_bar.classList.toggle('closed',force);

        if (force !== undefined) {
            if (force) {
                side_bar.classList.add('closed');
                clearIcon.classList.add('closed');
                searchCategoryIcon.classList.add('closed');
                search_bar.classList.add('closed');
                scrollToTopButton.classList.add('closed');
            } else {
                side_bar.classList.remove('closed');
                clearIcon.classList.remove('closed');
                searchCategoryIcon.classList.remove('closed');
                search_bar.classList.remove('closed');
                scrollToTopButton.classList.remove('closed');

            }
        } else {

            if (side_bar.classList.contains('closed')) {
                side_bar.classList.remove('closed');
                clearIcon.classList.remove('closed');
                searchCategoryIcon.classList.remove('closed');
                search_bar.classList.remove('closed');
                //fix for keyboard shortcuts
                if (getVar("sb_minimized") == "true") {
                    switch_sidebar.style.filter = "brightness(0.8)";
                }

            } else {
                if (getVar("sb_minimized") == "false") {
                    side_bar.classList.add('closed');
                    clearIcon.classList.add('closed');
                    searchCategoryIcon.classList.add('closed');
                    search_bar.classList.add('closed');
                    scrollToTopButton.classList.add('closed');
                    switch_sidebar.style.filter = "brightness(1.0)";
                } else {
                    switch_sidebar.style.filter = "brightness(0.8)";
                }
            }
        }

    });


    if (getVar("sb_minimized") == "false") {

        if (force == undefined) {
            setVar("sb_minimized", true);
        }
        main_sidebar.style.width = '45px';
    } else {

        if (force == undefined) {
            setVar("sb_minimized", false);
            main_sidebar.style.width = getVar("sidebarWidth") || '300px';
        } else if (force == true) {

            main_sidebar.style.width = '45px'; console.log("minimized")

        } else {
            main_sidebar.style.width = getVar("sidebarWidth") || '300px';
        }

    }




}

//option: disable auto-hide when minimized

//Shortcuts

function handleKeyPress(event) {

    if (event.altKey && event.key.toLowerCase() === "x") {
        //toggle sidebar if it's closed
        const side_bar = document.getElementById('content_sidebar_home');
        if (side_bar.classList.contains('closed')) {
            toggleSHSB();

        }
        //focus on searchInput
        searchInput.focus();


    }
    if (event.altKey && event.key.toLowerCase() === "z") {
        toggleSHSB()
    }
    if (event.altKey && event.key.toLowerCase() === "g") {
        showSettings()
    }
}





// Custom Node View
function processViews(viewsData, settingsData) {

    const sb = document.getElementById('sidebar');
    const sbv = document.getElementById('sidebar_views');

    const promises = viewsData.map(async (view) => {
        const icon = view.icon;
        if (!icon) {
            return;
        }
        const description = view.description;

        const div_view = document.createElement('div');
        div_view.classList = "content_sidebar sb_hidden";
        div_view.id = "panel_" + view.id;
        div_view.dataset.content = view.id;
        const bsb = document.getElementById('content_sidebar_home');
        // add button to sidebarviews
        bsb.insertAdjacentElement('afterend', div_view);

        //console.log('Icon:', icon);
        //console.log('Descr:', description);
        //console.log('Panel:', view.panels);
        //console.log('-------------------');

        await Promise.all(view.panels.map(async (panel) => {
            try {
                const response = await fetch(cnPath + `panels/${panel}/${panel}.html`);
                const html = await response.text();

                if (html !== "404: Not Found") {
                    //inherit width from bsb
                    const div_panel = document.createElement('div');
                    div_panel.classList = "panel_sidebar";
                    div_panel.id = "panel_" + panel;

                    const div_panel_title = document.createElement('label');
                    div_panel_title.classList = "panel_sidebar_title sb_label";
                    div_panel_title.id = "panel_title_" + panel;

                    div_panel_title.innerHTML = panel.replace("_", " ");



                    div_panel.appendChild(div_panel_title);

                    const canvas = $el("div", {
                        parent: div_panel,
                        innerHTML: html,
                    });


                    div_view.insertAdjacentElement('beforeend', div_panel);
                    jsloader(`${cnPath}panels/${panel}/${panel}.jsb`);
                    console.log("LOADING " + cnPath + `panels/${panel}/${panel}.js`)
                }
            } catch (error) {
                console.error('Errore nel caricamento del file HTML:', error);
            }
        }));



        //sidebar menu
        const div_button = document.createElement('div');


        div_button.classList = "view_button";
        div_button.id = "switch_" + view.id;
        //inherit width from bsb

        div_button.dataset.tab = view.id;
        div_button.alt = view.description;
        div_button.innerHTML += view.icon;

        div_button.addEventListener('click', function () {
            const tabId = "panel_" + this.getAttribute('data-tab');
            switchTab(tabId)
        });
        sbv.appendChild(div_button);
    });
    return Promise.all(promises).then(() => {

        setTimeout(() => {

            settingsSetup(app, $el)
            setContextMenu(settingsData, "#content_sidebar_home .sidebarItem", 1);
            switchTab(getVar('sb_current_tab'));
            const sidebar_view = document.getElementById('sidebar_views');
            const sidebar = document.getElementById('sidebar');
            sidebar_view.addEventListener('mouseover', function () {
                if (getVar('sb_minimized') == "true") {
                    toggleSHSB(false);

                }

            });
            document.addEventListener('click', function (event) {
                //if click is outside sidebar id element
                if (!sidebar.contains(event.target)) {
                    if (getVar('sb_minimized') == "true") {
                        toggleSHSB(true);
                    }
                }

            });
        }, 100);

    });



}



async function loadData() {

    try {

        const response1 = await fetch(cnPath + 'views/views.json');
        const viewsData1 = await response1.json();
        const response2 = await fetch(cnPath + 'views/custom_views.json');
        const viewsData2 = await response2.json();
        const allViewsData = [...viewsData1, ...viewsData2];
        const response3 = await fetch(cnPath + 'settings.json');
        const settingsData = await response3.json();
        processViews(allViewsData, settingsData);
    } catch (error) {
        console.error('Error loading views:', error);
    }

}




async function SidebarPostBoot() {
    console.log('SidebarPostBoot');




    const switch_home = document.getElementById("switch_home");

    //only for home
    switch_home.addEventListener('click', function () {
        switchTab("content_sidebar_home", 1)



    });



    if (getVar("sb_minimized") == "false") {
        const switch_sidebar = document.getElementById('switch_sidebar');
        switch_sidebar.style.filter = "brightness(0.8)";
    }


    document.addEventListener("keydown", handleKeyPress);
    const sb = document.getElementById('content_sidebar_home');
    const scrollToTopButton = document.getElementById("sb_scrollToTopButton");
    scrollToTopButton.addEventListener("click", function () {
        sb.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });



    sb.addEventListener("scroll", function () {

        if (sb.scrollTop > 0) {
            scrollToTopButton.style.display = "block";
        } else {
            scrollToTopButton.style.display = "none";
        }
    });

    const sidebarBookmarks = document.getElementById("sidebarBookmarks");
    if (getVar("sb_pinned_collapsed")) {
        sidebarBookmarks.style.display = getVar('sb_pinned_collapsed');
    }

    if (getVar("sb_custom_collapsed")) {
        sidebarCustomNodes.style.display = getVar('sb_custom_collapsed');
    }
    loadData();
    /*
    const sidebar_views = document.getElementById("sidebar_views");
    const sidebar = document.getElementById("sidebar");
    //if is hover sidebar_views
    sidebar_views.addEventListener("mouseover", function() {
        toggleSHSB();
    })
    //if is not hover sidebar_views
    sidebar.addEventListener("mouseout", function() {
        toggleSHSB();
    })
   */
}


// Function to check if the element is not an empty object
function SidebarBoot() {
    if (Object.keys(LiteGraph.registered_node_types).length > 10) {
        // Execute the function when the element is not an empty object
        //
        //MIGRATION
        migrationSettings()

        addSidebarStyles("css/base_style.css");

        addSidebar();

        console.log('SidebarBoot');
        console.timeEnd('execution time');



    } else {
        // Retry after a period of time
        setTimeout(SidebarBoot, 500); // Check every 100 milliseconds
    }
}

// Start checking the element
SidebarBoot();
