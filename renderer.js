// user interface events handling
let nowPlayingBtn, textSpan; 

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

document.addEventListener('DOMContentLoaded', () => {
    let audio = null;
    let playlist = []; 
    let songNumber;

    const previousBtn = document.querySelector('#previous-btn');
    previousBtn.disabled = true; // does not allow to click on button if playlist wasn't created
    const playBtn = document.querySelector('#play-btn');
    playBtn.disabled = true;
    const nextBtn = document.querySelector('#next-btn');
    nextBtn.disabled = true;

    nowPlayingBtn = document.querySelector('#nowPlaying-btn');
    nowPlayingBtn.style.pointerEvents = 'none';
    textSpan = nowPlayingBtn.querySelector('.scrolling-text');

    const spedUpBtn = document.querySelector('#spedUp-btn');
    const slowDownBtn = document.querySelector('#slowDown-btn');
    let speed = 1;

    const fileInput = document.getElementById('file');
    const addSongBtn = document.querySelector('#addSong-btn');
    const playlistWrapper = document.querySelector('.playlist-list');

    window.electronAPI.onMusicArray((songs) => {  //gets songs list
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
        
        songNumber = 0; //there is 5 just because i have good song in the 5th position in my test folder
        if (songNumber >= playlist.length) songNumber = 0;

        audio = new Audio(playlist[songNumber].path);

        updateScrollBehavior(); 
    });

    //plays song
    function playSong(songIndex) {
        if (audio) audio.pause(); 
        if (songIndex < 0) songIndex = playlist.length-1;
        if (songIndex >= playlist.length) songIndex = 0;

        audio = new Audio(playlist[songIndex].path);
        songNumber = songIndex;
        
        audio.addEventListener('ended', onSongEnd);
        
        audio.play().catch(e => alert('Ошибка: ' + e.message));
        textSpan.textContent = playlist[songIndex].name;
        updateScrollBehavior();
        playBtn.textContent = '⏸';
    }

    function onSongEnd() {
        songNumber += 1;
        if (songNumber >= playlist.length) songNumber = 0;
        playSong(songNumber);
    }

    previousBtn.addEventListener('click', () => {
        songNumber -= 1;
        playSong(songNumber);
    });

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

    nextBtn.addEventListener('click', () => {
        songNumber += 1;
        playSong(songNumber);
    });

    // appearing list of songs
    nowPlayingBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        playlistWrapper.classList.toggle('show'); 
    });

    // sped up and slow down buttons
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
