let isRunning = false;
let queue = [];
let visited = new Set();
let currentIndex = 0;
let config = { recursive: false, limit: 20 };
let workerTabId = null;
let currentUrl = null;
let currentJobId = 0;
let currentTabIndex = 0;
let currentTabTotal = 0;
let pageTimeoutId = null;
let loadTimeoutId = null;
let loadListener = null;
let statusMessage = "Stopped";
const PAGE_TIMEOUT_MS = 45000;
const LOAD_TIMEOUT_MS = 15000;
const STITCH_TIMEOUT_MS = 20000;
const BLOCKED_URL_PREFIXES = [
  "about:",
  "chrome:",
  "chrome-error:",
  "chrome-extension:",
  "devtools:",
  "edge:",
  "moz-extension:"
];

// Load config from storage
function loadConfig() {
  return new Promise(resolve => {
    chrome.storage.local.get(['recursive', 'limit', 'imageFormat', 'downloadDir'], (res) => {
      config.recursive = res.recursive !== undefined ? res.recursive : true;
      config.limit = res.limit || 20;
      config.imageFormat = res.imageFormat || 'png';
      config.downloadDir = res.downloadDir || 'autocapture';
      resolve();
    });
  });
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "start_capture") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && !isRunning) {
      await loadConfig();
      startProcess(tab.url, tab.id, config.recursive, config.limit);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getStatus") {
    sendResponse(getStatus());
  } else if (message.action === "startCapture") {
    if (!isRunning) {
      startProcess(message.startUrl, message.tabId, message.recursive, message.limit, message.digiMode, message.digiStart, message.digiEnd);
    }
    sendResponse(getStatus());
  } else if (message.action === "stopCapture") {
    stopProcess("Stopped by user.");
    sendResponse(getStatus());
  } else if (message.action === "linksFound") {
    handleNewLinks(message.links);
  } else if (message.action === "captureVisibleTab") {
    if (!isRunning || !sender.tab || sender.tab.id !== workerTabId) {
      sendResponse({ dataUrl: null });
      return;
    }

    const tryCapture = (retries = 3) => {
      chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: config.imageFormat || "png" }).then(dataUrl => {
        sendResponse({ dataUrl: dataUrl });
      }).catch(err => {
        if (retries > 0) {
          console.warn("Capture failed, retrying in 1s...", err);
          setTimeout(() => tryCapture(retries - 1), 1000);
        } else {
          console.error("Capture completely failed after retries:", err);
          sendResponse({ dataUrl: null });
        }
      });
    };
    tryCapture();
    return true; // async
  } else if (message.action === "tabsPlanned") {
    if (!isRunning || message.jobId !== currentJobId) return;
    currentTabTotal = message.total || 0;
    currentTabIndex = 0;
    broadcastStatus();
  } else if (message.action === "stitchCaptures") {
    if (!isRunning || message.jobId !== currentJobId) return;
    if (message.tabIndex) {
      currentTabIndex = message.tabIndex;
      broadcastStatus();
    }
    // A multi-tab page keeps producing images for a while; give it a fresh
    // timeout budget for each one instead of racing the single 45s window
    // set when the page first loaded.
    if (message.isLastTab === false) refreshPageTimeout(message.jobId);
    stitchAndSave(message);
  } else if (message.action === "captureComplete") {
    if (!isRunning || message.jobId !== currentJobId) return;
    if (message.tabIndex) {
      currentTabIndex = message.tabIndex;
    }
    saveImage(message.dataUrl, currentUrl, message.label);
    // A single page visit can produce several images (one per client-side
    // tab). Only move on to the next queued page once the last one is in.
    if (message.isLastTab === false) {
      refreshPageTimeout(message.jobId);
      broadcastStatus();
    } else {
      finishCurrentPage();
    }
  } else if (message.action === "pageCaptureFailed") {
    if (!isRunning || (message.jobId && message.jobId !== currentJobId)) return;
    console.error("Capture failed for:", currentUrl);
    finishCurrentPage();
  }
});

function getStatus() {
  return {
    isRunning,
    currentIndex,
    totalFound: config.digiMode ? (config.digiEnd - config.digiStart + 1) : (visited.size + queue.length),
    currentUrl,
    currentTabIndex,
    currentTabTotal,
    message: isRunning ? "Running" : statusMessage
  };
}

async function stitchAndSave(message) {
  try {
    const result = await withTimeout(
      chrome.runtime.sendMessage({
        action: "doStitch",
        ...message,
        imageFormat: config.imageFormat || "png"
      }),
      STITCH_TIMEOUT_MS
    );

    if (!isRunning || message.jobId !== currentJobId) return;

    if (result && result.ok && result.dataUrl) {
      saveImage(result.dataUrl, currentUrl, message.label);
    } else {
      console.error("Stitching failed:", result && result.error ? result.error : result);
    }
  } catch (err) {
    console.error("Could not stitch captures:", err);
  } finally {
    if (isRunning && message.jobId === currentJobId && message.isLastTab !== false) {
      finishCurrentPage();
    }
  }
}

function refreshPageTimeout(jobId) {
  if (pageTimeoutId) clearTimeout(pageTimeoutId);
  pageTimeoutId = setTimeout(() => {
    if (isRunning && jobId === currentJobId) {
      console.warn("Page capture timed out:", currentUrl);
      finishCurrentPage();
    }
  }, PAGE_TIMEOUT_MS);
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error("Timed out")), timeoutMs);
    promise.then(
      value => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      error => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function broadcastStatus() {
  chrome.runtime.sendMessage({ action: "statusUpdate", status: getStatus() }).catch(() => {});
}

async function startProcess(startUrl, tabId, recursive, limit, digiMode = false, digiStart = 1, digiEnd = 10) {
  isRunning = true;
  queue = [startUrl];
  visited = new Set();
  currentIndex = 0;
  config.recursive = recursive;
  config.limit = limit;
  config.digiMode = digiMode;
  config.digiStart = digiStart;
  config.digiEnd = digiEnd;
  config.digiCurrentPage = digiStart;
  currentUrl = null;
  workerTabId = tabId || null;
  statusMessage = "Running";

  broadcastStatus();
  await loadConfig();
  config.recursive = recursive;
  config.limit = limit;
  config.digiMode = digiMode;
  config.digiStart = digiStart;
  config.digiEnd = digiEnd;
  try {
    await setupOffscreenDocument();
    processNext();
  } catch (err) {
    console.error("Could not start offscreen document:", err);
    stopProcess("Could not start capture.");
  }
}

function stopProcess(msg = "Finished") {
  isRunning = false;
  statusMessage = msg;
  clearPageTimers();
  workerTabId = null;
  currentUrl = null;
  broadcastStatus();
}

async function processNext() {
  if (!isRunning) return;
  clearPageTimers();
  currentTabIndex = 0;
  currentTabTotal = 0;

  if (config.digiMode) {
    if (config.digiCurrentPage > config.digiEnd) {
      stopProcess("Capture complete.");
      return;
    }
    // For the first page, just use the startUrl from the queue without shifting it yet
    currentUrl = queue[0];
  } else {
    if (queue.length === 0 || visited.size >= config.limit) {
      stopProcess("Capture complete.");
      return;
    }
    currentUrl = queue.shift();
  }

  if (!isInjectableUrl(currentUrl)) {
    if (!config.digiMode) processNext();
    else stopProcess("Invalid URL for Digi4School mode.");
    return;
  }

  visited.add(currentUrl);
  currentIndex++;
  currentJobId++;
  const jobId = currentJobId;
  broadcastStatus();

  try {
    let scriptInjected = false;

    function injectScript(tabId, activeJobId) {
      if (scriptInjected) return;
      scriptInjected = true;
      setTimeout(async () => {
        if (!isRunning || activeJobId !== currentJobId) return;
        try {
          const tab = await chrome.tabs.get(tabId);
          if (!isInjectableUrl(tab.url || tab.pendingUrl || "")) {
            finishCurrentPage();
            return;
          }

          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (jobId, recursive) => {
              globalThis.__AUTO_CAPTURE_JOB_ID__ = jobId;
              globalThis.__AUTO_CAPTURE_RECURSIVE__ = recursive;
            },
            args: [activeJobId, !!config.recursive]
          });
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content/content.js']
          });
        } catch (e) {
          if (!isExpectedInjectionError(e)) {
            console.error("Failed to inject", e);
          }
          finishCurrentPage();
        }
      }, 1500); // 1.5s delay to ensure full rendering
    }

    if (config.digiMode && currentIndex > 1) {
      // In digiMode, after the first page, we don't load the URL, we click "Next"
      await chrome.scripting.executeScript({
        target: { tabId: workerTabId },
        func: () => {
          // Attempt to click the next button or simulate Right Arrow
          let nextBtn = document.querySelector('.btn-next, #nextBtn, .nav-next, button[title*="Next" i], button[title*="Nächste" i], button[title*="Vor" i]');
          if (!nextBtn) {
            for (let i = 0; i < window.frames.length; i++) {
              try {
                nextBtn = window.frames[i].document.querySelector('.btn-next, #nextBtn, .nav-next, button[title*="Next" i], button[title*="Nächste" i], button[title*="Vor" i]');
                if (nextBtn) break;
              } catch(e) {}
            }
          }
          if (nextBtn) {
            nextBtn.click();
          } else {
            // Fallback to keyboard event
            document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', keyCode: 39, code: 'ArrowRight', bubbles: true}));
          }
        }
      });

      config.digiCurrentPage++;

      refreshPageTimeout(jobId);

      // Wait 2 seconds for page turn animation/loading, then inject capture script
      setTimeout(() => {
        if (isRunning && jobId === currentJobId) {
          injectScript(workerTabId, jobId);
        }
      }, 2500);

      return;
    }

    if (workerTabId) {
      await chrome.tabs.update(workerTabId, { url: currentUrl, active: true });
    } else {
      const tab = await chrome.tabs.create({ url: currentUrl, active: true });
      workerTabId = tab.id;
    }

    if (config.digiMode && currentIndex === 1) {
       config.digiCurrentPage++; // We just loaded the first page
    }

    refreshPageTimeout(jobId);

    loadTimeoutId = setTimeout(() => {
      if (isRunning && jobId === currentJobId) {
        console.warn("Page load timed out, trying capture anyway:", currentUrl);
        cleanupLoadListener();
        injectScript(workerTabId, jobId);
      }
    }, LOAD_TIMEOUT_MS);

    const checkTab = async (tabId) => {
      const tab = await chrome.tabs.get(tabId);
      if (isRunning && jobId === currentJobId && tab.status === 'complete') {
        clearTimeout(loadTimeoutId);
        loadTimeoutId = null;
        cleanupLoadListener();
        injectScript(tabId, jobId);
      }
    };

    loadListener = function listener(tabId, info) {
      if (isRunning && jobId === currentJobId && tabId === workerTabId && info.status === 'complete') {
        clearTimeout(loadTimeoutId);
        loadTimeoutId = null;
        cleanupLoadListener();
        injectScript(tabId, jobId);
      }
    };

    chrome.tabs.onUpdated.addListener(loadListener);
    // Check immediately in case it's already loaded (e.g. from cache)
    setTimeout(() => checkTab(workerTabId), 500);
  } catch (err) {
    console.error("Failed to process page:", err);
    finishCurrentPage();
  }
}

function finishCurrentPage() {
  clearPageTimers();
  processNext();
}

function clearPageTimers() {
  if (pageTimeoutId) {
    clearTimeout(pageTimeoutId);
    pageTimeoutId = null;
  }
  if (loadTimeoutId) {
    clearTimeout(loadTimeoutId);
    loadTimeoutId = null;
  }
  cleanupLoadListener();
}

function cleanupLoadListener() {
  if (loadListener) {
    chrome.tabs.onUpdated.removeListener(loadListener);
    loadListener = null;
  }
}

function isInjectableUrl(url) {
  if (!url) return false;
  return !BLOCKED_URL_PREFIXES.some(prefix => url.startsWith(prefix));
}

// Second line of defence for the queue: never navigate to a URL that would
// end the session. Following one logs the crawler out, and every page after
// it captures nothing but the login gate.
function isSessionEndingUrl(url) {
  if (!url) return false;
  let path;
  try {
    const u = new URL(url);
    path = (u.pathname + u.search).toLowerCase();
  } catch (e) {
    return false;
  }
  return /(^|[\/_?&=-])(logout|log-out|signout|sign-out|abmelden|ausloggen|logoff)([\/_?&=-]|$)/.test(path);
}

function isExpectedInjectionError(error) {
  const message = error && error.message ? error.message : String(error || "");
  return message.includes("showing error page") ||
    message.includes("Cannot access") ||
    message.includes("Extension manifest must request permission") ||
    message.includes("No tab with id");
}

function handleNewLinks(links) {
  if (!config.recursive && currentIndex > 1) return;
  const currentUrlObj = new URL(currentUrl);
  for (let link of links) {
    try {
      const linkObj = new URL(link);
      if (linkObj.origin === currentUrlObj.origin) {
        // Keep the hash: hash-routed single-page apps (Vue/React dashboards
        // using "#/route" navigation) put the actual sub-page identity there.
        // Dropping it collapses every sub-page link into the same URL as the
        // page already visited, so the crawler never queues any of them.
        const cleanUrl = linkObj.origin + linkObj.pathname + linkObj.search + linkObj.hash;
        if (isSessionEndingUrl(cleanUrl)) continue;
        if (isInjectableUrl(cleanUrl) && !visited.has(cleanUrl) && !queue.includes(cleanUrl)) {
          queue.push(cleanUrl);
        }
      }
    } catch (e) {}
  }
  broadcastStatus();
}

function saveImage(dataUrl, url, label) {
  if (!dataUrl) return;
  const ext = config.imageFormat === 'jpeg' ? 'jpg' : 'png';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeLabel = label ? '_' + String(label).replace(/[^a-z0-9_-]+/gi, '-').slice(0, 40) : '';
  const filename = `${config.downloadDir}/capture_${timestamp}${safeLabel}.${ext}`;

  chrome.downloads.download({
    url: dataUrl,
    filename: filename,
    saveAs: false
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error("Download failed:", chrome.runtime.lastError.message);
      addToHistory(url, filename, null, "download_failed");
      return;
    }
    addToHistory(url, filename, downloadId, "saved");
  });
}

function addToHistory(url, filename, downloadId, status = "saved") {
  chrome.storage.local.get(['history'], (result) => {
    let history = result.history || [];
    history.push({
      url: url,
      timestamp: Date.now(),
      filename,
      downloadId,
      status
    });
    // Keep only last 100
    if (history.length > 100) history.shift();
    chrome.storage.local.set({ history: history });
  });
}

async function setupOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen/offscreen.html');
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });
  if (existingContexts.length > 0) return;
  await chrome.offscreen.createDocument({
    url: offscreenUrl,
    reasons: ['DOM_PARSER'],
    justification: 'Stitching screenshots'
  });
}
