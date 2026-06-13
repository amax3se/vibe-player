// user interface events handling
document.addEventListener('DOMContentLoaded', () => {
    let audio = null;
    let playlist = []; 
    let songNumber = 5;
    const previousBtn = document.querySelector('#previous-btn');
    const playBtn = document.querySelector('#play-btn');
    const nextBtn = document.querySelector('#next-btn');

    window.electronAPI.onMusicArray((songs) => {  //gets songs array
        if (songs.length === 0) { return; }

        playlist = songs;
        songNumber = 5;
        if (songNumber >= playlist.length) songNumber = 0;
        audio = new Audio(`./assets/music/${playlist[songNumber]}`);
    });
    
    previousBtn.addEventListener('click', () => {
        audio.pause();

        songNumber-=1;
        audio = new Audio(`./assets/music/${playlist[songNumber]}`);

        audio.play().catch(e => alert('Ошибка:', e));
    });

    playBtn.addEventListener('click', () => {
        if (!audio) return alert('Music was not downloaded');

        if (audio.paused) {
            audio.play().catch(e => alert('Ошибка:', e));;
            playBtn.textContent = 'Pause';
            console.log('song is playing')
        } else {
            audio.pause();
            playBtn.textContent = 'Play';
            console.log('song was stoped')
        }
    });

    nextBtn.addEventListener('click', () => {
        audio.pause();
        playBtn.textContent = 'Play';

        songNumber += 1;
        audio = null;
        audio = new Audio(`./assets/music/${playlist[songNumber]}`);

        audio.play().catch(e => alert('Ошибка:', e));
    });

    // handler for answer from main process getting  
    window.electronAPI.onResponse((event, response) => {
        responseDiv.textContent = response;
    });
});
