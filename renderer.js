// user interface events handling
document.addEventListener('DOMContentLoaded', () => {
    let audio = null;
    const playBtn = document.querySelector('#play-btn');
    let playlist = [];

    window.electronAPI.onMusicArray((songs) => {  //gets songs array
        if (songs.length === 0) return;
        playlist = songs;
        const firstSong = songs[5];

        audio = new Audio(`./assets/music/${firstSong}`);
    });

    playBtn.addEventListener('click', () => {
        console.log(playlist);
        if (!audio) return alert('Music was not downloaded');
        if (audio.paused) {
            audio.play().catch(e => console.error('Ошибка:', e));;
            playBtn.textContent = 'Pause';
            console.log('song is playing')
        } else {
            audio.pause();
            playBtn.textContent = 'Play';
            console.log('song was stoped')
        }
    });

    // handler for answer from main process getting  
    window.electronAPI.onResponse((event, response) => {
        responseDiv.textContent = response;
    });
});
