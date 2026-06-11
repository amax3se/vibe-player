const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Сохраняем глобальную ссылку на объект окна
let mainWindow;

function createWindow() {
// Создаем окно браузера
mainWindow = new BrowserWindow({
width: 800,
height: 600,
webPreferences: {
preload: path.join(__dirname, 'preload.js'),
nodeIntegration: false,
contextIsolation: true
}
});

// Загружаем HTML-файл в окно
mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

// Открываем DevTools при необходимости
// mainWindow.webContents.openDevTools();

// Обработка закрытия окна
mainWindow.on('closed', () => {
mainWindow = null;
});
}

// Создаем окно, когда приложение готово
app.on('ready', createWindow);

// Выход из приложения, когда все окна закрыты (кроме macOS)
app.on('window-all-closed', () => {
if (process.platform !== 'darwin') {
app.quit();
}
});

// На macOS пересоздаем окно при активации приложения
app.on('activate', () => {
if (mainWindow === null) {
createWindow();
}
});

// Добавим в существующий main.js
ipcMain.on('message', (event, message) => {
console.log('Получено сообщение:', message);
// Отправляем ответ обратно в рендерер
mainWindow.webContents.send('response', `Ответ на: ${message}`);
});

