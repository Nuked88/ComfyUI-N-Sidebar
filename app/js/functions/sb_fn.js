const cnPath="../extensions/ComfyUI-N-Sidebar/"
function addSidebarStyles(cssPath) {
    const   linkElement = document.createElement("link");
            linkElement.rel = "stylesheet";
            linkElement.type = "text/css";
            linkElement.href = cnPath+cssPath
    document.head.appendChild(linkElement);
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


function sdExpandAll(forceExpand=0) {

    const categoryItems = document.querySelectorAll(".content_sidebar .sidebarCategory");
    const side_bar_status = document.querySelector(".content_sidebar").dataset.expanded;
    const expand_node = document.getElementsByClassName("expand_node")[0];

    let display_value = "true";

    if (side_bar_status === "true" && forceExpand === 0) {

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


function handleSearch(categorySearchToggle,searchSection,searchIdInput) {
   

    return new Promise((resolve, reject) => {
        const options = {
            keys: ['textContent','category'],
            threshold: 0.5,
            useExtendedSearch: true
          };
          

        const searchTerm = document.getElementById(searchIdInput).value.toLowerCase();
        const categoryItems = document.querySelectorAll(".sidebarCategory li");
        const categories = document.querySelectorAll(searchSection+" .sidebarCategory");
        const listItems = document.querySelectorAll(searchSection+" .sidebarItem");


        /*reset*/
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
            
            //fts_fuzzy_match(searchTerm, cleanText(itemText))
            const isInSearchTerm = itemText.includes(searchTerm);
            item.style.display = isInSearchTerm ? "block" : "none";
        });

        /* hide empty categories */
        categories.forEach(category => {
            const subItems = category.querySelectorAll("li");
            const areAllHidden = Array.from(subItems).every(subItem => subItem.style.display === "none");
            category.style.display = areAllHidden ? "none" : category.style.display;
        });
        
        sdExpandAll(1);
        resolve(searchTerm);
    });
}

//PREVIEW
function safeObjectKeys(obj) {
    try {
      return Object.keys(obj);
    } catch (error) {
      //console.error('Error while trying to get object keys:', error);
      return [];
    }
  }

function createNodePreview(nodeID) {
    let description = "";
    let rows = "";
    let last_rows = "";
    const data = LiteGraph.registered_node_types;


    try{
     description = data[nodeID].nodeData.description;
    }catch(err){
     description = "";
    }
    try{
    let inputs = data[nodeID].nodeData.input; //divided between optional and required
    let outputs_name = data[nodeID].nodeData.output_name;
    let outputs = data[nodeID].nodeData.output;
    //console.log(category, inputs, outputs);
    //create array with objectkeys from input and output
    const inputArray = [];
    const outputArray = [];
  
    const inputKeysRequired =  safeObjectKeys(inputs.required)
    const inputKeysOptional =  safeObjectKeys(inputs.optional)

    
        for (let i = 0; i < inputKeysRequired.length; i++) {
            try{
            let thirdV = null;
            let secondV = inputs.required[inputKeysRequired[i]][0];
            
                if (Array.isArray(secondV)){
                    //array
                    secondV = inputs.required[inputKeysRequired[i]][0][0];
                    thirdV = inputs.required[inputKeysRequired[i]][0][0];
                }
               if (inputs.required[inputKeysRequired[i]][1]!=undefined){  
                
                    //object
                    thirdV = inputs.required[inputKeysRequired[i]][1].default;
                }

             
            inputArray.push([inputKeysRequired[i],secondV,thirdV]);
            }catch(err){
                console.log("error",err)
            }
         }
      
    try{
        for (let i = 0; i < inputKeysOptional.length; i++) {
            let thirdV = null;
            let secondV = inputs.optional[inputKeysOptional[i]][0];
                if (Array.isArray(secondV)){
                    //array
                    secondV = inputs.optional[inputKeysOptional[i]][0][0];
                    thirdV = inputs.optional[inputKeysOptional[i]][0][0];
                }
               if (inputs.optional[inputKeysOptional[i]][1]!=undefined){  
                
                    //object
                    thirdV = inputs.optional[inputKeysOptional[i]][1].default;
                }
            inputArray.push([inputKeysOptional[i],secondV,thirdV]);
         }
      
    }catch(err){
         console.log(err)
    }


   
  
    for (let i = 0; i < outputs.length; i++) {
        if (outputs_name[i] != undefined) {
            outputArray.push([outputs[i],outputs_name[i]]);
        }
        else{
        outputArray.push(outputs[i],outputs[i]);
        }

   
    }





    
    let length_loop = outputArray.length;
    if (inputArray.length> outputArray.length){ 
        length_loop = inputArray.length;
    }
    for (let i = 0; i < length_loop; i++) {
      
        const inputList= inputArray[i] ? inputArray[i] : null;
        const outputList= outputArray[i] ? outputArray[i] : null;
        let inputName = "";
        let inputType = "";
        let inputValue = null;
        let outputType = "";
        let outputName = "";

        if (inputList != null){
            inputName = inputList[0];
            inputType = inputList[1];
            inputValue = inputList[2];
        }else
        {
            inputName = "";
            inputType = "sb_hidden";
            inputValue = null;
        }
        if (outputList != null){
            outputType = outputList[0];
            outputName = outputList[1];
   
        }else
        {
            outputType = "sb_hidden";
            outputName = "";
        }


        if (inputValue != null){
            if (inputType == "STRING"){
                last_rows += `<div class="sb_row sb_row_string nodepreview long_field">
        <div class="sb_col sb_arrow"></div>
        <div class="sb_col">${inputName}</div>
        <div class="sb_col  middle-column"></div>
        <div class="sb_col sb_inherit">${inputValue}</div>
        <div class="sb_col sb_arrow"></div>
        </div>`;
            }else{
            last_rows += `<div class="sb_row nodepreview long_field">
        <div class="sb_col sb_arrow">&#x25C0;</div>
        <div class="sb_col ">${inputName}</div>
        <div class="sb_col  middle-column"></div>
        <div class="sb_col sb_inherit">${inputValue}</div>
        <div class="sb_col sb_arrow">&#x25B6;</div>
        </div>`;
            }
        inputType = "sb_hidden";
        inputName = "";
        }
       

            rows += `<div class="sb_row nodepreview">
        <div class="sb_col"><div class="sb_dot ${inputType}"></div></div>
        <div class="sb_col">${inputName}</div>
        <div class="sb_col middle-column"> </div>
        <div class="sb_col sb_inherit">${outputName}</div>
        <div class="sb_col "><div class="sb_dot ${outputType}"></div></div>
        </div>`;
        

      

       
    }
    //console.log( inputArray,outputArray);
    
   ////create preview
   //const nodePreview = document.createElement("div");
   //nodePreview.classList.add("node_preview");
   //nodePreview.id = nodeID;

    }catch(err){
        rows = `<div class="sb_row nodepreview">
        <div class="sb_col"></div>
        <div class="sb_col"></div>
        <div class="sb_col middle-column sb_preview_badge ">NOT AVAILABLE</div>
        <div class="sb_col sb_inherit"></div>
        <div class="sb_col "></div>
        </div>`
        last_rows = ``
    }
return [`<div class="sb_table">
       <div class="node_header"><div class="sb_dot headdot"></div>${nodeID}</div>
       <div class="sb_preview_badge">PREVIEW</div>
       ${rows}
       ${last_rows}
       </div>`,description];
}


//change view
function switchTab(tabId) {
    if (tabId != null) {
    const tabContents = document.querySelectorAll('.content_sidebar');
    const tabHead = document.querySelectorAll('.sidebar-header');

    if (tabId=="content_sidebar_home"){
        const tabIdHead = document.getElementById("sidebar-header");
        tabIdHead.classList.remove('sb_hidden');
    }
    else{
        tabHead.forEach(content => {
            content.classList.add('sb_hidden');
        })
    }
    // Hide all tabs
    tabContents.forEach(content => {
        content.classList.add('sb_hidden');
    });

    

    // Show the content of the clicked tab
    document.getElementById(tabId).classList.remove('sb_hidden');

    setVar('sb_current_tab', tabId);
    }
}



// PINNED ITEMS
function savePinnedItems(pinnedItems) {
    const pinnedItemsString = JSON.stringify(pinnedItems);
    //setVar('pinnedItems', pinnedItemsString, 9999);
    updateConfiguration('sb_pinnedItems',pinnedItemsString)
}


async function loadPinnedItems() {

    const pinnedItemsString = await getConfiguration('sb_pinnedItems');//getVar('pinnedItems');

    if (pinnedItemsString) {
        return JSON.parse(pinnedItemsString);
    }
    return [];
}


function migrationSettings() {
    const oldSettingsList = ["pinnedItems","Comfy.Settings.sidebar_noderadius_settings","Comfy.Settings.sidebar_barbottom","Comfy.Settings.sidebar_bartop","Comfy.Settings.sidebar_blur_settings","Comfy.Settings.sidebar_opacity_settings","Comfy.Settings.sidebar_font_settings","Comfy.Settings.sidebar_node_settings"];
    const newSettingsList = ["sb_pinnedItems","sb_noderadius","sb_barbottom","sb_bartop","sb_blur","sb_opacity","sb_font","sb_node"];

    oldSettingsList.forEach((setting, index) => {
        try{
        const newSetting = newSettingsList[index];
        const oldSettingValue = getVar(setting);
        if (oldSettingValue) {
            if (setting != "pinnedItems") {
                updateConfiguration(newSetting, parseFloat(oldSettingValue.replace('"',"").replace('"',"")));
            } else {
                updateConfiguration(newSetting, oldSettingValue); 
            }
           renameVar(setting, "bk_"+setting)
        }
        }catch(err){
            console.log(err)
        }
    })
   // updateConfiguration('sb_pinnedItems',pinnedItemsString) ;
}