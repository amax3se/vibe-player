// a bridge between processes
const { contextBridge, ipcRenderer } = require('electron');

// export API for using in rendering process
contextBridge.exposeInMainWorld('electronAPI', {
    // function for sending message to the main process
    sendMessage: (message) => ipcRenderer.send('message', message),

    // function for getting message from main process
    onResponse: (callback) => ipcRenderer.on('response', callback)
});
