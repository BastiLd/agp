(function () {
  const THEME_KEY = 'theme';
  const DARK_QUERY = '(prefers-color-scheme: dark)';

  function applyTheme(theme) {
    const resolvedTheme = theme === 'dark' || theme === 'light'
      ? theme
      : (window.matchMedia && window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = resolvedTheme;
  }

  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([THEME_KEY], (result) => applyTheme(result.theme || 'system'));
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.theme) {
        applyTheme(changes.theme.newValue || 'system');
      }
    });
  } else {
    applyTheme('system');
  }

  if (window.matchMedia) {
    window.matchMedia(DARK_QUERY).addEventListener('change', () => {
      chrome.storage.local.get([THEME_KEY], (result) => {
        if (!result.theme || result.theme === 'system') applyTheme('system');
      });
    });
  }
})();
