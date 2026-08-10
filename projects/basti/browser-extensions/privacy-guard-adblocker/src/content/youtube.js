(function initPrivacyGuardYouTube() {
  if (window.__privacyGuardYouTubeLoaded) {
    return;
  }
  window.__privacyGuardYouTubeLoaded = true;

  const YOUTUBE_PLAYER_AD_SELECTORS = [
    ".video-ads",
    ".ytp-ad-module",
    ".ytp-ad-overlay-container",
    ".ytp-ad-player-overlay",
    ".ytp-ad-text-overlay",
    ".ytp-ad-progress-list"
  ];

  const YOUTUBE_FEED_AD_SELECTORS = [
    "ytd-ad-slot-renderer",
    "ytd-display-ad-renderer",
    "ytd-promoted-sparkles-web-renderer",
    "ytd-promoted-video-renderer",
    "ytd-companion-slot-renderer",
    "ytd-action-companion-ad-renderer",
    "ytd-in-feed-ad-layout-renderer",
    "ytd-video-masthead-ad-v3-renderer",
    "ytd-compact-promoted-video-renderer"
  ];

  const FEED_CARD_CONTAINERS = [
    "ytd-rich-item-renderer",
    "ytd-rich-section-renderer",
    "ytd-reel-shelf-renderer",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-item-section-renderer"
  ];

  const SKIP_SELECTORS = [
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-skip-ad-button",
    "button[class*='skip'][class*='ad']"
  ];

  let hiddenCount = 0;
  let skipCount = 0;
  let reportTimer = null;

  run();
  const observer = new MutationObserver(() => {
    window.clearTimeout(window.__privacyGuardYouTubeTimer);
    window.__privacyGuardYouTubeTimer = window.setTimeout(run, 150);
  });
  observer.observe(document.documentElement || document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "hidden", "style"]
  });

  function run() {
    hideYouTubeAds();
    clickSkipButtons();
    muteAdSlots();
  }

  function hideYouTubeAds() {
    for (const selector of YOUTUBE_PLAYER_AD_SELECTORS) {
      let nodes = [];
      try {
        nodes = document.querySelectorAll(selector);
      } catch {
        continue;
      }
      for (const node of nodes) {
        if (node instanceof HTMLElement && !node.classList.contains("pg-hidden")) {
          node.classList.add("pg-hidden");
          hiddenCount += 1;
        }
      }
    }
    hideFeedAds();
    if (hiddenCount) {
      queueReport();
    }
  }

  function hideFeedAds() {
    for (const selector of YOUTUBE_FEED_AD_SELECTORS) {
      for (const adNode of document.querySelectorAll(selector)) {
        if (!(adNode instanceof HTMLElement)) {
          continue;
        }
        const target = findSafeAdContainer(adNode);
        if (target && !target.classList.contains("pg-hidden")) {
          target.classList.add("pg-hidden");
          target.dataset.pgYoutubeAd = "1";
          hiddenCount += 1;
        }
      }
    }

  }

  function findSafeAdContainer(adNode) {
    const directAdRenderer = adNode.matches(YOUTUBE_FEED_AD_SELECTORS.join(","))
      ? adNode
      : adNode.closest(YOUTUBE_FEED_AD_SELECTORS.join(","));
    if (!directAdRenderer) {
      return null;
    }
    for (const selector of FEED_CARD_CONTAINERS) {
      const container = directAdRenderer.closest(selector);
      if (container instanceof HTMLElement && container.contains(directAdRenderer)) {
        return container;
      }
    }
    return directAdRenderer instanceof HTMLElement ? directAdRenderer : null;
  }

  function clickSkipButtons() {
    for (const selector of SKIP_SELECTORS) {
      for (const node of document.querySelectorAll(selector)) {
        if (node instanceof HTMLElement && isVisible(node)) {
          node.click();
          skipCount += 1;
        }
      }
    }
    if (skipCount) {
      queueReport();
    }
  }

  function muteAdSlots() {
    const player = document.querySelector(".html5-video-player.ad-showing, .html5-video-player.ad-interrupting");
    if (!player) {
      return;
    }
    const video = document.querySelector("video");
    if (video && Number.isFinite(video.duration) && video.duration < 120) {
      video.currentTime = Math.max(video.currentTime, Math.max(0, video.duration - 0.25));
    }
  }

  function queueReport() {
    if (reportTimer) {
      return;
    }
    reportTimer = window.setTimeout(async () => {
      const events = [];
      if (hiddenCount) {
        events.push({
          category: "youtube",
          label: "YouTube ad elements hidden",
          source: "youtube.com explicit renderer",
          selector: YOUTUBE_FEED_AD_SELECTORS.join(", "),
          blocked: true
        });
      }
      if (skipCount) {
        events.push({
          category: "youtube",
          label: "YouTube skip button clicked",
          source: "youtube.com",
          blocked: true
        });
      }
      hiddenCount = 0;
      skipCount = 0;
      reportTimer = null;
      try {
        await chrome.runtime.sendMessage({
          type: "CONTENT_DETECTION",
          url: location.href,
          events
        });
      } catch {
        // Ignore transient extension reload errors.
      }
    }, 1000);
  }

  function isVisible(node) {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 6 &&
      rect.height > 6 &&
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      Number(style.opacity || 1) > 0.05;
  }
})();
