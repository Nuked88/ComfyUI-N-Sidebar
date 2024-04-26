import server
import folder_paths
from aiohttp import web
import os
import json



class JSONConfigManager:
    def __init__(self, file_name):
        self.file_name = file_name
        self.initial_config = """
            {"menuctx_category": "Context Menu",
            "menuctx_options": [],
            "menuctx_subOptions": [],
            "menuctx_opt_callback": [],
            "menuctx_sub_opt_callback": []
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
    




file_path = os.path.join(folder_paths.get_folder_paths("custom_nodes")[0],"ComfyUI-N-Sidebar","app","settings.json")


config_manager = JSONConfigManager(file_path)

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

list_panels = os.path.join(folder_paths.get_folder_paths("custom_nodes")[0],"ComfyUI-N-Sidebar","app","panels")

list_panels_array = []
#list folders
folders = os.listdir(list_panels)
for folder in folders:
    if os.path.isdir(os.path.join(list_panels, folder)):
        list_panels_array.append(folder)



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