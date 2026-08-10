document.addEventListener('DOMContentLoaded', async () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusDiv = document.getElementById('status');
  const digiStartPage = document.getElementById('digiStartPage');
  const digiEndPage = document.getElementById('digiEndPage');
  const dots = document.getElementById('dots');
  const progressInfo = document.getElementById('progressInfo');

  // Load saved settings
  chrome.storage.local.get(['digiStart', 'digiEnd'], (result) => {
    digiStartPage.value = result.digiStart || 1;
    digiEndPage.value = result.digiEnd || 10;
  });

  // Save settings when changed
  digiStartPage.addEventListener('change', () => {
    chrome.storage.local.set({ digiStart: parseInt(digiStartPage.value, 10) || 1 });
  });

  digiEndPage.addEventListener('change', () => {
    chrome.storage.local.set({ digiEnd: parseInt(digiEndPage.value, 10) || 10 });
  });

  // Check current status
  const response = await chrome.runtime.sendMessage({ action: "getStatus" });
  updateUI(response);

  startBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      statusDiv.textContent = chrome.i18n.getMessage("errorChromeUrl") || "Chrome URLs können nicht aufgenommen werden.";
      return;
    }

    const digiStart = parseInt(digiStartPage.value, 10) || 1;
    const digiEnd = parseInt(digiEndPage.value, 10) || 10;

    const res = await chrome.runtime.sendMessage({ 
      action: "startCapture", 
      startUrl: tab.url,
      tabId: tab.id,
      recursive: false,
      limit: 1000,
      digiMode: true,
      digiStart: digiStart,
      digiEnd: digiEnd
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
      digiStartPage.disabled = true;
      digiEndPage.disabled = true;
      if (dots) dots.style.display = 'flex';
      
      const total = Math.max(status.totalFound || 1, status.currentIndex || 1);
      const percent = Math.min(100, Math.round((status.currentIndex / total) * 100));
      if (progressInfo) progressInfo.textContent = `${percent}%`;

      let msg = chrome.i18n.getMessage("statusRunning", [
        status.currentIndex.toString(),
        total.toString(),
        "Digi4School"
      ]) || `Verarbeite ${status.currentIndex} / ${total}`;
      statusDiv.textContent = msg;
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      digiStartPage.disabled = false;
      digiEndPage.disabled = false;
      if (dots) dots.style.display = 'none';
      if (progressInfo) progressInfo.textContent = '';
      
      if (status.message === "Capture complete.") {
          statusDiv.textContent = chrome.i18n.getMessage("statusFinished") || "Fertig.";
      } else if (status.message === "Stopped by user.") {
          statusDiv.textContent = chrome.i18n.getMessage("statusStopped") || "Gestoppt.";
      } else {
          statusDiv.textContent = status.message || "Bereit.";
      }
    }
  }
});
