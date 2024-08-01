

let sbPosition = "left";
let defaultSearchToggle = "fuzzy";
let defaultSearchOrder = "comfyui";

async function getConfiguration(name,local = false) {
	//console.log("getStyles called " + name);
      try {
        if (local) {
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

    
    app.ui.settings.addSetting({
        id: "0_sidebar",
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

  
    addSBSetting( "sb_settingsDiv",{
        id: "workflow_preview",
        name: "Enable Workflow Node List",
        defaultValue: "false",
        type: "boolean",
        local: true,
        info: "This is disabled by default since workflows preview can be slow.",
       
   
        onChange(value) {
            
        },
    });

    addSBSetting( "sb_settingsDiv",{
        id: "workflow_replace",
        name: "Workflow Replace Popup",
        defaultValue: "true",
        type: "boolean",
        local: true,
       
   
        onChange(value) {
            
        },
    });
    addSBSetting( "sb_settingsDiv",{
        id: "auto_hide",
        name: "Auto Show Sidebar",
        defaultValue: "false",
        type: "boolean",
        local: true,
       
   
        onChange(value) {
            
        },
    });
    addSBSetting( "sb_settingsDiv",{
        id: "show_at_startup",
        name: "Show at Startup",
        defaultValue: "false",
        type: "boolean",
        local: true,
        info: "This setting is only considered when the sidebar is not fixed",
       
   
        onChange(value) {
            
        },
    });

    await addSBSetting( "sb_settingsDiv", {
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

    addSBSetting( "sb_settingsDiv",{
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
    
    addSBSetting( "sb_settingsDiv",{
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
   
    addSBSetting( "sb_settingsDiv", {
        id: "bartop",
        name: "Space Top",
        defaultValue: "19",
        type: "slider",
        attrs: {
            min: 0,
            max: 300,
            step: 1,
        },
        async onChange(value) {
            addDynamicCSSRule('.sidebar', 'padding-top', value + 'px');
           
            /*var element = document.getElementById('sidebar');
   
            const sb_barbottom_range = document.getElementById('sb_barbottom_range');
            const sb_barbottom_span = document.getElementById('sb_barbottom_span');



            let sb_bartop = await getConfiguration("sb_bartop")
           var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            var rect = element.getBoundingClientRect();
            console.log("viewportHeight: "+ viewportHeight);
            console.log("value: "+value)
            console.log("bottom: "+rect.bottom);
            console.log("sb_bartop: "+sb_bartop)
            if ((parseInt(rect.bottom)+parseInt(sb_bartop)) > (parseInt(viewportHeight)+parseInt(value))) {


                let diff_height = (parseInt(rect.bottom)+parseInt(sb_bartop)) - (parseInt(viewportHeight)+parseInt(value) - 20);
                //
                console.log(diff_height);
                addDynamicCSSRule('.sidebar', 'height', 'calc(100% - ' + diff_height + 'px');
                updateConfiguration("sb_barbottom",diff_height);

                try{
                    //sb_barbottom_range.value = (parseInt(diff_height)+1);
                    //sb_barbottom_span.innerText = (parseInt(diff_height)+1);
              
                    console.log("Not Visible")
                    } catch(e) {
                        console.log(e)
                    }
                console.log("NOT Visible")
       
            }

            if (!isBottomEdgeVisible(element)) {
               
                // Get botton height value
                let sb_barbottom = await getConfiguration("sb_barbottom")
               
                sb_barbottom = parseInt(sb_barbottom)+1
                console.log(sb_barbottom);
                updateConfiguration("sb_barbottom",(parseInt(sb_barbottom)));
                addDynamicCSSRule('.sidebar', 'height', 'calc(100% - ' + (parseInt(sb_barbottom)+10) + 'px');
                try{
                sb_barbottom_range.value = (parseInt(sb_barbottom)+10);
                sb_barbottom_span.innerText = (parseInt(sb_barbottom)+10);
                console.log(sb_barbottom_range.value)
                console.log("Not Visible")
                } catch(e) {
                    
                }
                
            }*/
        }
    });
    var last_right_value = 0;
    var element = document.getElementById('sidebar');
    addSBSetting( "sb_settingsDiv", {
        id: "barbottom",
        name: "Space Bottom",
        defaultValue: "19",
        type: "slider",
        attrs: {
            min: 0,
            max: 500,
            step: 1,
        },
        async onChange(value) {
            addDynamicCSSRule('.sidebar', 'height', 'calc(100% - ' + value + 'px');

           /* const sb_barbottom_range = document.getElementById('sb_barbottom_range');
            const sb_barbottom_span = document.getElementById('sb_barbottom_span');
            

            let sb_bartop = await getConfiguration("sb_bartop")

            var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
           var rect = element.getBoundingClientRect();
     

            if ((parseInt(rect.bottom)+parseInt(sb_bartop)) <= (parseInt(viewportHeight)+parseInt(value)+20)) {

                addDynamicCSSRule('.sidebar', 'height', 'calc(100% - ' + value + 'px');
                last_right_value = value
                console.log("Visible")
       
            }
            else {
         
                
                try{
                    let diff_height = (parseInt(rect.bottom)+parseInt(sb_bartop)) - (parseInt(viewportHeight)+parseInt(value));

                 value = (parseInt(diff_height))
                sb_barbottom_range.value = (parseInt(diff_height));
                sb_barbottom_span.innerText = (parseInt(diff_height));
                console.log(value)
    
                } catch(e) {
                    
                }
            }

*/
            
        }
    });

    //z-index sidebar
    addSBSetting( "sb_settingsDiv",{
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
    
    addSBSetting( "sb_settingsDiv",{
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
    
    addSBSetting( "sb_settingsDiv",{
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
    
    addSBSetting( "sb_settingsDiv", {
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

    addSBSetting( "sb_settingsDiv", {
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
    addSBSetting( "sb_settingsDiv", {
        id: "position",
        name: "Position",
        defaultValue: "left",
        type: "dropdown",
        options: [
            { value: "left", label: "LEFT" },
            { value: "right", label: "RIGHT" }

  
        ],
        onChange(value) {
            if (value == "right") {
                addDynamicCSSRule('.content_sidebar', 'float', 'right');
                addDynamicCSSRule('#sidebar_views', 'float', 'right');
                addDynamicCSSRule('.dragHandle', 'float', 'right');
                addDynamicCSSRule('.sidebar', 'left', 'unset');
                addDynamicCSSRule('.sidebar', 'right', '0');
                addDynamicCSSRule('.sidebar-header', 'right', '52px');
                addDynamicCSSRule('#sb_scrollToTopButton', 'right', '48px');

            }
            if (value == "left") {
                addDynamicCSSRule('.content_sidebar', 'float', 'left');
                addDynamicCSSRule('#sidebar_views', 'float', 'left');
                addDynamicCSSRule('.dragHandle', 'float', 'left');
                addDynamicCSSRule('.sidebar', 'left', '0');
                addDynamicCSSRule('.sidebar', 'right', 'unset');
                addDynamicCSSRule('.sidebar-header', 'right', 'unset');
                addDynamicCSSRule('#sb_scrollToTopButton', 'right', '26px');
            }
            sbPosition = value;
     
        },
    });

    await addSBSetting( "sb_settingsDiv", {
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

    addSBSetting( "sb_settingsDiv", {
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
    const sb_modal_backdrop = document.getElementById("sb-modal-backdrop-settings");
        switch_settings.addEventListener('click', function() {

            //set sb-settingsDiv visible
            showSettings();

        })
        document.body.addEventListener('click', function(event) {
            const modalBackdrop = document.querySelector('.sb-modal-backdrop-settings');
         
            if (event.target === modalBackdrop) {
                sb_settingsDiv.classList.add('sb_hidden');
                sb_modal_backdrop.classList.add('sb_hidden');
            }
        })
        sb_resetButton.addEventListener('click', function() {
          
            resetSettings();
            
        })

        sb_factoryResetButton.addEventListener('click', function() {
          
            factoryReset();
            
        })



       
        
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
        infoIcon.innerHTML ="🛈";
        infoIcon.title = setting.info;
        
        nameLabel.appendChild(infoIcon);
    }

    
    let inputElement;
    if (setting.type === "boolean") {
        inputElement = document.createElement("input");
        inputElement.type = "checkbox";
 
        let configValue = await getConfiguration(setting.id, setting.local) || setting.defaultValue;
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
        inputElement.value = await getConfiguration(setting.id) || setting.defaultValue || setting.defaultValue;
        setting.onChange(inputElement.value);
        inputElement.addEventListener("input", function() {
         
            valueText.textContent = inputElement.value;
            setting.onChange(inputElement.value);
            updateConfiguration(setting.id,inputElement.value)
        });

        
        const valueText = document.createElement("span");
        valueText.textContent = await getConfiguration(setting.id) || setting.defaultValue;
        valueText.id = setting.id+"_span";
        sliderContainer.appendChild(inputElement);
        sliderContainer.appendChild(valueText);
        settingElement.appendChild(sliderContainer);

    } else if (setting.type === "text") {
        inputElement = document.createElement("input");
        inputElement.type = "text";
        inputElement.value = await getConfiguration(setting.id) || setting.defaultValue;
        setting.onChange(inputElement.value);
        inputElement.addEventListener("input", function() {
            setting.onChange(inputElement.value);
            updateConfiguration(setting.id,inputElement.value)
        });
    } 
    else if (setting.type === "textarea") {
        inputElement = document.createElement("textarea");
        inputElement.rows = 3;
        inputElement.value = await getConfiguration(setting.id) || setting.defaultValue;
        setting.onChange(inputElement.value);
        inputElement.addEventListener("input", function() {
            setting.onChange(inputElement.value);
            updateConfiguration(setting.id,inputElement.value)
        });
    }
    else if (setting.type === "dropdown") {
        inputElement = document.createElement("select");
        const defaultValue = await getConfiguration(setting.id) || setting.defaultValue;
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
            updateConfiguration(setting.id,inputElement.value)
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