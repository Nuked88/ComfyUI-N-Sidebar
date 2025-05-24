import server
import folder_paths
from aiohttp import web
import os
import json
from pathlib import Path
import base64
import shutil
import zipfile
from io import BytesIO
import io
import asyncio
import subprocess
import requests
from urllib.parse import urlencode
import importlib.util
import sys
from packaging import version

def check_and_install(package, import_name="", desired_version=None,reboot=False):
    if import_name == "":
        import_name = package
    try:
        library_module = importlib.import_module(import_name)
        current_version  = getattr(library_module, '__version__', None)
        if current_version :
            if current_version:
                print(f"Current version of {import_name}: {current_version}")
            if desired_version:
                if version.parse(current_version) < version.parse(desired_version):
                    print(f"Updating {import_name} to version {desired_version}...")
                    install_package(f"{package}=={desired_version}")
                    print(f"{import_name} updated successfully to version {desired_version}")
                #else:
                #    print(f"{import_name} is already up-to-date with version {current_version}")

        else:
            print(f"Version of {import_name}: Not found")

        
    except ImportError:
        print(f"Installing {import_name}...")
        install_package(package)


def install_package(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--no-cache-dir", package])

check_and_install('aiofiles')



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

    def get_internal_settings(self):
        try:
            internal_settings = {
               "current_path":  os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))),
            }
            return internal_settings
        except FileNotFoundError:
            return {}
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



def check_model_existence(metadata_path, config_manager, id_model=None):
    metadata_current_path = os.path.join(metadata_path, "models")
    if not os.path.exists(metadata_current_path):
        #create directory
        os.makedirs(metadata_current_path)
    models_report = []

    # Scansione del primo livello della directory
    for model_dir in os.listdir(metadata_current_path):
        model_path = os.path.join(metadata_current_path, model_dir)
        if id_model and id_model != model_dir:
            continue
        if os.path.isdir(model_path):
            # Cerca i file JSON e immagine all'interno della directory del modello
            json_file = None
            image_file = None

            for file_name in os.listdir(model_path):
                if file_name.endswith('.json'):
                    json_file = os.path.join(model_path, file_name)
                elif file_name.endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
                    image_file = os.path.join(model_path, file_name)

            if json_file:
                try:
                    # Leggi il contenuto del file JSON
                    with open(json_file, 'r') as f:
                        model_data = json.load(f)

                    model_type = model_data.get('model_type').lower()
                    model_name = model_data.get('name')
                    expected_size = model_data.get('size')
                    model_hash = model_data.get('hash')
                    model_file_name = model_data.get('model_file_name')
                    # Recupera il percorso corretto dal config manager
                    config_key = f"sb_w_{model_type}"
                    model_base_path = config_manager.read_item(config_key)
                    if model_base_path:
                        full_model_path = os.path.join(model_base_path, model_file_name)

                        model_info = {
                            "id": model_data.get('id'),
                            "name": model_name,
                            "size": expected_size,
                            "author": model_data.get('author'),
                            "url": model_data.get('url'),
                            "image_type": model_data.get('image_type'),
                            "image_name": model_data.get('image_name'),
                            "model_type": model_type,
                            "model_file_name": model_file_name,
                            "hash": model_hash,
                            "base_model" : model_data.get('base_model'),
                            "full_model_path": full_model_path,
                            "nsfw": model_data.get('nsfw'),
                            "status": ""
                        }

                        # Verifica se il modello esiste e confronta la dimensione del file
                        if os.path.isfile(full_model_path):
                            actual_size = os.path.getsize(full_model_path)
                            #get last edit date
                            last_edit = os.path.getctime(json_file)

                            model_info['last_edit'] = last_edit

                            # Confronto delle dimensioni
                            if actual_size == expected_size:
                                model_info['status'] = "valid"
                            else:
                                model_info['status'] = f"size_mismatch (expected: {expected_size} bytes, found: {actual_size} bytes)"
                        else:
                            model_info['status'] = "missing"
                    else:
                        model_info = {
                            "name": model_name,
                            "status": f"model_type_path_missing for {model_type}"
                        }

                    # Aggiungi il report del modello
                    models_report.append(model_info)

                except Exception as e:
                    print(f"Error processing file '{json_file}': {e}")
                    model_info['status'] = "error"
                    continue
    
    return models_report






print("ComfyUI-N-Sidebar is loading...") 
    




file_path = os.path.join(os.path.dirname(os.path.realpath(__file__)),"app","settings.json")
views_path = os.path.join(os.path.dirname(os.path.realpath(__file__)),"app","views","views.json")
views_backup_path = os.path.join(os.path.dirname(os.path.realpath(__file__)),"app","views","views_backup.json")
views_default_path = os.path.join(os.path.dirname(os.path.realpath(__file__)),"app","views","views_default.json")
metadata_path = os.path.join(os.path.dirname(os.path.realpath(__file__)),"metadata")
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



@server.PromptServer.instance.routes.get("/sidebar/current" )
async def s_get(request):
    #current directory
    current_dir = os.path.dirname(os.path.realpath(__file__))
    current_dir_name = os.path.basename(current_dir)

    return web.json_response(current_dir_name, content_type='application/json')




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


@server.PromptServer.instance.routes.get("/sidebar/internal_settings" )
async def s_get(request):
    get_internal_settings = config_manager.get_internal_settings()

    return web.json_response(get_internal_settings, content_type='application/json')


# Endpoint export config
@server.PromptServer.instance.routes.post('/sidebar/export')
async def export_config(request):
    data = await request.json()
    selected_items = data['selected_items']
    export_data = {}
    all_keys = set(config_manager.data.keys())
    keys_to_exclude = set( ['sb_pinnedItems', 'sb_categoryNodeMap','sb_ColorCustomCategories', 'sb_workflowNodeMap','sb_ColorCustomWorkflows', 'sb_templateNodeMap','sb_ColorCustomTemplates'] )


    for item in selected_items:
        if item == '':
            continue 
        elif '|' in item:
            keys = item.split('|')
            for key in keys:
                export_data[key] = config_manager.read_item(key)
                keys_to_exclude.add(key)  
        else:
            export_data[item] = config_manager.read_item(item)
            keys_to_exclude.add(item) 


    if '' in selected_items:
        remaining_keys = all_keys - keys_to_exclude
        for key in remaining_keys:
            export_data[key] = config_manager.read_item(key)

    json_data = json.dumps(export_data, indent=4)

    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        if "model_templates" in selected_items:
            zip_path = export_model_templates()
            zip_file.write(zip_path, 'model_templates.zip')

        zip_file.writestr('config_export.json', json_data)

    zip_buffer.seek(0)
    return web.Response(body=zip_buffer.read(), headers={
        'Content-Disposition': 'attachment; filename="config_export.zip"',
        'Content-Type': 'application/zip'
    })


@server.PromptServer.instance.routes.post('/sidebar/import')
async def import_config(request):
    # Crea un lettore di multipart per leggere file e altri dati
    reader = await request.multipart()
    metadata_current_path = os.path.join(metadata_path, "models")
    if not os.path.exists(metadata_current_path):
        os.makedirs(metadata_current_path)
    # Dati per salvare l'importazione
    selected_items = []
    config_data = None

    # Itera sulle parti della richiesta multipart
    while True:
        part = await reader.next()
        if part is None:
            break

        if part.name == 'file':
            # Carica il file inviato (può essere JSON o ZIP)
            filename = part.filename
            file_data = await part.read()

            # Verifica se è un file zip
            if zipfile.is_zipfile(io.BytesIO(file_data)):
                # Estrai i file dallo zip
                with zipfile.ZipFile(io.BytesIO(file_data)) as zip_file:
                    for file_name in zip_file.namelist():
                        with zip_file.open(file_name) as f:
                            if file_name == 'config_export.json':
                                config_data = json.load(f)
                            elif file_name == 'model_templates.zip':
      
                                with zipfile.ZipFile(io.BytesIO(f.read())) as model_zip:
                                    model_zip.extractall(metadata_current_path)
                                    

            else:
                
                config_data = json.loads(file_data)

        elif part.name == 'selected_items':
            # Leggi i dati selezionati come JSON
            selected_items = json.loads(await part.text())

    # Ora `config_data` contiene il JSON importato dal file (sia ZIP che JSON singolo)
    # e `selected_items` contiene le chiavi da importare

    if config_data:
        for item in selected_items:
            if item:
                # Separa le chiavi multiple
                keys = item.split('|')
                for key in keys:
                    if key in config_data:
                        config_manager.update_item(key, config_data[key])
            else:
                # Importa tutti i dati tranne quelli specifici
                for key, value in config_data.items():
                    if key not in ['sb_pinnedItems', 'sb_categoryNodeMap', 'sb_workflowNodeMap', 'sb_templateNodeMap', 'sb_ColorCustomCategories', 'sb_ColorCustomWorkflows', 'sb_ColorCustomTemplates']:
                        config_manager.update_item(key, value)

    return web.json_response({'status': 'success'})

@server.PromptServer.instance.routes.post("/sidebar/restorelayout")
async def restore_layout(request):
    try:
        # Check if the backup file exists
        if not Path(views_default_path).exists():
            result = {"result": "Error", "message": "Backup file not found."}
            return web.json_response(result, content_type='application/json', status=404)

        # Restore views.json from the backup
        with open(Path(views_default_path), 'r', encoding='utf-8') as f:
            backup_data = json.load(f)

        # Write the backup data to views.json
        with open(Path(views_path), 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=4)

        # Respond with success
        result = {"result": "OK", "message": "Layout successfully restored."}
        return web.json_response(result, content_type='application/json')

    except Exception as e:
        # Error handling
        print(f"Error restoring layout: {e}")
        result = {"result": "Error", "message": str(e)}
        return web.json_response(result, content_type='application/json', status=500)
    

@server.PromptServer.instance.routes.post("/sidebar/savelayout")
async def save_layout(request):
    try:
        # Otteniamo i dati JSON dalla richiesta POST
        data = await request.json()


         # If views.json exists, create a backup
        if Path(views_path).exists():
            os.replace(Path(views_path), Path(views_backup_path))

        # Save the new layout to views.json
        with open(Path(views_path), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

        # Success response
        result = {"result": "OK", "message": "Layout saved successfully."}
        return web.json_response(result, content_type='application/json')

    except Exception as e:
        # Error handling
        print(f"Error saving layout: {e}")
        result = {"result": "Error", "message": str(e)}
        return web.json_response(result, content_type='application/json', status=500)
    

@server.PromptServer.instance.routes.get("/sidebar/views")
async def s_get(request):
    # if file exists
    if os.path.isfile(views_path):
    
        return web.FileResponse(views_path)
    else:
        return web.Response(status=403)

@server.PromptServer.instance.routes.get("/sidebar/panels")
async def s_get_panels(request):
    # Definisce il percorso della directory "panels"
    panels_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "app", "panels")
    
    # Verifica se la directory esiste
    if os.path.isdir(panels_path):
        # Crea una lista con i nomi delle cartelle nella directory "panels"
        folder_names = [folder for folder in os.listdir(panels_path) if os.path.isdir(os.path.join(panels_path, folder))]
        
        # Restituisce la lista di nomi di cartelle in formato JSON
        return web.json_response(folder_names)
    else:
        # Se la directory non esiste, restituisce un errore 403
        return web.Response(status=403)
    




@server.PromptServer.instance.routes.post("/sidebar/execute")
async def execute(request):
    try:
        data = await request.json()
        command = data.get('command', '')

        # Esegui il comando
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        # Ritorna l'output del comando
        output = stdout.decode() + stderr.decode()
        return web.json_response({'output': output})
    except Exception as e:
        return web.json_response({'output': str(e)}, status=500)


async def fetch_data(request):
    api_url = "https://civitai.com/api/v1/models"
    params = request.rel_url.query
    response = requests.get(api_url, params=params)
    data = response.text

    return web.Response(text=data, content_type='application/json')


@server.PromptServer.instance.routes.get("/sidebar/proxy/models")
async def proxy_models(request):
    try:

        params = request.query
        api_url = "https://civitai.com/api/v1/models"
        headers = {
            "Content-Type": "application/json"
        }

        full_url = f"{api_url}?{urlencode(params)}"

        async with aiohttp.ClientSession() as session:
            async with session.get(full_url, headers=headers) as response:
                response_data = await response.json()
                for item in response_data.get("items", []):
                    json_data = check_model_existence(metadata_path, config_manager, str(item["id"]))

                    if len(json_data) > 0:
                        item["nsbStatus"] = json_data[0].get("status")

                return web.json_response(response_data)

    except Exception as e:
        return web.json_response({'error': str(e)}, status=500)

def export_model_templates():
    metadata_current_path = os.path.join(metadata_path, "models")
    zip_name = "model_templates.zip"
    
    zip_path = os.path.join(metadata_path, zip_name)
    
   
    if os.path.exists(zip_path):
        os.remove(zip_path)

    shutil.make_archive(os.path.join(metadata_path, zip_name.replace('.zip', '')), 'zip', metadata_current_path)
    
    return zip_path




def createJSONInfo(metadata_current_path, data,total_size,image_name):
    if not os.path.exists(os.path.join(metadata_current_path, f"{data['id']}.json")):
        info_path = os.path.join(metadata_current_path, f"{data['id']}.json")

        #remove from url ?token=...
        data['url'] = data['url'].split('?token=')[0]
        
        info = {
            "id": data['id'],
            "name": data['name'],
            "size": total_size,
            "author": data['author'],
            "url": data['url'],
            "image_type": data['image_type'],
            "image_name": image_name,
            "model_type": data['model_type'],
            "model_file_name" :  data['model_file_name'],
            "base_model": data['base_model'],
            "nsfw": data['nsfw'],
            "hash": data['hash']
        }
        with open(info_path, 'w') as f:
            json.dump(info, f)

import aiohttp
import aiofiles
import traceback

download_progress = {}
download_tasks = {}
downloads = {}
@server.PromptServer.instance.routes.post('/sidebar/download')
async def download_model(request):
    try:
        data = await request.json()
        id_download = data['id']
        name = data['name']
        model_url = data['url']
        save_path = data['path']
        image_url = data['image_url']
        image_type = data['image_type']
        nsfw = data['nsfw']
        metadata_current_path = os.path.join(metadata_path,"models", str(id_download))
        if not os.path.exists(metadata_current_path):
                os.makedirs(metadata_current_path)
        image_name = ''
    



        # Scarica l'immagine o il video e salvalo
        if image_url:
            image_ext = os.path.splitext(image_url)[1]
            if image_type == "image":
                image_name = str(id_download) + image_ext
            else:
                image_name = str(id_download) + ".mp4"

            image_path = os.path.join(metadata_current_path, image_name)
            
            if not os.path.exists(image_path):
                async with aiohttp.ClientSession() as session:
                  async with session.get(image_url) as image_response:
                      image_data = await image_response.read()
                      with open(image_path, 'wb') as f:
                          f.write(image_data)



        # Verifica se il file finale esiste già
        if os.path.exists(save_path) and os.path.getsize(save_path) > 200:
            downloads[id_download] = {
                "name": name,
                "progress": 100,
                "task": None,
                "temp_save_path": None,
                "file_size": None,
                "downloaded_size": None,
                "status": "finished",
                "nsfw": nsfw
            }
            headers = {
            'Range': f'bytes=0-'
            }
            #only for check size
            async with aiohttp.ClientSession() as session:
                async with session.get(model_url, headers=headers) as response:
                    total_size = int(response.headers.get('content-length', 0))

                    createJSONInfo(metadata_current_path, data,total_size,image_name)

            return web.Response(text=json.dumps({'status': 'already_exists'}), content_type='application/json')

        # Percorso del file temporaneo con estensione .part
        temp_save_path = save_path + '.part'

        # Inizializza il progresso
        if os.path.exists(temp_save_path):
            # Se il file .part esiste, riprende dal punto interrotto
            downloaded_size = os.path.getsize(temp_save_path)
        else:
            # Se non esiste, inizia da zero
            downloaded_size = 0

        headers = {
            'Range': f'bytes={downloaded_size}-'
        }

        # Definizione della coroutine del download
        async def download_coroutine(downloaded_size):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(model_url, headers=headers) as response:
                        total_size = int(response.headers.get('content-length', 0)) + downloaded_size
                        
                        # Gestione della cartella dei metadati e del file immagine


                        createJSONInfo(metadata_current_path, data,total_size,image_name)
                        downloads[id_download]['name'] = name
                        # Imposta la progressione del download
                        downloads[id_download]['file_size'] = total_size
                        downloads[id_download]['downloaded_size'] = downloaded_size 
                        downloads[id_download]['progress'] = (downloaded_size / total_size) * 100

                        if total_size < 200:
                            downloads[id_download]['status'] = "api_error"
                            raise Exception("Probably API error")
                        # Effettua il download del contenuto e aggiorna il progresso
                        async with aiofiles.open(temp_save_path, 'ab') as f:
                            while True:
                                chunk = await response.content.read(1024)
                                if not chunk:
                                    break
                                downloaded_size += len(chunk)
                                downloads[id_download]['downloaded_size'] = downloaded_size
                                downloads[id_download]['progress'] = (downloaded_size / total_size) * 100
                                downloads[id_download]['status'] = "running"
                                
                                await f.write(chunk)

                        # Download completato, rinomina il file .part al nome finale
                        downloads[id_download]['progress'] = 100  # Completo
                        if (downloaded_size / total_size) * 100 == 100:
                            try:
                                # change name only if download is complete
                                file_path = data['path']
                            
                                os.rename(temp_save_path, file_path)
                                # if is a zip file, unzip it and delete it
                                if file_path.endswith('.zip'):
                                    saveInSubfolder = config_manager.read_item('sb_save_in_subfolder')
                    
                                    if saveInSubfolder == True:

                                        save_path_zip = file_path.replace('.zip', '')
                                        if not os.path.exists(os.path.dirname(save_path_zip)):
                                            os.makedirs(save_path_zip)
                                        shutil.unpack_archive(file_path, save_path_zip)

                                    else:
                                        shutil.unpack_archive(file_path, os.path.dirname(file_path))
                                    os.remove(file_path)

                            except Exception as e:
                                print(e)
                                traceback.print_exc()



                            downloads[id_download]['status'] = "completed"

                return web.Response(text=json.dumps({'status': 'success'}), content_type='application/json')

            except Exception as e:
                if downloads[id_download]['status'] != "api_error":
                    downloads[id_download]['status'] = "error"
                return web.json_response({'error': str(e)}, status=500)

        # Avvia il download e memorizza il task e il percorso temporaneo nel dizionario downloads
        task = server.PromptServer.instance.loop.create_task(download_coroutine(downloaded_size))
        downloads[id_download] = {
            "task": task,
            "progress": 0,
            "temp_save_path": temp_save_path
        }

        return web.Response(text=json.dumps({'status': 'downloading'}), content_type='application/json')

    except Exception as e:
        return web.json_response({'error': str(e)}, status=500)

@server.PromptServer.instance.routes.post('/sidebar/pause')
async def pause_download(request):
    try:
        data = await request.json()
        id_download = data['id']

        download_info = downloads.get(id_download)
        if download_info:
            task = download_info['task']
            
            # Cancella il task del download
            if task:
                task.cancel()
                
            # Aggiorna lo stato del progresso al 50% o a un altro stato indicativo di pausa, se necessario
            downloads[id_download]['progress'] = downloads[id_download].get('progress', 0)
            downloads[id_download]['status'] = 'paused'
            
            return web.Response(text=json.dumps({'status': 'paused'}), content_type='application/json')
        else:
            return web.json_response({'error': 'Download not found'}, status=404)

    except Exception as e:
        return web.json_response({'error': str(e)}, status=500)


@server.PromptServer.instance.routes.post('/sidebar/cancel')
async def cancel_download(request):
    try:
        data = await request.json()
        id_download = data['id']

        download_info = downloads.get(id_download)
        if download_info:
            task = download_info['task']
            temp_save_path = download_info['temp_save_path']
            
            # Cancella il task del download
            if task:
                task.cancel()
            
            # Rimuove il file .part se esiste
            if temp_save_path and os.path.exists(temp_save_path):
                os.remove(temp_save_path)

            # Rimuove il download dal dizionario
            downloads.pop(id_download, None)
            
            return web.Response(text=json.dumps({'status': 'canceled'}), content_type='application/json')
        else:
            return web.json_response({'error': 'Download not found'}, status=404)

    except Exception as e:
        return web.json_response({'error': str(e)}, status=500)

@server.PromptServer.instance.routes.get('/sidebar/download/progress')
async def get_progress(request):
    id_download = request.query.get('id')
    
    # Se viene passato un ID specifico
    if id_download:
        download_info = downloads.get(id_download)
        if download_info:
            # Restituisci tutte le informazioni del download per l'ID specifico
            return web.json_response({
                'id': id_download,
                'progress': download_info.get('progress', 0),
                'temp_save_path': download_info.get('temp_save_path'),
                'task_status': download_info.get('status'),
                'file_size': download_info.get('file_size', 'Unknown'),
                'downloaded_size': download_info.get('downloaded_size', 0)

            })
        else:
            return web.json_response({'error': 'Download not found'}, status=404)
    
    # Se non viene passato un ID, restituisci tutte le informazioni per tutti i download attivi
    all_progress = [
        {
            'id': key,
            'progress': value.get('progress', 0),
            'temp_save_path': value.get('temp_save_path'),
            'task_status': value.get('status'),
            'file_size': value.get('file_size', 'Unknown'),
            'downloaded_size': value.get('downloaded_size', 0)

        }
        for key, value in downloads.items()
    ]
    
    return web.json_response({'progress_list': all_progress})



################################################################################################################
@server.PromptServer.instance.routes.get('/sidebar/ws/progress')
async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    try:
        while True:
            # Controlla se la connessione è ancora aperta
            if ws.closed:
                print("Client disconnected.")
                break
            
            # Costruisci la lista di progressi da inviare al client
            all_progress = [
                {
                    'id': key,
                    'name': value.get('name'),
                    'progress': value.get('progress', 0),
                    'temp_save_path': value.get('temp_save_path'),
                    'task_status': value.get('status'),
                    'file_size': value.get('file_size', 'Unknown'),
                    'downloaded_size': value.get('downloaded_size', 0)
                }
                for key, value in downloads.items()
            ]
            
            try:
                # Invia i progressi tramite WebSocket
                await ws.send_json({'progress_list': all_progress})

                # remove the id with progress 100
                for id_download in list(downloads.keys()):
                    if downloads[id_download]['progress'] == 100:
                        downloads.pop(id_download, None)

            except ConnectionResetError:
                #print("Connection was closed while sending data.")
                break
            
            # Attendere un secondo prima di inviare nuovamente
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass
        #print("WebSocket connection closed.")
    finally:
        pass
        #print("WebSocket handler terminated.")
    
    return ws






################################################################################################################




@server.PromptServer.instance.routes.get('/sidebar/checkintegrity')
async def get_progress(request):
    id_model = request.query.get('id')  
    if id_model:
        res=  check_model_existence(metadata_path, config_manager, id_model)
    else:
        res=  check_model_existence(metadata_path, config_manager)
    return web.json_response(res, content_type='application/json')

@server.PromptServer.instance.routes.get('/sidebar/models/image')
async def show_image(request):
    id_model = request.query.get('id')  
    image_name = request.query.get('image_name')   
    image_current_path = os.path.join(metadata_path,"models", str(id_model), image_name)

    return web.FileResponse(image_current_path)


@server.PromptServer.instance.routes.get('/sidebar/models/delete')
async def delete_model(request):
    id_model = request.query.get('id')
    res = check_model_existence(metadata_path, config_manager, id_model)

    model_info_current_path = os.path.join(metadata_path,"models", str(id_model))
    model_current_path =  res[0].get("full_model_path")
    model_current_path_part =  res[0].get("full_model_path")+".part"

    if os.path.exists(model_current_path):
        #delete file
        os.remove(model_current_path)

    #if some part are still there
    if os.path.exists(model_current_path_part):
        os.remove(model_current_path_part)


    if os.path.exists(model_info_current_path):
        shutil.rmtree(model_info_current_path)

    return web.Response(text=json.dumps({'status': 'deleted'}), content_type='application/json')


import hashlib

def hash_files_in_directory_SHA(file_path):
    try:
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(8192):
                hasher.update(chunk)

        return hasher.hexdigest()

    except Exception as e:
        print(f"Error hashing {file_path}: {e}")
        return None
    
async def get_model_info(model_id):
    full_url = f"https://civitai.com/api/v1/model-versions/models/{model_id}/"
    headers = {
            "Content-Type": "application/json"
        }

    async with aiohttp.ClientSession() as session:
        async with session.get(full_url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                return data
            else:
                return None
"""
@server.PromptServer.instance.routes.get('/sidebar/models/rebuild')
async def rebuild_library(request):
    try:
        if downloads[0]['status'] == "running":
            return web.json_response({'error': 'Model rebuilding is already in progress'}, status=400)
    except KeyError:
        pass
    async def coroutine():
   
        loop = asyncio.get_event_loop()
        model_found = 0
        models_currently_done = 0
        
        downloads[0] = {
                'name': "sb_rebuilding_task",
                'file_size': model_found,
                'downloaded_size': models_currently_done,
                'progress': 0,  # initialization with 0
                'status': "running",
                'temp_save_path': ''
            
        }

        try:
            # Model directory
            allowed_directories = [config_manager.read_item("sb_w_checkpoint"),
                                   config_manager.read_item("sb_w_textualinversion"),
                                   config_manager.read_item("sb_w_hypernetwork"),
                                   config_manager.read_item("sb_w_lora"),
                                   config_manager.read_item("sb_w_controlnet"), 
                                   config_manager.read_item("sb_w_upscaler"), 
                                   config_manager.read_item("sb_w_vae")]
            files_path = []
            for directory in allowed_directories:
                for root, _, files in os.walk(directory):
                    #model_found += sum(1 for file in files if file.endswith(('.safetensors', '.ckpt')))
                    for file in files:
                        model_found += 1
                        if file.endswith(('.safetensors', '.ckpt')):
                            files_path.append(os.path.join(root, file))


            downloads[0]['status'] = "running"
            downloads[0]['file_size']=  model_found

            if model_found == 0:
                return web.json_response({'error': 'No models found'}, status=404)
            
            # Loop through models
            for file_path in files_path:
                file_name = os.path.basename(file_path)
                # Get file size in a non-blocking way
                total_size = await loop.run_in_executor(None, os.path.getsize, file_path)

                try:
                    # Run hash calculation in a thread
                    h = await loop.run_in_executor(None, hash_files_in_directory_SHA, file_path)

                    full_url = f"https://civitai.com/api/v1/model-versions/by-hash/{h}/"
                    headers = {"Content-Type": "application/json"}

                    async with aiohttp.ClientSession() as session:
                        async with session.get(full_url, headers=headers) as response:
                            response_data = await response.json()

                            id_download = response_data.get("id")
                            id_model = response_data.get("modelId")
                            image_url = response_data.get("images", [])[0].get("url")
                            image_type = response_data.get("images", [])[0].get("type")

                            # Get more model information asynchronously
                            info = await get_model_info(id_model)
                            creator = info.get("creator").get("username") if info else "Unknown"

                            # Create metadata directory in a non-blocking way
                            metadata_current_path = os.path.join(metadata_path, "models", str(id_model))
                            await loop.run_in_executor(None, os.makedirs, metadata_current_path)

                            image_name = ''

                            # Download image asynchronously
                            if image_url:
                                image_ext = os.path.splitext(image_url)[1]
                                image_name = str(id_model) + (image_ext if image_type == "image" else ".mp4")
                                image_path = os.path.join(metadata_current_path, image_name)

                                if not os.path.exists(image_path):
                                    async with session.get(image_url) as image_response:
                                        image_data = await image_response.read()
                                        # Write image to file asynchronously
                                        await loop.run_in_executor(None, lambda: open(image_path, 'wb').write(image_data))

                            # Create JSON with model information asynchronously
                            data = {
                                "id": id_model,
                                "name": response_data.get("model").get("name"),
                                "size": total_size,
                                "author": creator,
                                "url": response_data.get("downloadUrl"),
                                "image_type": image_type,
                                "image_name": image_name,
                                "model_type": response_data.get("model").get("type"),
                                "model_file_name": file_name,
                                "base_model": response_data.get("baseModel"),
                                "nsfw": response_data.get("model").get("nsfw"),
                                "hash": h
                            }

                            # Write JSON asynchronously
                            await loop.run_in_executor(None, createJSONInfo, metadata_current_path, data, total_size, image_name)

                except Exception as e:
                    print(f"Error hashing {file_path}: {e}")

                # Increment processed models
                models_currently_done += 1
                downloads[0]['downloaded_size'] = models_currently_done
                downloads[0]['progress'] = (models_currently_done / model_found) * 100

            downloads[0]['status'] = "ended"

            # Return response after completion
            return web.json_response({'status': 'building complete'}, status=200)

        except Exception as e:

            downloads[0]['status'] = f"error"
            return web.json_response({'error': str(e)}, status=500)
    
    # Start the coroutine as a task
    task = server.PromptServer.instance.loop.create_task(coroutine())

    # Immediate response to the client while the task is running
    return web.Response(text=json.dumps({'status': 'building'}), content_type='application/json')
"""

@server.PromptServer.instance.routes.get('/sidebar/models/rebuild')
async def rebuild_library(request):
    try:
        # Check if rebuilding is already in progress
        if downloads[0]['status'] == "running":
            return web.json_response({'error': 'Model rebuilding is already in progress'}, status=400)
    except KeyError:
            pass
    
    try:
        clear_flag = request.query.get('clear', '0').lower() == '1'
        processed_models_file = os.path.join(metadata_path, "processed_models.txt") 
        
        # If clear=1, delete the temporary file and start from scratch
        if clear_flag == 1 and os.path.exists(processed_models_file):
            os.remove(processed_models_file)
            #clear models folder 
            shutil.rmtree(os.path.join(metadata_path, "models"))
    except Exception as e:
        print(f"Error deleting temporary file: {e}")
    

    async def coroutine():
        loop = asyncio.get_event_loop()
        model_found = 0
        models_currently_done = 0

        # Read already processed models from the temporary file
        processed_models = set()
        if os.path.exists(processed_models_file):
            with open(processed_models_file, "r") as f:
                processed_models = set(line.strip() for line in f)

        downloads[0] = {
            'name': "sb_rebuilding_task",
            'file_size': model_found,
            'downloaded_size': models_currently_done,
            'progress': 0,  # initialization with 0
            'status': "running",
            'temp_save_path': ''
        }

        try:
            # Allowed directories
            allowed_directories = [
                config_manager.read_item("sb_w_checkpoint"),
                config_manager.read_item("sb_w_textualinversion"),
                config_manager.read_item("sb_w_hypernetwork"),
                config_manager.read_item("sb_w_lora"),
                config_manager.read_item("sb_w_controlnet"),
                config_manager.read_item("sb_w_upscaler"),
                config_manager.read_item("sb_w_vae")
            ]

            files_path = []
            for directory in allowed_directories:
                for root, _, files in os.walk(directory):
                    for file in files:
                        full_path = os.path.join(root, file)
                        model_found += 1

                        # Add to file_path only models not yet processed
                        if file.endswith(('.safetensors', '.ckpt')) and full_path not in processed_models:
                            files_path.append(full_path)

            downloads[0]['status'] = "running"
            downloads[0]['file_size'] = model_found

            if model_found == 0:
                return web.json_response({'error': 'No models found'}, status=404)

            # Loop through the models
            for file_path in files_path:
                file_name = os.path.basename(file_path)

                # Get the file size in a non-blocking way
                total_size = await loop.run_in_executor(None, os.path.getsize, file_path)

                try:
                    # Run hash calculation in a thread
                    h = await loop.run_in_executor(None, hash_files_in_directory_SHA, file_path)

                    full_url = f"https://civitai.com/api/v1/model-versions/by-hash/{h}/"
                    headers = {"Content-Type": "application/json"}

                    async with aiohttp.ClientSession() as session:
                        async with session.get(full_url, headers=headers) as response:
                            response_data = await response.json()

                            id_download = response_data.get("id")
                            id_model = response_data.get("modelId")
                            image_url = response_data.get("images", [])[0].get("url")
                            image_type = response_data.get("images", [])[0].get("type")

                            # Get more model information asynchronously
                            info = await get_model_info(id_model)
                            creator = info.get("creator").get("username") if info else "Unknown"

                            metadata_current_path = os.path.join(metadata_path, "models", str(id_model))
                            if os.path.exists(metadata_current_path):
                                shutil.rmtree(metadata_current_path)
                            await loop.run_in_executor(None, os.makedirs, metadata_current_path)

                            image_name = ''
                            if image_url:
                                image_ext = os.path.splitext(image_url)[1]
                                image_name = str(id_model) + (image_ext if image_type == "image" else ".mp4")
                                image_path = os.path.join(metadata_current_path, image_name)

                                if not os.path.exists(image_path):
                                    async with session.get(image_url) as image_response:
                                        image_data = await image_response.read()
                                        await loop.run_in_executor(None, lambda: open(image_path, 'wb').write(image_data))

                            # Create JSON with model information
                            data = {
                                "id": id_model,
                                "name": response_data.get("model").get("name"),
                                "size": total_size,
                                "author": creator,
                                "url": response_data.get("downloadUrl"),
                                "image_type": image_type,
                                "image_name": image_name,
                                "model_type": response_data.get("model").get("type"),
                                "model_file_name": file_name,
                                "base_model": response_data.get("baseModel"),
                                "nsfw": response_data.get("model").get("nsfw"),
                                "hash": h
                            }

                            # Write JSON to file
                            await loop.run_in_executor(None, createJSONInfo, metadata_current_path, data, total_size, image_name)

                            # Update the temporary file with the processed model
                            with open(processed_models_file, "a") as f:
                                f.write(file_path + "\n")

                except Exception as e:
                    print(f"Error hashing {file_path}: {e}")

                # Increment the processed models count
                models_currently_done += 1
                downloads[0]['downloaded_size'] = models_currently_done
                downloads[0]['progress'] = (models_currently_done / model_found) * 100

            downloads[0]['status'] = "ended"
            downloads[0]['progress'] = 100

            # Final response
            return web.json_response({'status': 'building complete'}, status=200)

        except Exception as e:
            downloads[0]['status'] = f"error"
            return web.json_response({'error': str(e)}, status=500)

    # Start the coroutine as a task
    task = server.PromptServer.instance.loop.create_task(coroutine())

    # Immediate response to the client
    return web.Response(text=json.dumps({'status': 'building'}), content_type='application/json')


WEB_DIRECTORY = "./app"