const imageFormat = document.getElementById('imageFormat');
const downloadDir = document.getElementById('downloadDir');
const autoDownload = document.getElementById('autoDownload');
const defaultLimit = document.getElementById('defaultLimit');
const themeSelect = document.getElementById('themeSelect');
const status = document.getElementById('status');

// Load settings
chrome.storage.local.get([
  'imageFormat', 
  'downloadDir', 
  'autoDownload', 
  'limit',
  'theme'
], (result) => {
  imageFormat.value = result.imageFormat || 'png';
  downloadDir.value = result.downloadDir || 'autocapture';
  autoDownload.checked = result.autoDownload || false;
  defaultLimit.value = result.limit || 20;
  themeSelect.value = result.theme || 'system';
});

// Save settings on change
[imageFormat, downloadDir, autoDownload, defaultLimit, themeSelect].forEach(el => {
  el.addEventListener('change', saveSettings);
});

function saveSettings() {
  chrome.storage.local.set({
    imageFormat: imageFormat.value,
    downloadDir: downloadDir.value,
    autoDownload: autoDownload.checked,
    limit: parseInt(defaultLimit.value, 10) || 20,
    theme: themeSelect.value
  }, () => {
    status.style.display = 'inline';
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);
  });
}
