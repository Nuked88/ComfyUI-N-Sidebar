
![Drag and Drop Nodes](./images/header.png)



[![YouTube](./images/YouTube.svg)](https://www.youtube.com/channel/UCnu819ZX2xiusPpbQ4KzSmA)

# ComfyUI-N-Sidebar
A simple sidebar for ComfyUI.
For what i know nobody did it, so i did it.
Maybe you don't need it. I need it >.< 

# Updates
- 21-04-2024
  - Rewritten a lot of the code to improve performance and readability, and slightly adjusted the UI to ensure compatibility with future updates.
  - ADDEDD CUSTOM CATEGORIES
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


# Uninstall
  - Delete the `ComfyUI-N-Sidebar` folder in `custom_nodes`


# Update
1. Navigate to the cloned repo e.g. `custom_nodes/ComfyUI-N-Sidebar`
2. `git pull`

# Keyboard Shortcuts

- `Alt+Z` to toggle show/hide sidebar
- `Alt+X` to focus on the search field

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

### 🎨 ComfyUI Themes Support 🎨
![Themes Support ](./images/theme.gif)

### 🎨 New Settings Panel 🎨
![ComfyUI Settings](./images/settings.png)

### Additional Features
- Width and Minimized State of the sidebar are saved in cookies


### Todo:
- [x] Reordering pinned nodes
- [x] Node preview (i don't think it will be an image)
- [x] Color integration with Jovimetrix
- [x] Better search
- [x] Custom Categories!!



## Contributing

Feel free to contribute to this project by reporting issues or suggesting improvements. Open an issue or submit a pull request on the GitHub repository.

## Donations

If you'd like to support the project, consider making a donation ❤️
<br>
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/C0C0AJECJ) 
<a href="https://patreon.com/DreamingAIChannel"><img src="./images/patreon_badge.png" alt="Support me on Patreon" height="27" /></a>

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

