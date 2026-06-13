const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let musicArray = []; 

// getting songs 
async function loadMusicFiles() {
    try {
        const musicFolder = path.join(__dirname, 'src', 'assets', 'music');
        const files = await fs.readdir(musicFolder);
        musicArray = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.mp3', '.wav', '.flac', '.m4a'].includes(ext);
        });

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('music-array', musicArray);
        }

    } catch (err) {
        alert('Error in reading song folder: ', err);
        musicArray = [];
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

    // После полной загрузки окна отправляем список песен (если он уже загружен)
    mainWindow.webContents.on('did-finish-load', () => {
        if (musicArray.length > 0) {
            mainWindow.webContents.send('music-array', musicArray);
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// download songs array
loadMusicFiles();

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
