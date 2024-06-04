import server
import folder_paths
from aiohttp import web
import os
import json
from collections import OrderedDict
from pathlib import Path
import base64
import shutil



class JSONConfigManager:
    def __init__(self, file_name):
        self.file_name = file_name
        self.initial_config = """
            {"menuctx_category": "Context Menu",
            "menuctx_options": [],
            "menuctx_subOptions": [],
            "menuctx_opt_callback": [],
            "menuctx_sub_opt_callback": [],
            "sb_wf_path": ""
            }"""
        if os.path.isfile(file_name):
            self.data = self.read_json_file()
        else:
           
            self.data = json.loads(self.initial_config)
            self.write_json_file()

    def read_json_file(self):
        try:
            with open(self.file_name, 'r') as file:
                return json.load(file)
        except FileNotFoundError:
            return {}

    def write_json_file(self):
        with open(self.file_name, 'w') as file:
            json.dump(self.data, file, indent=4)

    def read_item(self, parameter_name):
        return self.data.get(parameter_name)

    def update_item(self, parameter_name, new_value):
        self.data[parameter_name] = new_value
        self.write_json_file()

    def delete_item(self, parameter_name):
        if parameter_name in self.data:
            del self.data[parameter_name]
            self.write_json_file()

    def add_item(self, parameter_name, value):
        self.data[parameter_name] = value
        self.write_json_file()

def generate_id(file_path):
    
    encoded_bytes = base64.b64encode(file_path.encode('utf-8'))
    encoded_str = str(encoded_bytes, 'utf-8')
    return encoded_str


"""
def scan_directory(directory, workflows_dict, existing_names, main_path = ''):
    for entry in os.scandir(directory):
        if entry.is_file() and entry.name.endswith('.json'):
            base_name = entry.name[:-5]  # Remove the '.json' extension
            #unique_name = base_name
            
            #if unique_name in workflows_dict:
            #    folder_name = os.path.basename(directory)
            #    unique_name = f"{base_name} (from {folder_name})"
            
            subfolder = entry.path.replace(main_path, '').replace(entry.name, '')

            workflows_dict[base_name] = {"name": base_name,"path": entry.path, "subfolder": subfolder}
            existing_names.add(base_name)
        elif entry.is_dir():
            scan_directory(entry.path, workflows_dict, existing_names,main_path)

"""

def scan_directory(directory, workflows_dict, existing_names, main_path=''):
    for entry in os.scandir(directory):
        if entry.is_file() and entry.name.endswith('.json'):
            base_name = entry.name[:-5]  # Remove the '.json' extension
            subfolder = entry.path.replace(main_path, '').replace(entry.name, '')
            
            unique_id = generate_id(entry.path)
            workflows_dict[unique_id] = {
                "name": base_name,
                "path": entry.path,
                "subfolder": subfolder
            }
            existing_names.add(base_name)
        elif entry.is_dir():
            scan_directory(entry.path, workflows_dict, existing_names, main_path)








# If is different from ComfyUISidebar, change it
if __package__ != "ComfyUI-N-Sidebar":
    RED = "\033[31m"
    END = '\33[0m'
    print(f"{RED}!!!{END}")
    print(f"{RED}!!!{END}")
    print(f"{RED}WARNING:'{__package__}' folder name is WRONG!!! Please rename it 'ComfyUI-N-Sidebar'.{END}")
    print(f"{RED}!!!{END}")
    print(f"{RED}!!!{END}")
else:
    print("ComfyUI-N-Sidebar is loading...") 
    




file_path = os.path.join(os.path.dirname(os.path.realpath(__file__)),"app","settings.json")


config_manager = JSONConfigManager(file_path)

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}


default_path = os.path.join(folder_paths.base_path, "workflows")

try:
    list_workflows_dirs = config_manager.read_item("sb_wf_path").replace("\n\r", "\n").split('\n')
except:
    print("No 'sb_wf_path' in settings.json. Using default path.")
    list_workflows_dirs = []

workflow_dirs = []

for list_workflows in list_workflows_dirs:
    if  os.path.isdir(list_workflows.strip()):
        workflow_dirs.append(list_workflows.strip())

if os.path.isdir(default_path):
    workflow_dirs.insert(0, default_path)



list_panels = os.path.join(os.path.dirname(os.path.realpath(__file__)),"app","panels")

list_workflows_array = []
list_panels_array = []
#list folders
folders = os.listdir(list_panels)
for folder in folders:
    if os.path.isdir(os.path.join(list_panels, folder)):
        list_panels_array.append(folder)


@server.PromptServer.instance.routes.get("/sidebar/backup" )
async def s_get(request):
    backup_path = file_path + ".bak"

    try:
        # Crea una copia di settings.json come settings.json.bak
        shutil.copyfile(file_path, backup_path)
    except Exception as e:
        result = {"result": "ERROR", "message": str(e)}
        return web.json_response(result, content_type='application/json')

    result = {"result": "OK"}
    return web.json_response(result, content_type='application/json')



@server.PromptServer.instance.routes.get("/sidebar/workflows" )
async def s_get(request):
    workflows_dict = {}
    existing_names = set()

    for list_workflows in workflow_dirs:
        scan_directory(list_workflows, workflows_dict, existing_names, list_workflows)

    sorted_workflows_dict = dict(sorted(workflows_dict.items(), key=lambda x: x[1]["name"].lower()))

    return web.json_response(sorted_workflows_dict, content_type='application/json')



@server.PromptServer.instance.routes.post("/sidebar/workflow")
async def s_get(request):

    data = await request.json()

    action = data["action"]

    if action == "delete":
        path = Path(data["path"])
        os.remove(path)
        result = {"result": "OK"}
        return web.json_response(result, content_type='application/json')

    elif action == "rename":
        path = Path(data["path"])
        newName = data["newName"]
        
        if not path.exists():
                raise FileNotFoundError(f"The system cannot find the path specified: {path}")

        new_path = path.with_name(newName).with_suffix('.json')

        if new_path.exists():
            result = {"result": "File already exists!"}
        else:
            #rename 
            os.rename(path, new_path)
            result = {"result": "OK"}
        return web.json_response(result, content_type='application/json')
    else:
        file = data["path"]

        # if file exists
        if os.path.isfile(file):
        
            return web.FileResponse(file)
        else:
            return web.Response(status=403)











@server.PromptServer.instance.routes.get("/sidebar/panels" )
async def s_get(request):
    result = {"panels": list_panels_array}
    return web.json_response(result, content_type='application/json')

 

@server.PromptServer.instance.routes.post("/sidebar/settings" )
async def s_get(request):
    data = await request.json()
    action = data["action"]

    if action == "add":
        parameter = data["parameter"]
        value = data["value"]
        config_manager.add_item(parameter, value)
        result = {"result": "OK"}
        return web.json_response(result, content_type='application/json')
    
    elif action == "update":
        parameter = data["parameter"]
        value = data["value"]
        config_manager.update_item(parameter, value)
        result = {"result": "OK"}
        return web.json_response(result, content_type='application/json')


    elif action == "delete":
        parameter = data["parameter"]
        config_manager.delete_item(parameter)
        result = {"result": "OK"}
        return web.json_response(result, content_type='application/json')

    elif action == "read":
        parameter = data["parameter"]
        read_language = config_manager.read_item(parameter)
        result = {"value": read_language}
        return web.json_response(result, content_type='application/json')
    elif action == "factory_reset":
        config_manager.data = json.loads(config_manager.initial_config)
        config_manager.write_json_file()
        result = {"result": "OK"}
        return web.json_response(result, content_type='application/json')
    else:
        result = {"result": "ERROR"}
        return web.json_response(result, content_type='application/json')



    
    

 

WEB_DIRECTORY = "./app"