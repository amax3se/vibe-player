const { contextBridge, ipcRenderer } = require('electron');

// Экспортируем API для использования в процессе рендеринга
contextBridge.exposeInMainWorld('electronAPI', {
// Пример функции для отправки сообщения в главный процесс
sendMessage: (message) => ipcRenderer.send('message', message),

// Пример функции для получения ответа от главного процесса
onResponse: (callback) => ipcRenderer.on('response', callback)
});

