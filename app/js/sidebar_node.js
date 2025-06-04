
import { api } from "../../../../scripts/api.js"
import { app } from "../../../../scripts/app.js";
import { $el } from "../../../../scripts/ui.js";
import { fuzzyMatch } from "./fts_fuzzy_match.js";
import { GroupNodeConfig, GroupNodeHandler } from "../../../../extensions/core/groupNode.js";

const gnc = GroupNodeConfig;
//import {settingsSetup} from './functions/settings.jsb';
console.time('execution time');
//load folder name
var nameRequest = await fetch('sidebar/current');
var nameFolder = await nameRequest.json();
const cnPath =  `../extensions/${nameFolder}/`
function jsloader(url) {
    return new Promise((resolve, reject) => {
        try{
        const script = document.createElement("script");
        const timestamp = new Date().getTime();
        script.src = `${url}?v=${timestamp}`;
        script.type = "text/javascript";
        script.onload = () => resolve(script);
        //script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
        }catch(err){
            console.log(err)
        }
    });
}




jsloader(cnPath + "js/functions/sb_fn.js");
jsloader(cnPath + "js/functions/utils.js");
jsloader(cnPath + "js/functions/settings.js");




let CUSTOM_COLORS;
const SETTING_THEME = 'jovi.color.theme';

try {
    CUSTOM_COLORS = app.extensionManager.setting.get(SETTING_THEME) || {};
    Object.keys(DEFAULT_THEME).forEach(key => {
        if (!(key in CONFIG_THEME)) {
            CONFIG_THEME[key] = DEFAULT_THEME[key];
        }
    });
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

        item.addEventListener('touchstart', function (event) {
            dragItem = event.target;
        });

        item.addEventListener('touchmove', function (event) {
            event.preventDefault();
            const touch = event.touches[0];
            const dropZone = document.elementFromPoint(touch.clientX, touch.clientY).closest("ul");
            if (dropZone && dragItem) {
                dropZone.appendChild(dragItem); // O usa insertBefore se necessario
            }
        });

        item.addEventListener('touchend', function (event) {
            if (dragItem) {
                savePinnedItems(getSidebarItemIds());
                dragItem = null;
            }
        });

        getPreview(item, previewDiv,sidebad_view_width,(item) => {
                return createNodePreview(item.id);
            });

        reloadCtxMenu();
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
            savePinnedItems(getSidebarItemIds());
        }
    });
}


function saveSidebarPosition(sideb) {
    const width = sideb.style.width.replace('px', '');
    //const top = sideb.style.top.replace('px', '');

    const top = getDynamicCSSRule(".sidebar", 'top').replace('%', '');
    const height = getDynamicCSSRule(".sidebar", 'height').replace('%', '');
    if (width > 50) {

    setVar("sidebarWidth", width);
    addDynamicCSSRule('.side-bar-panel', 'min-width', 'calc('+width+'px - 35px)');
    }

    if (parseInt(top) > 0 ) {
    setVar("sb_bartop", top);
    }
    else {
    setVar("sb_bartop", 0);
    }
    if (height > 0) {
    setVar("sb_barbottom", height);
    }
    
    

}


function restoreSidebarWidth() {
    //if getVar("sidebarWidth") contains px remove it
    if (getVar("sidebarWidth") && getVar("sidebarWidth").includes('px')) {
        setVar("sidebarWidth", getVar("sidebarWidth").replace('px', ''));
    }   


    if (getVar("sidebarWidth") == null) {
        setVar("sidebarWidth", 400);
       
      
    }
    if (getVar("sb_minimized") == null) {
        setVar("sb_minimized", "true");
    }
    if (getVar("sb_current_tab") == null) {
        setVar("sb_current_tab", "panel_home");

    }

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
            try{
            let addedItem = sidebarBookmarks.appendChild(item.cloneNode(true));
            addedItem.lastChild.lastChild.classList.add("pinned");

            }catch(err){   }
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
    const itemSearchInput = document.getElementById("searchInputSB");

    itemSearchInput.addEventListener("input", async function () {
    
        // defaultSearchToggle = await getConfiguration("sb_search_type")
        if (defaultSearchToggle == "original" && itemSearchInput.value != "") {
            //search in all .sidebarItem
            handleSearch(categorySearchToggle, "#panel_home", "searchInputSB")
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


    function buildTree(categories, useSubcategories = true) {
        const tree = {};

        for (const category in categories) {
            const parts = useSubcategories ? category.split('/').filter(part => part !== '') : [category];

            let current = tree;
            if (parts.length > 0 || !useSubcategories) {


            for (const part of parts) {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }

            if (!current.items) {
                current.items = [];
            }

            categories[category].forEach(displayName => {
                current.items.push(displayName);
            });
            }
        }

        return tree;
    }

    function createHtmlFromTree(tree, parentElement,pinnedItems) {
        for (const key in tree) {
            if (key !== 'items') {
                const subfolderLi = document.createElement('li');
                subfolderLi.textContent = "🗀 " + key;
                subfolderLi.classList.add('sidebarCategory');
                subfolderLi.dataset.nameworkflow = key;

                const subfolderUl = document.createElement('ul');
                subfolderUl.style.display = "none";
                subfolderUl.classList.add('subfolder');
                subfolderUl.dataset.subfolder = key;
                subfolderUl.id = key + "_ul";
                subfolderUl.classList.add("displayNamesList");

                subfolderLi.appendChild(subfolderUl);
                parentElement.appendChild(subfolderLi);

                createHtmlFromTree(tree[key], subfolderUl,pinnedItems);
            }
        }

        if (tree.items) {
            tree.items.forEach(displayName => {
                try {

                    const displayNameMain = document.createElement('div');
                    displayNameMain.classList.add('displayName');
                    displayNameMain.title =  displayName.title;
                    displayNameMain.id = displayName.type;
                    displayNameMain.textContent = displayName.title;
                    const displayNameItem = document.createElement('li');
                    displayNameItem.classList.add('sidebarItem');
                    //displayNameItem.innerHTML = "<div class='displayName'>"+displayName.title+"</div>";
                    displayNameItem.title = displayName.title;
                    displayNameItem.draggable = true;
                    displayNameItem.appendChild(displayNameMain);

                    let color;
                    const nodeData = displayName?.nodeData;
                    // USE NODE'S DEFAULT COLOR, IF ANY
                    if (color === undefined && nodeData !== undefined) {
                        color = nodeData.color;
                    }
                    // JOVIMETRIX CUT-OUT FOR CUSTOM COLORED NODES
                    if (CUSTOM_COLORS) {
                        color = CUSTOM_COLORS[displayName.title];
                        if (color === undefined && nodeData !== undefined) {
                            let k = nodeData.category;
                            while (k) {
                                color = CUSTOM_COLORS[k];
                                if (color) {
                                    color = color.title;
                                    break;
                                }
                                const last = k.lastIndexOf('/');
                                k = last !== -1 ? k.substring(0, last) : '';
                            }
                        }
                    }
                    // APPLY THE COLOR, IF ANY
                    if (color) {
                        displayNameItem.style = `background: ${color} !important;`;
                    }
                    //

                    displayNameItem.id = displayName.type;

                    /* Create Pin Button */

                    const pinButton = document.createElement('button');
                    pinButton.classList.add('pinButton');

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

                    parentElement.appendChild(displayNameItem);
                } catch (err) {
                    console.log(err);
                }
            });
        }
    }


    async function renderList() {

        return new Promise(async (resolve, reject) => {
            const pinnedItems = await loadPinnedItems();
            //
            const sidebarCustomNodes = document.getElementById("sidebarCustomNodes");


            let tree_view = await getConfiguration("sb_tree_view") || "multi";
            if (tree_view=="multi" ) {
                tree_view = true;
            } else{
                tree_view = false;
            }
            const tree = buildTree(categories,tree_view);


            createHtmlFromTree(tree, sidebarCustomNodes,pinnedItems);



            if (!categorySearchToggle && itemSearchInput.value != "") {
                sdExpandAll(1);

            }

            loadPinnedItemsAndAddToBookmarks();


            /* PREVIEW */

            const sidebarItems_cat = document.querySelectorAll('.sidebarItem');
            const previewDiv = document.getElementById('previewDiv');
            let sidebad_view_width = document.getElementById("sidebar_views").offsetWidth;
            sidebarItems_cat.forEach(item => {

                getPreview(item,previewDiv,sidebad_view_width,(item) => {
                return createNodePreview(item.id);
            });

            });

            categoriesList.addEventListener('scroll', function () {
                previewDiv.style.display = 'none';
            });

            window.addEventListener('click', function (event) {

                if (!event.target.classList.contains('sidebarItem')) {
                    previewDiv.style.display = 'none';

                }
            });

            /* END PREVIEW */


            const categoryItems = document.querySelectorAll("#panel_home .sidebarCategory");
            categoryItems.forEach(function (folderItem) {
                folderItem.addEventListener("click", function (event) {

                    if (event.target === event.currentTarget) {
                        const displayNamesList = event.target.querySelector("ul");

                        displayNamesList.style.display = displayNamesList.style.display === "none" ? "block" : "none";

                        setNodeStatus('sb_categoryNodeStatus',displayNamesList.parentElement.dataset.nameworkflow, displayNamesList.style.display)
                    }
                });



            });



            reloadCtxMenu()
            resolve();
        });
    }
    let udata = await updateList();


/* RESIZE */

const dragHandles = {
    "dragHandle": "width",
    "dragHandleT": "top",
    "dragHandleV": "height",
    "sidebar_views": "top" // Condizione per altKey più avanti
};
let dragging = null;
let startX, startY, startValue;
const containerHeight = window.innerHeight;
Object.keys(dragHandles).forEach(handleId => {
    const element = document.getElementById(handleId);
    if (!element) return;

    element.addEventListener("mousedown", function (event) {
        if (handleId === "sidebar_views") {
            if (!event.altKey) return; // Gestisci l'eccezione altKey per sidebar_views
            element.style.cursor = 'n-resize'; // Cambia cursore quando alt è premuto
        } else if (handleId === "dragHandle" && localStorage.getItem("sb_state") === "closed") {
         
            return; // Gestisci l'eccezione minimized
        } else {
            element.style.cursor = ''; // Cambia cursore per gli altri handle
        }

        dragging = dragHandles[handleId];
        startX = event.clientX;
        startY = event.clientY;

        if (dragging === "width") {
            startValue = parseInt(window.getComputedStyle(sidebar_main).width);
        } else if (dragging === "top") {
            startValue = (parseInt(window.getComputedStyle(sidebar_main).top)/ containerHeight) * 100;
        } else if (dragging === "height") {
            
            startValue = (parseFloat(window.getComputedStyle(sidebar_main).height) / containerHeight) * 100;
        }

        event.preventDefault(); // Evita il comportamento predefinito del browser (ad esempio, selezione di testo)
    });
});

document.addEventListener("mouseup", function () {
    if (dragging) {
        saveSidebarPosition(sidebar_main);
        dragging = null;
        
        // Ripristina il cursore
        Object.keys(dragHandles).forEach(handleId => {
            const element = document.getElementById(handleId);
            if (element) {
                element.style.cursor = ''; // Reset del cursore a default
            }
        });
    }
});

document.addEventListener("mousemove", function (event) {
    if (!dragging) return;

    if (dragging === "width") {
        const delta = event.clientX - startX;
        if (sbPosition === "left") {
            sidebar_main.style.width = (startValue + delta) + "px";
        } else {
            sidebar_main.style.width = (startValue - delta) + "px";
        }
    } else if (dragging === "top") {
        const deltaV = event.clientY - startY;
        
        const newTopPercent = ((startValue * containerHeight / 100) + deltaV) / containerHeight * 100;
       
        addDynamicCSSRule('.sidebar', 'top', newTopPercent + '%');


    } else if (dragging === "height") {
        const deltaV = event.clientY - startY;
        
        const newHeightPercent = ((startValue * containerHeight / 100) + deltaV) / containerHeight * 100;
        //sidebar_main.style.setProperty("height", newHeightPercent + "%", "important");
        addDynamicCSSRule('.sidebar', 'height', newHeightPercent+ '%');
    }
});

    
    // Funzioni per gestire gli eventi touch
    dragHandle.addEventListener("touchstart", function (event) {
        if (localStorage.getItem("sb_state") === "open")
            {
        isDragging = true;
        startX = event.touches[0].clientX;
        startWidth = parseInt(window.getComputedStyle(sidebar_main).width);
            }
    });
    
    document.addEventListener("touchend", function () {
        if (isDragging) {
            isDragging = false;
            saveSidebarPosition(sidebar_main);
        }
    });
    
    document.addEventListener("touchmove", function (event) {
        if (!isDragging) return;
    
        const delta = event.touches[0].clientX - startX;
        if (sbPosition === "left") {
            sidebar_main.style.width = (startWidth + delta) + "px";
        } else {
            sidebar_main.style.width = (startWidth - delta) + "px";
        }
    });
    

    /* END RESIZE */

}




async function addSidebar() {

    let draggedElementId;
    const sidebar_width = restoreSidebarWidth();
    const timestamp = new Date().getTime();
    const response = await fetch(cnPath + 'html/sidebar.html?v=' + timestamp);
    let html = await response.text();
  
    //addDynamicCSSRule('.splitter-overlay', 'width', sidebar_width);
    html = html.replace(/{{sidebar_width}}/g, sidebar_width+"px");
    html = html.replace(/{{node_path}}/g, cnPath);
    const canvas = $el("sidebar", {
        parent: document.body,
        innerHTML: html
    });





    document.getElementById("panel_home").addEventListener("click", async function (event) {
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



    function handleTouchMove(event) {
        event.preventDefault();
    }
    
    function handleTouchEnd(event) {
        event.preventDefault();
    
        const touch = event.changedTouches[0];
        const dropZone = document.elementFromPoint(touch.clientX, touch.clientY);
    
        if (dropZone.tagName.toLowerCase() != "canvas") {
            return;
        }
    
        const coord = convertCanvasToOffset(app.canvasEl.data.ds, [touch.clientX, touch.clientY]);
        const x = coord[0];
        const y = coord[1];
        sidebarAddNode(draggedElementId, draggedElementId, x, y);
        draggedElementId = null;
    }
    
    // const search_bar = document.getElementById('searchInputSB');


  
    // Gestione degli eventi di trascinamento
    canvas.addEventListener("dragstart", function (event) {
        draggedElementId = event.target.id;
        previewDiv.style.display = 'none';
    });

    canvas.addEventListener("dragover", allowDrop);

    // Gestione degli eventi touch
    canvas.addEventListener("touchstart", function (event) {
        draggedElementId = event.target.id;
        previewDiv.style.display = 'none';
    });

    canvas.addEventListener("touchmove", handleTouchMove);

    canvas.addEventListener("touchend", handleTouchEnd);

    // Altri eventi
    document.getElementById('switch_sidebar').addEventListener('click', function () {
        toggleSHSB();
    });

    document.addEventListener('drop', handleDrop);

    const pinnedLabel = document.getElementById("sb_label_pinned");
    pinnedLabel.addEventListener('click', function () {
        toggleCollapsePinned();
    });


    createCategoryList();
    SidebarPostBoot();
}

//Shortcuts



async function handleKeyPress(event) {
    // Retrieve user-saved shortcuts from localStorage, or fall back to default values if not set
    let shortcuts = JSON.parse(await getConfiguration('sb_shortcuts')) || {
        action1: 'Alt + X',
        action2: 'Alt + Z',
        action3: 'Alt + G'
    };

    // Function to check if a key press matches the given shortcut
    function isShortcutMatch(shortcut, event) {
        const parts = shortcut.split(' + ');
        const key = parts.pop().toLowerCase(); // Extract the main key (e.g., 'X')
        const modifiers = parts; // Remaining parts are the modifiers (e.g., 'Alt', 'Ctrl')

        // Return true if all the modifiers and the main key match the current event
        return (
            modifiers.includes('Ctrl') === event.ctrlKey &&
            modifiers.includes('Alt') === event.altKey &&
            modifiers.includes('Shift') === event.shiftKey &&
            key === event.key.toLowerCase()
        );
    }

    let isCustomShortcut = false; // Flag to track if a custom shortcut is matched

    // Check if the pressed keys match the shortcut for action1 (Alt + X by default)
    if (isShortcutMatch(shortcuts.action1, event)) {
        const side_bar = document.getElementById('panel_home');
        if (side_bar.classList.contains('closed')) {
            toggleSHSB(); // Toggle sidebar if it's closed
        }
        
        switchTab("panel_home");
        searchInputSB.focus(); // Focus on the search input
        isCustomShortcut = true; // Mark that a custom shortcut was triggered
    }

    // Check if the pressed keys match the shortcut for action2 (Alt + Z by default)
    if (isShortcutMatch(shortcuts.action2, event)) {
        toggleSHSB(); // Toggle the sidebar
        isCustomShortcut = true; // Mark that a custom shortcut was triggered
    }

    // Check if the pressed keys match the shortcut for action3 (Alt + G by default)
    if (isShortcutMatch(shortcuts.action3, event)) {
        showSettings(); // Open settings panel
        isCustomShortcut = true; // Mark that a custom shortcut was triggered
    }

    // Only prevent the default action if a custom shortcut was triggered
    if (isCustomShortcut) {
        event.preventDefault();
    }
}


// Custom Node View
async function processViews(viewsData, settingsData) {
    const sb = document.getElementById('sidebar');
    const sbv = document.getElementById('sidebar_views');

    // Funzione per caricare un singolo view
    const loadView = async (view) => {
        const icon = view.icon;
        if (!icon) {
            return;
        }
        const description = view.description;

        const div_view = document.createElement('div');
        div_view.classList = "content_sidebar sb_hidden";
        div_view.id = "panel_" + view.id;
        div_view.dataset.content = view.id;
        const bsb = document.getElementById('panel_home');
        bsb.insertAdjacentElement('afterend', div_view);

        // Caricamento dei pannelli
        await Promise.all(view.panels.map(async (panel) => {
            try {
                const timestamp = new Date().getTime();
                const response = await fetch(cnPath + `panels/${panel}/${panel}.html?v=${timestamp}`);
                const html = await response.text();

                if (html !== "404: Not Found") {
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

        // Creazione del pulsante per la vista
        const div_button = document.createElement('div');
        div_button.classList = "view_button right";
        div_button.id = "switch_" + view.id;
        div_button.dataset.tab = view.id;
        div_button.dataset.tooltip = description;
        div_button.innerHTML += view.icon;

        div_button.addEventListener('click', function () {
            const tabId = "panel_" + this.getAttribute('data-tab');
            switchTab(tabId);
            if (getVar("sb_auto_hide") == "false" && getVar("sb_minimized") == "true") {
                toggleSHSB(false);
            }
        });
        sbv.appendChild(div_button);
    };

    // Gestione degli ordini dei viewData
    await viewsData.reduce(async (prevPromise, view) => {
        await prevPromise;
        return loadView(view);
    }, Promise.resolve());

    setTimeout(() => {
        settingsSetup(app, $el);
        setContextMenu(settingsData, "#panel_home .sidebarItem", 1);
        switchTab(getVar('sb_current_tab'));
        const sidebar_view = document.getElementById('sidebar_views');
        const sidebar = document.getElementById('sidebar');

        sidebar_view.addEventListener('mouseover', function () {
            if (getVar('sb_auto_hide') == "true") {
                if (getVar('sb_minimized') == "true") {
                    toggleSHSB(false);
                }
            }
        });

        document.addEventListener('click', function (event) {
            if (!sidebar.contains(event.target)) {
                if (getVar('sb_minimized') == "true") {
                    toggleSHSB(true);
                }
            }
        });
    }, 100);
}






async function loadData() {

    try {
        const timestamp = new Date().getTime();
        const response1 = await fetch(`${cnPath}views/views.json?v=${timestamp}`);
        const viewsData1 = await response1.json();
        const response2 = await fetch(`${cnPath}views/custom_views.json?v=${timestamp}`);
        const viewsData2 = await response2.json();
        const allViewsData = [...viewsData1, ...viewsData2];
        const response3 = await fetch(`${cnPath}settings.json?v=${timestamp}`);
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
        switchTab("panel_home", 1)
        if (getVar("sb_auto_hide") == "false" && getVar("sb_minimized") == "true") {
            toggleSHSB(false);
            }


    });

    if (getVar("sb_minimized") == "false") {
        const switch_sidebar = document.getElementById('switch_sidebar');
        switch_sidebar.style.filter = "brightness(0.8)";
    }else{
        var sb_show_at_startup = getVar("sb_show_at_startup") || "false";

        if (sb_show_at_startup == "false" ) {
            toggleSHSB(true);
        }
    }


    document.addEventListener("keydown", handleKeyPress);
    const sb = document.getElementById('panel_home');
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

  try{
   //BETA
  
    

        if (getVar('Comfy.Settings.Comfy.UseNewMenu') != '"Disabled"') {
            const sidebar = document.getElementById('sidebar');
            const dragHandleT = document.getElementById('dragHandleT');
            if (getVar('Comfy.Settings.Comfy.UseNewMenu') === '"Top"') {
            sidebar.style.marginTop = '35px';
            sidebar.style.paddingTop = '0px';
            dragHandleT.style.top = '-6px';
            }
            else{
                sidebar.style.marginTop = '0px';
                sidebar.style.marginBottom = '35px';
                sidebar.style.paddingTop = '0px';
                sidebar.style.paddingBottom = '0px';
                dragHandleT.style.top = '0px';
            }
    
           
        }
        if (getVar('sb_embed_osb') == 'true') {
        // Seleziona il contenitore .sidebar
        const sidebarContainer = document.getElementById('official_button');

        // Seleziona tutti i bottoni all'interno della nav
        const navContainer = document.querySelector('.side-tool-bar-container');
        const buttons = navContainer.querySelectorAll('button');

        // Sposta ogni bottone dalla nav alla sidebar
        buttons.forEach(button => {
          
            if (!(button.classList.contains('node-library-tab-button') && getVar('sb_embed_osb_nodes') === 'false')) {
                sidebarContainer.appendChild(button);
            }
            
            
    });

 
    navContainer.style.display = "none";

    }

  }catch(e){

  }
}


// Function to check if the element is not an empty object
function SidebarBoot() {
    if (Object.keys(LiteGraph.registered_node_types).length > 10) {
        // Execute the function when the element is not an empty object
        //
        try {
        //MIGRATION
        migrationSettings()
        }
        catch(e){
            console.log(e);
        }
        addSidebarStyles("css/base_style_sb.css");

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
