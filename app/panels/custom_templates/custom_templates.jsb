var custom_templates = (function () {
    let currentElement = null;

    function createTemplatePreview(nodeID, jsondata) {
        const jsonData = JSON.parse(jsondata);
        const nodeTypes = [...new Set(jsonData.nodes.map(node => node.type))];

        //const nodeTypes = jsonData.nodes.map(node => node.type);

        let rows = "";
        nodeTypes.forEach(type => {
            rows += `<li class="sidebarItem">${type}</li>`

        })
        return `<div class="sb_table">
    <div class="node_header">${nodeID}</div>
    <div class="sb_preview_badge">USED NODES</div>
    <ul>
    ${rows}
    </ul>
    </div>`;

    }
    // MODAL
    function createCustomHtml(type, name, elem = null) {
        if (type == "rename") {
            return `<h2 class="sb-modal-title">Rename Template Category</h2>
                    <form id="sb-template-form" action="javascript:void(0);">
                        <input type="text" autocomplete="off" class="sb-input" id="sb-templateName" value="${name}" name="sb-templateName" required>
                        <button type="submit" class="sb-button" onclick="custom_templates.renameCategory('${name}',document.getElementById('sb-templateName').value)">Rename</button>
                    </form>
                    <button id="closeModalButton"  class="sb-button">X</button>

                    `
        } else if (type == "color") {
            currentElement = elem;
            return `<h2 class="sb-modal-title">Color ${name}</h2>
                   <div class="colorBlob">
                    <input  class="colorBlobPicker" type="color" oninput="custom_templates.colorTemplate('${name}',this.value)" value="${rgbToHex(elem.style.backgroundColor)}" id="colorPicker">
                    </div>
                    <button type="button" class="sb-button" onclick="custom_templates.resetColorTemplate('${name}')">Reset Color</button>
                    <button type="button" class="sb-button" onclick="custom_templates.removeKeyConfig('sb_ColorCustomTemplates') ">Reset All Colors</button>

                    <button id="closeModalButton"  class="sb-button">X</button>
                `
        }
        else if(type == "renameTemplate"){
            return `<h2 class="sb-modal-title">Rename Template</h2>
            <form id="sb-template-form" action="javascript:void(0);">
                <input type="text" autocomplete="off" class="sb-input" id="sb-templateName" value="${name}" name="sb-templateName" required>
                <button type="submit" class="sb-button" onclick="custom_templates.renameTemplate('${name}',document.getElementById('sb-templateName').value)">Rename</button>
            </form>
            <button id="closeModalButton"  class="sb-button">X</button>

            `
        }
    }



    function setModalContext(addon = null) {
        if (addon == null) {
            return `
            <h2 class="sb-modal-title">Add New Template</h2>
            <form id="sb-template-form" action="javascript:void(0);">
                <input type="text" autocomplete="off" class="sb-input" id="sb-templateName" name="sb-templateName" placeholder="Template Name" required>
                <button type="submit" class="sb-button" onclick="custom_templates.addTemplate()">Add Template</button>
            </form>
            <button id="closeModalButton"  class="sb-button">X</button>
            `;
        }
        else {
            return addon
        }
    }



    function openModal(addon = null) {
        // Create HTML elements for the modal
        const modalBackdrop = document.createElement('div');
        modalBackdrop.classList.add('sb-modal-backdrop');

        const modal = document.createElement('div');
        modal.classList.add('sb-category-dialog');
        modal.innerHTML = setModalContext(addon)

        // Add the modal to the DOM
        document.body.appendChild(modalBackdrop);
        document.body.appendChild(modal);

        // Add an event listener for the close button
        const closeModalButton = modal.querySelector('#closeModalButton');
        closeModalButton.addEventListener('click', closeModal);
        try {
            // Focus the input field
            inputElement = document.getElementById('sb-templateName');
            inputElement.focus();
            const length = inputElement.value.length;
            inputElement.setSelectionRange(length, length);
        } catch (err) {

        }
    }


    // Function to open the modal

    //insert button  in label with id panel_title_custom_templates
    let templateSearchToggleCustom = false;
    const panel_title_custom_templates = document.getElementById("panel_title_custom_templates");

    const button_custom_templates = document.createElement("button");
    button_custom_templates.classList = "expand_node";
    button_custom_templates.title = "Expand/Collapse";
    button_custom_templates.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve">
<path d="M48,9.5C48,8.7,47.3,8,46.5,8h-41C4.7,8,4,8.7,4,9.5v3C4,13.3,4.7,14,5.5,14h41c0.8,0,1.5-0.7,1.5-1.5V9.5z"></path>
<path d="M48,39.5c0-0.8-0.7-1.5-1.5-1.5h-41C4.7,38,4,38.7,4,39.5v3C4,43.3,4.7,44,5.5,44h41c0.8,0,1.5-0.7,1.5-1.5
    V39.5z"></path>
<path d="M34.5,29c0.8,0,1.5-0.7,1.5-1.5v-3c0-0.8-0.7-1.5-1.5-1.5h-17c-0.8,0-1.5,0.7-1.5,1.5v3
    c0,0.8,0.7,1.5,1.5,1.5H34.5z"></path>

    <rect class="expand_node" style="opacity:0" x="0" y="0" width="52" height="52"></rect>
</svg>`;

    panel_title_custom_templates.appendChild(button_custom_templates);

    button_custom_templates.addEventListener("click", (event) => {
        const clickedElement = event.target;
        const pinButton = clickedElement.tagName;
        if ((pinButton == "rect") && clickedElement.classList.contains("expand_node")) {

            sdExpandAll();
        }

    })
    const clearIconCustomTemplate = document.querySelector(".clearIconCustomTemplate");
    const itemSearchInput = document.getElementById("searchTemplateInput");
    clearIconCustomTemplate.addEventListener("click", async function () {
        try {

            itemSearchInput.value = "";
            renderList("custom_templates_main");

        } catch (error) {
            console.error("Error occurred during search:", error);
        }
    });

    


    function afterRender() {

        customMenuTemplate = `
        {
            "menuctx_template": "Context Menu",
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
                "custom_templates.renameCategoryCallback",
                "custom_templates.deleteCategory",
                "custom_templates.colorTemplateCallback"
            
            ],
            "menuctx_sub_opt_callback": [
                [
                ],
                [
                ]
            ]
        }`;
    /*
        customMenuTemplateItem = `
        {
            "menuctx_template": "Context Menu",
            "menuctx_options": [
                "Delete from Template",
                "Rename Template",
                "Delete Template"
            ],
            "menuctx_subOptions": [
                [
                ]
            ],
            "menuctx_opt_callback": [
                "custom_templates.removeNodeFromTemplateCallback",
                "custom_templates.renameTemplateCallback",
                "custom_templates.removeTemplateCallback"
            
            ],
            "menuctx_sub_opt_callback": [
                [
                ],
                [
                ]
            ]
        }`;*/
        customMenuTemplateItem = `
        {
            "menuctx_template": "Context Menu",
            "menuctx_options": [
                "Delete from Template"
            ],
            "menuctx_subOptions": [
                [
                ]
            ],
            "menuctx_opt_callback": [
                "custom_templates.removeNodeFromTemplateCallback"
            
            ],
            "menuctx_sub_opt_callback": [
                [
                ],
                [
                ]
            ]
        }`;
    
        customMenuTemplateItemOut = `
        {
            "menuctx_template": "Context Menu",
            "menuctx_options": [
                "Rename Template",
                "Delete Template"
            ],
            "menuctx_subOptions": [
                [
                ]
            ],
            "menuctx_opt_callback": [
                "custom_templates.renameTemplateCallback",
                "custom_templates.removeTemplateCallback"
            
            ],
            "menuctx_sub_opt_callback": [
                [
                ],
                [
                ]
            ]
        }`;
        customMenuJSON = JSON.parse(customMenuTemplate);
        customMenuItemJSON = JSON.parse(customMenuTemplateItem);
        customMenuItemJSONOut = JSON.parse(customMenuTemplateItemOut);
    
        setContextMenu(customMenuJSON, "#custom_templates_main .sidebarCategory", 0, "sidebarItem", "sidebarCategory");
        setContextMenu(customMenuItemJSON, "#custom_templates_main .displayNamesList .sidebarItem");
       
       
       
        // ORDER CUSTOM CATEGORIES
        const custom_templates_main = document.getElementById("custom_templates_main");
        
        custom_templates_main.querySelectorAll(".sidebarCategory").forEach(function (item) {
            item.addEventListener("dragstart", handleTemplateDragStart);
        });
    
        custom_templates_main.removeEventListener("dragover", handleTemplateDragOver);
        custom_templates_main.addEventListener("dragover", handleTemplateDragOver);
    
        custom_templates_main.removeEventListener("drop", handleCustomTemplatesMainDrop);
        custom_templates_main.addEventListener("drop", handleCustomTemplatesMainDrop);
    
        // Template drag and drop
        custom_templates_main.querySelectorAll(".sidebarItem").forEach(function (item) {
            item.addEventListener("dragstart", handleTemplateDragStart);
        });
    
        sidebar.removeEventListener("dragstart", handleSidebarTemplateDragStart);
        sidebar.addEventListener("dragstart", handleSidebarTemplateDragStart);
    
        document.removeEventListener("drop", handleDocumentTemplateDropEvent);
        document.addEventListener("drop", handleDocumentTemplateDropEvent);
    
        // ORDER CUSTOM NODES
        custom_templates_main.querySelectorAll(".sidebarItem").forEach(function (item) {
            item.addEventListener("dragstart", handleTemplateDragStart);
        });
    }

    // handler

    function handleTemplateDragStart(event) {
        dragItem = event.target;
    }
    
    function handleTemplateDragOver(event) {
        event.preventDefault();
    }
    
    function handleCustomTemplatesMainDrop(event) {
        event.preventDefault();
        if (dragItem) {
            if (draggedElement.id !== 'sidebarItem') {
                if (dragItem.parentElement === event.target.parentElement) {
                    const custom_templates_main = document.getElementById("custom_templates_main");
                    custom_templates_main.insertBefore(dragItem, event.target);
                    reorderTemplates(getCustomTemplateOrder());
                }
            }
            dragItem = null;
        }
    }
    
    function handleSidebarTemplateDragStart(event) {
        draggedElement = event.target;
    }
    
    function handleDocumentTemplateDropEvent(event) {
        event.preventDefault();
        if (draggedElement.id === 'sidebarItem' && event.target.id === 'graph-canvas') {
            if (draggedElement.dataset.data === 'NaN') { return; }
            clipboardAction(async () => {
                const data = JSON.parse(draggedElement.dataset.data);
                localStorage.setItem("litegrapheditor_clipboard", draggedElement.dataset.data);
                const coord = convertCanvasToOffset(app.canvasEl.data.ds, [event.clientX, event.clientY]);
    
                app.canvas.graph_mouse[0] = coord[0];
                app.canvas.graph_mouse[1] = coord[1];
                app.canvas.pasteFromClipboard();
                localStorage.removeItem("litegrapheditor_clipboard");
                //draggedElement.dataset.data = NaN;
            });
        } else if (draggedElement.id === 'sidebarItem' && (event.target.classList.contains('sidebarCategory') || event.target.classList.contains('displayNamesList'))) {
            const ulElement = event.target.querySelector('ul');
            if (ulElement) {
                ulElement.appendChild(draggedElement);
            } else {
                event.target.appendChild(draggedElement);
            }
            updateConfiguration('sb_templateNodeMap', JSON.stringify(getCustomTemplateStructure()));
            renderList("custom_templates_main");
        } else if (draggedElement.id === 'sidebarItem' && event.target.parentElement.parentElement.classList.contains('sidebarCategory')) {
            event.target.parentElement.insertBefore(draggedElement, event.target);
            updateConfiguration('sb_templateNodeMap', JSON.stringify(getCustomTemplateStructure()));
            renderList("custom_templates_main");
        }
    }
    
    const clipboardAction = async (cb) => {
        const old = localStorage.getItem("litegrapheditor_clipboard");
        await cb();
        localStorage.setItem("litegrapheditor_clipboard", old);
    };
    

    function getCustomTemplateOrder() {
        let cat = [];
        const custom_templates_main = document.getElementById("custom_templates_main");
        custom_templates_main.querySelectorAll(".sidebarCategory").forEach(function (item) {
            cat.push(item.dataset.nametemplate)

        });
        return cat
    }


    function getCustomNodeOrder(idcat) {
        let node = [];
        const objMain = document.getElementById(idcat);
        objMain.querySelectorAll(".sidebarItem").forEach(function (item) {
            node.push(item.dataset.nametemplate)

        });
        return node
    }

    function getCustomTemplateStructure() {
        let cat = {};
        const custom_templates_main = document.getElementById("custom_templates_main");
        custom_templates_main.querySelectorAll(".sidebarCategory").forEach(function (item) {

            cat[item.dataset.nametemplate] = getCustomNodeOrder(item.dataset.nametemplate + "_ul")

        });

        return cat
    }

    async function readComfyTemplates() {
        let comfy_templates = {};
        try {            
            //multi user check
            //if Comfy.User local storage exists
            if (localStorage.getItem('Comfy.userId')) {
                headers = {
                    'Comfy-User': localStorage.getItem('Comfy.userId')
                }
            } else {
                headers = {}
            }
            const timestamp = new Date().getTime();
            const response = await fetch('./userdata/comfy.templates.json?v=' + timestamp, { headers: headers });
            comfy_templates = await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
        }


        return comfy_templates

    }
    async function readComfyTemplatesKV() {
        let kvtemplate = {};
        let comfy_templates = await readComfyTemplates();
        for (const template in comfy_templates) {
            let templateName = comfy_templates[template]
            kvtemplate[templateName.name] = templateName.data
        }


        return kvtemplate

    }

    async function renderList(elementID) {
        const data = await readComfyTemplatesKV()  //load all templates

        const myPromise = new Promise(async (resolve, reject) => {
            const templates = await readTemplates();


            //console.log(templates);
            const sidebarCustomNodes = document.getElementById(elementID);
            //clear elementid 
            sidebarCustomNodes.innerHTML = "";

            exclusion_list = []
            for (const template in templates) {
                //data[objKey].title.toLowerCase();
                let templateName = templates[template]
                const templateItem = document.createElement("li");
                templateItem.classList.add("sidebarCategory");
                templateItem.dataset.nametemplate = templateName;
                templateItem.textContent = "⌬ " + templateName;
                templateItem.draggable = true;

                const currentColor = await getValueFromConfig("sb_ColorCustomTemplates", templateName);
                if (currentColor) {
                    const value_perc = await getConfiguration("sb_opacity") || "1.0";

                    const rgbColor = hexToRgb(currentColor);
                    templateItem.style.setProperty('background-color', `rgba(${rgbColor}, ${value_perc})`, 'important');
                   
                }




                const displayNamesList = document.createElement("ul");
                displayNamesList.id = templateName + "_ul";
                displayNamesList.classList.add("displayNamesList");
                displayNamesList.style.display = getNodeStatus('sb_templateNodeStatus',templateName);
                templateItem.appendChild(displayNamesList);

                let displayName = template;


                const listNodeForTemplate = await getNodesForTemplate(templateName);
                    
                listNodeForTemplate.forEach(displayName => {
                    try {
                        const displayNameItem = document.createElement("li");
                        displayNameItem.classList.add("sidebarItem");
                        displayNameItem.id = "sidebarItem"
                        displayNameItem.textContent = displayName;
                        displayNameItem.dataset.nametemplate = displayName;
                        displayNameItem.dataset.data = data[displayName];
                        displayNameItem.draggable = true;


                        exclusion_list.push(displayName);


                        displayNamesList.appendChild(displayNameItem);


                        displayNamesList.addEventListener("drop", function (event) {
                            event.preventDefault();

                            if (dragItem) {

                                if (dragItem.parentElement == event.target.parentElement) {

                                    displayNamesList.insertBefore(dragItem, event.target);

                                    reorderNodeInTemplate(templateItem.dataset.nametemplate, getCustomNodeOrder(dragItem.parentElement.id))

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
                    sidebarCustomNodes.appendChild(templateItem);
                } catch (err) {
                    console.log(err);
                }
            }

            //adding templates not categorized
            let space = document.createElement("br");
            sidebarCustomNodes.appendChild(space);

            let comfy_templates = await readComfyTemplates();
            for (const template in comfy_templates) {
                //data[objKey].title.toLowerCase();
                let templateName = comfy_templates[template]

                //if templatename is not in exclusion list
                if (!exclusion_list.includes(templateName.name)) {


                    const templateItem = document.createElement("li");
                    templateItem.classList.add("sidebarItem");
                    templateItem.id = "sidebarItem";
                    templateItem.dataset.nametemplate = templateName.name;
                    templateItem.dataset.data = templateName.data;
                    templateItem.textContent = templateName.name;
                    templateItem.draggable = true;





                    let displayName = template;



                    try {
                        sidebarCustomNodes.appendChild(templateItem);
                    } catch (err) {
                        console.log(err);
                    }
                }


         
            



            }

    // Preview
    const sidebarItems_cat = document.querySelectorAll('#' + elementID + ' .sidebarItem');
    const previewDiv = document.getElementById('previewDiv');
    let sidebad_view_width = document.getElementById("sidebar_views").offsetWidth;
    const previewFunction = (item) => {
        const previewContent = createTemplatePreview(item.dataset.nametemplate, item.dataset.data);
        return [previewContent, null];  
    };

        sidebarItems_cat.forEach(item => {
            getPreview(item,previewDiv,sidebad_view_width,previewFunction);

        });
        window.addEventListener('click', function (event) {
            if (!event.target.classList.contains('sidebarItem')) {
                previewDiv.style.display = 'none';

            }
        });



        const templateItems = document.querySelectorAll("#custom_templates_main .sidebarCategory");
        templateItems.forEach(function (templateItem) {
            templateItem.addEventListener("click", function (event) {

                if (event.target === event.currentTarget) {
                    const displayNamesList = event.target.querySelector("ul");

                    displayNamesList.style.display = displayNamesList.style.display === "none" ? "block" : "none";

                    setNodeStatus('sb_templateNodeStatus',displayNamesList.parentElement.dataset.nametemplate, displayNamesList.style.display)
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
            handleSearch(templateSearchToggleCustom, "#custom_templates_main", "searchTemplateInput")


        } else {

            renderList("custom_templates_main");
        }

    }



    async function getNodeMap() {
        let templateNodeMap = JSON.parse(await getConfiguration('sb_templateNodeMap')) || {};
        return templateNodeMap;
    }

    function getNodesStatus() {
        let templateNodeStatus = JSON.parse(localStorage.getItem('sb_templateNodeStatus')) || {};
        return templateNodeStatus;
    }


    async function addTemplate() {


        const newTemplateName = document.getElementById('sb-templateName').value;
        // Check if the template name contains special characters
        if (containsSpecialCharacters(newTemplateName)) {
            // Alert the user and return if special characters are found
            alert("Template name cannot contain special characters.");
            return;
        }




        let templateNodeMap = await getNodeMap();


        if (!templateNodeMap[newTemplateName]) {

            templateNodeMap[newTemplateName] = [];
            updateConfiguration('sb_templateNodeMap', JSON.stringify(templateNodeMap));
            createContextualMenu();
            reloadCtxMenu()
            renderList("custom_templates_main");
            closeModal()
        } else {
            alert("Template already exists!");
            return;
        }
    }


    // Function to rename a template

    async function renameCategory(oldTemplateName, newTemplateName) {


        if (containsSpecialCharacters(newTemplateName)) {
            // Alert the user and return if special characters are found
            alert("Template name cannot contain special characters.");
            return;
        }
        if (oldTemplateName === newTemplateName) {
            closeModal()
            return;
        }

        let templateNodeMap = await getNodeMap();


        if (templateNodeMap[newTemplateName]) {
            alert("Category already exists!");
            return;
        }



        let templateNodeStatus = getNodesStatus();
        if (templateNodeMap[oldTemplateName]) {
            // Categoty Current Order
            let keys = Object.keys(templateNodeMap);

            templateNodeMap[newTemplateName] = templateNodeMap[oldTemplateName];
            delete templateNodeMap[oldTemplateName];

            // Rebuild Order
            let updatedMap = {};
            keys.forEach(key => {
                if (key === oldTemplateName) {
                    updatedMap[newTemplateName] = templateNodeMap[newTemplateName];
                } else {
                    updatedMap[key] = templateNodeMap[key];
                }
            });



            updateConfiguration('sb_templateNodeMap', JSON.stringify(updatedMap));
            //rename status
            if (templateNodeStatus[oldTemplateName]) {

                templateNodeStatus[newTemplateName] = templateNodeStatus[oldTemplateName];
                delete templateNodeStatus[oldTemplateName];
                localStorage.setItem('sb_templateNodeStatus', JSON.stringify(templateNodeStatus));
            }
            //rename color
            renameKeyConfig("sb_ColorCustomTemplates", oldTemplateName, newTemplateName)


            createContextualMenu();
            reloadCtxMenu()
            renderList("custom_templates_main");
            closeModal()
        } else {
            alert("Template not found!");
        }
    }

    async function renameTemplate(oldTemplateName, newTemplateName) {
        if (containsSpecialCharacters(newTemplateName, level=1)) {
            // Alert the user and return if special characters are found
            alert("Template name cannot contain special characters.");
            return;
        }
        const timestamp = new Date().getTime();
        const response = await fetch('./userdata/comfy.templates.json?v=' + timestamp);
        const nodeTemplates = await response.json();
        

        // local cache operation
        let nodeTemplatesLocal = JSON.parse(localStorage.getItem('Comfy.NodeTemplates'));
        for (let node of nodeTemplatesLocal) {
            if (node.name === oldTemplateName) {
                node.name = newTemplateName;
                break;
            }
        }
        localStorage.setItem('Comfy.NodeTemplates', JSON.stringify(nodeTemplatesLocal));

        //check if name already exists
        for (let node of nodeTemplates) {
            if (node.name === newTemplateName) {
                alert(`The Template name "${newTemplateName}" already exists.`);
                return;
            }

        }
        for (let node of nodeTemplates) {
           
            if (node.name === oldTemplateName) {
                node.name = newTemplateName;
                break;
            }
        }

       await fetch('./userdata/comfy.templates.json?v=' + timestamp, {
            method: 'POST',
            body: JSON.stringify(nodeTemplates),
            headers: {
                'Content-Type': 'application/json'
            }
       }). then(() => {
            renameTemplateNode("sb_templateNodeMap", oldTemplateName, newTemplateName)
            renderList("custom_templates_main");
            closeModal()
            //refresh page
            window.location.reload();
        });
        

    }


    async function removeTemplate(name) {
        timestamp = new Date().getTime();
        const response = await fetch('./userdata/comfy.templates.json?v=' + timestamp);
        const nodeTemplates = await response.json();
        //let nodeTemplates = JSON.parse(comfy_templates);

        //local cache operation
        let nodeTemplatesLocal = JSON.parse(localStorage.getItem('Comfy.NodeTemplates'));
        nodeTemplatesLocal = nodeTemplatesLocal.filter(node => node.name !== name);
        localStorage.setItem('Comfy.NodeTemplates', JSON.stringify(nodeTemplatesLocal));




        // Iterate over the nodeTemplates to find and remove the node
        for (let i = 0; i < nodeTemplates.length; i++) {
            if (nodeTemplates[i].name === name) {
                nodeTemplates.splice(i, 1); // Remove the node from the array
                break; // Assuming the node names are unique, we can break once we find it
            }
        }
       await fetch('./userdata/comfy.templates.json?v=' + timestamp, {
            method: 'POST',
            body: JSON.stringify(nodeTemplates),
            headers: {
                'Content-Type': 'application/json'
            }
       }).then(() => {
            removeTemplateNode("sb_templateNodeMap", name)
            renderList("custom_templates_main");
            //refresh page
            window.location.reload();
        });
        

    }

    async function readTemplates() {
        let templateNodeMap = await getNodeMap();
        if (templateNodeMap) {
            return Object.keys(templateNodeMap);
        }
        else {
            return [];
        }

    }


    // Function to delete a template
    async function deleteCategory(e) {

        const name = e.target.dataset.nametemplate;
        confirmation = confirm("Are you sure you want to delete the template " + name + "?");
        if (!confirmation) { return; }

        let templateNodeMap = await getNodeMap();
        // If the template name is found, remove it from the array
        if (templateNodeMap[name]) {
            removeNodeMapTemplate(name);
            createContextualMenu();
            removeKeyFromConfig("sb_ColorCustomTemplates", name)

            setTimeout(() => {

                renderList("custom_templates_main");
            }, 200)
            reloadCtxMenu()
        } else {
            alert("Template not found!");
        }
    }



    /////////////////////////////////////////////////

    async function getConfig(configName) {
        let templateNodeMap = JSON.parse(await getConfiguration(configName)) || {};
        return templateNodeMap;
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



    async  function renameTemplateNode(key, oldNodeName, newNodeName) {
        let jsonObject = await getConfig(key);

            // Parse the sb_templateNodeMap property to an object
            let templateNodeMap = jsonObject
            // Iterate over the template node map to find and replace the node name
            for (let template in templateNodeMap) {
                let nodes = templateNodeMap[template];
                let nodeIndex = nodes.indexOf(oldNodeName);
                if (nodeIndex !== -1) {
                    nodes[nodeIndex] = newNodeName;
                    break; // Assuming the node names are unique, we can break once we find it
                }
            }
    
        // Convert the modified JSON object back to a JSON string
        updateConfiguration(key, JSON.stringify(jsonObject));
    }

    async function removeTemplateNode(key, value) {

        let jsonObject = await getConfig(key);
        let templateNodeMap = jsonObject
            // Iterate over the template node map to find and remove the node name
            for (let template in templateNodeMap) {
                let nodes = templateNodeMap[template];
                let nodeIndex = nodes.indexOf(value);
                if (nodeIndex !== -1) {
                    nodes.splice(nodeIndex, 1); // Remove the node from the array
                    break; // Assuming the node names are unique, we can break once we find it
                }
            }
    
            updateConfiguration(key, JSON.stringify(jsonObject));
        }




    async function removeKeyConfig(configName) {
        removeConfiguration(configName)
        renderList("custom_templates_main");
    }







    ////////////////////////////////////////////////

    async function getTemplatesForNode(nodeName) {
        let templateNodeMap = await getNodeMap();

        let templates = [];
        for (let template in templateNodeMap) {
            if (templateNodeMap.hasOwnProperty(template)) {
                if (templateNodeMap[template].includes(nodeName)) {
                    templates.push(template);
                }
            }
        }
        return templates;
    }

    async function getNodesForTemplate(templateName) {
        let templateNodeMap = await getNodeMap();

        
        return templateNodeMap[templateName] || [];
    }


    async function assignNodeToTemplate(nodeName, templateNames) {
        let templateNodeMap = await getNodeMap();

        let assignedTemplates = await getTemplatesForNode(nodeName);
        templateNames = templateNames.filter(template => !assignedTemplates.includes(template));

        templateNames.forEach(templateName => {
            if (!templateNodeMap[templateName]) {
                templateNodeMap[templateName] = [];
            }
            templateNodeMap[templateName].push(nodeName);
        });
        updateConfiguration('sb_templateNodeMap', JSON.stringify(templateNodeMap));
        renderList("custom_templates_main");
    }


    async function removeNodeFromTemplate(nodeName, templateName) {
        let templateNodeMap = await getNodeMap();

        if (templateNodeMap[templateName]) {
            templateNodeMap[templateName] = templateNodeMap[templateName].filter(node => node !== nodeName);
            updateConfiguration('sb_templateNodeMap', JSON.stringify(templateNodeMap));
            renderList("custom_templates_main");

        }
    }


    async function removeNodeMapTemplate(templateName) {
        let templateNodeMap = await getNodeMap();
        let templateNodeStatus = getNodesStatus();
        delete templateNodeMap[templateName];
        updateConfiguration('sb_templateNodeMap', JSON.stringify(templateNodeMap));

        if (templateNodeStatus[templateName]) {
            delete templateNodeStatus[templateName];
            localStorage.setItem('sb_templateNodeStatus', JSON.stringify(templateNodeStatus));

        }
    }


    function editNodeTemplate(oldTemplateName, newTemplateName, nodeName) {

        removeNodeFromTemplate(nodeName, oldTemplateName);

        assignNodeToTemplate(nodeName, [newTemplateName]);
    }



    async function reorderTemplates(orderedKeys) {
        let templateNodeMap = await getNodeMap();
        let reorderedTemplateNodeMap = {};


        orderedKeys.forEach(templateKey => {
            if (templateNodeMap.hasOwnProperty(templateKey)) {
                reorderedTemplateNodeMap[templateKey] = templateNodeMap[templateKey];
            }
        });

        updateConfiguration('sb_templateNodeMap', JSON.stringify(reorderedTemplateNodeMap));


    }


    async function reorderNodeInTemplate(templateName, orderedKeys) {
        let templateNodeMap = await getNodeMap();

        if (templateNodeMap[templateName]) {
            templateNodeMap[templateName] = orderedKeys;
            updateConfiguration('sb_templateNodeMap', JSON.stringify(templateNodeMap));
        }
    }

    // Callbacks
    function removeNodeFromTemplateCallback(e, trge) {

        removeNodeFromTemplate(e.target.dataset.nametemplate, e.target.parentElement.parentElement.dataset.nametemplate)
    }

    function assignNodeToTemplateCallback(e, trge) {
        assignNodeToTemplate(e.target.id, [trge]);
    }

    function renameCategoryCallback(e, trge) {
        const name = e.target.dataset.nametemplate;
        openModal(createCustomHtml("rename", name))

    }

    function colorTemplateCallback(e) {

        const name = e.target.dataset.nametemplate;
        openModal(createCustomHtml("color", name, e.target))
        //colorTemplate(e.target.id, e.target.parentElement.parentElement.dataset.nametemplate)
    }


    function removeTemplateCallback(e) {
        // Function to delete a template

        const name = e.target.dataset.nametemplate;

        confirmation = confirm("Are you sure you want to delete the template " + name + "?");
        if (!confirmation) { return; }

        removeTemplate(name);
           
        

    }

    function renameTemplateCallback(e) {
        const name = e.target.dataset.nametemplate;
        // Recupera l'array dallo storage
        openModal(createCustomHtml("renameTemplate", name))
       

    }

    async function colorTemplate(name, value) {


        const value_perc = await getConfiguration("sb_opacity") || "1.0";
        const rgbColor = hexToRgb(value);

        currentElement.style.setProperty('background-color', `rgba(${rgbColor}, ${value_perc})`, 'important');


        assignValueToConfig("sb_ColorCustomTemplates", name, value)
    }
    // Add an event listener to the button to open the modal
    function resetColorTemplate(name) {

        removeKeyFromConfig("sb_ColorCustomTemplates", name)
        renderList("custom_templates_main");

    }


    async function createContextualMenu() {

        //const menuOptions = document.getElementById('menu-options');
        //new_menu_options_callback = [];
        //for each template
        /*template_menu = await readTemplates();
        callback_menu = [];
        for (let i = 0; i < template_menu.length; i++) {
            callback_menu.push("assignNodeToTemplateCallback");

        }*/


        console.log("custom template panel loaded")

    }



    const searchTemplateIconCustomTemplate = document.querySelector(".searchTemplateIconCustomTemplate");


    searchTemplateIconCustomTemplate.addEventListener("click", async function () {

        try {

            templateSearchToggleCustom = !templateSearchToggleCustom;
            searchTemplateIconCustomTemplate.style.opacity = templateSearchToggleCustom ? "1" : "0.5";


        } catch (error) {

            console.error("Error occurred during search:", error);
        }
    });

    return {
        openModal,
        addSidebarStyles,
        createContextualMenu,
        renderList,
        renameTemplate,
        renameCategory,
        colorTemplate,
        removeKeyConfig,
        searchT,
        deleteCategory,
        addTemplate,
        editNodeTemplate,
        removeNodeMapTemplate,
        reorderTemplates,
        reorderNodeInTemplate,
        removeNodeFromTemplateCallback,
        assignNodeToTemplateCallback,
        renameTemplateCallback,
        renameCategoryCallback,
        colorTemplateCallback,
        removeTemplateCallback,
        resetColorTemplate
    };


})();
custom_templates.addSidebarStyles("panels/custom_templates/style.css");
custom_templates.createContextualMenu()
custom_templates.renderList("custom_templates_main"); 