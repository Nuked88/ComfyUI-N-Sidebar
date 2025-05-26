

let sbPosition = "right";
let defaultSearchToggle = "fuzzy";
let defaultSearchOrder = "comfyui";
let current_path = null;
async function getConfiguration(name,local = false) {
	
      try {

        if (!current_path) {
            res = await fetch("./sidebar/internal_settings");
            settings = await res.json();
            current_path = settings.current_path;
        }
        
        if (local || local === 'true') {
            
            return localStorage.getItem(name);

        } else {
            
       
            const response = await fetch('/sidebar/settings', {
                cache: "no-store",
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action : "read",
                    parameter: name
                    
                }),
                
            });
          
            const data = await response.json();
            return data["value"];
  } 
            } catch (error) {
                console.log(error);
                return null;
            }
    }

  function addConfiguration(name,value) {
	  return fetch('/sidebar/settings', {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({
            action : "add",
		    parameter: name,
		    value: value
		}),
		  
	  })
  }

  function updateConfiguration(name,value,local = false) {
    

    if (local) {
        return  localStorage.setItem(name,value)
    } else {
        
	return fetch('/sidebar/settings', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
            action : "update",
		    parameter: name,
		    value: value
		}),
	})

    }
}

function removeConfiguration(name) {

    return fetch('/sidebar/settings', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
            action : "delete",
			parameter: name
		}),
	})
}

function factoryResetSettings() {
    return fetch('/sidebar/settings', {
        method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
        body: JSON.stringify({
            action : "factory_reset"
        })
		
    })



}



async function settingsSetup(app,$el) {

   
/*


    app.ui.settings.addSetting({
        id: "n-sidebar.Other.0_sidebar",
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

  */
    addSBSetting( "w_section",{
        id: "workflow_preview",
        name: "Enable Workflow Node List",
        defaultValue: "false",
        type: "boolean",
        local: true,
        info: "This is disabled by default since workflows preview can be slow.",
       
   
        onChange(value) {
            
        },
    });

    addSBSetting( "w_section",{
        id: "workflow_replace",
        name: "Workflow Replace Popup",
        defaultValue: "true",
        type: "boolean",
        local: true,
       
   
        onChange(value) {
            
        },
    });
    addSBSetting( "g_section",{
        id: "auto_hide",
        name: "Auto Show Sidebar",
        defaultValue: "false",
        type: "boolean",
        local: true,
       
   
        onChange(value) {
            
        },
    });
    addSBSetting( "g_section",{
        id: "show_at_startup",
        name: "Show at Startup",
        defaultValue: "false",
        type: "boolean",
        local: true,
        info: "This setting is only considered when the sidebar is not fixed",
       
   
        onChange(value) {
            
        },
    });


    addSBSetting( "g_section",{
        id: "embed_osb",
        name: "Embed Official Sidebar",
        defaultValue: "false",
        type: "boolean",
        local: true,
        info: "This will move the buttons of the official sidebar inside  the N-Sidebar.",
       
   
        onChange(value) {
            
        },
    });

    addSBSetting( "g_section",{
        id: "embed_osb_nodes",
        name: "Keep Node Library Button",
        defaultValue: "false",
        type: "boolean",
        local: true,
        info: "This will keep Node Library button in the N-Sidebar. Otherwise, it will be removed due to redundancy.",
       
   
        onChange(value) {
            
        },
    });
    await addSBSetting( "g_section", {
        id: "tree_view",
        name: "Node Category Tree View",
        defaultValue: "multi",
        type: "dropdown",
        info: "NOTE: The new view will be applied after a page refresh!",
        options: [
            { value: "mono", label: "MONO" },
            { value: "multi", label: "MULTILEVEL" }

  
        ],
        onChange(value) {
            
            defaultSearchOrder = value;
  
     
        },
    });

    addSBSetting( "g_section",{
        id: "font",
        name: "Font Size",
        defaultValue: "13",
        type: "slider",
        attrs: {
            min: 5,
            max: 30,
            step: 1,
        },
        onChange(value) {
            addDynamicCSSRule('.sidebarCategory, .sidebarFolder, #sidebarBookmarks', 'font-size', value + 'px');
        },
    });
    
    addSBSetting( "g_section",{
        id: "node",
        name: "Node Size",
        defaultValue: "10",
        type: "slider",
        attrs: {
            min: 0,
            max: 40,
            step: 1,
        },
        onChange(value) {
            addDynamicCSSRule('.sidebar li', 'padding', value + 'px');
        },
    });

  

    addSBSetting( "g_section", {
        id: "bartop",
        name: "Space Top",
        defaultValue: 6,
        type: "slider",
        local: true,
        attrs: {
            min: 0,
            max: 100,
            step: 1,
        },
        async onChange(value) {
            addDynamicCSSRule('.sidebar', 'top', value + '%');
       
        }
    });
    var last_right_value = 0;
    var element = document.getElementById('sidebar');
    addSBSetting( "g_section", {
        id: "barbottom",
        name: "Space Bottom",
        defaultValue: "97",
        type: "slider",
        local: true,
        attrs: {
            min: 30,
            max: 100,
            step: 1,
        },
        async onChange(value) {
            try{
            if (localStorage.getItem("Comfy.Settings.Comfy.UseNewMenu").replace(/"/g,'') ==='Top' || 
            localStorage.getItem("Comfy.Settings.Comfy.UseNewMenu").replace(/"/g,'') ==='Bottom'){
                addDynamicCSSRule('.sidebar', 'height', `calc(${value}% - 35px`);
            }
            else {
                addDynamicCSSRule('.sidebar', 'height',  value + '%');
            }
        }
        catch{
            addDynamicCSSRule('.sidebar', 'height',  value + '%');
        }
            
        }
    });

    //z-index sidebar
    addSBSetting( "g_section",{
        id: "zindex",
        name: "Sidebar Z-Index",
        defaultValue: "2",
        type: "slider",
        attrs: {
            min: 2,
            max: 1000,
            step: 1,
        },
        onChange(value) {
            addDynamicCSSRule('.sidebar', 'z-index', value);
          
        },
    })
    
    addSBSetting( "g_section",{
        id: "noderadius",
        name: "Node Radius Border",
        defaultValue: "9",
        type: "slider",
        attrs: {
            min: 0,
            max: 20,
            step: 1,
        },
        onChange(value) {
            addDynamicCSSRule('.sidebarCategory, .sidebarFolder, #sidebarBookmarks', 'border-radius', value + 'px');
            addDynamicCSSRule('.sidebarItem', 'border-radius', value + 'px');
        },
    });
    
    addSBSetting( "g_section",{
        id: "blur",
        name: "Blur Intesity",
        defaultValue: "5",
        type: "slider",
        attrs: {
            min: 0,
            max: 30,
            step: 1,
        },
        onChange(value) {
            addDynamicCSSRule('.content_sidebar', 'backdrop-filter', 'blur(' + value + 'px)');
            addDynamicCSSRule('#sidebar_views', 'backdrop-filter', 'blur(' + value + 'px)');
        },
    });
    
    addSBSetting( "g_section", {
        id: "opacity",
        name: "Opacity",
        defaultValue: "1.0",
        type: "slider",
        info: "Note: The opacity of custom-colored nodes is not applied in real-time and will take effect after the page is refreshed.",
        attrs: {
            min: 0.1,
            max: 1,
            step: 0.1,
        },
        onChange(value) {
            let value_perc = (value * 100).toFixed(0);
            addDynamicCSSRule('.content_sidebar', 'background', 'rgb(from var(--comfy-menu-bg) r g b / ' + value_perc + '%)');
            addDynamicCSSRule('#sidebar_views', 'background', 'rgb(from var(--comfy-menu-bg) r g b / ' + value_perc + '%)');
            addDynamicCSSRule('#sidebar_views', 'border-left', '2px rgb(from var(--comfy-menu-bg) r g b / ' + (parseFloat(value) + 10) + '%)');
            addDynamicCSSRule('.sidebarCategory, .sidebarFolder, #sidebarBookmarks', 'background-color', 'rgb(from var(--comfy-input-bg) r g b / ' + value_perc + '%)');

        
        },
    });

    addSBSetting( "g_section", {
        id: "search_type",
        name: "Search Type",
        defaultValue: "fuzzy",
        type: "dropdown",
        info: "Select the search type:\nORIGINAL: People who use custom nodes to translate ComfyUI (e.g. Chinese, Japanese...) should use this!\nNORMAL: Search based on original node name but without fuzzy matching\nFUZZY: Search based on the original node name with fuzzy matching (Default).",
        options: [
            { value: "original", label: "ORIGINAL" },
            { value: "normal", label: "NORMAL" },
            { value: "fuzzy", label: "FUZZY" },

  
        ],
        onChange(value) {
            defaultSearchToggle = value;
     
        },
    });
    addSBSetting( "g_section", {
        id: "position",
        name: "Position",
        defaultValue: "right",
        type: "dropdown",
        options: [
            { value: "left", label: "LEFT" },
            { value: "right", label: "RIGHT" }

  
        ],
        onChange(value) {
            let valueChange= '35px'
            if (value == "right") {
                addDynamicCSSRule('.content_sidebar', 'float', 'right');
                addDynamicCSSRule('.content_sidebar', 'border-top-left-radius', '5px');
                addDynamicCSSRule('.content_sidebar', 'border-bottom-left-radius', '5px');
                addDynamicCSSRule('#sidebar_views', 'float', 'right');
                addDynamicCSSRule('.dragHandle', 'float', 'right');
                addDynamicCSSRule('.dragHandle', 'right', '-5px');
                addDynamicCSSRule('.sidebar', 'left', 'unset');
                addDynamicCSSRule('.sidebar', 'right', '0');
                addDynamicCSSRule('.sidebar', 'flex-direction', 'row-reverse');
                addDynamicCSSRule('.sidebar-header', 'right', '52px');
                addDynamicCSSRule('.sidebar-header', 'left', '-17px');
                addDynamicCSSRule('#sb_scrollToTopButton', 'right', '48px');
                addDynamicCSSRule('.view_button', 'border-right-width', '2px');
                addDynamicCSSRule('.view_button', 'border-right-style', 'solid');
                addDynamicCSSRule('.view_button', 'border-left', '0px');
                //add to view_button  the . left class
                const view_button = document.getElementsByClassName('view_button');
                for (let i = 0; i < view_button.length; i++) {
                    view_button[i].classList.remove('right');
                    view_button[i].classList.add('left');
                }
                

                valueChange= '-35px';

           
                

            }
            if (value == "left") {
                addDynamicCSSRule('.content_sidebar', 'float', 'left');
                addDynamicCSSRule('.content_sidebar', 'border-top-right-radius', '5px');
                addDynamicCSSRule('.content_sidebar', 'border-bottom-right-radius', '5px');
                addDynamicCSSRule('#sidebar_views', 'float', 'left');
                addDynamicCSSRule('.dragHandle', 'float', 'left');
                addDynamicCSSRule('.sidebar', 'left', '0');
                addDynamicCSSRule('.sidebar', 'right', 'unset');
                addDynamicCSSRule('.sidebar', 'flex-direction', 'row');
                addDynamicCSSRule('.sidebar-header', 'right', 'unset');
                addDynamicCSSRule('.sidebar-header', 'left', '11px');
                addDynamicCSSRule('#sb_scrollToTopButton', 'right', '26px');
                addDynamicCSSRule('.view_button', 'border-left-width', '2px');
                addDynamicCSSRule('.view_button', 'border-left-style', 'solid');
                addDynamicCSSRule('.view_button', 'border-right', '0px');
                //add to view_button  the . right class
                const view_button = document.getElementsByClassName('view_button');
                for (let i = 0; i < view_button.length; i++) {
                    view_button[i].classList.remove('left');
                    view_button[i].classList.add('right');
                }
              
                valueChange= '35px'
            }


            //ALPHA
            try{
                if (localStorage.getItem("sb_embed_osb") == 'true')  {
                   
                        if (((localStorage.getItem("Comfy.Settings.Comfy.UseNewMenu") ==='"Top"' || 
                    localStorage.getItem("Comfy.Settings.Comfy.UseNewMenu") ==='"Bottom"')) && localStorage.getItem("Comfy.Settings.Comfy.Sidebar.Location")==null) {
                        addDynamicCSSRule('.splitter-overlay', 'margin-left', '0px');
                   
                        addDynamicCSSRule('.side-bar-panel', 'min-width', 'calc('+localStorage.getItem("sidebarWidth")+'px - 35px)');
                        
                    }
                }
            }
            catch(err){
            
                console.log("ERROR IN ALPHA VERSION: " + err);    
            
            }



            try{
                if (localStorage.getItem("sb_embed_osb") == 'true')  {
                    
                    if (localStorage.getItem("Comfy.Settings.Comfy.Sidebar.Location") === '"'+value+'"' ) {
                        
                    addDynamicCSSRule('.splitter-overlay', 'margin-left', valueChange);
                    
                    addDynamicCSSRule('.side-bar-panel', 'min-width', 'calc('+localStorage.getItem("sidebarWidth")+'px - 35px)');
                    }

                    
                    if (localStorage.getItem("Comfy.Settings.Comfy.Sidebar.Location") === null ) {
                        addDynamicCSSRule('.side-bar-panel', 'min-width', 'calc('+localStorage.getItem("sidebarWidth")+'px - 35px)');
                        //addDynamicCSSRule('.splitter-overlay', 'margin-left', '35px');
                    
                    }

                }
            }
            catch(err){
                console.log("ERROR IN ALPHA VERSION: " + err);    
            }

         
            
            sbPosition = value;
     
        },
    });

    await addSBSetting( "g_section", {
        id: "order_type",
        name: "Nodes Order Type",
        defaultValue: "comfyui",
        type: "dropdown",
        info: "Select the order type:\nCOMFYUI: The order of nodes will be the same as in the original ComfyUI\nALPHABETICAL: The order of nodes will be alphabetical\nNOTE: The new order will be applied after a page refresh!",
        options: [
            { value: "comfyui", label: "COMFYUI" },
            { value: "alphabetical", label: "ALPHABETICAL" }

  
        ],
        onChange(value) {
            
            defaultSearchOrder = value;
  
     
        },
    });

  

addSBSetting( "w_section", {
    id: "wf_path",
    name: "Workflow Paths",
    defaultValue: "",
    type: "textarea",
    info: "Paths must be row separated (only one per row).\nThe default ComfyUI workflows path has already been set.\nReboot ComfyUI to apply changes!",
   
    onChange(value) {
        
        NaN

 
    },
});



    const switch_settings = document.getElementById("switch_settings");
    const sb_exportButton = document.getElementById("sb_exportButton");
    const sb_importButton = document.getElementById("sb_importButton");
    const sb_shortcutButton = document.getElementById("sb_shortcutButton");
    const sb_modal_backdrop = document.getElementById("sb-modal-backdrop-settings");
    const sb_settingsDiv_export = document.getElementById("sb_settingsDiv_export");
    const sb_settingsDiv_import = document.getElementById("sb_settingsDiv_import");
    const sb_settingsDiv_shortcut = document.getElementById("sb_settingsDiv_shortcut");
    const sb_settingsDiv = document.getElementById("sb_settingsDiv");
        switch_settings.addEventListener('click', function() {

            //set sb-settingsDiv visible
            showSettings();

        })


        sb_exportButton.addEventListener('click', function() {
            showIESettings("export");
        })


        sb_importButton.addEventListener('click', function() {
            showIESettings("import");

        })


        sb_shortcutButton.addEventListener('click', function() {
            showIESettings("shortcut");
        })


        document.body.addEventListener('click', function(event) {
            const modalBackdrop = document.querySelector('.sb-modal-backdrop-settings');
         
            if (event.target === modalBackdrop) {
                sb_settingsDiv.classList.add('sb_hidden');
                sb_modal_backdrop.classList.add('sb_hidden');
                
                 
            }
       
            if (!sb_settingsDiv_export.classList.contains('sb_hidden')) {
                if (
                    (event.target === sb_modal_backdrop || sb_settingsDiv.contains(event.target)) &&
                    !event.target.matches('#sb_exportButton')
                ) {
                    sb_settingsDiv_export.classList.add('sb_hidden');
                    sb_settingsDiv_import.classList.add('sb_hidden');
                }
            }

            if (!sb_settingsDiv_import.classList.contains('sb_hidden')) {
                if (
                    (event.target === sb_modal_backdrop || sb_settingsDiv.contains(event.target)) &&
                    !event.target.matches('#sb_importButton')
                ) {
                    sb_settingsDiv_import.classList.add('sb_hidden');
                    //sb_settingsDiv_import.classList.add('sb_hidden');
                }
            }

            if (!sb_settingsDiv_shortcut.classList.contains('sb_hidden')) {
                if (
                    (event.target === sb_modal_backdrop || sb_settingsDiv.contains(event.target)) &&
                    !event.target.matches('#sb_shortcutButton')
                ) {
                    sb_settingsDiv_shortcut.classList.add('sb_hidden');
                    //sb_settingsDiv_shortcut.classList.add('sb_hidden');
                }
            }

        })
        sb_resetButton.addEventListener('click', function() {
          
            resetSettings();
            
        })

        sb_factoryResetButton.addEventListener('click', function() {
          
            factoryReset();
            
        })



        document.getElementById('sb_runExportButton').addEventListener('click', function() {
            const selectedItems = [];
            
            // Verifica quali checkbox sono selezionate e aggiungile all'array
            document.querySelectorAll('#sb_settingsDiv_export input[type="checkbox"]').forEach((checkbox, index) => {
                if (checkbox.checked) {
                    // Supponendo che l'ordine dei checkbox corrisponda ai parametri della configurazione
                    const keys = ['sb_pinnedItems', 'sb_categoryNodeMap|sb_ColorCustomCategories', 'sb_workflowNodeMap|sb_ColorCustomWorkflows', 'sb_templateNodeMap|sb_ColorCustomTemplates','sb_w_API_key','model_templates',''];
                    selectedItems.push(keys[index]);
                }
            });
        
            // Effettua una chiamata POST per esportare la configurazione selezionata
            fetch('/sidebar/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ selected_items: selectedItems }),
            })
            .then(response => response.blob()) // Riceviamo il file come blob
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'n-sidebar_config.zip'; // Nome del file
                document.body.appendChild(a);
                a.click(); // Avvia il download
                a.remove();
            })
            .catch(error => console.error('Error exporting config:', error));
        });

        document.getElementById('sb_selectFileButton').addEventListener('click', function() {
            document.getElementById('importFileInput').click();
        });

       
        document.getElementById('sb_runImportButton').addEventListener('click', async function() {
            const selectedItems = [];
            
            // Verifica quali checkbox sono selezionate e aggiungile all'array
            document.querySelectorAll('#sb_settingsDiv_import input[type="checkbox"]').forEach((checkbox, index) => {
                if (checkbox.checked) {
                    const keys = ['sb_pinnedItems', 'sb_categoryNodeMap|sb_ColorCustomCategories', 'sb_workflowNodeMap|sb_ColorCustomWorkflows', 'sb_templateNodeMap|sb_ColorCustomTemplates','sb_w_API_key','model_templates',''];
                    selectedItems.push(keys[index]);
                }
            });
        
            // Ottieni il file di importazione
            const fileInput = document.getElementById('importFileInput');
            const file = fileInput.files[0];
        
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('selected_items', JSON.stringify(selectedItems));
        
                try {
                    const response = await fetch('/sidebar/import', {
                        method: 'POST',
                        body: formData
                    });
        
                    if (response.ok) {
                        alert('Import successful! You may need to reload the ComfyUI page or restart the server for the changes to take effect');
                    } else {
                        alert('Failed to import settings.');
                    }
                } catch (error) {
                    console.error('Error during import:', error);
                }
            } else {
                alert('Please select a file to import.');
            }
        });



        /*SHORTCUTS*/
        const shortcutInputs = document.querySelectorAll('.sb-shortcut');
        const saveAllButton = document.getElementById('sb_saveAllShortcuts');
        const resetButton = document.getElementById('sb_resetToDefault');
        const defaultShortcuts = {
            action1: 'Alt + X',
            action2: 'Alt + Z',
            action3: 'Alt + G'
        };
       
        let shortcuts = JSON.parse(await getConfiguration('sb_shortcuts')) || defaultShortcuts;



       
        let currentShortcutKeys = {
            ctrl: false,
            alt: false,
            shift: false,
            key: null
        };
    
        // Function to update the input with the current shortcut
        function updateShortcutInput(inputElement) {
            const modifiers = [];
            if (currentShortcutKeys.ctrl) modifiers.push('Ctrl');
            if (currentShortcutKeys.meta) modifiers.push('Meta'); // Display Meta key separately
            if (currentShortcutKeys.alt) modifiers.push('Alt');
            if (currentShortcutKeys.shift) modifiers.push('Shift');

            if (modifiers.length > 0 && currentShortcutKeys.key) {
                inputElement.value = `${modifiers.join(' + ')} + ${currentShortcutKeys.key.toUpperCase()}`;
            } else {
                inputElement.value = '';
            }
        }
        // Mostra le shortcut salvate accanto a ciascun campo
        function displayShortcuts() {
            
            shortcutInputs.forEach(inputElement => {
                const action = inputElement.dataset.action;
                const shortcutSpan = document.querySelector(`.current-shortcut[data-action="${action}"]`);
                if (shortcuts[action]) {
                    shortcutSpan.textContent = shortcuts[action];
                } else {
                    shortcutSpan.textContent = 'Not Set';
                }
            });
        }
    
        document.addEventListener('keydown', (event) => {
            // Check if the active element is one of your shortcut input fields
            const activeElement = document.activeElement;
            const isShortcutInputActive = Array.from(shortcutInputs).includes(activeElement);
        
            if (isShortcutInputActive) {
                // Only prevent default behavior when interacting with shortcut input fields
                event.preventDefault();
        
                // Separate handling for Ctrl, Alt, Shift, and Meta (Command on Mac)
                if (event.ctrlKey) currentShortcutKeys.ctrl = true;
                if (event.metaKey) currentShortcutKeys.meta = true; // Handle Meta separately
                if (event.altKey) currentShortcutKeys.alt = true;
                if (event.shiftKey) currentShortcutKeys.shift = true;
        
                // Check if the key is a letter, number, special character, or accented letter
                if (event.key && !['Control', 'Meta', 'Alt', 'Shift'].includes(event.key)) {
                    currentShortcutKeys.key = event.key;
                }
        
                // Update the input element with the current shortcut combination
                updateShortcutInput(activeElement);
            }
        });
        
        document.addEventListener('keyup', (event) => {
            // Reset the modifier keys when they are released
            if (!event.ctrlKey) currentShortcutKeys.ctrl = false;
            if (!event.metaKey) currentShortcutKeys.meta = false; // Reset Meta separately
            if (!event.altKey) currentShortcutKeys.alt = false;
            if (!event.shiftKey) currentShortcutKeys.shift = false;
        });
        // Funzione per salvare tutte le shortcut
        function saveAllShortcuts() {
            shortcutInputs.forEach(inputElement => {
                const action = inputElement.dataset.action;
                const shortcut = inputElement.value;
    
                if (shortcut) {
                    shortcuts[action] = shortcut;
                }
            });
    
            // Salva tutte le shortcut
            updateConfiguration('sb_shortcuts', JSON.stringify(shortcuts));
            displayShortcuts();
            alert('Shortcuts saved successfully!');
        }
    
        // Evento per il pulsante "Save All Shortcuts"
        saveAllButton.addEventListener('click', () => {
            saveAllShortcuts();
        });
    
        // Funzione per riportare le shortcut a quelle di default
        function resetToDefault() {
            shortcuts = { ...defaultShortcuts };
            updateConfiguration('sb_shortcuts', JSON.stringify(shortcuts));
            displayShortcuts();
        }
    
        // Evento per il pulsante "Reset to Default"
        resetButton.addEventListener('click', () => {
            resetToDefault();
        });
    
        // Mostra le shortcut salvate all'avvio
        displayShortcuts();

        /* END OF SHORTCUTS */






        
// General function to handle tab switching
function createTabManager(tabs, contents) {
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Remove 'n-sb-active' class from all tabs and contents
            tabs.forEach(t => t.classList.remove('n-sb-active'));
            contents.forEach(c => c.classList.remove('n-sb-active'));

            // Add 'n-sb-active' class to the clicked tab and corresponding content
            tab.classList.add('n-sb-active');
            contents[index].classList.add('n-sb-active');
        });
    });
}


const tabSettings = document.getElementById('tabSettings');
const tabCustomize = document.getElementById('tabCustomize');
const settingsContainer = document.getElementById('settingsContainer');
const sbCustomizeContainer = document.getElementById('sbCustomizeContainer');

createTabManager([tabSettings, tabCustomize], [settingsContainer, sbCustomizeContainer]);

const t1 = document.getElementById('t1');
const t2 = document.getElementById('t2');
const tabSettings2 = document.getElementById('tabSettings2');
const tabCustomize2 = document.getElementById('tabCustomize2');


createTabManager([tabSettings2, tabCustomize2], [t1, t2]);
/******************************************************************************* */

function generateHash(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        const char = value.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32-bit integer
    }
    return `section_${hash}`;
}
// Function to map default titles to IDs
function getDefaultId(description) {
    const mapping = {
        "Custom Node Categories": "custom_categories",
        "Templates list": "custom_templates",
        "Workflows list": "custom_workflows"
    };
    return mapping[description] || generateHash(description);
}
      

  
//const availablePanels = ["custom_categories", "custom_templates", "custom_workflows", "custom_reports", "custom_users"];
let panelsInUse = new Set(); // Keep track of panels currently in use

const sectionList = document.getElementById('n-sb-section-list');



// Function to fetch sections from the server
async function fetchSections() {
    const timestamp = Date.now(); // You can use a different timestamp or method if needed
    const url = `./sidebar/views?v=${timestamp}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch sections: ' + response.statusText);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching sections:', error);
        return []; // Return an empty array on error
    }
}



// Function to fetch panels from the server
async function fetchPanels() {
    const timestamp = Date.now(); // You can use a different timestamp or method if needed
    const url = `./sidebar/panels?v=${timestamp}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch panels: ' + response.statusText);
        }
        const data = await response.json();
        return data.panels;  // Extract the "panels" array from the response
    } catch (error) {
        console.error('Error fetching panels:', error);
        return []; // Return an empty array on error
    }
}


// Function to create a panel item
function createPanelItem(panelName, sectionDiv) {
    const panelItem = document.createElement('li');
    panelItem.textContent = panelName;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = "x";
    removeBtn.classList.add('remove-panel');
    removeBtn.addEventListener('click', () => {
        panelItem.remove();
        panelsInUse.delete(panelName);
        updateAllPanelDropdowns(availablePanels); // Update all select dropdowns when a panel is removed
    });

    panelItem.appendChild(removeBtn);
    sectionDiv.querySelector('.panel-list').appendChild(panelItem);
}

// Function to create the section editor
function createSectionEditor(section, availablePanels) {
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('n-sb-section', 'draggable');
    sectionDiv.setAttribute('draggable', true);

    // Use default IDs for predefined titles
    const sectionId = getDefaultId(section.description);

    sectionDiv.innerHTML = `
        <div class="n-sb-section-header">
            <label>ICON:</label><input type="text" value="${section.icon}" class="icon-input">
            <label>TITLE:</label><input type="text" value="${section.description}" class="description-input">
            <input type="hidden" value="${sectionId}" class="id-input">
            <button class="remove-section-btn">Remove Section</button>
        </div>
        <div class="n-sb-section-panels">
            <ul class="panel-list">
                ${section.panels.map(panel => {
                    panelsInUse.add(panel); // Add the panel to the "in-use" set
                    return `<li>${panel} <button class="remove-panel">x</button></li>`;
                }).join('')}
            </ul>
            <select class="panel-select">
                ${availablePanels.map(panel => {
                    return `<option value="${panel}" ${panelsInUse.has(panel) ? 'disabled' : ''}>${panel}</option>`;
                }).join('')}
            </select>
            <button class="add-panel-btn">Add Panel</button>
        </div>
    `;

    // Add listeners to remove panels
    sectionDiv.querySelectorAll('.remove-panel').forEach(button => {
        button.addEventListener('click', (e) => {
            const panelItem = e.target.parentElement;
            const panelName = panelItem.textContent.trim().replace(/x$/, '').replace(' ', '');
            panelsInUse.delete(panelName);
            updateAllPanelDropdowns(availablePanels); // Update the panel dropdowns
            panelItem.remove();
        });
    });

    // Add listener to remove the entire section
    sectionDiv.querySelector('.remove-section-btn').addEventListener('click', () => {
        const panelItems = sectionDiv.querySelectorAll('.panel-list li');
        panelItems.forEach(item => {
            const panelName = item.textContent.trim().replace(/x$/, '').replace(' ', '');
            panelsInUse.delete(panelName);
        });
        sectionDiv.remove();
        updateAllPanelDropdowns(availablePanels); // Update the panel dropdowns
    });

    // Add new panels to the list
    sectionDiv.querySelector('.add-panel-btn').addEventListener('click', () => {
        const selectedPanel = sectionDiv.querySelector('.panel-select').value;
        if (!panelsInUse.has(selectedPanel)) {
            createPanelItem(selectedPanel, sectionDiv);
            panelsInUse.add(selectedPanel);
            updateAllPanelDropdowns(availablePanels); // Update all select dropdowns when a panel is added
        }
    });

    // Handle drag-and-drop
    sectionDiv.addEventListener('dragstart', () => {
        sectionDiv.classList.add('dragging');
    });

    sectionDiv.addEventListener('dragend', () => {
        sectionDiv.classList.remove('dragging');
    });

    sectionList.appendChild(sectionDiv);
    updateAllPanelDropdowns(availablePanels); // Update dropdowns after each section is added
}

// Update all dropdowns to reflect panels that are in use
function updateAllPanelDropdowns(availablePanels) {
    const panelSelects = document.querySelectorAll('.panel-select');

    panelSelects.forEach(select => {
        const currentSelected = select.value;
        select.innerHTML = availablePanels.map(panel => {
            const isDisabled = panelsInUse.has(panel) && panel !== currentSelected;
            return `<option value="${panel}" ${isDisabled ? 'disabled' : ''}>${panel}</option>`;
        }).join('');
    });
}

// Initialize the editor with fetched sections
async function initializeEditor() {
    const availablePanels = await fetchPanels();

    const sections = await fetchSections();
    sections.forEach(section => createSectionEditor(section, availablePanels));
}

// Add New Section Button
document.getElementById('add-section-btn').addEventListener('click', async () => {
    const newSection = {
        icon: "", // Icona vuota per default
        description: "New Section", // Descrizione di default
        panels: [] // Lista pannelli vuota di default
    };

    const availablePanels = await fetchPanels();  // Ottieni i pannelli disponibili
    createSectionEditor(newSection, availablePanels); // Passa i pannelli disponibili
});

// Save layout and send the data to the backend endpoint
document.getElementById('save-btn').addEventListener('click', async () => {
    const updatedSections = [];
    const sectionDivs = document.querySelectorAll('.n-sb-section');

    sectionDivs.forEach(sectionDiv => {
        const descriptionInput = sectionDiv.querySelector('.description-input').value;
        const iconInput = sectionDiv.querySelector('.icon-input').value;
        const idInput = getDefaultId(sectionDiv.querySelector('.description-input').value);
        const panelItems = sectionDiv.querySelectorAll('.panel-list li');
        const panels = [];

        panelItems.forEach(panelItem => {
            const panelName = panelItem.textContent.trim().replace(/x$/, '').replace(' ', '');
            panels.push(panelName);
        });

        updatedSections.push({
            id: idInput, // Include the ID in the saved data
            description: descriptionInput,
            icon: iconInput,
            panels: panels
        });
    });

    const layoutData = JSON.stringify(updatedSections, null, 2);
    console.log(layoutData); // Debug: print the JSON

    try {
        const response = await fetch('./sidebar/savelayout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: layoutData
        });

        if (response.ok) {
            alert('Layout saved successfully!');
        } else {
            alert('Error saving layout: ' + response.statusText);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
});

// Function for drag-and-drop reordering
sectionList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingElement = document.querySelector('.dragging');
    const afterElement = getDragAfterElement(sectionList, e.clientY);
    if (afterElement == null) {
        sectionList.appendChild(draggingElement);
    } else {
        sectionList.insertBefore(draggingElement, afterElement);
    }
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Restore layout functionality
document.getElementById('restore-btn').addEventListener('click', async () => {
    try {
        const response = await fetch('./sidebar/restorelayout', {
            method: 'POST'
        });

        if (response.ok) {
            alert('Layout restored successfully!');
            location.reload();  // Reloads the page to reflect the restored layout
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
});

// Initialize the editor on page load
initializeEditor();



}


async function addSBSetting(fieldLocation, setting) {
    setting.id = "sb_" + setting.id; 

  
    const settingElement = document.createElement("div");
    settingElement.classList.add("setting");
    

    const nameLabel = document.createElement("label");
    nameLabel.textContent = setting.name;
    settingElement.appendChild(nameLabel);

    if (setting.info) {
        const infoIcon = document.createElement("i");
        infoIcon.classList.add("info-icon");
        infoIcon.classList.add("right");
         
        infoIcon.innerHTML ="ℹ";
        infoIcon.dataset.tooltip = setting.info;
        
        nameLabel.appendChild(infoIcon);
    }

    
    let inputElement;
    let configStartValue = await getConfiguration(setting.id, setting.local);

    //  `null` or `undefined`
    if (configStartValue == null) {
        configStartValue = setting.defaultValue !== undefined ? setting.defaultValue : null;
        updateConfiguration(setting.id,configStartValue, setting.local)
    }




    if (setting.type === "boolean") {
        inputElement = document.createElement("input");
        inputElement.type = "checkbox";
 
        let configValue = configStartValue;
        if (configValue == "true") {
            inputElement.checked = true;
        } else if (configValue == "false") {
            inputElement.checked = false;
        } 
        
        setting.onChange(inputElement.checked);
        inputElement.addEventListener("change", function() {
            setting.onChange(inputElement.checked);
            updateConfiguration(setting.id,inputElement.checked, setting.local)
            
        });
    } else if (setting.type === "slider") {
    
        const sliderContainer = document.createElement("div");
        sliderContainer.classList.add("slider-container");

        inputElement = document.createElement("input");
        inputElement.type = "range";
        inputElement.id = setting.id+"_range";
        inputElement.min = setting.attrs.min;
        inputElement.max = setting.attrs.max;
        inputElement.step = setting.attrs.step;
        inputElement.value = configStartValue;
        setting.onChange(inputElement.value);
        inputElement.addEventListener("input", function() {
         
            valueText.textContent = inputElement.value;
            setting.onChange(inputElement.value);
            updateConfiguration(setting.id,inputElement.value, setting.local)
        });

        
        const valueText = document.createElement("span");
        valueText.textContent = configStartValue;
        valueText.id = setting.id+"_span";
        sliderContainer.appendChild(inputElement);
        sliderContainer.appendChild(valueText);
        settingElement.appendChild(sliderContainer);

    } else if (setting.type === "text") {
        inputElement = document.createElement("input");
        inputElement.type = "text";
        inputElement.placeholder = setting.placeholder || ""; 
        inputElement.value = configStartValue;
        setting.onChange(inputElement.value);
        inputElement.addEventListener("input", function() {
            setting.onChange(inputElement.value);
            updateConfiguration(setting.id,inputElement.value, setting.local)
        });
    } 
    else if (setting.type === "textarea") {
        inputElement = document.createElement("textarea");
        inputElement.rows = 3;
        inputElement.value = configStartValue;
        setting.onChange(inputElement.value);
        inputElement.addEventListener("input", function() {
            setting.onChange(inputElement.value);
            updateConfiguration(setting.id,inputElement.value)
        });
    }
    else if (setting.type === "dropdown") {
        inputElement = document.createElement("select");
        const defaultValue = configStartValue;
        setting.options.forEach(async (option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            
            if (option.value === defaultValue) {
                optionElement.selected = true;
            }
            inputElement.appendChild(optionElement);
        });
        setting.onChange(defaultValue);
        inputElement.addEventListener("change", function() {
            setting.onChange(inputElement.value);
            updateConfiguration(setting.id,inputElement.value, setting.local)
        });
    }

    settingElement.appendChild(inputElement);

    
    const targetElement = document.getElementById(fieldLocation);
    if (targetElement) {
        targetElement.appendChild(settingElement);
    } else {
        console.error("Target element not found!");
    }

    
}






function resetSettings() {
    let ok = confirm("This option will reset the following settings: \n-Search Type\n-Position\n-Nodes Order Type\n-Font Size\n-Node Size\n-Space Top\n-Space Bottom\n-Node Radius Border\n-Blur Intesity\n-Opacity\nsidebarWidth\nsb_pinned_collapsed\nsb_minimized\nsb_current_tab\nsb_workflow_preview\nsb_workflow_replace\nAre you sure you want to reset these settings?");
    if (!ok) {
        return;
    }
    const actualSettings = ["sb_noderadius","sb_barbottom","sb_bartop","sb_blur","sb_opacity","sb_font","sb_node"];
    actualSettings.forEach(setting => {
        removeConfiguration(setting);
    });

    const localSettings = ["sidebarWidth","sb_pinned_collapsed","sb_minimized","sb_current_tab","sb_workflow_preview","sb_workflow_replace","sb_migrated"];

    localSettings.forEach(setting => {
        try{
        removeVar(setting);
        }catch(err){
            console.log(err)
        }
    })

    window.location.reload();
}


function factoryReset() {
    let ok = confirm("Are you sure you want to do a factory reset?");
    if (!ok) {
        return;
    }
    factoryResetSettings();

    const localSettings = ["sidebarWidth","sb_pinned_collapsed","sb_minimized","sb_current_tab","sb_workflow_preview","sb_workflow_replace","sb_migrated"];

    localSettings.forEach(setting => {
        try{
        removeVar(setting);
        }catch(err){
            console.log(err)
        }
    })
    window.location.reload();
  
}


