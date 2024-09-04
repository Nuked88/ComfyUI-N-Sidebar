//console.log(LiteGraph.registered_node_types);
var custom_categories = (function () {
let currentElement = null;

function createCustomHtml(type, name, elem = null) {
    if (type == "rename") {
        return `<h2 class="sb-modal-title">Rename Category</h2>
                    <form id="sb-category-form" action="javascript:void(0);">
                        <input type="text" autocomplete="off" class="sb-input" id="sb-categoryName" value="${name}" name="sb-categoryName" required>
                        <button type="submit" class="sb-button" onclick="custom_categories.renameCategory('${name}',document.getElementById('sb-categoryName').value)">Rename Category</button>
                    </form>
                    <button id="closeModalButton"  class="sb-button">X</button>

                    `
    } else if (type == "color") {
        currentElement = elem;
        return `<h2 class="sb-modal-title">Color ${name}</h2>
                   <div class="colorBlob">
                    <input  class="colorBlobPicker" type="color" oninput="custom_categories.colorCategory('${name}',this.value)" value="${rgbToHex(elem.style.backgroundColor)}" id="colorPicker">
                    </div>
                    <button type="button" class="sb-button" onclick="custom_categories.resetColorCategory('${name}')">Reset Color</button>
                    <button type="button" class="sb-button" onclick="custom_categories.removeKeyConfig('sb_ColorCustomCategories') ">Reset All Colors</button>

                    <button id="closeModalButton"  class="sb-button">X</button>
                `
    }
}
// Function to open the modal

//insert button  in label with id panel_title_custom_categories
let categorySearchToggleCustom = false;
const panel_title_custom_categories = document.getElementById("panel_title_custom_categories");

const button_custom_categories = document.createElement("button");
button_custom_categories.classList = "expand_node";
button_custom_categories.title = "Expand/Collapse";
button_custom_categories.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve">
<path d="M48,9.5C48,8.7,47.3,8,46.5,8h-41C4.7,8,4,8.7,4,9.5v3C4,13.3,4.7,14,5.5,14h41c0.8,0,1.5-0.7,1.5-1.5V9.5z"></path>
<path d="M48,39.5c0-0.8-0.7-1.5-1.5-1.5h-41C4.7,38,4,38.7,4,39.5v3C4,43.3,4.7,44,5.5,44h41c0.8,0,1.5-0.7,1.5-1.5
    V39.5z"></path>
<path d="M34.5,29c0.8,0,1.5-0.7,1.5-1.5v-3c0-0.8-0.7-1.5-1.5-1.5h-17c-0.8,0-1.5,0.7-1.5,1.5v3
    c0,0.8,0.7,1.5,1.5,1.5H34.5z"></path>

    <rect class="expand_node" style="opacity:0" x="0" y="0" width="52" height="52"></rect>
</svg>`;

panel_title_custom_categories.appendChild(button_custom_categories);

button_custom_categories.addEventListener("click", (event) => {
    const clickedElement = event.target;
    const pinButton = clickedElement.tagName;
    if ((pinButton == "rect") && clickedElement.classList.contains("expand_node")) {

        sdExpandAll();
    }

})
const clearIconCustomCategory = document.querySelector(".clearIconCustomCategory");
const itemSearchInput = document.getElementById("searchInputCn");
clearIconCustomCategory.addEventListener("click", async function () {
    try {

        itemSearchInput.value = "";
        renderList("custom_categories_main");

    } catch (error) {
        console.error("Error occurred during search:", error);
    }
});





function afterRender() {

    customMenu = `
    {
        "menuctx_category": "Context Menu",
        "menuctx_options": [
            "Rename Category",
            "Delete Category",
            "Change Color"
        ],
        "menuctx_subOptions": [
            [
            ]
        ],
        "menuctx_opt_callback": [
            "custom_categories.renameCategoryCallback",
            "custom_categories.deleteCategory",
            "custom_categories.colorCategoryCallback"
        
        ],
        "menuctx_sub_opt_callback": [
            [
            ],
            [
            ]
        ]
    }`

    customMenuItem = `
    {
        "menuctx_category": "Context Menu",
        "menuctx_options": [
            "Delete from Category"
        ],
        "menuctx_subOptions": [
            [
            ]
        ],
        "menuctx_opt_callback": [
            "custom_categories.removeNodeFromCategoryCallback"
        
        ],
        "menuctx_sub_opt_callback": [
            [
            ],
            [
            ]
        ]
    }`

    
    customMenuJSON = JSON.parse(customMenu);
    customMenuItemJSON = JSON.parse(customMenuItem);

    setContextMenu(customMenuJSON, "#custom_categories_main .sidebarCategory", 0, "sidebarItem", "sidebarCategory");

    setContextMenu(customMenuItemJSON, "#custom_categories_main .sidebarItem");



    // ORDER CUSTOM CATEGORIES


    const custom_categories_main = document.getElementById("custom_categories_main");
    custom_categories_main.querySelectorAll(".sidebarCategory").forEach(function (item) {
        item.addEventListener("dragstart", function (event) {
            dragItem = event.target;


        });

    });

    custom_categories_main.addEventListener("dragover", function (event) {
        event.preventDefault();
    });

    custom_categories_main.addEventListener("drop", function (event) {
        event.preventDefault();

        if (dragItem) {


            if (dragItem.parentElement === event.target.parentElement) {
                custom_categories_main.insertBefore(dragItem, event.target);
                reorderCategories(getCustomCategoryOrder());
            }
            dragItem = null;
        }
    });





    // ORDER CUSTOM NODES


    custom_categories_main.querySelectorAll(".sidebarItem").forEach(function (item) {
        item.addEventListener("dragstart", function (event) {
            dragItem = event.target;


        });

    });


}

function getCustomCategoryOrder() {
    let cat = [];
    const custom_categories_main = document.getElementById("custom_categories_main");
    custom_categories_main.querySelectorAll(".sidebarCategory").forEach(function (item) {
        cat.push(item.dataset.namecategory)

    });
    return cat
}


function getCustomNodeOrder(idcat) {
    let node = [];
    const objMain = document.getElementById(idcat);
    objMain.querySelectorAll(".sidebarItem").forEach(function (item) {
        node.push(item.dataset.type)

    });
    return node
}


async function renderList(elementID) {
    const data = LiteGraph.registered_node_types;


    const myPromise = new Promise(async (resolve, reject) => {
        const categories = await readCategories();
        //const pinnedItems = loadPinnedItems();

        //console.log(categories);
        const sidebarCustomNodes = document.getElementById(elementID);
        //clear elementid 
        sidebarCustomNodes.innerHTML = "";


        for (const category in categories) {
            //data[objKey].title.toLowerCase();
            let categoryName = categories[category]
            const categoryItem = document.createElement("li");
            categoryItem.classList.add("sidebarCategory");
            categoryItem.dataset.namecategory = categoryName;
            categoryItem.textContent = "⌬ " + categoryName;
            categoryItem.draggable = true;

            const currentColor = await getValueFromConfig("sb_ColorCustomCategories", categoryName);
            if (currentColor) {
                const value_perc = await getConfiguration("sb_opacity") || "1.0";

                const rgbColor = hexToRgb(currentColor);
                categoryItem.style.setProperty('background-color', `rgba(${rgbColor}, ${value_perc})`, 'important');

                //categoryItem.style.backgroundColor = `rgba(${rgbColor}, ${value_perc})`;
            }




            const displayNamesList = document.createElement("ul");
            displayNamesList.id = categoryName + "_ul";
            displayNamesList.style.display = getNodeStatus('sb_categoryNodeStatus',categoryName);
            categoryItem.appendChild(displayNamesList);

            let displayName = category;


            const listNodeForCategory = await getNodesForCategory(categoryName);



            listNodeForCategory.forEach(displayName => {
                try {
                    const displayNameItem = document.createElement("li");
                    displayNameItem.classList.add("sidebarItem");
                    displayNameItem.textContent = data[displayName].title;
                    displayNameItem.title = data[displayName].title;
                    displayNameItem.draggable = true;
                    displayNameItem.dataset.type = data[displayName].type;




                    displayNameItem.id = displayName//.replace(" ", "_");

                    /* Create Pin Button 
                    const pinButton = document.createElement("button");
                    pinButton.classList.add("pinButton");
           
                    let add_class = "";
                    if (pinnedItems.includes(displayNameItem.dataset.type)) {
                        add_class = "pinned";
                    }
                  
                    pinButton.innerHTML = `<svg class="svg_class" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path class="pin_normal ${add_class}" d="M19.1835 7.80516L16.2188 4.83755C14.1921 2.8089 13.1788 1.79457 12.0904 2.03468C11.0021 2.2748 10.5086 3.62155 9.5217 6.31506L8.85373 8.1381C8.59063 8.85617 8.45908 9.2152 8.22239 9.49292C8.11619 9.61754 7.99536 9.72887 7.86251 9.82451C7.56644 10.0377 7.19811 10.1392 6.46145 10.3423C4.80107 10.8 3.97088 11.0289 3.65804 11.5721C3.5228 11.8069 3.45242 12.0735 3.45413 12.3446C3.45809 12.9715 4.06698 13.581 5.28476 14.8L6.69935 16.2163L2.22345 20.6964C1.92552 20.9946 1.92552 21.4782 2.22345 21.7764C2.52138 22.0746 3.00443 22.0746 3.30236 21.7764L7.77841 17.2961L9.24441 18.7635C10.4699 19.9902 11.0827 20.6036 11.7134 20.6045C11.9792 20.6049 12.2404 20.5358 12.4713 20.4041C13.0192 20.0914 13.2493 19.2551 13.7095 17.5825C13.9119 16.8472 14.013 16.4795 14.2254 16.1835C14.3184 16.054 14.4262 15.9358 14.5468 15.8314C14.8221 15.593 15.1788 15.459 15.8922 15.191L17.7362 14.4981C20.4 13.4973 21.7319 12.9969 21.9667 11.9115C22.2014 10.826 21.1954 9.81905 19.1835 7.80516Z" />
                    <rect class="pin_node" style="opacity:0" x="0" y="0" width="24" height="24"  />
                    </svg>`;
    
    
                    displayNameItem.appendChild(pinButton);
                    /* End Pin Button */


                    displayNamesList.appendChild(displayNameItem);


                    displayNamesList.addEventListener("drop", function (event) {
                        event.preventDefault();

                        if (dragItem) {

                            if (dragItem.parentElement == event.target.parentElement) {

                                displayNamesList.insertBefore(dragItem, event.target);

                                reorderNodeInCategory(categoryItem.dataset.namecategory, getCustomNodeOrder(dragItem.parentElement.id))

                            }
                            dragItem = null;


                        }
                    });





                }
                catch (err) {
                    console.log(err);
                }
            })




            try {
                sidebarCustomNodes.appendChild(categoryItem);
            } catch (err) {
                console.log(err);
            }


        }




        // Preview
        const sidebarItems_cat = document.querySelectorAll('#' + elementID + ' .sidebarItem');
        const previewDiv = document.getElementById('previewDiv');
        let sidebad_view_width = document.getElementById("sidebar_views").offsetWidth;

        sidebarItems_cat.forEach(item => {

            getPreview(item,previewDiv,sidebad_view_width,(item) => {
                return createNodePreview(item.id);
            });

        });



        const categoriesList = document.getElementsByClassName("content_sidebar")[1];
        categoriesList.addEventListener('scroll', function () {
            previewDiv.style.display = 'none';
        });

        window.addEventListener('click', function (event) {

            if (!event.target.classList.contains('sidebarItem')) {
                previewDiv.style.display = 'none';

            }
        });



        const categoryItems = document.querySelectorAll("#custom_categories_main .sidebarCategory");
        categoryItems.forEach(function (categoryItem) {
            categoryItem.addEventListener("click", function (event) {

                if (event.target === event.currentTarget) {
                    const displayNamesList = event.target.querySelector("ul");

                    displayNamesList.style.display = displayNamesList.style.display === "none" ? "block" : "none";

                    setNodeStatus('sb_categoryNodeStatus',displayNamesList.parentElement.dataset.namecategory, displayNamesList.style.display)
                }
            });



        });
        resolve(afterRender);





    });
    myPromise.then((callback) => {

        callback();
    }).catch((error) => {
        console.error("An error occurred:", error);
    });
}
function searchT(e) {

    if (e.value != "") {
        //search in all .sidebarItem
        handleSearch(categorySearchToggleCustom, "#custom_categories_main", "searchInputCn")


    } else {

        renderList("custom_categories_main");
    }

}



async function getNodeMap() {
    let categoryNodeMap = JSON.parse(await getConfiguration('sb_categoryNodeMap')) || {};
    return categoryNodeMap;
}

function getNodesStatus() {
    let categoryNodeStatus = JSON.parse(localStorage.getItem('sb_categoryNodeStatus')) || {};
    return categoryNodeStatus;
}


async function addCategory() {

    const newCategoryName = document.getElementById('sb-categoryName').value;
    // Check if the category name contains special characters
    if (containsSpecialCharacters(newCategoryName)) {
        // Alert the user and return if special characters are found
        alert("Category name cannot contain special characters.");
        return;
    }

    let categoryNodeMap = await getNodeMap();

    if (!categoryNodeMap[newCategoryName]) {

        categoryNodeMap[newCategoryName] = [];
        updateConfiguration('sb_categoryNodeMap', JSON.stringify(categoryNodeMap));
        createContextualMenu();
        reloadCtxMenu()
        renderList("custom_categories_main");
        closeModal()
    } else {
        alert("Category already exists!");
        return;
    }
}


// Function to rename a category

async function renameCategory(oldCategoryName, newCategoryName) {


    if (containsSpecialCharacters(newCategoryName)) {
        // Alert the user and return if special characters are found
        alert("Category name cannot contain special characters.");
        return;
    }
    if (oldCategoryName === newCategoryName) {
        closeModal()
        return;
    }

    let categoryNodeMap = await getNodeMap();

    if (categoryNodeMap[newCategoryName]) {
        alert("Category already exists!");
        return;
    }

    
    let categoryNodeStatus = getNodesStatus();
    if (categoryNodeMap[oldCategoryName]) {
        // Categoty Current Order
        let keys = Object.keys(categoryNodeMap);

        categoryNodeMap[newCategoryName] = categoryNodeMap[oldCategoryName];
        delete categoryNodeMap[oldCategoryName];

        // Rebuild Order
        let updatedMap = {};
        keys.forEach(key => {
            if (key === oldCategoryName) {
                updatedMap[newCategoryName] = categoryNodeMap[newCategoryName];
            } else {
                updatedMap[key] = categoryNodeMap[key];
            }
        });



        updateConfiguration('sb_categoryNodeMap', JSON.stringify(updatedMap));
        //rename status
        if (categoryNodeStatus[oldCategoryName]) {

            categoryNodeStatus[newCategoryName] = categoryNodeStatus[oldCategoryName];
            delete categoryNodeStatus[oldCategoryName];
            localStorage.setItem('sb_categoryNodeStatus', JSON.stringify(categoryNodeStatus));
        }
        //rename color
        renameKeyConfig("sb_ColorCustomCategories", oldCategoryName, newCategoryName)


        createContextualMenu();
        reloadCtxMenu()
        renderList("custom_categories_main");
        closeModal()
    } else {
        alert("Category not found!");
    }
}
async function readCategories() {
    let categoryNodeMap = await getNodeMap();
    if (categoryNodeMap) {
        return Object.keys(categoryNodeMap);
    }
    else {
        return [];
    }
}
// Function to delete a category
async function deleteCategory(e) {

    const name = e.target.dataset.namecategory;
    confirmation = confirm("Are you sure you want to delete the category " + name + "?");
    if (!confirmation) { return; }

    let categoryNodeMap = await getNodeMap();
    // If the category name is found, remove it from the array
    if (categoryNodeMap[name]) {
        removeNodeMapCategory(name);
        createContextualMenu();
        removeKeyFromConfig("sb_ColorCustomCategories", name)
        reloadCtxMenu()
        setTimeout(() => {
           
            renderList("custom_categories_main");
        },300)
        
    } else {
        alert("Category not found!");
    }
}





/////////////////////////////////////////////////

async function getConfig(configName) {
    let categoryNodeMap = JSON.parse(await getConfiguration(configName)) || {};
    return categoryNodeMap;
}



async function getValueFromConfig(configName, key) {
    let config = await getConfig(configName);
    return config[key] || null;
}

async function assignValueToConfig(configName, key, value) {
    let config = await getConfig(configName);
    config[key] = value;
    updateConfiguration(configName, JSON.stringify(config));
}

async function removeKeyFromConfig(configName, key) {
    let config = await getConfig(configName);
    delete config[key];
    updateConfiguration(configName, JSON.stringify(config));


}
async function renameKeyConfig(configName, oldKey, newKey) {
    let config = await getConfig(configName);
    let value = config[oldKey];
    delete config[oldKey];
    config[newKey] = value;
    updateConfiguration(configName, JSON.stringify(config));
}

async function removeKeyConfig(configName) {
    removeConfiguration(configName)
    renderList("custom_categories_main");
}



////////////////////////////////////////////////

async function getCategoriesForNode(nodeName) {
    let categoryNodeMap = await getNodeMap();

    let categories = [];
    for (let category in categoryNodeMap) {
        if (categoryNodeMap.hasOwnProperty(category)) {
            if (categoryNodeMap[category].includes(nodeName)) {
                categories.push(category);
            }
        }
    }
    return categories;
}

async function getNodesForCategory(categoryName) {
    let categoryNodeMap = await getNodeMap();

    return categoryNodeMap[categoryName] || [];
}


async function assignNodeToCategory(nodeName, categoryNames) {
    let categoryNodeMap = await getNodeMap();
    let assignedCategories = await getCategoriesForNode(nodeName);
    categoryNames = categoryNames.filter(category => !assignedCategories.includes(category));

    categoryNames.forEach(categoryName => {
        if (!categoryNodeMap[categoryName]) {
            categoryNodeMap[categoryName] = [];
        }
        categoryNodeMap[categoryName].push(nodeName);
    });
    updateConfiguration('sb_categoryNodeMap', JSON.stringify(categoryNodeMap));
    renderList("custom_categories_main");
}


async function removeNodeFromCategory(nodeName, categoryName) {
    let categoryNodeMap = await getNodeMap();

    if (categoryNodeMap[categoryName]) {
        categoryNodeMap[categoryName] = categoryNodeMap[categoryName].filter(node => node !== nodeName);
        updateConfiguration('sb_categoryNodeMap', JSON.stringify(categoryNodeMap));
        renderList("custom_categories_main");

    }
}


async function removeNodeMapCategory(categoryName) {
    let categoryNodeMap = await getNodeMap();
    let categoryNodeStatus = getNodesStatus();
    delete categoryNodeMap[categoryName];
    updateConfiguration('sb_categoryNodeMap', JSON.stringify(categoryNodeMap));

    if (categoryNodeStatus[categoryName]) {
        delete categoryNodeStatus[categoryName];
        localStorage.setItem('sb_categoryNodeStatus', JSON.stringify(categoryNodeStatus));

    }
}


function editNodeCategory(oldCategoryName, newCategoryName, nodeName) {

    removeNodeFromCategory(nodeName, oldCategoryName);

    assignNodeToCategory(nodeName, [newCategoryName]);
}



async function reorderCategories(orderedKeys) {
    let categoryNodeMap = await getNodeMap();
    let reorderedCategoryNodeMap = {};


    orderedKeys.forEach(categoryKey => {
        if (categoryNodeMap.hasOwnProperty(categoryKey)) {
            reorderedCategoryNodeMap[categoryKey] = categoryNodeMap[categoryKey];
        }
    });

    updateConfiguration('sb_categoryNodeMap', JSON.stringify(reorderedCategoryNodeMap));
}


async function reorderNodeInCategory(categoryName, orderedKeys) {
    let categoryNodeMap = await getNodeMap();

    if (categoryNodeMap[categoryName]) {
        categoryNodeMap[categoryName] = orderedKeys;
        updateConfiguration('sb_categoryNodeMap', JSON.stringify(categoryNodeMap));
    }
}

// Callbacks
function removeNodeFromCategoryCallback(e, trge) {

    removeNodeFromCategory(e.target.dataset.type, e.target.parentElement.parentElement.dataset.namecategory)
}

function assignNodeToCategoryCallback(e, trge) {
    assignNodeToCategory(e.target.id, [trge]);
}

function renameCategoryCallback(e, trge) {
    const name = e.target.dataset.namecategory;
    openModal(createCustomHtml("rename", name))

}

function colorCategoryCallback(e) {

    const name = e.target.dataset.namecategory;
    openModal(createCustomHtml("color", name, e.target))
    //colorCategory(e.target.id, e.target.parentElement.parentElement.dataset.namecategory)
}




async function colorCategory(name, value) {


    const value_perc = await getConfiguration("sb_opacity") || "1.0";
    const rgbColor = hexToRgb(value);


    currentElement.style.setProperty('background-color', `rgba(${rgbColor}, ${value_perc})`, 'important');

    assignValueToConfig("sb_ColorCustomCategories", name, value)
}
// Add an event listener to the button to open the modal
function resetColorCategory(name) {

    removeKeyFromConfig("sb_ColorCustomCategories", name)
    renderList("custom_categories_main");

}


async function createContextualMenu() {

    //const menuOptions = document.getElementById('menu-options');
    new_menu_options = [];
    new_submenu_options = [];
    new_menu_options_callback = [];
    new_submenu_options_callback = [];
    new_menu_options.push("Add to category");
    /*new_menu_options.push("Pin It");
    new_menu_options_callback.push("dummy");
    new_menu_options_callback.push("test_altert");*/
    //for each category
    category_menu = await readCategories();
    callback_menu = [];
    for (let i = 0; i < category_menu.length; i++) {
        callback_menu.push("custom_categories.assignNodeToCategoryCallback");

    }
    new_submenu_options.push(category_menu);
    new_submenu_options_callback.push(callback_menu);


    console.log("custom category panel loaded")

}


function test_altert(e, trge) {
    console.log(trge);
    console.log(e.target.id);
    console.log(e.target.parentElement.parentElement.dataset.namecategory);

    assignNodeToCategory(e.target.id, [trge]);
}

function dummy(e, trge) {

}



const searchCategoryIconCustomCategory = document.querySelector(".searchCategoryIconCustomCategory");


searchCategoryIconCustomCategory.addEventListener("click", async function () {

    try {

        categorySearchToggleCustom = !categorySearchToggleCustom;
        searchCategoryIconCustomCategory.style.opacity = categorySearchToggleCustom ? "1" : "0.5";


    } catch (error) {

        console.error("Error occurred during search:", error);
    }
});
return {
    openModal,
    addSidebarStyles,
    createContextualMenu,
    renderList,
    renameCategory,
    colorCategory,
    removeKeyConfig,
    searchT,
    deleteCategory,
    addCategory,
    editNodeCategory,
    removeNodeMapCategory,
    reorderNodeInCategory,
    removeNodeFromCategoryCallback,
    assignNodeToCategoryCallback,
    renameCategoryCallback,
    renameCategoryCallback,
    colorCategoryCallback,
    resetColorCategory
};


})();
custom_categories.addSidebarStyles("panels/custom_categories/style.css");
custom_categories.createContextualMenu()
custom_categories.renderList("custom_categories_main"); 