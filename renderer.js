// user interface events handling
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('send-btn');
    const responseDiv = document.getElementById('response');

    // button click handling
    sendBtn.addEventListener('click', () => {
        // send messages to the main process through API, exported to preload.js
        window.electronAPI.sendMessage('Hi from renderer!');
    });

    // handler for answer from main process getting  
    window.electronAPI.onResponse((event, response) => {
        responseDiv.textContent = response;
    });
});
