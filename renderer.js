// user interface events handling
document.addEventListener('DOMContentLoaded', () => {
    // === DECLARING ===
    // main variables that will be used during all work
    let audio = null;
    let playlist = []; 
    let songNumber;

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
        audio.play().catch(e => alert('Ошибка: ' + e.message));
        textSpan.textContent = playlist[songIndex].name;
        updateScrollBehavior();
        playBtn.textContent = '⏸';
    }

    // checks if it is the song end and if true plays new song
    function onSongEnd() {
        songNumber += 1;
        if (songNumber >= playlist.length) songNumber = 0;
        playSong(songNumber);
    }
    
    // === BUTTON's HANDLERS ===
    // plays previous song 
    previousBtn.addEventListener('click', () => {
        songNumber -= 1;
        playSong(songNumber);
    });

    // plays song 
    playBtn.addEventListener('click', () => {
        if (!audio) return alert('Music was not downloaded');

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
        if (speed + 0.5 >= 3) { 
            alert('Too fast!'); 
        } else { 
            audio.playbackRate += 0.5;
            speed += 0.5; 
        }
    });
    slowDownBtn.addEventListener('click', () => {
        if (speed - 0.5 <= 0) { 
            alert('Too slow!'); 
        } else { 
            audio.playbackRate -= 0.5;
            speed -= 0.5; 
        }
    });

    // save new song
    addSongBtn.addEventListener('click', () => {
        window.electronAPI.openFileDialog();
    });

    // === HANDLERS (main -> preload -> renderer) ===
    //gets songs list
    window.electronAPI.onMusicArray((songs) => { 
        if (songs.length === 0) { 
            alert('Playlist is empty :-(');
            return; 
        }
        playlist = songs;

        const parent = document.querySelector('.playlist-list');
        parent.innerHTML = '';

        // loop through the playlist and create a <button> for each song
        for (let i = 0; i < playlist.length; i++) {
            const songInList = document.createElement("button");
            songInList.textContent = playlist[i].name;
            parent.appendChild(songInList);
        }

        // plays song whose name was clicked
        const buttons = document.querySelectorAll('.playlist-list button');
        buttons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                playSong(index);
            });
        });

        // allows to click on button if playlist was created
        previousBtn.disabled = false;
        playBtn.disabled = false;
        nextBtn.disabled = false;
        nowPlayingBtn.style.pointerEvents = 'auto';
        
        songNumber = 0; 
        if (songNumber >= playlist.length) songNumber = 0;

        audio = new Audio(playlist[songNumber].path);

        updateScrollBehavior(); 
    });

    // file saving correction handler
    window.electronAPI.onFileSaved((result) => {
        if (result.success) {
            alert('File was saved!');
        } else {
            alert('Error: ' + result.error);
        }
    });

    // handler for answer from main process getting  
    window.electronAPI.onResponse((event, response) => {
        responseDiv.textContent = response;
    });
});
