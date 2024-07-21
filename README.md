
![Drag and Drop Nodes](./images/header.png)



[![YouTube](./images/YouTube.svg)](https://www.youtube.com/channel/UCnu819ZX2xiusPpbQ4KzSmA)

# ComfyUI-N-Sidebar
A simple sidebar for ComfyUI.
For what i know nobody did it, so i did it.
Maybe you don't need it. I need it >.< 

# Updates

- 21-07-2024
  - Fixed a cache bug on the templates panel

- 19-07-2024
  - Added OSX shortcut support

- 05-07-2024
  - Fixed bug on dragging templates  
  - Added multi user support on templates


- 04-06-2024
  - Fixed some bugs
  - Changed icon bar positioning to the border of the screen
  - Implemented the DAMN subcategory view on the node panel!!! xD (you can disable it in the settings if you don't want it)
  - Added the ability to disable the "Auto Show" feature
  - Added the ability to view folders inside the workflow panel
  - Added some tooltips for better UX
  - Changed the Custom Node Categories icon (I didn't like the old one)
  - Added a little icon in custom categories and folders/subcategories
  - Added the ability to move workflows in custom categories via the context menu
  - Added the ability to open workflows in another TAB

NOTE: If you had some custom categories in the workflow panel, at the first start they will be migrated to the new system (since I did a full rewrite to support the folders). It is possible that you need to refresh the page more than once to see them again. Also, a backup of the settings.json will be created before the migration in case anything goes wrong.

NOTE2: I hope I did not break anything T_T


- 25-05-2024
  - Fixed some bugs
  - Added Templates support**
    - Added ability categorize custom categories
    - Added preview (list of used nodes)
    
  - Added Workflow support!
    - Added ability to rename workflows
    - Added ability to remove workflows
    - Added ability to categorize workflows
    - Added preview (list of used nodes), (disabled by default)

** i did not enabled the **rename** and **delete** because it's conflicing with the TemplateManager


- 21-04-2024
  - Rewritten a lot of the code to improve performance and readability, and slightly adjusted the UI to ensure compatibility with future updates.
  - ADDED CUSTOM CATEGORIES
  - Added custom setting panel
  - Re-Implemented the 'original' search function to support translated versions of ComfyUI (requires testing)
  - Added LEFT and RIGHT positioning options
  - Added "Auto Hide" feature
  - Now you have the option to use the default node ordering in ComfyUI instead of the alphabetical one
  - Added the possibility to perform a Soft or Factory Reset of the configuration
  - Now most configuration settings are stored in the settings.json file.
  - Fixed some bugs
  - Added some other bugs for sure!

- 31-03-2024 
  - Added fuzzy search (work in reverse too!) (enabled by default) -  You can disable it in the settings
  - Added description of the node under the preview (Visible only if the description is set in the node)
  - Added possibility to collapse pinned node/custom nodes sections
  - Added possibility to set the bottom space for the sidebar
  - Added the scroll to top button
  - Fixed some bugs
  - Started migration from cookies to localstorage
  - 🐰 Happy Easter! 🐰

# Installation

1. Clone the repository:
`git clone https://github.com/Nuked88/ComfyUI-N-Sidebar.git`  
to your ComfyUI `custom_nodes` directory
2. Enjoy!

NOTE: If you choose to use a different method to install the ComfyUI-N-Sidebar, please ensure that you rename the folder to `ComfyUI-N-Sidebar`.

# Uninstall
  - Delete the `ComfyUI-N-Sidebar` folder in `custom_nodes`


# Update
1. Navigate to the cloned repo e.g. `custom_nodes/ComfyUI-N-Sidebar`
2. `git pull`


# Settings
The most important settings are stored in `custom_nodes/ComfyUI-N-Sidebar/settings.json`


# Keyboard Shortcuts

- `Alt+Z` or `Option+Z` to toggle show/hide sidebar
- `Alt+X` or `Option+X` to focus on the search field
- `Alt+G` or `Option+G` to open the settings

# Features

### 🖱️Drag and Drop Nodes🖱️
![Drag and Drop Nodes](./images/dd.gif)


### 📌Pin Your Favorite Node📌
![Pin Your Favorite Node](./images/pin.gif)

### 🔍Search within your nodes📄
![Search within your nodes](./images/search_nodes.gif)

### 🔍Search within categories📂
![Search within categories](./images/search_categories.gif)

### 🔍Fuzzy Search🔄
![Fuzzy Search](./images/fuzzysearch.gif)
This feature is enabled by default, you can disable it in the settings. I've used fts_fuzzy_match.js by [Forrest Smith](https://github.com/forrestthewoods/lib_fts)

### 🎨 Custom Categories 📂
![Custom Categories](./images/custom_categories.gif)


### ➕Expand/Collapse Categories/Sidebar➖
![Expand/Collapse Categories and Sidebar](./images/expand_collapse.gif)

### 🔁Reorder Nodes🔁
![Reorder Nodes](./images/pin_reorder.gif)
<br>
**Note**: The node will be placed **before** the element on which it is dragged!

### 👁 Preview Node 👁
![Preview Node](./images/preview.gif)

### 📄 Templates Support 📄
![Templates Support](./images/templates.gif)

#### 📄 Workflow Support 📄
![Workflow Support](./images/workflows.gif)

### 🎨 ComfyUI Themes Support 🎨
![Themes Support ](./images/theme.gif)

### 🎨 New Settings Panel 🎨
![ComfyUI Settings](./images/settings.png)

PS: Workflow Path 




### Todo:
- [x] Reordering pinned nodes
- [x] Node preview (i don't think it will be an image)
- [x] Color integration with Jovimetrix
- [x] Better search
- [x] Custom Categories!!
- [x] Workflows
- [x] Templates
- [ ] Custom Shortcuts
- [ ] Export and Import Settings
- [ ] Touch Support


### Known Issues:
 - After you drag a template onto the workflow, if you drag any other file from your PC that does not include a workflow, it will paste the last template you dragged again.

## Contributing

Feel free to contribute to this project by reporting issues or suggesting improvements. Open an issue or submit a pull request on the GitHub repository.

## Donations

If you'd like to support the project, consider making a donation ❤️
<br>
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/C0C0AJECJ) 
<a href="https://patreon.com/DreamingAIChannel"><img src="./images/patreon_badge.png" alt="Support me on Patreon" height="27" /></a>

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

