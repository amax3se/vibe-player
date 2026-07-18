const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const Essentia = require('essentia.js');
const essentia = new Essentia();
const path = require('path');
const fs = require('fs'); 

let mainWindow;
let musicArray = []; 

// path to the music folder
const musicFolder = path.join(app.getPath('userData'), 'music');

if (!fs.existsSync(musicFolder)) {
    fs.mkdirSync(musicFolder, { recursive: true });
}

// tagging song
async function tagSong(filePath) {
    const file = fs.readFileSync(filePath);
    const model = await essentia.getModel('discogs-effnet');

    try {
        const arrayBuffer = file.buffer.slice(
            file.byteOffset, 
            file.byteOffset + file.byteLength
        );

        let audioData = await essentia.decodeAudioData(arrayBuffer);

        console.log(`Length: ${audioData.audioData.length / audioData.sampleRate} sec`);
        console.log(`Rate: ${audioData.sampleRate} Hz`);
    } catch (error) {
        console.error('Error with analyzing:', error);
        throw error;
    }

    const tags = model.compute(audioData);
    console.log(tags);
} //! сохранять теги в файл

// getting songs 
async function loadMusicFiles() {
    try {
        const files = await fs.promises.readdir(musicFolder);

        musicArray = [];
        for (const file of filteredFiles) {
            const filePath = path.join(musicFolder, file);
            await tagSong(filePath);
            musicArray.push({
                name: file,
                path: filePath
            });
        }
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
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('music-array', musicArray);
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
ipcMain.on('open-file-dialog', async (event) => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'aac'] }
            ]
        });
        if (!result.canceled && result.filePaths.length > 0) {
            const sourcePath = result.filePaths[0];
            const fileName = path.basename(sourcePath);
            const uniqueName = Date.now() + '_' + fileName;
            const destPath = path.join(musicFolder, uniqueName);
            
            await fs.promises.copyFile(sourcePath, destPath);
            console.log('File saved:', destPath);
            
            await loadMusicFiles();
            
            event.reply('file-saved', { success: true, path: destPath });
        } else {
            event.reply('file-saved', { success: false, error: 'User cancel the choice' });
        }
    } catch (err) {
        console.error('Error:', err);
        event.reply('file-saved', { success: false, error: err.message });
    }
});

ipcMain.handle('delete-file', async (event, filePath) => {
    if (!filePath || typeof filePath !== 'string') {
        throw new Error('Wrong path to file');
    }

    const resolvedPath = path.resolve(filePath);
    const normalizedFolder = path.resolve(musicFolder);
    if (!resolvedPath.startsWith(normalizedFolder)) {
        throw new Error('Deleting files outside music folder is forbidden');
    }

    try {
        await fs.promises.access(resolvedPath, fs.constants.F_OK);
    } catch {
        throw new Error('File not found');
    }

    try {
        await fs.promises.unlink(resolvedPath);
        await loadMusicFiles();
        return { 
            success: true, 
            message: 'File was succesfully deleted',
            updatedPlaylist: musicArray 
        };
    } catch (error) {
        console.error('Deleting error:', error);
        throw new Error('Could not delete file');
    }
});