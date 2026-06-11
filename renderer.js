// Обработка событий пользовательского интерфейса
document.addEventListener('DOMContentLoaded', () => {
const sendBtn = document.getElementById('send-btn');
const responseDiv = document.getElementById('response');

// Обработчик клика по кнопке
sendBtn.addEventListener('click', () => {
// Отправляем сообщение в главный процесс через API, экспортированный в preload.js
window.electronAPI.sendMessage('Привет из рендерера!');
});

// Обработчик для получения ответа от главного процесса
window.electronAPI.onResponse((event, response) => {
responseDiv.textContent = response;
});
});

