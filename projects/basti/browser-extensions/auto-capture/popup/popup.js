document.addEventListener('DOMContentLoaded', async () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusDiv = document.getElementById('status');
  const recursiveCheck = document.getElementById('recursiveCheck');
  const limitInput = document.getElementById('limitInput');
  const dots = document.getElementById('dots');
  const progressInfo = document.getElementById('progressInfo');

  // i18n
  document.getElementById('recursiveLabel').textContent = chrome.i18n.getMessage("recursiveCrawl");
  document.getElementById('limitLabel').textContent = chrome.i18n.getMessage("maxPages");
  document.getElementById('startBtnText').textContent = chrome.i18n.getMessage("startBtn");
  document.getElementById('stopBtnText').textContent = chrome.i18n.getMessage("stopBtn");
  statusDiv.textContent = chrome.i18n.getMessage("statusReady");

  // Load saved settings or set defaults
  chrome.storage.local.get(['recursive', 'limit'], (result) => {
    recursiveCheck.checked = result.recursive !== undefined ? result.recursive : true;
    limitInput.value = result.limit !== undefined ? result.limit : 20;
  });

  // Save settings when changed
  recursiveCheck.addEventListener('change', () => {
    chrome.storage.local.set({ recursive: recursiveCheck.checked });
  });

  limitInput.addEventListener('change', () => {
    chrome.storage.local.set({ limit: parseInt(limitInput.value, 10) || 20 });
  });

  // Check current status
  const response = await chrome.runtime.sendMessage({ action: "getStatus" });
  updateUI(response);

  startBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      statusDiv.textContent = chrome.i18n.getMessage("errorChromeUrl");
      return;
    }

    const recursive = recursiveCheck.checked;
    const limit = parseInt(limitInput.value, 10) || 20;

    const res = await chrome.runtime.sendMessage({ 
      action: "startCapture", 
      startUrl: tab.url,
      tabId: tab.id,
      recursive: recursive,
      limit: limit,
      digiMode: false
    });
    updateUI(res);
  });

  stopBtn.addEventListener('click', async () => {
    const res = await chrome.runtime.sendMessage({ action: "stopCapture" });
    updateUI(res);
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "statusUpdate") {
      updateUI(message.status);
    }
  });

  function updateUI(status) {
    if (!status) return;

    if (status.isRunning) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      recursiveCheck.disabled = true;
      limitInput.disabled = true;
      if (dots) dots.style.display = 'flex';
      
      const total = Math.max(status.totalFound || 1, status.currentIndex || 1);
      const hasTabs = status.currentTabTotal > 1;
      const percent = hasTabs
        ? Math.min(100, Math.round(((status.currentIndex - 1 + (status.currentTabIndex || 0) / status.currentTabTotal) / total) * 100))
        : Math.min(100, Math.round((status.currentIndex / total) * 100));
      if (progressInfo) progressInfo.textContent = `${percent}%`;

      const urlLabel = status.currentUrl ? (status.currentUrl.split('/').pop() || status.currentUrl) : "Starting...";
      let msg = chrome.i18n.getMessage("statusRunning", [
        status.currentIndex.toString(),
        total.toString(),
        urlLabel
      ]);
      if (hasTabs) msg += ` · Tab ${status.currentTabIndex}/${status.currentTabTotal}`;
      statusDiv.textContent = msg;
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      recursiveCheck.disabled = false;
      limitInput.disabled = false;
      if (dots) dots.style.display = 'none';
      if (progressInfo) progressInfo.textContent = '';
      
      if (status.message === "Capture complete.") {
          statusDiv.textContent = chrome.i18n.getMessage("statusFinished");
      } else if (status.message === "Stopped by user.") {
          statusDiv.textContent = chrome.i18n.getMessage("statusStopped");
      } else {
          statusDiv.textContent = status.message || chrome.i18n.getMessage("statusReady");
      }
    }
  }
});
