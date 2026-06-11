const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// save global link to the window object
let mainWindow;

function createWindow() {
    // Create browser window
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
            }
        }
    );

    // Download HTML-file to the window
    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

    // Window closing processing
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Create window when app is ready
app.on('ready', createWindow);

// Quit from app when all windows are closed (exept macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// On macOS recreate window upon app is activated
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPS-messages handler
ipcMain.on('message', (event, message) => {
    console.log('Получено сообщение:', message);
    // return answer to the renderer
    mainWindow.webContents.send('response', `Ответ на: ${message}`);
});
