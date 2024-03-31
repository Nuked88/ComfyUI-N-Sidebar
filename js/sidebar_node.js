
import { api } from "../../../scripts/api.js"
import { app } from "../../../scripts/app.js";
import { $el } from "../../../scripts/ui.js";
import {fuzzyMatch} from "./fts_fuzzy_match.js";

console.time('execution time');



async function api_get(url) {
    var response = await api.fetchApi(url, { cache: "no-store" })
    return await response.json()
}

let CUSTOM_COLORS;
try {
    const CONFIG_CORE = await api_get("/jovimetrix/config")
    CUSTOM_COLORS = CONFIG_CORE?.user?.default?.color?.theme;
} catch {}

let categorySearchToggle = false;
let defaultSearchToggle = false;


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


function addSidebarStyles() {


    const sidebarStyle = `
    .litegraph .dialog {
        z-index: 100 !important;
    }

        .sidebar {
            position: absolute;
            top: 0;
            left: -250px;
            left: -250px;
            width: fit-content;
            height: calc(100% - 19px);
            color: var(--drag-text);
            transition: left 0.3s ease;
			z-index: 2;
			padding-top: 19px;
            left: 0;
            user-select: none;


        }

        .sidebar ul {
            list-style-type: none;
            /* border-bottom: 6px solid rgb(from var(--comfy-input-bg) r g b / 60%);*/
         
            padding-left: 5px;
            padding-right: 5px;
            margin-bottom: 8px;
            padding-top: 10px;
        }
        .sidebar li {
			padding: 10px;
			cursor: pointer;
			user-select: none;
            color: var(--input-text);
		}

        .content_sidebar {
     
            background:rgb(from var(--comfy-menu-bg) r g b / 100%);  
            overflow-y: scroll;
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
            background: var(--comfy-input-bg);
            color: var(--input-text);
            line-height: 1.4;
            border: 1px solid var(--border-color);
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
            color: var(--input-text);
            font-size: x-large;
            cursor: pointer;
            opacity: 0.5;
            user-select: none;
            line-height: 1.4;
        }


        .clearIcon:hover{
            opacity: 1.0;
        }

        .searchCategoryIcon{
            right: 0px;
            padding: 3px;
            font-size: larger;
            background: var(--border-color);
            color:var(--drag-text);
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
            background-color:var(--comfy-input-bg);  
            opacity:1;
            border-radius: 8px;
            padding-top: 11px;
            font-size: 15px;
            padding-bottom: 8px;
        }
        #sidebarCustomNodes{
            list-style-type: none;
            font-family: 'Open Sans', sans-serif;
            text-transform: capitalize;
            margin: 0px;
            background-color: transparent;
            opacity: 1;
            border-radius: 8px;
            font-size: 15px;
            padding-left: 0;
            padding-right: 0px;
            padding-top: 0px;
            padding-bottom: 40px;
        }
      
        .sidebarItem:hover{
            background:color-mix(in srgb, currentColor 15%, transparent);
        }
        .sidebarItem {
            list-style-type: none;
            font-family: 'Open Sans',sans-serif;
            text-transform: capitalize;
            margin: 2px;
            background: color-mix(in srgb,  var(--border-color) 35%, transparent) ; 
            opacity:1; 
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
            background-color: var(--comfy-menu-bg);
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

        .previewButton{
            background-color: transparent;
            border: 0;
            position: absolute;
            right: 35px;
        }

        .pinned{
            fill:    var(--descrip-text) !important;
            opacity: 1 !important;
        }
        .svg_class{
            width: 24px;
            height: 24px;
            fill: var(--border-color);
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
            fill: var(--border-color);

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

            background: var(--comfy-input-bg);
            border-radius: 3px;
            padding-left: 6px;
            padding-right: 6px;
            display: block;
            width: calc(100% - 20px);
            text-align: center;
            user-select: none;
            cursor: pointer;
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
            fill: var(--input-text);
            cursor: pointer;
        }
    
        .sb_dot {
            width: 8px; 
            height: 8px; 
            border-radius: 50%;
            background-color: grey; 
          }
          .node_header {
            line-height: 1;
            padding: 8px 13px 7px;
            background: var(--comfy-input-bg);
            margin-bottom: 5px;
            font-size: 15px;
            text-wrap: nowrap;
            overflow: hidden;
          }
          .headdot {
            width: 10px;
            height: 10px;
            float: inline-start;
            margin-right: 8px;
          }
          .sb_hidden {
            display: none;
          }
          
          .IMAGE {
            background-color: #64b5f6; 
          }
          
          .VAE {
            background-color: #ff6e6e; 
          }
          
          .LATENT {
            background-color: #ff9cf9; 
          }

          .MASK{
            background-color: #81c784;
          }

          .CONDITIONING{
            background-color: #ffa931;
          }

          .CLIP{
            background-color: #ffd500;
          }

          .MODEL{
            background-color: #b39ddb;
          }

          .CONTROL_NET{
            background-color: #a5d6a7;
          }


        #previewDiv {
            position: absolute;
            background-color: var(--comfy-menu-bg);
            font-family: 'Open Sans', sans-serif;
            font-size: small;
            color: var(--descrip-text);
            border: 1px solid var(--descrip-text);
            display: none;
            min-width: 300px;
            width: min-content;
            height: fit-content;
            z-index: 9999;
            border-radius: 12px;
            overflow: hidden;
            font-size: 12px;
            padding-bottom: 10px;
            
        }
        #previewDiv .sb_description {
            margin: 10px;
            padding: 6px;
            background: var(--border-color);
            border-radius: 5px;
            font-style: italic;
            font-weight: 500;
            font-size: 0.9rem;
        }
        .sb_table {
            display: grid;
           
            grid-column-gap: 10px; /* Spazio tra le colonne */
            width: 100%; /* Imposta la larghezza della tabella al 100% del contenitore */
        }
        
        .sb_row {
            display: grid;
            grid-template-columns: 10px 1fr 1fr 1fr 10px; 
            grid-column-gap: 10px; 
            align-items: baseline;
            padding-left: 9px;
            padding-right: 9px;
        }
        .sb_row_string{
            grid-template-columns: 10px 1fr 1fr 10fr 1fr; 
        }
        .sb_col {
            border: 0px solid #000;
            display: flex;
            align-items: flex-end;
            flex-direction: row-reverse;
            flex-wrap: nowrap;
            align-content: flex-start;
            justify-content: flex-end;
        }
        .sb_inherit{
            display: inherit;
        }
        .long_field{
            background: var(--bg-color);
            border: 2px solid var(--border-color);
            margin: 5px 5px 0 5px;
            border-radius: 10px;
            line-height: 1.7;
        }
   
        .sb_arrow{
            color: var(--fg-color);
        }
        .sb_preview_badge{
            text-align: center;
            background:var(--comfy-input-bg);
            font-weight: bold;
            color: var(--error-text);   
        }

        #sb_scrollToTopButton {
            position: absolute;
            bottom: 2px; 
            right: 34px; 
            cursor: pointer;
            display: none;

            border-radius: 20%;
            background: var(--comfy-menu-bg);
            padding: 4px;
            border: 1px solid #4c4c4c;
          }
          
          #sb_scrollToTopButton svg {
            width: 20px; 
            height: 20px; 
            fill: var(--descrip-text);
          }


        .custom-menu {
            display: none;
            position: absolute;
            background-color: #fff;
            border: 1px solid #ccc;
            padding: 5px 0;
            list-style: none;
            z-index: 1000;
        }
        
        .custom-menu ul {
            margin: 0;
            padding: 0;
        }
        
        .custom-menu li {
            display: block;
        }
        
        .custom-menu li a {
            display: block;
            padding: 8px 12px;
            text-decoration: none;
            color: #333;
        }
        
        .custom-menu li a:hover {
            background-color: #f0f0f0;
        }




    `;

    const styleElement = $el("style", {
        parent: document.head,
        textContent: sidebarStyle
    });
}

/* Utils */
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
        existingRule.style[property] = value;
    } else {

        customStyle.sheet.insertRule(`${selector} { ${property}: ${value} !important; }`, customStyle.sheet.cssRules.length);
    }
}

function getVar(name) {
    var varValue = localStorage.getItem(name);
    if (varValue === null) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            /*migration to localstorage*/
            localStorage.setItem(name, cookieValue);

            return cookieValue;
            
        }
    }
   }else {
    return varValue;
   }

    return null;
}

function setVar(name, value, days) {
    /*migration to localstorage*/
    localStorage.setItem(name, value);

    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
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
/* End Utils */

function getSidebarItemIds() {
    const sidebarItems = document.querySelectorAll("#sidebarBookmarks .sidebarItem");
    const itemIds = [];

    sidebarItems.forEach(function(item) {
        itemIds.push(item.id);
    });

    return itemIds;
}
function postPinned() {


    var dragItem = null;
    const categoriesList = document.getElementById("content_sidebar");
    const pinnedElement= document.getElementById("sidebarBookmarks");
    pinnedElement.querySelectorAll(".sidebarItem").forEach(function(item) {
        
        item.addEventListener("dragstart", function(event) {
            dragItem = event.target;
        });

        item.addEventListener('mouseover', function() {
           
            if (this.classList.contains('sidebarItem') && this.tagName === 'LI') {
            let descriptionDiv = "";
            const itemPosition = getElementPosition(this);
            let previewDivTop = 0;
            const [previewContent,node_description] = createNodePreview(item.id);
            if (node_description) {
            descriptionDiv = "<div class='sb_description'>" + node_description + "</div>";
            }
            previewDiv.innerHTML = previewContent+descriptionDiv;
            previewDiv.style.display = 'block';
            const correction_offset = 45;
    
            if (itemPosition.top - this.offsetHeight >=0 && itemPosition.top + previewDiv.offsetHeight < document.body.offsetHeight) {
               previewDivTop = itemPosition.top - this.offsetHeight
               
            }else if (itemPosition.top - this.offsetHeight -previewDiv.offsetHeight <=0){
                previewDivTop = 0 +correction_offset;
    
                
            }
            else {
         
                previewDivTop =   (itemPosition.top + this.offsetHeight) - previewDiv.offsetHeight;
            }
            const previewDivLeft = itemPosition.left + this.offsetWidth + correction_offset;
        
            previewDiv.style.top = `${previewDivTop}px`;
            previewDiv.style.left = `${previewDivLeft}px`;
      
      } });
    
        item.addEventListener('mouseout', function() {
            previewDiv.style.display = 'none';
        })









    });

    pinnedElement.addEventListener("dragover", function(event) {
        event.preventDefault();
    });

    pinnedElement.addEventListener("drop", function(event) {
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
    document.cookie = setVar("sidebarWidth", width, 3000);
}


function restoreSidebarWidth() {
    let width_sidebar = "auto";
    let cookieValue = getVar("sidebarWidth");
    if (cookieValue) {
        width_sidebar = cookieValue;
    }
    return width_sidebar;
    
}


function savePinnedItems(pinnedItems) {
    const pinnedItemsString = JSON.stringify(pinnedItems);
    setVar('pinnedItems', pinnedItemsString, 9999);
}


function loadPinnedItems() {
    const pinnedItemsString = getVar('pinnedItems');
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
        postPinned();
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


    // delete pinned
    const sidebarCategories = sidebarBookmarks.querySelectorAll(".sidebarItem");
    sidebarCategories.forEach(category => { category.remove();   });
 

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
  
    const category = data[nodeID].category;
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
        <div class="sb_col ">${inputName}</div>
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
function toggleCollapsePinned() {

    // expand/collapse pinned
    const sidebarBookmarks = document.getElementById('sidebarBookmarks');
    
    if (sidebarBookmarks.style.display === 'none') {
        sidebarBookmarks.style.display = 'block';
        setVar('sb_pinned_collapsed', 'block', 3000);
    } else {
        sidebarBookmarks.style.display = 'none';
        setVar('sb_pinned_collapsed', 'none', 3000);
    }

}


function toggleCollapseCustom() {

    if (sidebarCustomNodes.style.display === 'none') {
        sidebarCustomNodes.style.display = 'block';
        setVar('sb_custom_collapsed', 'block', 3000);
    } else {
        sidebarCustomNodes.style.display = 'none';
        setVar('sb_custom_collapsed', 'none', 3000);
    }
    
}
async function  createCategoryList() {
    const data = LiteGraph.registered_node_types;
    let categories = {};
    const pinnedItems = loadPinnedItems();
    const categoriesList = document.getElementById("content_sidebar");
    const itemSearchInput = document.getElementById("searchInput");
   
    itemSearchInput.addEventListener("input", updateList);

    const clearIcon = document.querySelector(".clearIcon");
    const searchCategoryIcon = document.querySelector(".searchCategoryIcon");
    clearIcon.addEventListener("click", async function () {
        try {
    
            itemSearchInput.value = "";
            const searchTerm =  updateList();
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


 async function updateList() {

  
    return new Promise((resolve, reject) => {
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
            }   else{
                searchable = category;
            }

            
            if (defaultSearchToggle) {
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

                    const [accepted,rank]  = fuzzyMatch(itemSearchString, reverseAndAppend(cleanText(searchable)));
                    

                            
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
 if(itemSearchString != ""){
    if (!defaultSearchToggle)  {

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
        // order categories alphabetically
        const sortedCategoriesData = {};
        const sortedCategories = Object.keys(categories).sort();
        sortedCategories.forEach(category => {
            
            sortedCategoriesData[category] = categories[category];

        });

        categories = sortedCategoriesData;
    

        
    }

    
 
    renderList();

    resolve(itemSearchString);

});
}

   
    async function renderList() {
        
        return new Promise((resolve, reject) => {
            const pinnedItems = loadPinnedItems();
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
   
    sidebarItems_cat.forEach(item => {
  
        item.addEventListener('mouseover', function() {
           
            if (this.classList.contains('sidebarItem') && this.tagName === 'LI') {
            let descriptionDiv = "";
            const itemPosition = getElementPosition(this);
            let previewDivTop = 0;
            const [previewContent,node_description] = createNodePreview(item.id);
            if (node_description) {
            descriptionDiv = "<div class='sb_description'>" + node_description + "</div>";
            }
            previewDiv.innerHTML = previewContent+descriptionDiv;
            previewDiv.style.display = 'block';
            const correction_offset = 45;

            if (itemPosition.top - this.offsetHeight >=0 && itemPosition.top + previewDiv.offsetHeight < document.body.offsetHeight) {
               previewDivTop = itemPosition.top - this.offsetHeight
               
            }else if (itemPosition.top - this.offsetHeight -previewDiv.offsetHeight <=0){
                previewDivTop = 0 +correction_offset;

                
            }
            else {
         
                previewDivTop =   (itemPosition.top + this.offsetHeight) - previewDiv.offsetHeight;
            }
          
            const previewDivLeft = itemPosition.left + this.offsetWidth + correction_offset;
        
            previewDiv.style.top = `${previewDivTop}px`;
            previewDiv.style.left = `${previewDivLeft}px`;
      
      } });

        item.addEventListener('mouseout', function() {
            previewDiv.style.display = 'none';
        })

        });

        categoriesList.addEventListener('scroll', function() {
            previewDiv.style.display = 'none';
        });

        window.addEventListener('click', function(event) {

            if (!event.target.classList.contains('sidebarItem')) {
            previewDiv.style.display = 'none';

            }
        });


       
        resolve();
    });
    }
    let udata  = await updateList();

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
    <label class="sb_label" id="sb_label_pinned">PINNED</label>
	<ul id="sidebarBookmarks"></ul>
    <label class="sb_label" id="sb_label_custom">CUSTOM NODES<button class="expand_node" >
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
    <ul id="sidebarCustomNodes"></ul>
	</div>
	<div class="dragHandle" id="dragHandle"></div>
    <div id ="switch_sidebar">☰</div>
    <div id="previewDiv"></div>
    <a href="#" id="sb_scrollToTopButton">
    <svg fill="#000000" height="800px" width="800px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 330 330" xml:space="preserve">
<path id="XMLID_224_" d="M325.606,229.393l-150.004-150C172.79,76.58,168.974,75,164.996,75c-3.979,0-7.794,1.581-10.607,4.394
	l-149.996,150c-5.858,5.858-5.858,15.355,0,21.213c5.857,5.857,15.355,5.858,21.213,0l139.39-139.393l139.397,139.393
	C307.322,253.536,311.161,255,315,255c3.839,0,7.678-1.464,10.607-4.394C331.464,244.748,331.464,235.251,325.606,229.393z"/>
</svg>
  </a>
    <div id="customMenu" class="custom-menu">
	

    
    <ul>
        <li><a href="#">Option 1</a></li>
        <li><a href="#">Option 2</a></li>
        <li><a href="#">Option 3</a></li>
    </ul></div> 
</div>
    `;

    const canvas = $el("sidebar", {
        parent: document.body,
        innerHTML: sidebarHtml
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


    pinnedLabel.addEventListener('click', function() {
        toggleCollapsePinned();
    });
   



  
}




function toggleSHSB() {
    const side_bar = document.getElementById('content_sidebar');
    const search_bar = document.getElementById('searchInput');
        
    const clearIcon = document.querySelector(".clearIcon");
    const searchCategoryIcon = document.querySelector(".searchCategoryIcon");
    search_bar.classList.toggle('closed');
    side_bar.classList.toggle('closed');
    clearIcon.classList.toggle('closed');
    searchCategoryIcon.classList.toggle('closed');
    if (side_bar.classList.contains('closed')) {
        setVar("sb_minimized", true, 3000);
    }else {
        setVar("sb_minimized", false, 3000);
    }
   
}


//Shortcuts

function handleKeyPress(event) {

    if (event.altKey && event.key.toLowerCase() === "x") {
        //toggle sidebar if it's closed
        const side_bar = document.getElementById('content_sidebar');
        if (side_bar.classList.contains('closed')) {
            toggleSHSB();
        }
        //focus on searchInput
        searchInput.focus();
        

          }
    if (event.altKey && event.key.toLowerCase() === "z") {
        toggleSHSB()
    }
}

function setContextMenu() {
const sb =document.getElementById('content_sidebar');

//ContextMenu
sb.addEventListener("contextmenu", function(event) {
    event.preventDefault();

    const customMenu = document.getElementById("customMenu");
    customMenu.style.display = "block";
    customMenu.style.left = event.pageX + "px";
    customMenu.style.top = event.pageY + "px";
});

window.addEventListener("click", function(event) {
    const customMenu = document.getElementById("customMenu");
    customMenu.style.display = "none";
});
}

//Settings
function settingsSetup() {

    app.ui.settings.addSetting({
        id: "0_sidebar_settings",
        name: "[Sidebar] Better ComfyUI Settings Style",
        type: "boolean",
		defaultValue: false,
        onChange(value) {
            let styleElement;
            if (value) {
                styleElement = $el("style", {
                    id: "sb-settings-style",
                    parent: document.head,
                    textContent: settingsStyle
                });
            } else {
              try{ 
                document.getElementById("sb-settings-style").remove();
              } catch(e) {
                  
              }
            }
        },
    });
        app.ui.settings.addSetting({
        id: "0_sidebar_default_search",
        name: "[Sidebar] Use Default Search",
        type: "boolean",
		defaultValue: false,
        onChange(value) {
            defaultSearchToggle = value;
        },
    });
    
    app.ui.settings.addSetting({
        id: "sidebar_font_settings",
        name: "[Sidebar] Font Size",
        defaultValue: "13",
        type: "slider",
        attrs: {
            min: 5,
            max: 30,
            step: 1,
        },
        onChange(value) {
            addDynamicCSSRule('.sidebarCategory, #sidebarBookmarks', 'font-size', value+'px');
        },
    });

    app.ui.settings.addSetting({
        id: "sidebar_node_settings",
        name: "[Sidebar] Node Size",
        defaultValue: "10",
        type: "slider",
        attrs: {
            min: 2,
            max: 40,
            step: 1,
        },
        onChange(value) {
            addDynamicCSSRule('.sidebar li', 'padding', value+'px');
        },
    });


    app.ui.settings.addSetting({
        id: "sidebar_bartop",
        name: "[Sidebar] Space Top",
        defaultValue: "19",
        type: "slider",
        attrs: {
            min: 0,
            max: 300,
            step: 1,
        },
        onChange(value) {
            //addDynamicCSSRule('.sidebar', 'height', 'calc(100% - '+value+'px');
            addDynamicCSSRule('.sidebar', 'padding-top', value+'px');
        }
    });

    app.ui.settings.addSetting({
        id: "sidebar_barbottom",
        name: "[Sidebar] Space Bottom",
        defaultValue: "19",
        type: "slider",
        attrs: {
            min: 0,
            max: 300,
            step: 1,
        },
        onChange(value) {
            addDynamicCSSRule('.sidebar', 'height', 'calc(100% - '+value+'px');
            
        }
    });
    app.ui.settings.addSetting({
        id: "sidebar_noderadius_settings",
        name: "[Sidebar] Node Radius Border",
        defaultValue: "9",
        type: "slider",
        attrs: {
            min: 0,
            max: 20,
            step: 1,
        },
        onChange(value) {
           addDynamicCSSRule('.sidebarCategory, #sidebarBookmarks', 'border-radius', value+'px');
           addDynamicCSSRule('.sidebarItem', 'border-radius', value+'px');
             
        },
    });


    app.ui.settings.addSetting({
        id: "sidebar_blur_settings",
        name: "[Sidebar] Blur Intesity",
        defaultValue: "5",
        type: "slider",
        attrs: {
            min: 0,
            max: 30,
            step: 1,
        },
    
        onChange(value) {
           addDynamicCSSRule('.content_sidebar', 'backdrop-filter', 'blur('+value+'px)');

             
        },
    });

    app.ui.settings.addSetting({
        id: "sidebar_opacity_settings",
        name: "[Sidebar] Opacity",
        defaultValue: "1.0",
        type: "slider",
        attrs: {
            min: 0.1,
            max: 1,
            step: 0.1,
        },
        onChange(value) {
          let value_perc = (value * 100).toFixed(0);
            
          addDynamicCSSRule('.content_sidebar', 'background', 'rgb(from var(--comfy-menu-bg) r g b / '+value_perc+'%)');
          addDynamicCSSRule('.sidebarCategory, #sidebarBookmarks', 'opacity', value);

             
        },
    });
  
    

}


function SidebarPostBoot() {
    addSidebarStyles();
    addSidebar();
    
    if (getVar("sb_minimized")=="true") {
        toggleSHSB();
    }
    

    document.addEventListener("keydown", handleKeyPress);
    const sb =document.getElementById('content_sidebar');
    const scrollToTopButton = document.getElementById("sb_scrollToTopButton");
    scrollToTopButton.addEventListener("click", function() {
        sb.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      });

      

    sb.addEventListener("scroll", function() {
      
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
    
}


// Function to check if the element is not an empty object
function SidebarBoot() {
    if (Object.keys(LiteGraph.registered_node_types).length > 10) {
        // Execute the function when the element is not an empty object
        settingsSetup();
        createCategoryList();
        //setContextMenu();
        console.timeEnd('execution time');
    } else {
        // Retry after a period of time
        setTimeout(SidebarBoot, 500); // Check every 100 milliseconds
    }
}

// Start checking the element
SidebarBoot();
SidebarPostBoot();