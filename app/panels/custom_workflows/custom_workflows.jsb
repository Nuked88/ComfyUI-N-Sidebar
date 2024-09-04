var custom_workflows = (function () {
    let currentElement = null;

    async function createWorkflowPreview(nodeID, jsondata) {
        try {
            const req = JSON.stringify({ action: 'load', path: jsondata });


            const response = await fetch('/sidebar/workflow', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: req
            });

            const data = await response.json();
            const jsonData = data; // JSON.parse(jsondata); 

            // Elimina i duplicati usando un Set
            const nodeTypes = [...new Set(jsonData.nodes.map(node => node.type))];

            let rows = "";
            nodeTypes.forEach(type => {
                rows += `<li class="sidebarItem">${type}</li>`;
            });

            return `<div class="sb_table">
        <div class="node_header">${nodeID}</div>
        <div class="sb_preview_badge">USED NODES</div>
        <ul>
            ${rows}
        </ul>
    </div>`;
        } catch (e) {
            console.log(e);
            return '<div class="sb_table"><div class="node_header">' + nodeID + '</div><div class="sb_preview_badge">USED NODES</div><ul><li class="sidebarItem">ERROR</li></ul></div>';
        }
    }


    async function getWorkflow(nodeID, jsondata) {
        try {
            const req = JSON.stringify({ action: 'load', path: jsondata });


            const response = await fetch('/sidebar/workflow', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: req
            });

            const data = await response.json();

            return data;    
         
        } catch (e) {
            console.log(e);
            return NaN;
        }
    }
    // MODAL
    function createCustomHtml(type, name, elem = null) {
     
        if (type == "rename") {
            return `<h2 class="sb-modal-title">Rename Category</h2>
                    <form id="sb-workflow-form" action="javascript:void(0);">
                        <input type="text" autocomplete="off" class="sb-input" id="sb-workflowName" value="${name}" name="sb-workflowName" required>
                        <button type="submit" class="sb-button" onclick="custom_workflows.renameCategory('${name}',document.getElementById('sb-workflowName').value)">Rename</button>
                    </form>
                    <button id="closeModalButton"  class="sb-button">X</button>

                    `
        } else if (type == "color") {
            currentElement = elem;
            return `<h2 class="sb-modal-title">Color ${name}</h2>
                   <div class="colorBlob">
                    <input  class="colorBlobPicker" type="color" oninput="custom_workflows.colorWorkflow('${name}',this.value)" value="${rgbToHex(elem.style.backgroundColor)}" id="colorPicker">
                    </div>
                    <button type="button" class="sb-button" onclick="custom_workflows.resetColorWorkflow('${name}')">Reset Color</button>
                    <button type="button" class="sb-button" onclick="custom_workflows.removeKeyConfig('sb_ColorCustomWorkflows') ">Reset All Colors</button>

                    <button id="closeModalButton"  class="sb-button">X</button>
                `
        }else if(type == "renameWorkflow"){
            elem = elem.replace(/\\/g, '/');
            return `<h2 class="sb-modal-title">Rename Workflow</h2>
            <form id="sb-workflow-form" action="javascript:void(0);">
                <input type="text" autocomplete="off" class="sb-input" id="sb-workflowName" value="${name}" name="sb-workflowName" required>
                <button type="submit" class="sb-button" onclick="custom_workflows.renameWorkflow('${elem}','${name}',document.getElementById('sb-workflowName').value)">Rename</button>
            </form>
            <button id="closeModalButton"  class="sb-button">X</button>

            `
        }
    }



    function setModalContext(addon = null) {
        if (addon == null) {
            return `
            <h2 class="sb-modal-title">Add New Workflow</h2>
            <form id="sb-workflow-form" action="javascript:void(0);">
                <input type="text" autocomplete="off" class="sb-input" id="sb-workflowName" name="sb-workflowName" placeholder="Workflow Name" required>
                <button type="submit" class="sb-button" onclick="custom_workflows.addWorkflow()">Add Workflow</button>
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
            inputElement = document.getElementById('sb-workflowName');
            inputElement.focus();
            const length = inputElement.value.length;
            inputElement.setSelectionRange(length, length);
        } catch (err) {

        }
    }


    // Function to open the modal

    //insert button  in label with id panel_title_custom_workflows
    let workflowSearchToggleCustom = false;
    const panel_title_custom_workflows = document.getElementById("panel_title_custom_workflows");

    const button_custom_workflows = document.createElement("button");
    button_custom_workflows.classList = "expand_node";
    button_custom_workflows.title = "Expand/Collapse";
    button_custom_workflows.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve">
<path d="M48,9.5C48,8.7,47.3,8,46.5,8h-41C4.7,8,4,8.7,4,9.5v3C4,13.3,4.7,14,5.5,14h41c0.8,0,1.5-0.7,1.5-1.5V9.5z"></path>
<path d="M48,39.5c0-0.8-0.7-1.5-1.5-1.5h-41C4.7,38,4,38.7,4,39.5v3C4,43.3,4.7,44,5.5,44h41c0.8,0,1.5-0.7,1.5-1.5
    V39.5z"></path>
<path d="M34.5,29c0.8,0,1.5-0.7,1.5-1.5v-3c0-0.8-0.7-1.5-1.5-1.5h-17c-0.8,0-1.5,0.7-1.5,1.5v3
    c0,0.8,0.7,1.5,1.5,1.5H34.5z"></path>

    <rect class="expand_node" style="opacity:0" x="0" y="0" width="52" height="52"></rect>
</svg>`;

    panel_title_custom_workflows.appendChild(button_custom_workflows);

    button_custom_workflows.addEventListener("click", (event) => {
        const clickedElement = event.target;
        const pinButton = clickedElement.tagName;
        if ((pinButton == "rect") && clickedElement.classList.contains("expand_node")) {

            sdExpandAll();
        }

    })
    const clearIconCustomWorkflow = document.querySelector(".clearIconCustomWorkflow");
    const itemSearchInput = document.getElementById("searchWorkflowInput");
    clearIconCustomWorkflow.addEventListener("click", async function () {
        try {

            itemSearchInput.value = "";
            renderList("custom_workflows_main");

        } catch (error) {
            console.error("Error occurred during search:", error);
        }
    });

  

    async function afterRender() {
        const workflows = await readWorkflows();
        const workflowsString = JSON.stringify(workflows, null, 4); // Formatta il JSON con indentazione di 4 spazi
        
        callback_menu = [];
        for (let i = 0; i < workflows.length; i++) {
            callback_menu.push("custom_workflows.assignNodeToWorkflowCallback");
    
        }
        const callbackString = JSON.stringify(callback_menu, null, 4);


        customMenuWorkflow = `
        {
            "menuctx_workflow": "Context Menu",
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
                "custom_workflows.renameCategoryCallback",
                "custom_workflows.removeCategory",
                "custom_workflows.colorWorkflowCallback"
            
            ],
            "menuctx_sub_opt_callback": [
                [
                ],
                [
                ],
                [
                ]
            ]
        }`;
    
        customMenuWorkflowItem = `
        {
            "menuctx_workflow": "Context Menu",
            "menuctx_options": [
                "Open in New Tab",
                "Delete from Category",
                "Rename Workflow",
                "Delete Workflow",
                "Add to"
                
            ],
            "menuctx_subOptions": [
                [
                ],
                [
                ],
                [
                ],
                [
                ],
                ${workflowsString}
            ],
            "menuctx_opt_callback": [
                "custom_workflows.openWorkflowInNewTabCallback",
                "custom_workflows.removeNodeFromWorkflowCallback",
                "custom_workflows.renameWorkflowCallback",
                "custom_workflows.removeWorkflowCallback"
                
            
            ],
            "menuctx_sub_opt_callback": [
                [ 
                ],
                [
                ],
                [
                ],
                [
                ],
                ${callbackString}
            ]
        }`;
        customMenuWorkflowItemOut = `
        {
            "menuctx_workflow": "Context Menu",
            "menuctx_options": [
                "Open in New Tab",
                "Rename Workflow",
                "Delete Workflow",
                "Add to"
                
            ],
            "menuctx_subOptions": [
                [
                ],
                [
                ],
                [
                ],
                ${workflowsString}
            ],
            "menuctx_opt_callback": [
                "custom_workflows.openWorkflowInNewTabCallback",
                "custom_workflows.renameWorkflowCallback",
                "custom_workflows.removeWorkflowCallback"
                
            
            ],
            "menuctx_sub_opt_callback": [
                [ 
                ],
                [
                ],
                [
                ],
                ${callbackString}
            ]
        }`;
    
        customMenuJSON = JSON.parse(customMenuWorkflow);
        customMenuItemJSON = JSON.parse(customMenuWorkflowItem);
        customMenuItemJSONOut = JSON.parse(customMenuWorkflowItemOut);
    
        setContextMenu(customMenuJSON, "#custom_workflows_main .sidebarCategory", 0, "sidebarItem", "sidebarCategory");
        setContextMenu(customMenuItemJSONOut, "#custom_workflows_main .sidebarItem");
        setContextMenu(customMenuItemJSON, "#custom_workflows_main .displayNamesList .sidebarItem");
    
        // ORDER CUSTOM CATEGORIES
        const custom_workflows_main = document.getElementById("custom_workflows_main");
        
        custom_workflows_main.querySelectorAll(".sidebarCategory").forEach(function (item) {
            item.addEventListener("dragstart", handleDragStart);
        });
    
        custom_workflows_main.removeEventListener("dragover", handleDragOver);
        custom_workflows_main.addEventListener("dragover", handleDragOver);
    
        custom_workflows_main.removeEventListener("drop", handleCustomWorkflowsMainDrop);
        custom_workflows_main.addEventListener("drop", handleCustomWorkflowsMainDrop);
    
        //workflow drag and drop
        custom_workflows_main.querySelectorAll(".sidebarItem").forEach(function (item) {
            item.addEventListener("dragstart", handleDragStart);
        });
    
        sidebar.removeEventListener("dragstart", handleSidebarDragStart);
        sidebar.addEventListener("dragstart", handleSidebarDragStart);
    
        document.removeEventListener("drop", handleDocumentDropEvent);
        document.addEventListener("drop", handleDocumentDropEvent);
    
        // ORDER CUSTOM NODES
        custom_workflows_main.querySelectorAll(".sidebarItem").forEach(function (item) {
            item.addEventListener("dragstart", handleDragStart);
        });
    }




    // handler
    
    function handleDragStart(event) {
        dragItem = event.target;
    }
    
    function handleDragOver(event) {
        event.preventDefault();
    }
    
    function handleCustomWorkflowsMainDrop(event) {
        event.preventDefault();
        if (dragItem) {
            if (draggedElement.id !== 'sidebarWorkflowItem') {
                if (dragItem.parentElement === event.target.parentElement) {
                    const custom_workflows_main = document.getElementById("custom_workflows_main");
                    custom_workflows_main.insertBefore(dragItem, event.target);
                    reorderWorkflows(getCustomWorkflowOrder());
                }
            }
            dragItem = null;
        }
    }
    
    function handleSidebarDragStart(event) {
        draggedElement = event.target;
    }
    
    async function handleDocumentDropEvent(event) {
        //prevent default action
        event.preventDefault();
        const sb_workflow_replace = localStorage.getItem('sb_workflow_replace') || "true";
        if (draggedElement.id === 'sidebarWorkflowItem' && event.target.id === 'graph-canvas') {
       
            if (draggedElement.dataset.data === 'NaN') { return; }
            if (sb_workflow_replace=="true") {
                const confirmation = confirm("This will replace the current workflow. Are you sure?");
                if (!confirmation) { return; }
            }
            //post request to /sidebar/workflow with json with path
            const req = JSON.stringify({ action: 'load', path: draggedElement.dataset.data });
            fetch('/sidebar/workflow', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: req
            })
            .then(response => response.json())
            .then(data => {
                app.loadGraphData(data);
                draggedElement.dataset.data = NaN;
            });
    
        } else if (draggedElement.id === 'sidebarWorkflowItem' && (event.target.classList.contains('sidebarCategory') || event.target.classList.contains('displayNamesList'))) {
            const ulElement = event.target.querySelector('ul');

            if (ulElement) {
                ulElement.appendChild(draggedElement);
            } else {
                event.target.appendChild(draggedElement);
            }
    
            updateConfiguration('sb_workflowNodeMap', JSON.stringify(getCustomWorkflowStructure()));
            renderList("custom_workflows_main");
        } 
        
        
        else if (draggedElement.id === 'sidebarWorkflowItem' && event.target.parentElement.parentElement.classList.contains('sidebarCategory')) {
            event.target.parentElement.insertBefore(draggedElement, event.target);
            updateConfiguration('sb_workflowNodeMap', JSON.stringify(getCustomWorkflowStructure()));
            renderList("custom_workflows_main");
        }
    }






    // ORDER CUSTOM CATEGORIES
    
    function getCustomWorkflowOrder() {
        let cat = [];
        const custom_workflows_main = document.getElementById("custom_workflows_main");
        custom_workflows_main.querySelectorAll(".sidebarCategory").forEach(function (item) {
            cat.push(item.dataset.nameworkflow)

        });
        return cat
    }


    function getCustomNodeOrder(idcat) {
        let node = [];
        const objMain = document.getElementById(idcat);
        objMain.querySelectorAll(".sidebarItem").forEach(function (item) {
            node.push(item.dataset.id)

        });
        return node
    }

    function getCustomWorkflowStructure() {
        let cat = {};
        const custom_workflows_main = document.getElementById("custom_workflows_main");
        custom_workflows_main.querySelectorAll(".sidebarCategory").forEach(function (item) {
            
            cat[item.dataset.nameworkflow] = getCustomNodeOrder(item.dataset.nameworkflow + "_ul")

        });

        return cat
    }

    async function readComfyWorkflows() {
        let comfy_workflows;
        try {
            const response = await fetch('./sidebar/workflows');
            comfy_workflows = await response.json();

        } catch (error) {
            console.error('Error fetching data:', error);
        }
        return comfy_workflows

    }

    function splitPath(path) {
        // Replace all backslashes with forward slashes
        let normalizedPath = path.replace(/\\/g, '/');
        // Split the normalized path by the forward slash
        let pathArray = normalizedPath.split('/');
        // Remove any empty strings from the array (which can happen if there are trailing slashes)
        pathArray = pathArray.filter(part => part !== '');
        return pathArray;
    }
    
    function buildTree(workflows) {
        const tree = {};
    
        for (const workflow in workflows) {
            const subfolder = workflows[workflow].subfolder.replace(/\\/g, '/'); // Normalize path
            const parts = subfolder.split('/').filter(part => part !== '');
    
            let current = tree;
            for (const part of parts) {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
    
            if (!current.workflows) {
                current.workflows = [];
            }
    
            current.workflows.push({
                name: workflows[workflow].name,
                path: workflows[workflow].path,
                id: workflow
            });
        }
    
        return tree;
    }
    


    function createHtmlFromTree(tree, parentElement) {
        // Make i subfolder
        for (const key in tree) {
            if (key !== 'workflows') {
                const subfolderLi = document.createElement('li');
                subfolderLi.textContent = "🗀 "+ key;
                subfolderLi.classList.add('sidebarFolder');
                subfolderLi.dataset.nameworkflow = key;
    
                const subfolderUl = document.createElement('ul');
                subfolderUl.classList.add('subfolder');
                subfolderUl.dataset.subfolder = key;
                subfolderUl.id = key + "_ul";
                subfolderUl.classList.add("displayNamesList");
    
                subfolderLi.appendChild(subfolderUl);
                parentElement.appendChild(subfolderLi);
    
                createHtmlFromTree(tree[key], subfolderUl);
            }
        }
    
        // Then make workflows
        if (tree.workflows) {
            tree.workflows.forEach(workflow => {
                const workflowItem = document.createElement('li');
                workflowItem.classList.add('sidebarItem');
                workflowItem.id = "sidebarWorkflowItem";
                workflowItem.dataset.nameworkflow = workflow.name;
                workflowItem.dataset.data = workflow.path;
                workflowItem.dataset.id = workflow.id;
                workflowItem.title = workflow.name;
                workflowItem.textContent = workflow.name;
                workflowItem.draggable = true;
                parentElement.appendChild(workflowItem);
            });
        }
    }




    async function renderList(elementID) {
        const data = await readComfyWorkflows()  //load all workflows

        const myPromise = new Promise(async (resolve, reject) => {
            const workflows = await readWorkflows();


            //console.log(workflows);
            const sidebarCustomNodes = document.getElementById(elementID);
            //clear elementid 
            sidebarCustomNodes.innerHTML = "";

            exclusion_list = []
            general_index = 0


            for (const workflow in workflows) {
                //data[objKey].title.toLowerCase();
                let workflowName = workflows[workflow]
                const workflowItem = document.createElement("li");
                workflowItem.classList.add("sidebarCategory");
                workflowItem.dataset.nameworkflow = workflowName;
                workflowItem.textContent = "⌬ " + workflowName;
                workflowItem.draggable = true;

                const currentColor = await getValueFromConfig("sb_ColorCustomWorkflows", workflowName);

                if (currentColor) {
                    const value_perc = await getConfiguration("sb_opacity") || "1.0";

                    const rgbColor = hexToRgb(currentColor);

                    workflowItem.style.setProperty('background-color', `rgba(${rgbColor}, ${value_perc})`, 'important');

                }




                const displayNamesList = document.createElement("ul");
                displayNamesList.id = workflowName + "_ul";
                displayNamesList.classList.add("displayNamesList");
                displayNamesList.style.display = getNodeStatus('sb_workflowNodeStatus',workflowName);
                workflowItem.appendChild(displayNamesList);

                let displayName = workflow;


                const listNodeForWorkflow = await getNodesForWorkflow(workflowName);



                listNodeForWorkflow.forEach(displayName => {
                    try {
                        const displayNameItem = document.createElement("li");
                        displayNameItem.classList.add("sidebarItem");
                        displayNameItem.id = "sidebarWorkflowItem"
                        displayNameItem.textContent = data[displayName].name;
                        displayNameItem.title = data[displayName].name;
                        displayNameItem.dataset.nameworkflow = data[displayName].name;
                        displayNameItem.dataset.data = data[displayName].path;
                        displayNameItem.dataset.id = displayName;
                        displayNameItem.draggable = true;

                        exclusion_list.push(displayName);


                        displayNamesList.appendChild(displayNameItem);


                        displayNamesList.addEventListener("drop", function (event) {
                            event.preventDefault();

                            if (dragItem) {

                                if (dragItem.parentElement == event.target.parentElement) {

                                    displayNamesList.insertBefore(dragItem, event.target);
                                    reorderNodeInWorkflow(workflowItem.dataset.nameworkflow, getCustomNodeOrder(dragItem.parentElement.id))

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
                    sidebarCustomNodes.appendChild(workflowItem);
                } catch (err) {
                    console.log(err);
                }
                general_index++;
            }

            //adding workflows not categorized
            let space = document.createElement("br");
            sidebarCustomNodes.appendChild(space);

            let comfy_workflows = await readComfyWorkflows();


            comfy_workflows = Object.fromEntries(Object.entries(comfy_workflows).filter(([key]) => !exclusion_list.includes(key)));

            const tree = buildTree(comfy_workflows);
            general_index = general_index + (Object.keys(tree).length);


            createHtmlFromTree(tree, sidebarCustomNodes);

            if (general_index == 0) {
                const noWorkflow = document.createElement("div");
                noWorkflow.classList.add("TIPSidebarItem");
                noWorkflow.textContent = "It's pretty empty here... Try adding your Workflow folder in the sidebar settings! :D";
                sidebarCustomNodes.appendChild(noWorkflow);
            }


      // Preview

      const sidebarItems_cat = document.querySelectorAll('#' + elementID + ' .sidebarItem');
      const previewDiv = document.getElementById('previewDiv');
      let sidebad_view_width = document.getElementById("sidebar_views").offsetWidth;


        const configFunction = async () => {
            const preview = JSON.parse(await getConfiguration('sb_workflow_preview', true));
            return preview;
        };
    
        const previewFunction = async (item) => {
            const previewContent = await createWorkflowPreview(item.dataset.nameworkflow, item.dataset.data);
            return [previewContent, null];  
        };
      
        const preview = JSON.parse(await getConfiguration('sb_workflow_preview', true))

        sidebarItems_cat.forEach(item => {
            if (preview) {
                getPreview(item,previewDiv,sidebad_view_width, previewFunction, configFunction);
            }
        });

        window.addEventListener('click', function (event) {

            if (!event.target.classList.contains('sidebarItem')) {
                previewDiv.style.display = 'none';

            }
        });







            const workflowItems = document.querySelectorAll("#custom_workflows_main .sidebarCategory");
            workflowItems.forEach(function (workflowItem) {
                workflowItem.addEventListener("click", function (event) {

                    if (event.target === event.currentTarget) {
                        const displayNamesList = event.target.querySelector("ul");

                        displayNamesList.style.display = displayNamesList.style.display === "none" ? "block" : "none";

                        setNodeStatus('sb_workflowNodeStatus',displayNamesList.parentElement.dataset.nameworkflow, displayNamesList.style.display)
                    }
                });



            });


            const folderItems = document.querySelectorAll("#custom_workflows_main .sidebarFolder");
            folderItems.forEach(function (folderItem) {
                folderItem.addEventListener("click", function (event) {

                    if (event.target === event.currentTarget) {
                        const displayNamesList = event.target.querySelector("ul");

                        displayNamesList.style.display = displayNamesList.style.display === "none" ? "block" : "none";

                        setNodeStatus('sb_workflowNodeStatus',displayNamesList.parentElement.dataset.nameworkflow, displayNamesList.style.display)
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
            handleSearch(workflowSearchToggleCustom, "#custom_workflows_main", "searchWorkflowInput")


        } else {

            renderList("custom_workflows_main");
        }

    }



    async function getNodeMap() {
        let workflowNodeMap = JSON.parse(await getConfiguration('sb_workflowNodeMap')) || {};
        return workflowNodeMap;
    }

    function getNodesStatus() {
        let workflowNodeStatus = JSON.parse(localStorage.getItem('sb_workflowNodeStatus')) || {};
        return workflowNodeStatus;
    }


    async function addWorkflow() {


        const newWorkflowName = document.getElementById('sb-workflowName').value;
        // Check if the workflow name contains special characters
        if (containsSpecialCharacters(newWorkflowName)) {
            // Alert the user and return if special characters are found
            alert("Workflow name cannot contain special characters.");
            return;
        }




        let workflowNodeMap = await getNodeMap();


        if (!workflowNodeMap[newWorkflowName]) {

            workflowNodeMap[newWorkflowName] = [];
            updateConfiguration('sb_workflowNodeMap', JSON.stringify(workflowNodeMap));
            createContextualMenu();
            reloadCtxMenu()
            renderList("custom_workflows_main");
            closeModal()
        } else {
            alert("Workflow already exists!");
            return;
        }
    }


    // Function to rename a workflow

    async function renameCategory(oldWorkflowName, newWorkflowName) {


        if (containsSpecialCharacters(newWorkflowName)) {
            // Alert the user and return if special characters are found
            alert("Workflow name cannot contain special characters.");
            return;
        }
        if (oldWorkflowName === newWorkflowName) {
            closeModal()
            return;
        }

        let workflowNodeMap = await getNodeMap();

        if (workflowNodeMap[newWorkflowName]) {
            alert("Category already exists!");
            return;
        }



        let workflowNodeStatus = getNodesStatus();
        if (workflowNodeMap[oldWorkflowName]) {
            // Categoty Current Order
            let keys = Object.keys(workflowNodeMap);

            workflowNodeMap[newWorkflowName] = workflowNodeMap[oldWorkflowName];
            delete workflowNodeMap[oldWorkflowName];

            // Rebuild Order
            let updatedMap = {};
            keys.forEach(key => {
                if (key === oldWorkflowName) {
                    updatedMap[newWorkflowName] = workflowNodeMap[newWorkflowName];
                } else {
                    updatedMap[key] = workflowNodeMap[key];
                }
            });



            updateConfiguration('sb_workflowNodeMap', JSON.stringify(updatedMap));
            //rename status
            if (workflowNodeStatus[oldWorkflowName]) {

                workflowNodeStatus[newWorkflowName] = workflowNodeStatus[oldWorkflowName];
                delete workflowNodeStatus[oldWorkflowName];
                localStorage.setItem('sb_workflowNodeStatus', JSON.stringify(workflowNodeStatus));
            }
            //rename color
            renameKeyConfig("sb_ColorCustomWorkflows", oldWorkflowName, newWorkflowName)


            createContextualMenu();
            reloadCtxMenu()
            renderList("custom_workflows_main");
            closeModal()
        } else {
            alert("Workflow not found!");
        }
    }



    async function readWorkflows() {
        let workflowNodeMap = await getNodeMap();
        if (workflowNodeMap) {
            return Object.keys(workflowNodeMap);
        }
        else {
            return [];
        }

    }


    // Function to delete a workflow
    async function removeCategory(e) {

        const name = e.target.dataset.nameworkflow;
        confirmation = confirm("Are you sure you want to delete the category " + name + "?");
        if (!confirmation) { return; }

        let workflowNodeMap = await getNodeMap();
        // If the workflow name is found, remove it from the array
        if (workflowNodeMap[name]) {
            removeNodeMapWorkflow(name);
            createContextualMenu();
            removeKeyFromConfig("sb_ColorCustomWorkflows", name)

            setTimeout(() => {

                renderList("custom_workflows_main");
            }, 200)
            reloadCtxMenu()
        } else {
            alert("Workflow not found!");
        }
    }

    async function renameWorkflow(path,oldWorkflowName, newWorkflowName) {
   

                
            if (containsSpecialCharacters(newWorkflowName, level=1)) {
                // Alert the user and return if special characters are found
                alert("Workflow name cannot contain special characters.");
                return;
            }

            const parts = path.split('/');
            parts.pop();
  
            let oldWorkflowNameHash = btoa(parts.join('\\')+'\\'+oldWorkflowName + '.json');
            let newWorkflowNameHash = btoa(parts.join('\\')+'\\'+newWorkflowName + '.json');
                
            await fetch('./sidebar/workflow', {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'rename',
                        path: path,
                        newName: newWorkflowName
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
            }).then(response => response.json())
            .then(data => {

            if (data.result == 'OK') {

                renameWorkflowNode("sb_workflowNodeMap", oldWorkflowNameHash, newWorkflowNameHash)
                
                const element = document.getElementById('custom_workflows_main');
                let position = element.scrollTop;
                closeModal()
                renderList("custom_workflows_main");

                //little hack
                setTimeout(() => {
                    element.scrollTop = position;
                },200);
            } else {
                alert(data.result);
            }

            
        });
        

    }
    async  function renameWorkflowNode(key, oldNodeName, newNodeName) {
        let jsonObject = await getConfig(key);

            // Parse the sb_workflowNodeMap property to an object
            let workflowNodeMap = jsonObject
            // Iterate over the workflow node map to find and replace the node name
            for (let workflow in workflowNodeMap) {
                let nodes = workflowNodeMap[workflow];
                let nodeIndex = nodes.indexOf(oldNodeName);
                if (nodeIndex !== -1) {
                    nodes[nodeIndex] = newNodeName;
                    break; // Assuming the node names are unique, we can break once we find it
                }
            }
    
        // Convert the modified JSON object back to a JSON string
        updateConfiguration(key, JSON.stringify(jsonObject));
    }


    async function removeWorkflowNode(key, value) {

        let jsonObject = await getConfig(key);
        let workflowNodeMap = jsonObject
            // Iterate over the workflow node map to find and remove the node name
            for (let workflow in workflowNodeMap) {
                let nodes = workflowNodeMap[workflow];
                let nodeIndex = nodes.indexOf(value);
                if (nodeIndex !== -1) {
                    nodes.splice(nodeIndex, 1); // Remove the node from the array
                    break; // Assuming the node names are unique, we can break once we find it
                }
            }
    
            updateConfiguration(key, JSON.stringify(jsonObject));
        }


    async function removeWorkflow(name,path) {

       confirmation = confirm("Are you sure you want to delete the workflow " + name + "?");
       if (!confirmation) { return; }
       await fetch('./sidebar/workflow', {
            method: 'POST',
            body: JSON.stringify(
                {
                    action: 'delete',
                    path: path
                }
            ),
            headers: {
                'Content-Type': 'application/json'
            }
       }).then(() => {
            removeWorkflowNode("sb_workflowNodeMap", name)
            renderList("custom_workflows_main");
            
        });
        

    }




    /////////////////////////////////////////////////

    async function getConfig(configName) {
        let workflowNodeMap = JSON.parse(await getConfiguration(configName)) || {};
        return workflowNodeMap;
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
        renderList("custom_workflows_main");
    }







    ////////////////////////////////////////////////

    async function getWorkflowsForNode(nodeName) {
        let workflowNodeMap = await getNodeMap();

        let workflows = [];
        for (let workflow in workflowNodeMap) {
            if (workflowNodeMap.hasOwnProperty(workflow)) {
                if (workflowNodeMap[workflow].includes(nodeName)) {
                    workflows.push(workflow);
                }
            }
        }
        return workflows;
    }

    async function getNodesForWorkflow(workflowName) {
        let workflowNodeMap = await getNodeMap();


        return workflowNodeMap[workflowName] || [];
    }


    async function assignNodeToWorkflow(nodeName, workflowNames) {
        let workflowNodeMap = await getNodeMap();

        let assignedWorkflows = await getWorkflowsForNode(nodeName);
        workflowNames = workflowNames.filter(workflow => !assignedWorkflows.includes(workflow));

        workflowNames.forEach(workflowName => {
            if (!workflowNodeMap[workflowName]) {
                workflowNodeMap[workflowName] = [];
            }
            workflowNodeMap[workflowName].push(nodeName);
        });
        updateConfiguration('sb_workflowNodeMap', JSON.stringify(workflowNodeMap));
      
        const element = document.getElementById('custom_workflows_main');
        let position = element.scrollTop;
        renderList("custom_workflows_main");

        //little hack
        setTimeout(() => {
            element.scrollTop = position;
        },200);
    }


    async function removeNodeFromWorkflow(nodeName, workflowName) {
        let workflowNodeMap = await getNodeMap();

        if (workflowNodeMap[workflowName]) {
            workflowNodeMap[workflowName] = workflowNodeMap[workflowName].filter(node => node !== nodeName);
            updateConfiguration('sb_workflowNodeMap', JSON.stringify(workflowNodeMap));
            renderList("custom_workflows_main");

        }
    }


    async function removeNodeMapWorkflow(workflowName) {
        let workflowNodeMap = await getNodeMap();
        let workflowNodeStatus = getNodesStatus();
        delete workflowNodeMap[workflowName];
        updateConfiguration('sb_workflowNodeMap', JSON.stringify(workflowNodeMap));

        if (workflowNodeStatus[workflowName]) {
            delete workflowNodeStatus[workflowName];
            localStorage.setItem('sb_workflowNodeStatus', JSON.stringify(workflowNodeStatus));

        }
    }


    function editNodeWorkflow(oldWorkflowName, newWorkflowName, nodeName) {

        removeNodeFromWorkflow(nodeName, oldWorkflowName);

        assignNodeToWorkflow(nodeName, [newWorkflowName]);
    }



    async function reorderWorkflows(orderedKeys) {
        let workflowNodeMap = await getNodeMap();
        let reorderedWorkflowNodeMap = {};


        orderedKeys.forEach(workflowKey => {
            if (workflowNodeMap.hasOwnProperty(workflowKey)) {
                reorderedWorkflowNodeMap[workflowKey] = workflowNodeMap[workflowKey];
            }
        });

        updateConfiguration('sb_workflowNodeMap', JSON.stringify(reorderedWorkflowNodeMap));


    }


    async function reorderNodeInWorkflow(workflowName, orderedKeys) {
        let workflowNodeMap = await getNodeMap();

        if (workflowNodeMap[workflowName]) {
            workflowNodeMap[workflowName] = orderedKeys;
            updateConfiguration('sb_workflowNodeMap', JSON.stringify(workflowNodeMap));
        }
    }

    // Callbacks
    function removeNodeFromWorkflowCallback(e, trge) {

        removeNodeFromWorkflow(e.target.dataset.id, e.target.parentElement.parentElement.dataset.nameworkflow)
    }

    function assignNodeToWorkflowCallback(e, trge) {
        assignNodeToWorkflow(e.target.dataset.id, [trge]);
        
    }

    function renameWorkflowCallback(e, trge) {
        const name = e.target.dataset.nameworkflow;
        const path = e.target.dataset.data;
        openModal(createCustomHtml("renameWorkflow", name, path))

    }

    function renameCategoryCallback(e, trge) {
        const name = e.target.dataset.nameworkflow;
    
        openModal(createCustomHtml("rename", name))

    }
    

    function removeWorkflowCallback(e, trge) {
        const name = e.target.textContent;
        const path = e.target.dataset.data;
        removeWorkflow(name,path)
    }
    function colorWorkflowCallback(e) {

        const name = e.target.dataset.nameworkflow;
        openModal(createCustomHtml("color", name, e.target))
        //colorWorkflow(e.target.id, e.target.parentElement.parentElement.dataset.nameworkflow)
    }

    async function  openWorkflowInNewTabCallback(e, trge)  {

       var win = window.open(`${window.location.origin}/?wfsb=${e.target.dataset.id}`, '_blank');
       win.focus();

    }

   

    async function colorWorkflow(name, value) {


        const value_perc = await getConfiguration("sb_opacity") || "1.0";
        const rgbColor = hexToRgb(value);

        currentElement.style.setProperty('background-color', `rgba(${rgbColor}, ${value_perc})`, 'important');


        assignValueToConfig("sb_ColorCustomWorkflows", name, value)
    }
    // Add an event listener to the button to open the modal
    function resetColorWorkflow(name) {

        removeKeyFromConfig("sb_ColorCustomWorkflows", name)
        renderList("custom_workflows_main");

    }


    async function createContextualMenu() {

        console.log("custom workflow panel loaded")

    }


   

    const searchWorkflowIconCustomWorkflow = document.querySelector(".searchWorkflowIconCustomWorkflow");
    searchWorkflowIconCustomWorkflow.addEventListener("click", async function () {

        try {

            workflowSearchToggleCustom = !workflowSearchToggleCustom;
            searchWorkflowIconCustomWorkflow.style.opacity = workflowSearchToggleCustom ? "1" : "0.5";


        } catch (error) {

            console.error("Error occurred during search:", error);
        }
    });


    function checkAndLoadWorkflow() {
        const url = new URL(window.location.href);
        if (url.searchParams.has('wfsb')) {
    
          const wfsbValue = url.searchParams.get('wfsb');  
    
              const req = JSON.stringify({ action: 'load', path: atob(wfsbValue) });
              fetch('/sidebar/workflow', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: req
              })
              .then(response => response.json())
              .then(data => {
                  app.loadGraphData(data);
              });
          url.searchParams.delete('wfsb');
          window.history.replaceState({}, document.title, url.pathname + url.search);
        }
      }
      

    /*temp funciton*/
   async function migrationSettings() {
    if (!getVar("sb_migrated")) {
        fetch('/sidebar/backup', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.json())
        .then(async data => {
            if (data.result === "OK") { 
                console.log("Starting migration...");
                // Get actual config
                let jsonObject = await getNodeMap();
                // Get actual list of workflows   
                let workflowNodeMap = await readComfyWorkflows();

                function findKeyByName(jsonObject, targetName) {
                    for (let key in jsonObject) {
                        if (jsonObject[key].name === targetName) {
                            return key;
                        }
                    }
                    return null;
                }

                // Iterate over the workflow 
                for (let workflow in jsonObject) {
                    let nodes = jsonObject[workflow];
                    for (let node of nodes) {
                        let key = findKeyByName(workflowNodeMap, node);
                        if (key !== null) {
                            await renameWorkflowNode("sb_workflowNodeMap", node, key);
                        } 
                    }
                }
                setVar("sb_migrated", true);
                console.log("Migration completed.");
            } else {
                console.error("Backup failed, migration aborted.");
            }
        })
        .catch(error => {
            console.error("Error during backup request:", error);
        });
    }
}


    return {
        openModal,
        addSidebarStyles,
        createContextualMenu,
        renderList,
        renameCategory,
        renameWorkflow,
        colorWorkflow,
        removeKeyConfig,
        searchT,
        removeCategory,
        removeWorkflow,
        addWorkflow,
        editNodeWorkflow,
        removeNodeMapWorkflow,
        reorderWorkflows,
        reorderNodeInWorkflow,
        removeNodeFromWorkflowCallback,
        removeWorkflowCallback,
        assignNodeToWorkflowCallback,
        openWorkflowInNewTabCallback,
        renameWorkflowCallback,
        renameCategoryCallback,
        colorWorkflowCallback,
        resetColorWorkflow,
        migrationSettings,
        checkAndLoadWorkflow
    };


})();
custom_workflows.migrationSettings();
custom_workflows.addSidebarStyles("panels/custom_workflows/style.css");
custom_workflows.createContextualMenu()
custom_workflows.renderList("custom_workflows_main"); 
custom_workflows.checkAndLoadWorkflow();
