 
  let new_menu_options = [];
  let new_submenu_options = [];
  let new_menu_options_callback = [];
  let new_submenu_options_callback = [];
  const settingsStyle = ` 
    
    #comfy-settings-dialog input{
        background: var(--comfy-input-bg);
        color: var(--input-text);
        border: 1px solid var(--border-color);
        padding: 5px;
    }
    #comfy-settings-dialog tr > td:first-child {
        text-align: left;
    }
    #comfy-settings-dialog select{
    background: var(--bg-color);
    color: var(--drag-text);
    padding: 5px;
    }
    
    #comfy-settings-dialog {
    
        background: var(--bg-color);
    }
    
    #comfy-settings-dialog::-webkit-scrollbar {
        margin-top: 0.5rem;
        height: 1rem;
        width: .6rem;
        top: 10px;
        background-color: transparent;
    }
    
    #comfy-settings-dialog::-webkit-scrollbar:horizontal {
        height: .5rem;
        width: 2.5rem
    }
    
    #comfy-settings-dialog::-webkit-scrollbar-track {
        background-color: var(--comfy-input-bg);
        border-radius: 9999px
    
    }
    
    #comfy-settings-dialog::-webkit-scrollbar-thumb {
        --tw-border-opacity: 1;
        background-color:  var(--border-color);
        border: 0;
        border-radius: 9999px;
    
    }
    
    #comfy-settings-dialog::-webkit-scrollbar-thumb:hover {
        --tw-bg-opacity: 1;
        background-color: var(--border-color);
    
    }
    
    .comfy-table td, .comfy-table th {
        border: 0px solid var(--border-color);
        padding: 8px;
    }
    
    
    ` 
    async function api_get(url) {
        var response = await api.fetchApi(url, { cache: "no-store" })
        return await response.json()
    }
    function getDynamicCSSRule(selector, property) {
        const styleId = 'dynamic-styles';
        const customStyle = document.getElementById(styleId);
    
        if (!customStyle) {
            return null; 
        }

        const existingRule = Array.from(customStyle.sheet.cssRules).find(rule => rule.selectorText === selector);
    
        if (existingRule) {
            return existingRule.style.getPropertyValue(property);
        }
    
        return null; 
    }
    
    
    function addDynamicCSSRule(selector, property, value) {
        const styleId = 'dynamic-styles'; 
        let customStyle = document.getElementById(styleId);
    
        if (!customStyle) {
            customStyle = document.createElement('style');
            customStyle.type = 'text/css';
            customStyle.id = styleId;
            document.head.appendChild(customStyle);
        }
    
        const existingRule = Array.from(customStyle.sheet.cssRules).find(rule => rule.selectorText === selector);
        if (existingRule) {
            existingRule.style.setProperty(property, value, 'important');
        } else {
    
            customStyle.sheet.insertRule(`${selector} { ${property}: ${value} !important; }`, customStyle.sheet.cssRules.length);
        }
    }

    function addJavascriptVar(name, value) {
        const scripta = document.createElement('script');
        scripta.type = 'text/javascript';
        scripta.innerHTML = "var "+name+" = "+value;

        document.head.appendChild(scripta);
        
    }
function getVar(name) {
    var varValue = localStorage.getItem(name);
    if (varValue === null) {
        if (name=="pinnedItems") {
            //get cookie pinnedItems
            var cookies = document.cookie.split('; ');
            cookies.forEach(cookie => {
                const [cookieName, cookieValue] = cookie.split('=');
                if (cookieName === name) {
                   
                    setVar(name, cookieValue) 
                    
                }
            })
            //delete cookie pinnedItems
            document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
        else {
            return null;
        }

   }else {
    return varValue;
   }

    return null;
}

function setVar(name, value) {
    /*migration to localstorage*/
    localStorage.setItem(name, value);

}
function removeVar(name) {
    localStorage.removeItem(name);
}

function renameVar(oldName, newName) {
    const oldValue = getVar(oldName);
    setVar(newName, oldValue);  
    removeVar(oldName);

}

function getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top,
        left: rect.left 
    };
}

function reverseAndAppend(originalName) {
    let words;
    let lastWord;
    let reversedWords;
    let reversedString;
    let finalName;
    if (originalName.includes(' ')) {
         const words = originalName.split(' ');
    
     lastWord = words.pop();


    reversedWords = words.reverse();
    reversedString = reversedWords.join(' ');

    finalName = originalName + ' ' + reversedString;
    
    return finalName;

    } else {


        words = originalName.split(/(?=[A-Z])/); 
        lastWord = words.pop();
        reversedWords = words.reverse();
        reversedString = reversedWords.join('');
        finalName = originalName + reversedString;
          
        return finalName;

    }
}
function cleanText(text) {
    let cleanedText = text.replace(/[^a-zA-Z0-9\s\n\-]/g, '');
    cleanedText = cleanedText.replace(/\s+/g, ' ');
    cleanedText = cleanedText.replace(/\n/g, '');
    return cleanedText;
}

function calcSBTop() {
    let sb = document.getElementById('sidebar');
    let sbtop = window.getComputedStyle(sb).getPropertyValue('top').replace('px', '');
    if (getVar('Comfy.Settings.Comfy.UseNewMenu') === '"Top"') {
        
        return parseInt(sbtop) + 35; 
    }
    else{
        return sbtop;
    }
}
//CONTEXT MENU
function createContextMenu(event, subMenus,settingsData) {
    event.preventDefault();
    hideAllSubMenus();
    
    const sbcontextMenu = document.getElementById('customMenu');
    const menuOptions = document.getElementById('menu-options');

    // Clear existing menu items
    menuOptions.innerHTML = '';
   
    // Populate main options
    settingsData.menuctx_options.forEach((option, index) => {
        const li = document.createElement('li');
        li.textContent = option;
        li.addEventListener('mouseenter', () => {
            hideAllSubMenus();
            showSubMenu(subMenus[index], li);
        });
        try {
            

        if (settingsData.menuctx_opt_callback[index].indexOf(".") !== -1) {

            // Handle sub menu option
            var mainfunc = settingsData.menuctx_opt_callback[index].split(".")[0];
            var subfunc = settingsData.menuctx_opt_callback[index].split(".")[1];
            if (typeof (window[mainfunc][subfunc]) === 'function') {
                
            
                li.addEventListener('click', () => {
                    // Handle sub menu click
                    window[mainfunc][subfunc](event);
                });
            
            }
        }
        else{

        if (typeof (window[settingsData.menuctx_opt_callback[index]]) === 'function') {
            li.addEventListener('click', () => {
                // Handle main option click
                window[settingsData.menuctx_opt_callback[index]](event); 
            
            }); 
        }
    }
        } catch (error) {
            console.log(error);
            
        }
        menuOptions.appendChild(li);
    });

    // Show context menu
    sbcontextMenu.style.display = 'block';
    let sbtop = calcSBTop();
    
    sbcontextMenu.style.top = (event.clientY - sbtop) + 'px';
    if (sbPosition === "left") {
    
    sbcontextMenu.style.left = event.clientX + 'px';
    } else {
       // const sidebar_width =  getVar("sidebarWidth");
        //console.log(parseInt(sidebar_width))
        //console.log(event)
        //console.log(event.clientX - parseInt(sidebar_width) )
        //temp bugfix
    sbcontextMenu.style.left =  event.layerX  + 'px';
    }
    
    // Hide context menu on body click
    document.body.addEventListener('click', hideContextMenu);
}

function showSubMenu(subMenu, element) {
    try{
        if (subMenu) {
            subMenu.style.display = 'block';

            const rect = element.getBoundingClientRect();
            subMenu.style.top = element.offsetTop + 'px';

            subMenuVisible = true;
        }
    } catch (error) {
        console.log(error);
    }
}

function hideAllSubMenus() {
    const subMenus = document.querySelectorAll('.sub-menu');
    subMenus.forEach(subMenu => {
        subMenu.style.display = 'none';
    });
    subMenuVisible = false;
}

function hideContextMenu() {
    const sbcontextMenu = document.getElementById('customMenu');
    sbcontextMenu.style.display = 'none';
    document.body.removeEventListener('click', hideContextMenu);
}

let subMenuVisible = false;
let lastTargetClicked = null;

async function setContextMenu(settingsData,class_menu_item,main=0,exluded_class=null,included_class = null) {
    

   if (main==1){
        settingsData.menuctx_options = settingsData.menuctx_options.concat(new_menu_options);
        settingsData.menuctx_subOptions = settingsData.menuctx_subOptions.concat(new_submenu_options);
        settingsData.menuctx_opt_callback = settingsData.menuctx_opt_callback.concat(new_menu_options_callback);
        settingsData.menuctx_sub_opt_callback = settingsData.menuctx_sub_opt_callback.concat(new_submenu_options_callback);
   }
   const sbcontextMenu = document.getElementById('customMenu');
    const menuOptions = document.createElement("ul");
    menuOptions.id = "menu-options";
    sbcontextMenu.appendChild(menuOptions);

    const subMenus = [];
    for (let i = 0; i < settingsData.menuctx_subOptions.length; i++) {
        
        
      
        const subMenu = document.createElement("ul");
        subMenu.id = `sub-menu-op${i + 1}`;
        subMenu.classList.add("sub-menu");
        if (settingsData.menuctx_subOptions[i].length == 0) {
            subMenu.classList.add("cat_empty");
        }
        
        sbcontextMenu.appendChild(subMenu);
        subMenus.push(subMenu);

        for (let j = 0; j < settingsData.menuctx_subOptions[i].length; j++) {
            const li = document.createElement("li");
            li.textContent = settingsData.menuctx_subOptions[i][j];
            subMenu.appendChild(li);
            try {
          
                if (settingsData.menuctx_sub_opt_callback[i][j].indexOf(".") !== -1) {

                    // Handle sub menu option
                    var mainfunc = settingsData.menuctx_sub_opt_callback[i][j].split(".")[0];
                    var subfunc = settingsData.menuctx_sub_opt_callback[i][j].split(".")[1];
                    if (typeof (window[mainfunc][subfunc]) === 'function') {
                        
                    
                        li.addEventListener('click', () => {
                            // Handle sub menu click
                        
                            window[mainfunc][subfunc](lastTargetClicked,settingsData.menuctx_subOptions[i][j]);

                        });
                    
                    }
                }
                else{
        
                    if (typeof (window[settingsData.menuctx_sub_opt_callback[i][j]]) === 'function') {
                        li.addEventListener('click', () => {
                            // Handle main option click
                  
                        
                            window[settingsData.menuctx_sub_opt_callback[i][j]](lastTargetClicked,settingsData.menuctx_subOptions[i][j]); 
                        
                        }); 
                    }
            }






            } catch (error) {
                console.log(error);
            }
        }
    
    }
   
   const sidebarItems = document.querySelectorAll(class_menu_item);
//const sb =document.getElementById('panel_home');


for (const sidebarItem of sidebarItems) {
    sidebarItem.addEventListener('contextmenu', (event) => {

        if(!event.target.classList.contains(exluded_class)){

            if (included_class != null && !event.target.classList.contains(included_class)){
                return;
            }
        createContextMenu (event, subMenus,settingsData);
        lastTargetClicked = event;
        }
    });
}

//ContextMenu
//sb.addEventListener("contextmenu", function(event) {
//    event.preventDefault();
//
//    const customMenu = document.getElementById("customMenu");
//    customMenu.style.display = "block";
//    customMenu.style.left = event.pageX + "px";
//    customMenu.style.top = event.pageY + "px";
//});
//
window.addEventListener("click", function(event) {
    const customMenu = document.getElementById("customMenu");
    customMenu.style.display = "none";
});
}


// Function to check for special characters 
function containsSpecialCharacters(name, level=0) {
    // Define a regular expression pattern to match special characters
    if (level == 0) {
        var specialCharacters = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    } else if (level == 1) {
        var specialCharacters = /[\*':"\\|,<>\/?]/g;
    } else{
        var specialCharacters = /['"]/gi;
    }
   
    // Return true if the name contains any special characters, false otherwise
    return specialCharacters.test(name);
}

async function reloadCtxMenu() {
    //load folder name
    var nameRequest = await fetch('sidebar/current');
    var nameFolder = await nameRequest.json();
    
    const cnPath =  `../extensions/${nameFolder}/`

    const response3 = await fetch(cnPath +'settings.json');
    const settingsData = await response3.json();

    setContextMenu(settingsData,"#panel_home .sidebarItem",1);

}

function setNodeStatus(varname,node,status) {
    try{//'sb_categoryNodeStatus'
        const categoryNodeStatus = JSON.parse(localStorage.getItem(varname)) || {};
        categoryNodeStatus[node] = [status];
        localStorage.setItem(varname, JSON.stringify(categoryNodeStatus));
    }catch(err){ }
}

function getNodeStatus(varname,node) {
    try{
        const categoryNodeStatus = JSON.parse(localStorage.getItem(varname)) || {};
        return categoryNodeStatus[node] || "none";
    }catch(err){ }
    return "none";
}

function getNodesStatus() {
    let categoryNodeStatus = JSON.parse(localStorage.getItem(varname)) || {};
    return categoryNodeStatus;
}


// MODAL

function setModalContext(addon=null) {
    if (addon==null) {
            return `
            <h2 class="sb-modal-title">Add New Category</h2>
            <form id="sb-category-form" action="javascript:void(0);">
                <input type="text" autocomplete="off" class="sb-input" id="sb-categoryName" name="sb-categoryName" placeholder="Category Name" required>
                <button type="submit" class="sb-button" onclick="custom_categories.addCategory()">Add Category</button>
            </form>
            <button id="closeModalButton"  class="sb-button">X</button>
            `;
    }
    else {
        return addon
            }
}

function openModal(addon=null) {
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
try{
    // Focus the input field
    inputElement = document.getElementById('sb-categoryName');
    inputElement.focus();
    const length = inputElement.value.length;
    inputElement.setSelectionRange(length, length);

}catch(err){
    
}
}



// Function to close the modal
function closeModal() {
    const modalBackdrop = document.querySelector('.sb-modal-backdrop');
    const modal = document.querySelector('.sb-category-dialog');
    try{
    // Remove the modal from the DOM
    modalBackdrop.parentNode.removeChild(modalBackdrop);
    modal.parentNode.removeChild(modal);
    }
    catch(err){
        console.log(err);
    }
}


function rgbToHex(rgb) {
    // Verifica se il colore è nel formato "rgb()"
    if (rgb.indexOf('rgb') !== -1) {
        // Esegue il parsing dei valori di rosso, verde e blu
        const [r, g, b] = rgb.match(/\d+/g);

        // Converte i valori in esadecimale e li concatena con "#"
        return `#${parseInt(r, 10).toString(16).padStart(2, '0')}${parseInt(g, 10).toString(16).padStart(2, '0')}${parseInt(b, 10).toString(16).padStart(2, '0')}`;
    }
    return rgb; // Se il colore è già nel formato con "#", lo restituisce direttamente
}


function hexToRgb(hex) {
    try{
    // Rimuovi il carattere # se presente
    hex = hex.replace(/^#/, '');

    // Estrai i valori R, G e B
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Restituisci il colore in formato RGB
    return `${r}, ${g}, ${b}`;
    }catch(err){
        console.log(err)
        return "#000000";
    }
}

//click anywhere outside the modal to close it
document.body.addEventListener('click', function(event) {
    const modalBackdrop = document.querySelector('.sb-modal-backdrop');
    const modal = document.querySelector('.sb-category-dialog');
    if (event.target === modalBackdrop) {
        closeModal();
    }
})
 



 
function showSettings() {
    const sb_settingsDiv = document.getElementById("sb_settingsDiv");
    const sb_modal_backdrop = document.getElementById("sb-modal-backdrop-settings");
        sb_settingsDiv.classList.remove('sb_hidden');
        sb_modal_backdrop.classList.remove('sb_hidden');
}



 
function showIESettings(operation) {
    const sb_settingsDiv = document.getElementById("sb_settingsDiv_"+operation);
        sb_settingsDiv.classList.remove('sb_hidden');

}

function isBottomEdgeVisible(el) {

    var rect = el.getBoundingClientRect();
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    if (rect.bottom <= viewportHeight) {
        return true;
    }

    return false;
}

function convertCanvasToOffset(canvas, pos, out) {
    out = out || [0, 0];
    out[0] = pos[0] / canvas.scale - canvas.offset[0];
    out[1] = pos[1] / canvas.scale - canvas.offset[1];
    return out;
};
