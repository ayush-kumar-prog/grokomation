// Popup script - uses Chrome API to open tabs
document.getElementById('openCanvas').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:5174' });
});
