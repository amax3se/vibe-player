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
    const playBtn = document.querySelector('#play-btn');
    const nextBtn = document.querySelector('#next-btn');
    nowPlayingBtn = document.querySelector('#nowPlaying-btn');
    textSpan = nowPlayingBtn.querySelector('.scrolling-text');

    window.electronAPI.onMusicArray((songs) => {  //gets songs array
        if (songs.length === 0) { return; }

        playlist = songs;
        songNumber = 5; //there is 5 just because i have good song in the 5th position in my test folder
        if (songNumber >= playlist.length) songNumber = 0;
        audio = new Audio(`./assets/music/${playlist[songNumber]}`);
        updateScrollBehavior(); 
    });
    
    //plays song
    function playSong(songIndex) {
        if (audio) audio.pause(); 
        if (songIndex < 0) songIndex = playlist.length-1;
        if (songIndex >= playlist.length) songIndex = 0;

        audio = new Audio(`./assets/music/${playlist[songIndex]}`);
        songNumber = songIndex;

        audio.play().catch(e => alert('Ошибка: ' + e.message));
        textSpan.textContent = playlist[songIndex];
        updateScrollBehavior();
        playBtn.textContent = '⏸';
    }

    previousBtn.addEventListener('click', () => {
        songNumber -= 1;
        playSong(songNumber);
    });

    playBtn.addEventListener('click', () => {
        if (!audio) return alert('Music was not downloaded');

        if (audio.paused) {
            audio.play();
            textSpan.textContent = playlist[songNumber];
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

    nowPlayingBtn.addEventListener('click', () => {
        const childWindow = window.open('', 'modal')
        childWindow.document.write('<h1>Hello</h1>')
    });

    // handler for answer from main process getting  
    window.electronAPI.onResponse((event, response) => {
        responseDiv.textContent = response;
    });
});
