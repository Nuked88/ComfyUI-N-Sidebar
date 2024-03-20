import { $el } from "../../../scripts/ui.js";

let categorySearchToggle = false;
function addSidebarStyles() {
    const sidebarStyle = `
    .litegraph .dialog {
        z-index: 100 !important;
    }

        .sidebar {
            position: absolute;
            top: 0;
            left: -250px; 
            width: fit-content;
            height: calc(100% - 19px);
			
            color: white;
            transition: left 0.3s ease;
			z-index: 2;
			overflow: hidden;
		
			padding-top: 19px;
            left: 0;
            user-select: none; 
	
        }
       
        .sidebar ul {
            list-style-type: none;
      
            border-bottom: 6px solid #252525;
            background: #222;    
            padding-left: 5px;
            padding-right: 5px;
        }
        .sidebar li {
			padding: 10px;
			cursor: pointer;
			user-select: none; 
		}
		
.content_sidebar {
    background-color: #353535; /*#3333337d;*/
    overflow-y: auto; 
    overflow-x: hidden;
    height: 100%;
	float:left;
    backdrop-filter: blur(5px);
}

.dragHandle {
    position: relative;
	float: left;
    right: 0;
    top: 0;
    height: 100%;
    width: 10px; 
    cursor: ew-resize; 
	background: rgb(62,62,62);
background: linear-gradient(90deg, rgb(62 62 62 / 46%) 0%, rgb(39 39 39 / 47%) 50%, rgb(28 28 28 / 31%) 100%);
}
#searchInput {
    box-sizing: border-box;
    width: 100%;
    border-radius: 5px;
    padding: 10px;
    border: none;
    user-select: none; 
    background: #222;
    color: #fff;

}
.sidebar-header {
    position: absolute;
    width: calc(100% - 49px);
    margin-top: 5px;
    margin-bottom: 10px;
    margin-left: 10px;  
   
    z-index: 400;
    
}
.clearIcon,.searchCategoryIcon{
    position: absolute;
    padding: 5px;
    right: 30px;
    color: #fff;
    font-size: x-large;
    cursor: pointer;
    opacity: 0.5;
    user-select: none;
}


.clearIcon:hover{
    opacity: 1.0;
}

.searchCategoryIcon{
    right: 0px;
    padding: 3px;
    font-size: larger;
    background: #636363;
    color: #fff;
    margin: 4px;
    border-radius: 5px;
    width: 18px;
    text-align: center;
    top: 0;
    

}

.searchCategoryIcon:hover{
    opacity: 0.5;
}

.sidebarCategory, #sidebarBookmarks{
	list-style-type: none;
    font-family: 'Open Sans',sans-serif;
    text-transform: capitalize;
    margin: 2px;
	background-color: #222;
    border-radius: 9px;
        padding-top: 11px;
        font-size: 15px;
}
.sidebarCategory:hover{
	background-color: #232323;
}
.sidebarItem:hover{
	background-color: #3a3a3a;
}
.sidebarItem {
    list-style-type: none;
    font-family: 'Open Sans',sans-serif;
    text-transform: capitalize;
    margin: 2px;
	background: #353535;
    border-radius: 8px;

    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: calc(100% - 39px);
}


.content_sidebar::-webkit-scrollbar {
    margin-top: 0.5rem;
    height: 1rem;
    width: .5rem;
    top: 10px;
}

.content_sidebar::-webkit-scrollbar:horizontal {
    height: .5rem;
    width: 1rem
}

.content_sidebar::-webkit-scrollbar-track {
    background-color: transparent;
    border-radius: 9999px
}

.content_sidebar::-webkit-scrollbar-thumb {
    --tw-border-opacity: 1;
    background-color: hsla(0,0%,50%,.8);
    border-color: rgba(255,255,255,0,0,0);
    border-radius: 9999px;
    border-width: 1px
}

.content_sidebar::-webkit-scrollbar-thumb:hover {
    --tw-bg-opacity: 1;
    background-color: rgba(150,150,150,var(--tw-bg-opacity))
}
#spacer {
    height: 45px;
}

#switch_sidebar {
    position: relative;
    float: left;
    left: 0;
    margin-left: -0.6rem;
    cursor: pointer;
    user-select: none;
    padding: 2px;
    font-size: 20px;
    background-color: #353535;
    border-bottom-right-radius: 5px;
    border-top-right-radius: 5px;

}
#searchInput.closed {
    display: none;
}
#content_sidebar.closed {
    width: 0 !important; 
}
.searchCategoryIcon.closed {
    display: none;
}
.clearIcon.closed {
    display: none;
}

.sidebarCategory .pinButton {
    background-color: transparent;
    border: 0;
    position: absolute;
    right: 0;
}

#sidebarBookmarks .pinButton {

    background-color: transparent;
    border: 0;

    position: absolute;
    right: 0;
}
.pinned{
    fill: #999 !important;
    opacity: 1 !important;
}
.svg_class{
    width: 24px;
    height: 24px;
    fill: #4e4e4e;
    cursor: pointer;
    /* hacky fix */
    margin-top: -5px;
    margin-left: -25px;
}

.pin_normal{
    opacity: 0.5;
}
.pin_normal:hover{
    opacity: 1;
}
.svg_class:hover{
    fill: #4e4e4e;
    
}


#sidebarBookmarks .sidebarItem {
    margin-left: 10px;
    margin-right: 29px;

}
.sb_label {
    font-family: 'Open Sans',sans-serif;
    position: relative;
    margin: 5px;
    font-weight: bold;
  
    background: #1e1e1e;
    /* border: 2px solid; */
    border-radius: 3px;
    padding-left: 6px;
    padding-right: 6px;
    display: block;
    width: calc(100% - 20px);
    text-align: center;
    user-select: none;
}

.expand_node, .pin_node{
    position: absolute;
    right: 5px;
    background: transparent;
    border: 0;
    
}
.expand_node svg ,  .pin_node svg {
    
    width: 20px;
    height: 20px;
    background: transparent;
    fill: white;
    cursor: pointer;
}




    `;

    const styleElement = $el("style", {
        parent: document.head,
        textContent: sidebarStyle
    });
}

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            return cookieValue;
        }
    }
    return null;
}

function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
}

function sidebarAddNode(name, text, x, y) {
    const node = LiteGraph.createNode(name, text)
    if (node) {
        const pos =
            [
                x,
                y
            ]
        node.pos = pos;
        app.graph.add(node)
    }
}

function saveSidebarWidth(sideb) {
    const width = sideb.style.width;


    document.cookie = setCookie("sidebarWidth", width, 3000);
}


function restoreSidebarWidth() {
    let width_sidebar = "auto";
    let cookieValue = getCookie("sidebarWidth");
    if (cookieValue) {

        width_sidebar = cookieValue;
    }
    return width_sidebar;
}


function savePinnedItems(pinnedItems) {
    const pinnedItemsString = JSON.stringify(pinnedItems);
    setCookie('pinnedItems', pinnedItemsString, 9999);
}


function loadPinnedItems() {
    const pinnedItemsString = getCookie('pinnedItems');
    if (pinnedItemsString) {
        return JSON.parse(pinnedItemsString);
    }
    return [];
}


function pinItem(itemId) {

    const item = document.getElementById(itemId);
    const sidebarBookmarks = document.getElementById("sidebarBookmarks");
    const pinnedItems = loadPinnedItems();
    if (!pinnedItems.includes(itemId)) {
        let addedItem = sidebarBookmarks.appendChild(item.cloneNode(true));

        addedItem.lastChild.lastChild.childNodes[1].classList.add("pinned");
        pinnedItems.push(itemId);
        savePinnedItems(pinnedItems);
    }

}



function unpinItem(itemId) {
    const item = document.getElementById(itemId);
    const sidebarBookmarks = document.getElementById("sidebarBookmarks");
    const pinnedItems = loadPinnedItems();
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


function loadPinnedItemsAndAddToBookmarks() {
    const pinnedItems = loadPinnedItems();


    const sidebarBookmarks = document.getElementById("sidebarBookmarks");
    pinnedItems.forEach(itemId => {
        pinItem(itemId);
        const item = document.getElementById(itemId);
        if (item) {
            let addedItem = sidebarBookmarks.appendChild(item.cloneNode(true));

            addedItem.lastChild.lastChild.classList.add("pinned");

        }
    });
}

function sdExpandAll() {

    const categoryItems = document.querySelectorAll(".content_sidebar .sidebarCategory");
    const side_bar_status = document.querySelector(".content_sidebar").dataset.expanded;
    const expand_node = document.getElementsByClassName("expand_node")[0];

    let display_value = "true";

    if (side_bar_status === "true") {

        display_value = "none";
        expand_node.innerHTML = `<svg  xmlns="http://www.w3.org/2000/svg" 
                         viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve">
                    <path d="M48,9.5C48,8.7,47.3,8,46.5,8h-41C4.7,8,4,8.7,4,9.5v3C4,13.3,4.7,14,5.5,14h41c0.8,0,1.5-0.7,1.5-1.5V9.5z"
                        />
                    <path d="M48,39.5c0-0.8-0.7-1.5-1.5-1.5h-41C4.7,38,4,38.7,4,39.5v3C4,43.3,4.7,44,5.5,44h41c0.8,0,1.5-0.7,1.5-1.5
                        V39.5z"/>
                    <path d="M30,29h4.5c0.8,0,1.5-0.7,1.5-1.5v-3c0-0.8-0.7-1.5-1.5-1.5H30c-0.6,0-1-0.4-1-1v-4.5c0-0.8-0.7-1.5-1.5-1.5
                        h-3c-0.8,0-1.5,0.7-1.5,1.5V22c0,0.6-0.4,1-1,1h-4.5c-0.8,0-1.5,0.7-1.5,1.5v3c0,0.8,0.7,1.5,1.5,1.5H22c0.6,0,1,0.4,1,1v4.5
                        c0,0.8,0.7,1.5,1.5,1.5h3c0.8,0,1.5-0.7,1.5-1.5V30C29,29.4,29.4,29,30,29z"/>
                        <rect class="expand_node" style="opacity:0" x="0" y="0" width="52" height="52"  />
                    </svg>`;
        document.querySelector(".content_sidebar").dataset.expanded = "false";

    } else {

        display_value = "block";
        expand_node.innerHTML = `<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"  enable-background="new 0 0 52 52" xml:space="preserve" >
                    <path d="M48,9.5C48,8.7,47.3,8,46.5,8h-41C4.7,8,4,8.7,4,9.5v3C4,13.3,4.7,14,5.5,14h41c0.8,0,1.5-0.7,1.5-1.5V9.5z"></path>
                    <path d="M48,39.5c0-0.8-0.7-1.5-1.5-1.5h-41C4.7,38,4,38.7,4,39.5v3C4,43.3,4.7,44,5.5,44h41c0.8,0,1.5-0.7,1.5-1.5
                        V39.5z"></path>
                    <path d="M34.5,29c0.8,0,1.5-0.7,1.5-1.5v-3c0-0.8-0.7-1.5-1.5-1.5h-17c-0.8,0-1.5,0.7-1.5,1.5v3
                        c0,0.8,0.7,1.5,1.5,1.5H34.5z"></path>
                       
                        <rect class="expand_node" style="opacity:0" x="0" y="0" width="52" height="52"  />
                    </svg>`;
        document.querySelector(".content_sidebar").dataset.expanded = "true";

    }


    categoryItems.forEach(function (categoryItem) {
        const displayNamesList = categoryItem.querySelector("ul");

        if (expand_node) {


            displayNamesList.style.display = display_value;
        }

    });
}



function createCategoryList() {
    const data = LiteGraph.registered_node_types;
    const categories = {};
    const pinnedItems = loadPinnedItems();
    for (const objKey in data) {
        const category = data[objKey].category;
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(data[objKey]);
    }


    const sortedCategories = Object.keys(categories).sort();


    const sortedCategoriesData = {};
    sortedCategories.forEach(category => {
        sortedCategoriesData[category] = categories[category];
    });

    const categoriesList = document.getElementById("content_sidebar");

    for (const category in sortedCategoriesData) {
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

                displayNameItem.id = displayName.type;


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

                displayNamesList.appendChild(displayNameItem);
            } catch (err) {

            }
        });

        categoryItem.addEventListener("click", function (event) {

            if (event.target === event.currentTarget) {

                displayNamesList.style.display = displayNamesList.style.display === "none" ? "block" : "none";
            }
        });


        categoriesList.appendChild(categoryItem);
    }


    const dragHandle = document.getElementById("dragHandle");

    let isDragging = false;
    let startX;
    let startWidth;


    dragHandle.addEventListener("mousedown", function (event) {
        isDragging = true;
        startX = event.clientX;
        startWidth = parseInt(window.getComputedStyle(categoriesList).width);

    });


    document.addEventListener("mouseup", function () {

        if (isDragging) {
            isDragging = false;

            saveSidebarWidth(categoriesList);

        }
    });


    document.addEventListener("mousemove", function (event) {
        if (!isDragging) return;

        const delta = event.clientX - startX;
        categoriesList.style.width = (startWidth + delta) + "px";
    });

    loadPinnedItemsAndAddToBookmarks();
}

function addSidebar() {

    let draggedElementId;
    const sidebar_width = restoreSidebarWidth();
    const sidebarHtml = `
	<div class="sidebar" id="sidebar">
    <div class="sidebar-header">
	<input type="text" id="searchInput" placeholder="Search..." autocomplete="off">
    <span class="clearIcon">&times;</span>
    <span class="searchCategoryIcon">C</span>
    </div>
	<div class="content_sidebar" id ="content_sidebar" data-expanded="false" style="width:${sidebar_width};">
    
	
    <div id="spacer"></div>
    <label class="sb_label">PINNED</label>
	<ul id="sidebarBookmarks"></ul>
    <label class="sb_label">CUSTOM NODES<button class="expand_node" >
    <svg  xmlns="http://www.w3.org/2000/svg" 
                         viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve">
                    <path d="M48,9.5C48,8.7,47.3,8,46.5,8h-41C4.7,8,4,8.7,4,9.5v3C4,13.3,4.7,14,5.5,14h41c0.8,0,1.5-0.7,1.5-1.5V9.5z"
                        />
                    <path d="M48,39.5c0-0.8-0.7-1.5-1.5-1.5h-41C4.7,38,4,38.7,4,39.5v3C4,43.3,4.7,44,5.5,44h41c0.8,0,1.5-0.7,1.5-1.5
                        V39.5z"/>
                    <path d="M30,29h4.5c0.8,0,1.5-0.7,1.5-1.5v-3c0-0.8-0.7-1.5-1.5-1.5H30c-0.6,0-1-0.4-1-1v-4.5c0-0.8-0.7-1.5-1.5-1.5
                        h-3c-0.8,0-1.5,0.7-1.5,1.5V22c0,0.6-0.4,1-1,1h-4.5c-0.8,0-1.5,0.7-1.5,1.5v3c0,0.8,0.7,1.5,1.5,1.5H22c0.6,0,1,0.4,1,1v4.5
                        c0,0.8,0.7,1.5,1.5,1.5h3c0.8,0,1.5-0.7,1.5-1.5V30C29,29.4,29.4,29,30,29z"/>
                        <rect class="expand_node" style="opacity:0" x="0" y="0" width="52" height="52"  />
    </svg>
    </button></label>
	</div>
	<div class="dragHandle" id="dragHandle"></div>
    <div id ="switch_sidebar">☰</div>
	</div>
	 
    `;

    const sidebarElement = $el("sidebar", {
        parent: document.body,
        innerHTML: sidebarHtml
    });



    const clearIcon = document.querySelector(".clearIcon");
    const searchCategoryIcon = document.querySelector(".searchCategoryIcon");


    const searchInput = document.getElementById("searchInput");

    clearIcon.addEventListener("click", async function () {
        try {
            
            searchInput.value = "";

            
            const searchTerm = await handleSearch();

            
            console.log("Search term cleared:", searchTerm);

            
        } catch (error) {
            
            console.error("Error occurred during search:", error);
        }
    });

    searchCategoryIcon.addEventListener("click", async function () {
        try {
            
            categorySearchToggle = !categorySearchToggle;

            
            searchCategoryIcon.style.opacity = categorySearchToggle ? "1" : "0.5";

            
            const searchTerm = await handleSearch();

            
            console.log("Search term:", searchTerm);

            
        } catch (error) {
            
            console.error("Error occurred during search:", error);
        }
    });



    document.getElementById("content_sidebar").addEventListener("click", function (event) {
        const clickedElement = event.target;
        const pinnedItems = loadPinnedItems();

        const pinButton = clickedElement.tagName;



        if (pinButton == "rect" && clickedElement.classList.contains("pin_node")) {
            let itemId;
            try {
                itemId = clickedElement.parentElement.parentElement.parentElement.id;
            } catch (err) {

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

    });


    const sidebarItems = document.querySelectorAll(".sidebar li ul li");
    sidebarItems.forEach(item => {
        item.draggable = true;
    });

    setTimeout(() => {
        createCategoryList();

    }, 2000);


    function convertCanvasToOffset(canvas, pos, out) {
        out = out || [0, 0];
        out[0] = pos[0] / canvas.scale - canvas.offset[0];
        out[1] = pos[1] / canvas.scale - canvas.offset[1];
        return out;
    };


    function handleDrop(event) {
        event.preventDefault();

        const coord = convertCanvasToOffset(app.canvasEl.data.ds, [event.clientX, event.clientY]);
        const x = coord[0];
        const y = coord[1];


        sidebarAddNode(draggedElementId, draggedElementId, x, y);
        const draggedElementId_string = draggedElementId;


        draggedElementId = null;
    }


    function allowDrop(event) {
        event.preventDefault();
    }


    const canvas = sidebarElement;



    canvas.addEventListener("dragstart", function (event) {

        draggedElementId = event.target.id;
    });



    function handleSearch(event) {
        return new Promise((resolve, reject) => {
            const searchTerm = document.getElementById("searchInput").value.toLowerCase();
            const categoryItems = document.querySelectorAll(".sidebarCategory li");
            const categories = document.querySelectorAll(".sidebarCategory");
            const listItems = document.querySelectorAll(".sidebar li");
            
            categoryItems.forEach(category => {
                const subItems = category.querySelectorAll("li");
                category.style.display = "block";

                subItems.forEach(sub => {
                    sub.style.display = "block";
                });

            });

            
            const sidebarItems = categorySearchToggle ? categories : listItems;

            
            sidebarItems.forEach(item => {

                let itemText = item.textContent.toLowerCase();
                if (categorySearchToggle) {

                    itemText = Array.from(item.childNodes)
                        .filter(node => node.nodeType === Node.TEXT_NODE)
                        .map(node => node.textContent.trim())
                        .join(' ').toLowerCase();
                }

                const isInSearchTerm = itemText.includes(searchTerm);
                

                
                item.style.display = isInSearchTerm ? "block" : "none";
            });

            
            categories.forEach(category => {
                const subItems = category.querySelectorAll("li");




                const areAllHidden = Array.from(subItems).every(subItem => subItem.style.display === "none");
                category.style.display = areAllHidden ? "none" : category.style.display;
            });

            
            resolve(searchTerm);
        });
    }

    const search_bar = document.getElementById('searchInput');
    search_bar.addEventListener("input", async (event) => {
        try {
            
            const searchTerm = await handleSearch(event);

            
            console.log("Search term:", searchTerm);

            
        } catch (error) {
            
            console.error("Error occurred during search:", error);
        }
    });


    document.getElementById('switch_sidebar').addEventListener('click', function () {
        const side_bar = document.getElementById('content_sidebar');

        search_bar.classList.toggle('closed');
        side_bar.classList.toggle('closed');
        clearIcon.classList.toggle('closed');
        searchCategoryIcon.classList.toggle('closed');

    });

    document.addEventListener('drop', handleDrop);


    canvas.addEventListener('dragover', allowDrop);


}



addSidebarStyles();
addSidebar();


/*
function handleKeyPress(event) {
       if (event.key === "x") {   }
}
document.addEventListener("keydown", handleKeyPress);
*/
