
function joinPath(...paths) {
    return paths.join('/').replace(/\/{2,}/g, '/');
}
function normalizePath(path) {
    return path.replace(/\\/g, '/');  // Converti tutte le backslash in forward slash
}

const assets_downloader = (function () {
    let debounceTimeout;

    let isRebuilding = false;
    
/*
    async function checkProgress() {
        try {
            const response = await fetch(`/sidebar/download/progress`);
            const data = await response.json();

            if (data.progress_list && data.progress_list.length > 0) {
                let allCompleted = true;

                data.progress_list.forEach(download => {
                    const id = download.id;
                    const progress = download.progress;
                    let downloaded_size = parseInt(parseInt(download.downloaded_size) / 1024 / 1024);
                    let total_size = parseInt(parseInt(download.file_size) / 1024 / 1024);

                    const cards = document.querySelectorAll(`[data-result-id="${id}"]`);
                    cards.forEach(card => {
                        if (card) {
                            const progressBar = card.querySelector('.progress-bar');
                            const statusBar = card.querySelector(`.sub-stripe-status`);

                            const downloadButton = card.querySelector(`.sub-stripe-dw`);
                            const pauseButton = card.querySelector(`.sub-stripe-ps`);
                            const cancelButton = card.querySelector(`.sub-stripe-cn`);
                            const completeButton = card.querySelector(`.sub-stripe-complete`);
                            const deleteButton = card.querySelector(`.sub-stripe-delete`);

                            if (progressBar) {
                                downloadButton.style.display = 'none';
                                pauseButton.style.display = 'block';
                                cancelButton.style.display = 'block';
                                deleteButton.style.display = 'none';
                                completeButton.style.display = 'none';

                                progressBar.style.width = `${progress}%`;
                                if (download.task_status === 'error') {


                                    pauseDownload(id, pauseButton, downloadButton);
                                    statusBar.innerHTML = "ERROR!";
                                    createToast('There was an error during the download. Please try again later.');
                                    allCompleted = true;

                                }
                                statusBar.innerHTML = `${downloaded_size} MB / ${total_size} MB`;
                                statusBar.style.display = 'block';

                                if (parseInt(progress) === 100) {
                                    console.log(`Download completed for ${id}!`);
                                    pauseButton.style.display = 'none';
                                    cancelButton.style.display = 'none';
                                    downloadButton.style.display = 'none';
                                    statusBar.style.display = 'none';
                                    completeButton.style.display = 'block';
                                    deleteButton.style.display = 'block';
                                    progressBar.style.width = `0%`;
                                } else {
                                    allCompleted = false;
                                }
                            }
                        }
                    });
                });

                if (allCompleted) {
                    clearInterval(pollingInterval);  // Stoppa il polling se tutto è completato
                    isPolling = false;
                    console.log("All downloads completed!");
                }
            } else {
                console.log("No downloads in progress.");
                clearInterval(pollingInterval);  // Ferma il polling se non ci sono download
                isPolling = false;
            }
        } catch (error) {
            console.error("Error checking download progress:", error);
            clearInterval(pollingInterval);  // Ferma il polling in caso di errore
            isPolling = false;
        }
    }

    function startPolling() {
        if (!isPolling) {
            isPolling = true;
            pollingInterval = setInterval(checkProgress, 1000);  // Esegui checkProgress ogni secondo
        }
    }
    function stopPolling() {
        clearInterval(pollingInterval);  // Ferma il polling manualmente
        isPolling = false;
    }
*/

/********************************/
// Websocket
/*******************************/
let socket;
let reconnectInterval = 5000;  // Interval to attempt reconnection (in milliseconds)
let reconnectAttempts = 0;     // Count the number of reconnection attempts
let maxReconnectAttempts = 10; // Max number of reconnection attempts before giving up

function setupWebSocket() {

    const host = window.location.host;
    const wsUrl = `ws://${host}/sidebar/ws/progress`;
    const socket = new WebSocket(wsUrl);


    socket.onopen = function() {
        console.log('Sidebar WebSocket connection established');
        reconnectAttempts = 0;  // Reset the reconnection attempts when successfully connected
    };

    socket.onmessage = function(event) {
        try{
        const data = JSON.parse(event.data);
 
        if (data.progress_list && data.progress_list.length > 0) {
            let allCompleted = true;

            data.progress_list.forEach(download => {
                const id = download.id;
         
                const progress = parseFloat(download.progress.toFixed(2));
                let downloaded_size = parseInt(parseInt(download.downloaded_size) / 1024 / 1024);
                let total_size = parseInt(parseInt(download.file_size) / 1024 / 1024);

                const cards = document.querySelectorAll(`[data-result-id="${id}"]`);
                cards.forEach(card => {
                    if (card) {
                        const progressBar = card.querySelector('.progress-bar');
                        const statusBar = card.querySelector(`.sub-stripe-status`);

                        const downloadButton = card.querySelector(`.sub-stripe-dw`);
                        const pauseButton = card.querySelector(`.sub-stripe-ps`);
                        const cancelButton = card.querySelector(`.sub-stripe-cn`);
                        const completeButton = card.querySelector(`.sub-stripe-complete`);
                        const deleteButton = card.querySelector(`.sub-stripe-delete`);

                        if (progressBar ) {
                            downloadButton.style.display = 'none';
                            pauseButton.style.display = 'block';
                            cancelButton.style.display = 'block';
                            deleteButton.style.display = 'none';
                            completeButton.style.display = 'none';

                            progressBar.style.width = `${progress}%`;


                            if (download.task_status === 'error') {
                                pauseDownload(id, pauseButton, downloadButton);
                                statusBar.innerHTML = "ERROR!";
                                createToast(`There was an error during the download of ${download.name}. Please try again later.`);
                                allCompleted = true;
                            }
                            else if (download.task_status === 'api_error') {
                                pauseDownload(id, pauseButton, downloadButton);
                                statusBar.innerHTML = "API ERROR!";
                                createToast(`This model (${download.name}) probably needs an API key to be downloaded. Please set it in the <a href="javascript:void()" onclick="showSettings()"><b>settings</b></a>`);
                                allCompleted = true;
                                
                            }

                            statusBar.innerHTML = `${downloaded_size} MB / ${total_size} MB`;
                            statusBar.style.display = 'block';

                            if (parseInt(progress) === 100) {
                                console.log(`Download completed for ${download.name}!`);
                                createToast(`Download completed for ${download.name}!`,timeout = 5000, type = 'info')
                                pauseButton.style.display = 'none';
                                cancelButton.style.display = 'none';
                                downloadButton.style.display = 'none';
                                statusBar.style.display = 'none';
                                completeButton.style.display = 'block';
                                deleteButton.style.display = 'block';
                                progressBar.style.width = `0%`;
                            } else {
                                allCompleted = false;
                            }
                        
                        }
                    }
                });

                
           
            
            if (download.name == 'sb_rebuilding_task') {
                              
                           
                const sb_rebuild_pgs = document.querySelector('.sb-rebuild-pgs')
                const sb_rebuild_pgs_label = document.querySelector('.sb-rebuild-bg-pgs label');
                const sb_rebuild_bg_pgs = document.querySelector('.sb-rebuild-bg-pgs');
                sb_rebuild_bg_pgs.style.display = `block`;
                sb_rebuild_pgs.style.width = `${progress}%`;
                sb_rebuild_pgs_label.innerHTML = `(${progress}%) BUILDING LIBRARY...`;
                if (parseInt(progress) === 100) {
              
                    createToast(`Rebuilding libraries completed!`,timeout = 5000, type = 'info')
                    sb_rebuild_bg_pgs.style.display = 'none';
            
                } 

            }
        });


            if (allCompleted) {
                console.log("All downloads completed!");
                //socket.close();  // Chiude il WebSocket se tutto è completato
            }
        } else {
            
            //socket.close();  // Chiude il WebSocket se non ci sono download
        }

        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
           // socket.close();  // Chiude il WebSocket in caso di errore
        }
    };

    socket.onclose = function(event) {
        console.log(`WebSocket connection closed: ${event.reason || 'Unknown reason'}`);

        if (reconnectAttempts < maxReconnectAttempts) {
            console.log(`Attempting to reconnect in ${reconnectInterval / 1000} seconds...`);
            setTimeout(() => {
                reconnectAttempts++;
                setupWebSocket();  // Try to reconnect
            }, reconnectInterval);
        } else {
            console.error('Max reconnection attempts reached. Connection closed permanently.');
        }
    };

    socket.onerror = function(error) {
        //console.error('WebSocket error:', error);
    };
}

// Avvio della connessione WebSocket
setupWebSocket();


/********************************/
// end websocket
/********************************/


    async function pauseDownload(id, element, downloadButton) {

        //check if paused
        let response = await fetch(`/sidebar/download/progress`);
        const data = await response.json();

        if (data.progress_list && data.progress_list.length > 0) {
            data.progress_list.forEach(async download => {
                if (download.id == id) {
                    if (download.task_status == "paused") {
                        element.style.filter = "brightness(80%)";
                        element.innerHTML = '<i class="pi pi-pause-circle"></i>';
                        //emulate click on download button
                        downloadButton.click();

                        return;
                    }
                    else {
                        response = await fetch('/sidebar/pause', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ id: id })
                        });

                        const result = await response.json();
                        if (result.status == "paused") {
                            element.style.filter = "brightness(180%)";
                            element.innerHTML = '<i class="pi pi-play-circle"></i>';

                        }
                        console.log(result);
                    }
                }
            });
        }



    }

    async function cancelDownload(id, downloadButton, pauseButton, cancelButton, statusBar) {
        let response = await fetch('/sidebar/pause', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        });
        response = await fetch('/sidebar/cancel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        });

        const result = await response.json();
        if (result.status == "canceled") {
            downloadButton.style.display = 'block';
            pauseButton.style.display = 'none';
            cancelButton.style.display = 'none';
            statusBar.style.display = 'none';

        }
        console.log(result);
    }

    async function deleteDownload(id) {
        // confirm deletion
        // if confirmed, delete

        const confirm = window.confirm("Are you sure you want to delete this model?\n Note: If this is a workflow, only the card from the list will be deleted. To delete the file(s) itself, please use the workflow panel.");
        if (!confirm) {
            return;
        }

        let response = await fetch('/sidebar/models/delete' + '?id=' + id, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },

        });

        const result = await response.json();

        return result.status

    }



    async function downloadModel(url, element, image_url, image_type, creator) {
        try {
            const correct_path = await getConfiguration("sb_w_" + element.type.toLowerCase());
            const downloadName = element.modelVersions[0].files[0].name;
            const path = normalizePath(`${correct_path}/${downloadName}`),
                apiKey = await getConfiguration("sb_w_API_key");
            token = '';
            if (apiKey) {
                token = '?token=' + apiKey;

                if (url.indexOf('?') > 0) {
                    token = '&token=' + apiKey;
                }
             
            
                //console.log('token: ' + token);
            }
            // Create a FormData object to send the file URL and path
            const formData = {
                id: element.id,
                name: element.name,
                model_file_name: element.modelVersions[0].files[0].name,
                author: creator,
                url: url + token,
                path: path,
                nsfw: element.nsfw,
                image_url: image_url,
                image_type: image_type,
                model_type: element.type,
                size: element.modelVersions[0].files[0].size,
                hash: element.modelVersions[0].files[0].hashes["BLAKE3"],
                base_model: element.modelVersions[0].baseModel
            };

            //startPolling();
            // Make a POST request to the Python endpoint
            const response = await fetch('/sidebar/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Start checking the progress
                //startPolling();

            } else {
                alert('Error downloading the model.');
            }
        } catch (error) {
            console.error("Error downloading the model:", error);
        }
    }



    function createCards(visual, creator, result) {
        const last_edit = result.last_edit ? result.last_edit : 0;
        return `${visual}
    <div class="image-overlay" id="image-overlay">
        <div class="overlay-content">
            <div class="header">
                <div class="main-stripe">
                    <span class="sub-stripe">
                        <div class="">${result.type}</div>
                        <div class="separator" role="separator"></div>
                        <div class="">${result.modelVersions[0].baseModel}</div>
                    </span>
                </div>
                <div class="sub-stripe-manager" id="sub-stripe-dw-manager">
                    <div class="sub-stripe-dw" id="sub-stripe-dw-${result.id}">
                    <i class="pi pi-download"></i>
                    </div>
                    <div class="sub-stripe-ps" id="sub-stripe-dw-${result.id}">
                    <i class="pi pi-pause-circle"></i>
                    </div>
                    <div class="sub-stripe-cn" id="sub-stripe-dw-${result.id}">
                    <i class="pi pi-times-circle"></i>
                    </div>
                    <div class="sub-stripe-complete" id="sub-stripe-complete-${result.id}" title="Download Complete">
                    <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="sub-stripe-delete" id="sub-stripe-delete-${result.id}" title="Delete Model">
                    <i class="pi pi-trash"></i>
                    </div>

                </div>
                
            </div>
            <div class="content"><div class="sub-stripe-status"></div></div>
            <div class="footer">
                <div class="creator-info">
                    <p class="creator-name"><a href="https://civitai.com/user/${creator}" target="_blank">@${creator}</a></p>
                </div>
                <div class="card-main-text"><a href="https://civitai.com/models/${result.id}/" target="_blank">${result.name}</a></div>
                <div class="stats-section">
                    <span class="stat-item"><i class="pi pi-download"></i>${result.stats.downloadCount}</span>
                    <div class="separator" role="separator"></div>
                    <span class="stat-item"><i class="pi pi-thumbs-up"></i>${result.stats.thumbsUpCount}</span>
                </div>
            </div>
            <input type="hidden" name="nsfw" value="${result.nsfw}">
            <input type="hidden" name="last_edit" value="${last_edit}">
        </div>
    </div>
    <div class="progress-container">
        <div class="progress-bar"></div>
    </div>
`;

    }



    async function loadLibrary() {

        const libraryContainer = document.getElementById('library-container');
        const response = await fetch('/sidebar/checkintegrity');
        const data = await response.json();
        libraryContainer.innerHTML = '';
        // Render the results
        data.forEach(async result => {
            try {
                const card = document.createElement('div');
                card.className = 'card';
                //card.id = result.id;
                card.setAttribute('data-result-id', result.id);


                if (result.image_type === "image") {
                    visual = `<img class="model-image" src="./sidebar/models/image?id=${result.id}&image_name=${result.image_name}" alt="${result.name}" ></img>`;
                } else {
                    visual = `<video class="model-image" autoplay loop><source src="./sidebar/models/image?id=${result.id}&image_name=${result.image_name}" alt="${result.name}" type="video/mp4" /></video>`;
                }
                const creator = result.author;

                const result_data = {
                    id: result.id,
                    name: result.name,
                    type: result.model_type,
                    nsfw: result.nsfw,
                    last_edit: result.last_edit,
                    downloadUrl: result.url,
                    modelVersions: [
                        {
                            baseModel: result.base_model,
                            files: [
                                {
                                    name: result.model_file_name,
                                    size: result.size,
                                    downloadUrl: result.url,
                                    hashes: {
                                        "BLAKE3": result.hash
                                    }
                                }
                            ]
                        }
                    ],
                    stats: {
                        downloadCount: -1,
                        thumbsUpCount: -1
                    }
                };



                card.innerHTML = createCards(visual, creator, result_data)

                const deleteButton = card.querySelector(`.sub-stripe-delete`)
                const downloadButton = card.querySelector(`.sub-stripe-dw`)
                const pauseButton = card.querySelector(`.sub-stripe-ps`)
                const cancelButton = card.querySelector(`.sub-stripe-cn`)

                const statusBar = card.querySelector(`.sub-stripe-status`);

                if (result.status == "valid") {
                    card.querySelector(`.stats-section`).style.display = 'none';
                    downloadButton.style.display = 'none';
                    pauseButton.style.display = 'none';
                    cancelButton.style.display = 'none';
                    card.querySelector(`.sub-stripe-complete`).style.display = 'block';
                    deleteButton.style.display = 'block';
                } else if (result.status == "missing" || result.status == "running") {
                    if (result.model_type == "workflows") {
                        card.querySelector(`.stats-section`).style.display = 'none';
                        downloadButton.style.display = 'none';
                        pauseButton.style.display = 'none';
                        cancelButton.style.display = 'none';
                        card.querySelector(`.sub-stripe-complete`).style.display = 'block';
                        deleteButton.style.display = 'block';
                   
                    } else {
                        card.querySelector(`.stats-section`).style.display = 'none';
                        downloadButton.style.display = 'block';
                        pauseButton.style.display = 'none';
                        deleteButton.style.display = 'block';
                        card.querySelector(`.sub-stripe-complete`).style.display = 'none';
                    }
                   

                    //startPolling();
                }


                downloadButton.addEventListener('click', async function () {
                    //check api key


                    // Call the download function
                    downloadModel(result_data.downloadUrl, result_data, null, null, creator);

                })

                pauseButton.addEventListener('click', async function () {
                    pauseDownload(result.id, pauseButton, downloadButton);


                })

                cancelButton.addEventListener('click', async function () {
                    cancelDownload(result.id, downloadButton, pauseButton, cancelButton, statusBar);
                })
                deleteButton.addEventListener('click', async function () {
                    let resultDel = await deleteDownload(result.id);
                    

                    if (resultDel == "deleted") {
                        //completly remove the card
                        card.remove();

                    }
                })

                // Append card to results container
                libraryContainer.appendChild(card);

                // ANIMATION
                const overlay = card.querySelector('.image-overlay');
                const modelImage = card.querySelector('.model-image'); 

                if (overlay && modelImage) {
                    overlay.addEventListener('mouseover', function () {
                        modelImage.style.transform = 'scale(1.05)';
                    });
  
                    overlay.addEventListener('mouseout', function () {
                        modelImage.style.transform = 'scale(1)';
                    });
                }

            } catch (error) {
                console.error('Error rendering card:', error);
            }

        });
        searchInLibrary(); //apply filters
    }



    async function searchT() {

        // Get search query and filters
        const query = document.getElementById('searchTemplateInput').value;
        const nsfwFilter = Array.from(document.getElementById('nsfwFilter').selectedOptions).map(option => option.value);
        const typeMultiSelectElement = document.getElementById('typeFilter');
        const typeHiddenInputs = typeMultiSelectElement.querySelectorAll('input[type="hidden"]');
        const typeFilter = Array.from(typeHiddenInputs).map(input => input.value);

        const baseModelMultiSelectElement = document.getElementById('baseModelFilter');
        const baseModelHiddenInputs = baseModelMultiSelectElement.querySelectorAll('input[type="hidden"]');
        const baseModelFilter = Array.from(baseModelHiddenInputs).map(input => input.value);

        const sortOption = document.getElementById('sortOption').value;
        const periodOption = document.getElementById('periodOption').value;

        // Set API parameters
        let apiUrl = "./sidebar/proxy/models?";
        const params = new URLSearchParams();

        // Add query parameter if present
        if (query) {
            params.append("query", query);
        }

        // Add NSFW filter
        if (nsfwFilter.length > 0) {
            params.append("nsfw", nsfwFilter.includes('true'));
        }

        // Add type filter
        if (typeFilter.length > 0) {
            typeFilter.forEach(type => params.append("types", type));
        }

        // Add base model filter
        if (baseModelFilter.length > 0) {
            baseModelFilter.forEach(model => params.append("baseModels", model));
        }

        // Add sort option
        if (sortOption) {
            params.append("sort", sortOption);
        }

        // Add period filter
        if (periodOption) {
            params.append("period", periodOption);
        }

        // Limit results to 10 and set pagination to first page
        params.append("limit", 100);
        params.append("page", 1);

        apiUrl += params.toString();

        try {
            // Show loading icon
            const resultsContainer = document.getElementById('results-container');
            resultsContainer.innerHTML = '<i class="pi pi-spin pi-spinner-dotted" style="font-size: 2rem; display: block; margin: auto;"></i>';

            // Fetch data from Civitai API
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();


            // Clear previous results
            resultsContainer.innerHTML = '';

            // Render the results
            data.items.forEach(async result => {
                const card = document.createElement('div');
                card.className = 'card';
                //card.id = result.id;
                card.setAttribute('data-result-id', result.id);

                let visual = '';
                let image_url = '';
                let image_type = '';
                let creator = '';
                try {
                    creator = result.creator?.username || 'Unknown';
                } catch (e) {
                    console.log(e);
                    creator = 'Unknown';
                }
                // Cerca l'immagine da visualizzare
                for (const modelVersion of result.modelVersions) {
                    const images = modelVersion.images;
                    if (images && images.length > 0) {
                        const firstImage = images[0];
                        if (firstImage) {
                            if (firstImage.nsfw === "true") {
                                visual = `<img class="model-image" src="${firstImage.url}" alt="${result.name}" style="filter: blur(20px);" />`;

                            }
                            else {
                                if (firstImage.type === "image") {
                                    visual = `<img class="model-image" src="${firstImage.url}" alt="${result.name}" ></img>`;
                                } else {
                                    visual = `<video class="model-image" autoplay loop><source src="${firstImage.url}" alt="${result.name}" type="video/mp4" /></video>`;
                                }
                            }

                            image_url = firstImage.url
                            image_type = firstImage.type
                            break;
                        }
                    }
                }

                if (visual === '') {
                    visual = '<div class="no-image">No Image Available</div>';
                }


                card.innerHTML = createCards(visual, creator, result);

                // Append card to results container
                resultsContainer.appendChild(card);

                // Aggiungi event listeners corretti per ciascuna card
                const overlay = card.querySelector('.image-overlay');
                const modelImage = card.querySelector('.model-image'); // Seleziona l'immagine specifica di questa card

                if (overlay && modelImage) {
                    overlay.addEventListener('mouseover', function () {
                        modelImage.style.transform = 'scale(1.05)';
                    });

                    overlay.addEventListener('mouseout', function () {
                        modelImage.style.transform = 'scale(1)';
                    });
                }

                const downloadButton = card.querySelector('#sub-stripe-dw-' + result.id);
                const pauseButton = card.querySelector(`.sub-stripe-ps`);
                const cancelButton = card.querySelector(`.sub-stripe-cn`);
                const statusBar = card.querySelector(`.sub-stripe-status`);

                const deleteButton = card.querySelector(`.sub-stripe-delete`);
                const completeButton = card.querySelector(`.sub-stripe-complete`);

                if (result.nsbStatus === "valid") {
                    downloadButton.style.display = "none";
                    completeButton.style.display = "block";
                    deleteButton.style.display = "block";
                }





                /*DOWNLOAD EVENT*/
                downloadButton.addEventListener('click', async function () {
                    //check api key

                    const downloadUrl = result.modelVersions[0].files[0].downloadUrl; // Store download URL in data attribute

                    // Call the download function
                    downloadModel(downloadUrl, result, image_url, image_type, creator);

                })

                pauseButton.addEventListener('click', async function () {
                    pauseDownload(result.id, pauseButton, downloadButton);


                })

                cancelButton.addEventListener('click', async function () {
                    cancelDownload(result.id, downloadButton, pauseButton, cancelButton, statusBar);
                })

                deleteButton.addEventListener('click', async function () {
                    let resultDel = await deleteDownload(result.id);
                    if (resultDel == "deleted") {
                        downloadButton.style.display = 'block';
                        deleteButton.style.display = 'none';
                        completeButton.style.display = 'none';

                    }

                })


            });


        } catch (error) {
            console.error("Error fetching data from API:", error);
        }
    }

    function applySorting(cards, sortOption) {
        const container = document.getElementById('library-container');
        const sortedCards = Array.from(cards).filter(card => card.style.display === "block");  // Solo le card visibili

        // Esegui l'ordinamento
        if (sortOption === "az") {
            console.log("az");
            sortedCards.sort((a, b) => a.querySelector('.card-main-text a').innerText.localeCompare(b.querySelector('.card-main-text a').innerText));
        } else if (sortOption === "za") {
            sortedCards.sort((a, b) => b.querySelector('.card-main-text a').innerText.localeCompare(a.querySelector('.card-main-text a').innerText));
        } else if (sortOption === "Newest") {
            sortedCards.sort((a, b) => {
                const dateA = parseFloat(a.querySelector('input[name="last_edit"]').value);
                const dateB = parseFloat(b.querySelector('input[name="last_edit"]').value);
                return dateB - dateA; // Più recenti prima
            });
        }

        // Prima rimuovi tutte le carte visibili dal container
        sortedCards.forEach(card => container.removeChild(card));

        // Poi reinseriscile in ordine
        sortedCards.forEach(card => container.appendChild(card));
    }


    function searchInLibrary() {


        // Valori di input
        const searchQuery = document.getElementById('searchLibraryInput').value.toLowerCase();
        const nsfwFilter = document.getElementById('nsfwFilterLibrary').value;

        // Filtro tipo (multi-select)
        const typeMultiSelectElement = document.getElementById('typeFilterLibrary');
        const typeHiddenInputs = typeMultiSelectElement.querySelectorAll('input[type="hidden"]');
        const selectedTypes = Array.from(typeHiddenInputs).map(option => option.value.toLowerCase());

        // Filtro baseModels (multi-select)
        const baseModelMultiSelectElement = document.getElementById('baseModelFilterLibrary');
        const baseModelHiddenInputs = baseModelMultiSelectElement.querySelectorAll('input[type="hidden"]');
        const selectedBaseModels = Array.from(baseModelHiddenInputs).map(option => option.value.toLowerCase());

        // Opzione di ordinamento
        const sortOption = document.getElementById('sortOptionLibrary').value;
        console.log(sortOption);

        // Recupera tutte le card dal container
        const cards = document.querySelectorAll('#library-container .card');

        cards.forEach(card => {
            // Recupera i dati dalla card
            const cardTitle = card.querySelector('.card-main-text a').innerText.toLowerCase();
            const cardNSFW = card.querySelector('input[name="nsfw"]').value;

            const cardTypes = Array.from(card.querySelectorAll('.main-stripe .sub-stripe div')).map(el => el.innerText.toLowerCase());
            const cardBaseModel = card.querySelector('.main-stripe .sub-stripe div:nth-child(3)').innerText.toLowerCase();

            // Filtra per testo (searchQuery)
            let matchesSearch = searchQuery === "" || cardTitle.includes(searchQuery);

            // Filtra per NSFW
            let matchesNSFW = (nsfwFilter === true) || (cardNSFW === nsfwFilter);

            // Filtra per tipo (se selezionati)
            let matchesType = selectedTypes.length === 0 || selectedTypes.some(type => cardTypes.includes(type));

            // Filtra per baseModel (se selezionati)
            let matchesBaseModel = selectedBaseModels.length === 0 || selectedBaseModels.includes(cardBaseModel);

            // Mostra o nascondi la card in base ai filtri
            if (matchesSearch && matchesNSFW && matchesType && matchesBaseModel) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });

        // Applica l'ordinamento se richiesto
        applySorting(cards, sortOption);
    }

    async function rebuildLibrary(type_build) {
        const confirm = window.confirm('Are you sure you want to rebuild the library? This will take a while. NOTE: this is an EXPERIMENTAL feature and it may fail any time.');


        if (!confirm) {
            return;
        }


        let response = await fetch('/sidebar/models/rebuild?clear=' + type_build, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },

        });

        const result = await response.json();

        return result.status
    }


    function debounce(fn, delay) {
        return function (...args) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => fn(...args), delay);
        };
    }

    // Create a debounced version of searchT with a 3-second delay
    const debouncedSearchT = debounce(searchT, 700);
    const debouncedSearchType = debounce(searchT, 1500);
    const debouncedSearchInLibrary = debounce(searchInLibrary, 200);
    // Attach the debounced function to the input event
    document.getElementById('searchTemplateInput').addEventListener('input', debouncedSearchT);
 



    /* multiselect*/

    class MultiSelect {

        constructor(element, options = {}) {
            let defaults = {
                placeholder: 'Select item(s)',
                max: null,
                search: false,  // Disable search
                selectAll: false,
                listAll: false,
                closeListOnItemSelect: false,
                name: 'typefilters',
                width: '',
                height: '',
                dropdownWidth: '',
                dropdownHeight: '',
                data: [],
                onChange: function () { },
                onSelect: function () { },
                onUnselect: function () { }
            };
            this.options = Object.assign(defaults, options);
            this.selectElement = typeof element === 'string' ? document.querySelector(element) : element;
            for (const prop in this.selectElement.dataset) {
                if (this.options[prop] !== undefined) {
                    this.options[prop] = this.selectElement.dataset[prop];
                }
            }
            this.name = this.selectElement.getAttribute('name') ? this.selectElement.getAttribute('name') : 'multi-select-typefilter';
            if (!this.options.data.length) {
                let options = this.selectElement.querySelectorAll('option');
                for (let i = 0; i < options.length; i++) {
                    this.options.data.push({
                        value: options[i].value,
                        text: options[i].innerHTML,
                        selected: options[i].selected,
                        html: options[i].getAttribute('data-html')
                    });
                }
            }
            this.element = this._template();
            this.selectElement.replaceWith(this.element);
            this._updateSelected();
            this._eventHandlers();
        }

        _template() {
            let optionsHTML = '';
            for (let i = 0; i < this.data.length; i++) {
                optionsHTML += `
                <div class="multi-select-option${this.selectedValues.includes(this.data[i].value) ? ' multi-select-selected' : ''}" data-value="${this.data[i].value}">
                    <span class="multi-select-option-radio"></span>
                    <span class="multi-select-option-text">${this.data[i].html ? this.data[i].html : this.data[i].text}</span>
                </div>
            `;
            }
            let selectAllHTML = '';
            if (this.options.selectAll === true || this.options.selectAll === 'true') {
                selectAllHTML = `<div class="multi-select-all">
                <span class="multi-select-option-radio"></span>
                <span class="multi-select-option-text">Select all</span>
            </div>`;
            }
            let template = `
            <div class="multi-select ${this.name}"${this.selectElement.id ? ' id="' + this.selectElement.id + '"' : ''} style="${this.width ? 'width:' + this.width + ';' : ''}${this.height ? 'height:' + this.height + ';' : ''}">
                ${this.selectedValues.map(value => `<input type="hidden" name="${this.name}[]" value="${value}">`).join('')}
                <div class="multi-select-header" style="${this.width ? 'width:' + this.width + ';' : ''}${this.height ? 'height:' + this.height + ';' : ''}">
                    <span class="multi-select-header-max">${this.options.max ? this.selectedValues.length + '/' + this.options.max : ''}</span>
                    <span class="multi-select-header-placeholder">${this.placeholder}</span>
                </div>
                <div class="multi-select-options" style="${this.options.dropdownWidth ? 'width:' + this.options.dropdownWidth + ';' : ''}${this.options.dropdownHeight ? 'height:' + this.options.dropdownHeight + ';' : ''}">
                    ${selectAllHTML}
                    ${optionsHTML}
                </div>
            </div>
        `;
            let element = document.createElement('div');
            element.innerHTML = template;
            return element;
        }

        _eventHandlers() {
            let headerElement = this.element.querySelector('.multi-select-header');
            this.element.querySelectorAll('.multi-select-option').forEach(option => {
                option.onclick = () => {
                    let selected = true;
                    if (!option.classList.contains('multi-select-selected')) {
                        if (this.options.max && this.selectedValues.length >= this.options.max) {
                            return;
                        }
                        option.classList.add('multi-select-selected');
                        if (this.options.listAll === true || this.options.listAll === 'true') {
                            if (this.element.querySelector('.multi-select-header-option')) {
                                let opt = Array.from(this.element.querySelectorAll('.multi-select-header-option')).pop();
                                opt.insertAdjacentHTML('afterend', `<span class="multi-select-header-option" data-value="${option.dataset.value}">${option.querySelector('.multi-select-option-text').innerHTML}</span>`);
                            } else {
                                headerElement.insertAdjacentHTML('afterbegin', `<span class="multi-select-header-option" data-value="${option.dataset.value}">${option.querySelector('.multi-select-option-text').innerHTML}</span>`);
                            }
                        }
                        this.element.querySelector('.multi-select').insertAdjacentHTML('afterbegin', `<input type="hidden" name="${this.name}[]" value="${option.dataset.value}">`);
                        this.data.filter(data => data.value == option.dataset.value)[0].selected = true;
                    } else {
                        option.classList.remove('multi-select-selected');
                        this.element.querySelectorAll('.multi-select-header-option').forEach(headerOption => headerOption.dataset.value == option.dataset.value ? headerOption.remove() : '');
                        this.element.querySelector(`input[value="${option.dataset.value}"]`).remove();
                        this.data.filter(data => data.value == option.dataset.value)[0].selected = false;
                        selected = false;
                    }
                    if (this.options.listAll === false || this.options.listAll === 'false') {
                        if (this.element.querySelector('.multi-select-header-option')) {
                            this.element.querySelector('.multi-select-header-option').remove();
                        }
                        headerElement.insertAdjacentHTML('afterbegin', `<span class="multi-select-header-option">${this.selectedValues.length} selected</span>`);
                        //search
                        // debouncedSearchType();
                    }
                    if (!this.element.querySelector('.multi-select-header-option')) {
                        headerElement.insertAdjacentHTML('afterbegin', `<span class="multi-select-header-placeholder">${this.placeholder}</span>`);
                    } else if (this.element.querySelector('.multi-select-header-placeholder')) {
                        this.element.querySelector('.multi-select-header-placeholder').remove();
                    }
                    if (this.options.max) {
                        this.element.querySelector('.multi-select-header-max').innerHTML = this.selectedValues.length + '/' + this.options.max;
                    }
                    if (this.options.search === true || this.options.search === 'true') {
                        this.element.querySelector('.multi-select-search').value = '';
                    }
                    this.element.querySelectorAll('.multi-select-option').forEach(option => option.style.display = 'flex');
                    if (this.options.closeListOnItemSelect === true || this.options.closeListOnItemSelect === 'true') {
                        headerElement.classList.remove('multi-select-header-active');
                    }
                    this.options.onChange(option.dataset.value, option.querySelector('.multi-select-option-text').innerHTML, option);
                    if (selected) {
                        this.options.onSelect(option.dataset.value, option.querySelector('.multi-select-option-text').innerHTML, option);
                    } else {
                        this.options.onUnselect(option.dataset.value, option.querySelector('.multi-select-option-text').innerHTML, option);
                    }
                };
            });
            headerElement.onclick = () => headerElement.classList.toggle('multi-select-header-active');
            if (this.options.selectAll === true || this.options.selectAll === 'true') {
                let selectAllButton = this.element.querySelector('.multi-select-all');
                selectAllButton.onclick = () => {
                    let allSelected = selectAllButton.classList.contains('multi-select-selected');
                    this.element.querySelectorAll('.multi-select-option').forEach(option => {
                        let dataItem = this.data.find(data => data.value == option.dataset.value);
                        if (dataItem && ((allSelected && dataItem.selected) || (!allSelected && !dataItem.selected))) {
                            option.click();
                        }
                    });
                    selectAllButton.classList.toggle('multi-select-selected');
                };
            }
            if (this.selectElement.id && document.querySelector('label[for="' + this.selectElement.id + '"]')) {
                document.querySelector('label[for="' + this.selectElement.id + '"]').onclick = () => {
                    headerElement.classList.toggle('multi-select-header-active');
                };
            }
            document.addEventListener('click', event => {
                if (!event.target.closest('.' + this.name) && !event.target.closest('label[for="' + this.selectElement.id + '"]')) {
                    headerElement.classList.remove('multi-select-header-active');
                }
            });
        }

        _updateSelected() {
            if (this.options.listAll === true || this.options.listAll === 'true') {
                this.element.querySelectorAll('.multi-select-option').forEach(option => {
                    if (option.classList.contains('multi-select-selected')) {
                        this.element.querySelector('.multi-select-header').insertAdjacentHTML('afterbegin', `<span class="multi-select-header-option" data-value="${option.dataset.value}">${option.querySelector('.multi-select-option-text').innerHTML}</span>`);
                    }
                });
            } else {
                if (this.selectedValues.length > 0) {
                    this.element.querySelector('.multi-select-header').insertAdjacentHTML('afterbegin', `<span class="multi-select-header-option">${this.selectedValues.length} selected</span>`);
                }
            }
            if (this.element.querySelector('.multi-select-header-option')) {
                this.element.querySelector('.multi-select-header-placeholder').remove();
            }
        }

        get selectedValues() {
            return this.data.filter(data => data.selected).map(data => data.value);
        }

        get selectedItems() {
            return this.data.filter(data => data.selected);
        }

        set data(value) {
            this.options.data = value;
        }

        get data() {
            return this.options.data;
        }

        set selectElement(value) {
            this.options.selectElement = value;
        }

        get selectElement() {
            return this.options.selectElement;
        }

        set element(value) {
            this.options.element = value;
        }

        get element() {
            return this.options.element;
        }

        set placeholder(value) {
            this.options.placeholder = value;
        }

        get placeholder() {
            return this.options.placeholder;
        }

        set name(value) {
            this.options.name = value;
        }

        get name() {
            return this.options.name;
        }

        set width(value) {
            this.options.width = value;
        }

        get width() {
            return this.options.width;
        }

        set height(value) {
            this.options.height = value;
        }

        get height() {
            return this.options.height;
        }

    }
    document.querySelectorAll('[data-multi-select]').forEach(select => new MultiSelect(select, { onChange: debouncedSearchT }));
    document.querySelectorAll('[data-library-multi-select]').forEach(select => new MultiSelect(select, { onChange: debouncedSearchInLibrary }));

    return {
        searchT: debouncedSearchT,
        downloadModel: downloadModel,
        loadLibrary: loadLibrary,
        searchInLibrary: searchInLibrary,
        setupWebSocket: setupWebSocket,
        rebuildLibrary: rebuildLibrary
    };


})();



addSidebarStyles("panels/assets_downloader/style.css");



const folderDict = {
    "Checkpoint": "models/checkpoints",
    "TextualInversion": "models/embeddings",
    "Hypernetwork": "models/hypernetworks",
    "AestheticGradient": "temp",
    "LORA": "models/loras",
    "LoCon": "models/loras",
    "DoRA": "models/loras",
    "Controlnet": "models/controlnet",
    "Upscaler": "models/upscale_models",
    "MotionModule": "temp",
    "VAE": "models/vae",
    "Poses": "input",
    "Wildcards": "temp",
    "Workflows": "workflows",
    "Other": "temp"
};


addSBSetting("m_section", {
    id: `w_API_key`,
    name: `API Key`,
    info: "Get your API key from https://civitai.com/user/account. Some models require an API key to be downloaded.",
    defaultValue: "",
    type: "text",
    local: false,
    async onChange(value) {
        // Aggiungi il tuo codice di callback
    }
});

// Loop attraverso le option del select
Object.keys(folderDict).forEach(value => {
    if (folderDict[value]) {
        addSBSetting("m_section", {
            id: `w_${value.toLowerCase()}`,
            name: `${value} Save Folder`,
            defaultValue: joinPath(current_path, folderDict[value]),
            type: "text",
            placeholder: "C:....",
            local: false,
            async onChange(value) {
                // Aggiungi il tuo codice di callback
            }
        });
    }
});



addSBSetting("m_section", {
    id: `w_cards`,
    name: `Card Width`,
    type: "slider",
    local: true,
    defaultValue: "220",
    attrs: {
        min: 215,
        max: 600,
        step: 1,
    },
    onChange(value) {
        addDynamicCSSRule('#assets_downloader_main .card, .sb-mymodels .card', 'width', value + 'px');
    },
});

addSBSetting("m_section", {
    id: `h_cards`,
    name: `Card Height`,
    type: "slider",
    local: true,
    defaultValue: "340",
    attrs: {
        min: 100,
        max: 340,
        step: 1,
    },
    onChange(value) {
        addDynamicCSSRule('#assets_downloader_main .card, .sb-mymodels .card', 'height', value + 'px');
    },
})

addSBSetting( "m_section",{
    id: "save_in_subfolder",
    name: "Extract workflows in subfolder",
    defaultValue: "false",
    type: "boolean",
    local: false,
    info: "Workflows will be extracted in a subfolder.",
   

    onChange(value) {
        
    },
});

function createToast(text,timeout = 6000, type = 'error') {
    // Create the toast container div
    const toastDiv = document.createElement('div');
    toastDiv.id = 'n-sb-p-toast';
    toastDiv.className = 'p-toast';
    toastDiv.setAttribute('data-pc-name', 'toast');
    toastDiv.setAttribute('data-pc-section', 'root');
    toastDiv.style.position = 'fixed';
    toastDiv.style.bottom = '20px';
    toastDiv.style.right = '20px';
    toastDiv.style.zIndex = 99999;
    toastDiv.style.opacity = 0; // Set initial opacity for fade-in
    toastDiv.style.transition = 'opacity 0.5s'; // Smooth fade-in and fade-out

    // Append the toast to the body
    document.body.appendChild(toastDiv);

    // Set the inner content of the toast, including the close button
    toastDiv.innerHTML = `<div class="p-toast-message p-toast-message-${type} sb-pi-toast-center" role="alert" aria-live="assertive" aria-atomic="true" data-pc-section="message"><div class="p-toast-message-content" ><div class="p-toast-message-text" ><span class="p-toast-summary" data-pc-section="summary">${text}</span><div class="p-toast-detail" data-pc-section="detail"></div></div><div data-pc-section="buttoncontainer"><button class="p-toast-close-button" type="button" aria-label="Close" autofocus="" data-pc-section="closebutton"><i class="pi pi-times-circle"></i></button></div></div></div>`;

    // Fade-in effect
    setTimeout(() => {
        toastDiv.style.opacity = 1; // Apply fade-in by increasing opacity to 1
    }, 10);

    // Get the close button
    const closeButton = toastDiv.querySelector('.p-toast-close-button');

    // Add event listener to close the toast when the button is clicked
    closeButton.addEventListener('click', () => {
        fadeOutToast(toastDiv); // Trigger fade-out on close
    });

    // Automatically remove the toast after 5 seconds (5000 ms) with fade-out
    setTimeout(() => {
        fadeOutToast(toastDiv); // Trigger fade-out after timeout
    }, timeout);

    // Function to handle fade-out and removal of the toast
    function fadeOutToast(toastElement) {
        toastElement.style.opacity = 0; // Set opacity to 0 for fade-out effect
        setTimeout(() => {
            removeToast(toastElement); // Remove after transition ends
        }, 500); // Wait for the fade-out transition to complete (500ms)
    }

    // Function to remove the toast and its container from the DOM
    function removeToast(toastElement) {
        const parentElement = toastElement.parentNode;
        if (parentElement) {
            parentElement.removeChild(toastElement);  // Remove the toast
        }

        const nSbToast = document.getElementById('n-sb-toast');  // Find the n-sb-toast element
        if (nSbToast) {
            nSbToast.remove();  // Remove n-sb-toast if it exists
        }
    }
}

function toggleMenu() {
    var menu = document.getElementById("sb-menu");
    if (menu.style.display === "block") {
      menu.style.display = "none";
    } else {
      menu.style.display = "block";
    }
  }
  
  // Optional: Close the menu if the user clicks outside of it
  window.onclick = function(event) {
    if (!event.target.matches('.sb-kebab-icon')) {
      var dropdowns = document.getElementsByClassName("sb-menu");
      for (var i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.style.display === "block") {
          openDropdown.style.display = "none";
        }
      }
    }
  }

