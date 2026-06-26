const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs'); 

let mainWindow;
let musicArray = []; 

// path to the music folder
const musicFolder = path.join(__dirname, 'assets', 'music');
const assetsDir = path.join(__dirname, 'assets');

if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}
if (!fs.existsSync(musicFolder)) {
    fs.mkdirSync(musicFolder, { recursive: true });
}

// getting songs 
async function loadMusicFiles() {
    try {
        const files = await fs.promises.readdir(musicFolder);
        musicArray = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac'].includes(ext);
        });
    } catch (err) {
        console.error('Error reading music folder:', err);
        musicArray = [];
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('music-array', musicArray);
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
    console.log('Get message:', message);
    // return answer to the renderer
    mainWindow.webContents.send('response', `Answer on: ${message}`);
});

// save audio handler 
ipcMain.on('save-audio-file', async (event, sourcePath) => {
    try {
        const fileName = path.basename(sourcePath);
        const uniqueName = Date.now() + '_' + fileName;
        const destPath = path.join(musicFolder, uniqueName);

        await fs.promises.copyFile(sourcePath, destPath);
        console.log('Файл сохранён:', destPath);

        await loadMusicFiles();

        event.reply('file-saved', { success: true, path: destPath });
    } catch (err) {
        event.reply('file-saved', { success: false, error: err.message });
    }
});