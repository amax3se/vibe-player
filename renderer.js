// user interface events handling
document.addEventListener('DOMContentLoaded', () => {
    // === DECLARING ===
    // main variables that will be used during all work
    let audio = null;
    let playlist = []; 
    let songNumber;
    const responseDiv = document.querySelector('#response-div');

    // the main buttons (next, previous, play, stop)
    const previousBtn = document.querySelector('#previous-btn');
    previousBtn.disabled = true; // does not allow to click on button if playlist wasn't created
    const playBtn = document.querySelector('#play-btn');
    playBtn.disabled = true;
    const nextBtn = document.querySelector('#next-btn');
    nextBtn.disabled = true;

    // show song that playing now and the playlist (if you hover cursor on btn)
    const nowPlayingBtn = document.querySelector('#nowPlaying-btn');
    nowPlayingBtn.style.pointerEvents = 'none';
    const textSpan = nowPlayingBtn.querySelector('.scrolling-text');

    // buttons to control song (speed, removal)
    const spedUpBtn = document.querySelector('#spedUp-btn');
    const slowDownBtn = document.querySelector('#slowDown-btn');
    let speed = 1;
    const deleteBtn = document.querySelector('#delete-btn');

    // button for adding songs
    const fileInput = document.getElementById('file');
    const addSongBtn = document.querySelector('#addSong-btn');
    const playlistWrapper = document.querySelector('.playlist-list');

    // === FUNCTIONS ===
    // updates scrolling if text is bigger than button
    function updateScrollBehavior() {
        const containerWidth = nowPlayingBtn.clientWidth;
        const textWidth = textSpan.scrollWidth;
        
        const isOverflow = textWidth > containerWidth;
        
        if (isOverflow) {
            const scrollAmount = -(textWidth - containerWidth);
            nowPlayingBtn.style.setProperty('--scroll-amount', `${scrollAmount}px`);
            nowPlayingBtn.classList.add('scrollable');
        } else {
            nowPlayingBtn.classList.remove('scrollable');
            textSpan.style.transform = ''; 
            nowPlayingBtn.style.removeProperty('--scroll-amount');
        }
    }

    //plays song
    function playSong(songIndex) {
        // checks
        if (audio) audio.pause(); 
        if (songIndex < 0) songIndex = playlist.length-1;
        if (songIndex >= playlist.length) songIndex = 0;

        // create audio 
        audio = new Audio(playlist[songIndex].path);
        songNumber = songIndex;
        
        audio.addEventListener('ended', onSongEnd); // if end -> play next song
        
        // plays song
        audio.play();
        textSpan.textContent = playlist[songIndex].name;
        updateScrollBehavior();
        playBtn.textContent = '⏸';
    }

    // checks if it is the song end and if true plays new song
    function onSongEnd() {
        songNumber += 1;
        playSong(songNumber);
    }

    // renders playlist
    function renderPlaylist(songs) {
        playlist = songs || [];
        const parent = document.querySelector('.playlist-list');
        parent.innerHTML = '';

        if (playlist.length === 0) {
            previousBtn.disabled = true;
            playBtn.disabled = true;
            nextBtn.disabled = true;
            nowPlayingBtn.style.pointerEvents = 'none';
            textSpan.textContent = 'Now playing...'; 
            playBtn.textContent = '►';
            audio = null;
            songNumber = 0;
            nowPlayingBtn.classList.remove('scrollable');
            textSpan.style.transform = '';
            nowPlayingBtn.style.removeProperty('--scroll-amount');
            return;
        }

        playlist.forEach((song, index) => {
            const btn = document.createElement('button');
            btn.textContent = song.name;
            btn.addEventListener('click', () => playSong(index));
            parent.appendChild(btn);
        });

        previousBtn.disabled = false;
        playBtn.disabled = false;
        nextBtn.disabled = false;
        nowPlayingBtn.style.pointerEvents = 'auto';

        if (!audio) {
            songNumber = 0;
            audio = new Audio(playlist[0].path);
            textSpan.textContent = playlist[0].name;
            updateScrollBehavior();
        }
    }

    // delete song 
    async function deleteTrack(filePath) {
        try {
            const result = await window.electronAPI.deleteFile(filePath);
            return result.updatedPlaylist; 
        } catch (error) {
            return null;
        }
    }
    
    // === BUTTON's HANDLERS ===
    // plays previous song 
    previousBtn.addEventListener('click', () => {
        songNumber -= 1;
        playSong(songNumber);
    });

    // plays song 
    playBtn.addEventListener('click', () => {
        if (!audio) return alert('Firstly choose music!');

        if (audio.paused) {
            audio.play();
            textSpan.textContent = playlist[songNumber].name;
            updateScrollBehavior();
            playBtn.textContent = '⏸';
        } else {
            audio.pause();
            playBtn.textContent = '►';
        }
    });

    // plays next song 
    nextBtn.addEventListener('click', () => {
        songNumber += 1;
        playSong(songNumber);
    });

    // appearing list of songs
    nowPlayingBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        playlistWrapper.classList.toggle('show'); 
    });

    // sped up and slow down song
    spedUpBtn.addEventListener('click', () => {
        if (!audio) return alert('Firstly choose music!');
        if (speed + 0.5 >= 3) { 
            alert('Too fast!'); 
        } else { 
            audio.playbackRate += 0.5;
            speed += 0.5; 
        }
    });
    slowDownBtn.addEventListener('click', () => {
        if (!audio) return alert('Firstly choose music!');
        if (speed - 0.5 <= 0) { 
            alert('Too slow!'); 
        } else { 
            audio.playbackRate -= 0.5;
            speed -= 0.5; 
        }
    });
    // delete song button
    deleteBtn.addEventListener('click', async () => {
        if (!playlist.length) {
            return alert('Playlist is empty!');
        }

        audio.pause();

        const newPlaylist = await deleteTrack(playlist[songNumber].path);
        if (newPlaylist === null) {
            return alert('Error with deleting');
        }

        renderPlaylist(newPlaylist);

        if (!playlist.length) {
            alert('Playlist is empty!');
        } else {
            if (songNumber >= playlist.length) songNumber = 0;
            playSong(songNumber);
        }
    });

    // save new song
    addSongBtn.addEventListener('click', () => {
        window.electronAPI.openFileDialog();
    });

    // === HANDLERS (main -> preload -> renderer) ===
    //gets songs list
    window.electronAPI.onMusicArray((songs) => {
        renderPlaylist(songs);
    });

    // file saving correction handler
    window.electronAPI.onFileSaved((result) => {
        if (result.success) {
            alert('File was saved!');
        } else {
            alert('Error saving file');
        }
    });

    // handler for answer from main process getting  
    window.electronAPI.onResponse((event, response) => {
        responseDiv.textContent = response;
    });
});
