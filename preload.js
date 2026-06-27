// a bridge between processes
const { contextBridge, ipcRenderer } = require('electron');

// export API for using in rendering process
contextBridge.exposeInMainWorld('electronAPI', {
    sendMessage: (message) => ipcRenderer.send('message', message), // function for sending message to the main process
    onResponse: (callback) => ipcRenderer.on('response', callback), // function for getting message from main process

    // function for sending songs array to the renderer
    onMusicArray: (callback) => ipcRenderer.on('music-array', (event, data) => callback(data)),

    openFileDialog: () => ipcRenderer.send('open-file-dialog'),
    onFileSaved: (callback) => ipcRenderer.on('file-saved', (event, result) => callback(result))
});