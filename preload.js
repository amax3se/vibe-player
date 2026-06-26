// a bridge between processes
const { contextBridge, ipcRenderer } = require('electron');

// export API for using in rendering process
contextBridge.exposeInMainWorld('electronAPI', {
    // function for sending songs array to the renderer
    onMusicArray: (callback) => ipcRenderer.on('music-array', (event, data) => callback(data)),

    // function for sending message to the main process
    sendMessage: (message) => ipcRenderer.send('message', message),

    // function for getting message from main process
    onResponse: (callback) => ipcRenderer.on('response', callback),

    saveAudioFile: (filePath) => ipcRenderer.send('save-audio-file', filePath),
    onFileSaved: (callback) => ipcRenderer.on('file-saved', (event, result) => callback(result))
});