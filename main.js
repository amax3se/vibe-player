const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { Essentia, EssentiaWASM } = require('essentia.js');
const path = require('path');
const fs = require('fs'); 
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const wav = require('wav');
const os = require('os');

const essentia = new Essentia(EssentiaWASM);
let mainWindow;
let musicArray = []; 

// path to the music folder
const musicFolder = path.join(app.getPath('userData'), 'music');
if (!fs.existsSync(musicFolder)) {
    fs.mkdirSync(musicFolder, { recursive: true });
}

// decode to vector
ffmpeg.setFfmpegPath(ffmpegPath);

function decodeAudio(filePath) {
    return new Promise((resolve, reject) => {
        const tempFile = path.join(
            os.tmpdir(),
            `temp_${Date.now()}_${Math.random().toString(36).slice(2)}.wav`
        );

        ffmpeg(filePath)
            .toFormat('wav')
            .audioFrequency(16000)
            .audioChannels(1)
            .on('error', (err) => {
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                reject(new Error(`FFmpeg: ${err.message || err}`));
            })
            .on('end', () => {
                try {
                    const wavData = fs.readFileSync(tempFile);
                    const reader = new wav.Reader();
                    const pcmChunks = [];

                    reader.on('data', chunk => pcmChunks.push(chunk));
                    reader.on('end', () => {
                        try {
                            const pcmBuffer = Buffer.concat(pcmChunks);
                            const int16Array = new Int16Array(
                                pcmBuffer.buffer,
                                pcmBuffer.byteOffset,
                                pcmBuffer.length / 2
                            );
                            const floatArray = new Float32Array(int16Array.length);
                            for (let i = 0; i < int16Array.length; i++) {
                                floatArray[i] = int16Array[i] / 32768.0;
                            }
                            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                            resolve(essentia.arrayToVector(floatArray));
                        } catch (err) {
                            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                            reject(err);
                        }
                    });

                    reader.write(wavData);
                    reader.on('error', (err) => {
                        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                        reject(err);
                    });
                    reader.end();
                } catch (err) {
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    reject(err);
                }
            })
            .save(tempFile);
    });
}

// tagging song
async function tagSong(filePath, topN = 5) {
    const tagList = [
        'rock', 'pop', 'alternative', 'indie', 'electronic', 'dance', 'rnb',
        'hip hop', 'rap', 'country', 'folk', 'classical', 'jazz', 'blues',
        'soul', 'funk', 'reggae', 'latin', 'world', 'vocal', 'instrumental',
        'female vocalist', 'male vocalist', 'guitar', 'piano', 'drums',
        'bass', 'strings', 'synth', 'ambient', 'experimental', 'metal',
        'punk', 'hard rock', 'house', 'techno', 'trance', 'dubstep',
        'trap', 'garage', 'disco', 'oldies', 'new wave', 'chill',
        'melodic', 'sad', 'happy', 'energetic', 'relaxing', 'party'
    ];
    
    let audioData, vectorData, features, predictions, avgPredictions;
    try {
        // Единственное декодирование
        audioData = await decodeAudio(filePath);
        if (audioData.size() === 0) {
            throw new Error('Audio is empty');
        }

        const TARGET_LENGTH = 48000;
        const srcArray = essentia.vectorToArray(audioData);
        let processedArray;

        if (srcArray.length < TARGET_LENGTH) {
            const padded = new Float32Array(TARGET_LENGTH);
            padded.set(srcArray, 0);
            processedArray = padded;
        } else {
            processedArray = srcArray.slice(0, TARGET_LENGTH);
        }

        // Создаём вектор из обработанного куска
        vectorData = essentia.arrayToVector(processedArray);
        features = essentia.TensorflowInputMusiCNN(vectorData);
        predictions = essentia.TensorflowPredictMusiCNN(features);
        avgPredictions = essentia.PoolAggregator(predictions);

        const results = avgPredictions.value.map((prob, idx) => ({
            tag: tagList[idx] || `tag_${idx}`,
            probability: prob
        }));
        results.sort((a, b) => b.probability - a.probability);
        const topTags = results.slice(0, topN);

        const result = { filePath, tags: topTags };

        const dir = path.dirname(filePath);
        const basename = path.basename(filePath, path.extname(filePath));
        const tagsFilePath = path.join(dir, `${basename}.tags.json`);
        await fs.promises.writeFile(tagsFilePath, JSON.stringify(result, null, 2), 'utf8');

        console.log(`Tags for ${path.basename(filePath)} saved.`);
        return result;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error processing ${filePath}:`, errorMsg);
        if (error instanceof Error && error.stack) {
            console.error(error.stack);
        }
        return { filePath, error: errorMsg };
    } finally {
        // Освобождаем все WASM-объекты
        if (audioData) audioData.delete();
        if (vectorData) vectorData.delete();
        if (features) features.delete();
        if (predictions) predictions.delete();
        if (avgPredictions) avgPredictions.delete();
    }
}

// getting songs 
async function loadMusicFiles() {
    try {
        const audioExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac'];
        const files = await fs.promises.readdir(musicFolder);
        const audioFiles = files.filter(file => 
            audioExtensions.includes(path.extname(file).toLowerCase())
        );

        musicArray = [];
        for (const file of audioFiles) {
            const filePath = path.join(musicFolder, file);
            const tagsResult = await tagSong(filePath);
            musicArray.push({
                name: file,
                path: filePath,
                tags: tagsResult.tags || [] 
            });
        }

        console.log(`Processed ${musicArray.length} tracks`);
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