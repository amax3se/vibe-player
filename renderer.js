// user interface events handling
document.addEventListener('DOMContentLoaded', () => {
    let audio = null;
    let playlist = []; 
    let songNumber;
    const previousBtn = document.querySelector('#previous-btn');
    const playBtn = document.querySelector('#play-btn');
    const nextBtn = document.querySelector('#next-btn');

    window.electronAPI.onMusicArray((songs) => {  //gets songs array
        if (songs.length === 0) { return; }

        playlist = songs;
        songNumber = 5; //there is 5 just because i have good song in the 5th position in my test folder
        if (songNumber >= playlist.length) songNumber = 0;
        audio = new Audio(`./assets/music/${playlist[songNumber]}`);
    });
    
    function playSong(songIndex) {
        if (audio) audio.pause(); 
        if (songIndex < 0) songIndex = playlist.length;
        if (songIndex >= playlist.length) songIndex = 0;

        audio = new Audio(`./assets/music/${playlist[songIndex]}`);
        songNumber = songIndex;

        audio.play().catch(e => alert('Ошибка: ' + e.message));
        playBtn.textContent = '⏸ ';
    }

    previousBtn.addEventListener('click', () => {
        songNumber -= 1;
        playSong(songNumber);
    });

    playBtn.addEventListener('click', () => {
        if (!audio) return alert('Music was not downloaded');

        if (audio.paused) {
            audio.play();
            playBtn.textContent = '⏸   ';
        } else {
            audio.pause();
            playBtn.textContent = '►';
        }
    });

    nextBtn.addEventListener('click', () => {
        songNumber += 1;
        playSong(songNumber);
    });

    // handler for answer from main process getting  
    window.electronAPI.onResponse((event, response) => {
        responseDiv.textContent = response;
    });
});
