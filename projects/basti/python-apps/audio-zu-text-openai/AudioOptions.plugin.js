/**
 * @name AudioOptions
 * @author Kaan (patched by ChatGPT)
 * @version 1.0.4
 * @description Adds a Download button for Discord voice messages.
 */
"use strict";

module.exports = class AudioOptions {
  constructor() {
    this.api = new BdApi("AudioOptions");
    this.Patcher = this.api.Patcher;
    this.React = this.api.React;
    this.Webpack = this.api.Webpack;
    this.DOM = this.api.DOM;
    this.UI = this.api.UI;
    this.Net = this.api.Net;
  }

  start() {
    try {
      this.injectCss();
      this.patchVoiceMessage();
      this.UI.showToast("AudioOptions loaded.", { type: "success" });
    } catch (e) {
      console.error("[AudioOptions] start error", e);
      this.UI.showToast("AudioOptions failed to start (see console).", { type: "error" });
    }
  }

  stop() {
    this.Patcher.unpatchAll();
    try {
      this.DOM?.removeStyle?.("AudioOptions");
    } catch (_) {}
  }

  injectCss() {
    // Discord sometimes applies pointer-events/overlays to message UI. Force the button to be clickable.
    const css = `
      .audio-options-download{
        pointer-events: auto !important;
        position: relative !important;
        z-index: 9999 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        user-select: none !important;
      }
      .audio-options-download *{ pointer-events: none !important; }
    `;
    this.DOM?.addStyle?.("AudioOptions", css);
  }

  getVoiceModule() {
    const wp = this.Webpack;
    if (!wp) return null;

    if (typeof wp.getBySource === "function") {
      return (
        wp.getBySource("getPlaybackRate", { searchDefault: true }) ||
        wp.getBySource("playbackRate", { searchDefault: true }) ||
        null
      );
    }

    const getModule = typeof wp.getModule === "function" ? wp.getModule.bind(wp) : null;
    const filters = wp.Filters || {};
    const tryGet = (filter) => {
      if (!getModule || !filter) return null;
      try {
        return getModule(filter, { searchExports: true, defaultExport: true }) || getModule(filter);
      } catch (_) {
        try {
          return getModule(filter);
        } catch (err) {
          return null;
        }
      }
    };

    return (
      tryGet(filters.byStrings?.("getPlaybackRate")) ||
      tryGet(filters.byStrings?.("playbackRate")) ||
      tryGet(filters.byProps?.("getPlaybackRate")) ||
      tryGet(filters.byProps?.("playbackRate")) ||
      null
    );
  }

  getPatchTarget(mod) {
    if (!mod) return null;
    const candidates = [
      mod?.Z,
      mod?.default,
      mod,
      ...Object.keys(mod).map((k) => mod[k]),
    ].filter(Boolean);

    for (const c of candidates) {
      if (c && typeof c === "object" && typeof c.type === "function") return { kind: "object", target: c };
      if (typeof c === "function") return { kind: "function", target: c };
    }
    return null;
  }

  isLikelyAudioUrl(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (lower.startsWith("blob:")) return true;
    if (lower.includes("cdn.discordapp.com") || lower.includes("media.discordapp.net")) return true;
    return /\.(ogg|mp3|m4a|wav|flac|webm)(\?|$)/.test(lower);
  }

  getFilenameFromUrl(url) {
    const fallback = `voice-message-${Date.now()}.ogg`;
    if (!url || url.startsWith("blob:")) return fallback;
    try {
      const parsed = new URL(url);
      const base = parsed.pathname.split("/").pop();
      if (!base) return fallback;
      const clean = base.split("?")[0];
      if (!clean || !/\.[a-z0-9]+$/i.test(clean)) return fallback;
      return clean;
    } catch (e) {
      return fallback;
    }
  }

  extractUrlFromElement(el) {
    if (!el) return null;
    if (el.tagName === "A" && el.href) return el.href;
    if (el.src) return el.src;
    return (
      el.getAttribute?.("href") ||
      el.getAttribute?.("src") ||
      el.getAttribute?.("data-src") ||
      el.getAttribute?.("data-url") ||
      el.getAttribute?.("data-download-url") ||
      null
    );
  }

  findAudioUrl(root) {
    if (!root) return null;
    const audio = root.querySelector("audio");
    if (audio) {
      const direct = audio.currentSrc || audio.src;
      if (this.isLikelyAudioUrl(direct)) return direct;
      const source = audio.querySelector("source");
      if (this.isLikelyAudioUrl(source?.src)) return source.src;
    }

    const directNode = root.querySelector(
      '[href*="cdn.discordapp.com"], [src*="cdn.discordapp.com"], [href*="media.discordapp.net"], [src*="media.discordapp.net"]'
    );
    const directUrl = this.extractUrlFromElement(directNode);
    if (this.isLikelyAudioUrl(directUrl)) return directUrl;

    const candidates = root.querySelectorAll("a[href], [data-src], [data-url], [data-download-url], source, audio");
    for (const node of candidates) {
      const url = this.extractUrlFromElement(node);
      if (this.isLikelyAudioUrl(url)) return url;
    }

    return null;
  }

  triggerDownload(href, filename, revokeAfter) {
    const a = Object.assign(document.createElement("a"), {
      href,
      download: filename,
      rel: "noopener",
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (revokeAfter) URL.revokeObjectURL(href);
  }

  async downloadFromUrl(url, filename) {
    try {
      if (!url) throw new Error("No URL");
      const finalName = filename || this.getFilenameFromUrl(url);
      if (url.startsWith("blob:")) {
        this.triggerDownload(url, finalName, false);
        this.UI.showToast("Download started!", { type: "success" });
        return;
      }

      const fetcher = this.Net?.fetch ? this.Net.fetch.bind(this.Net) : window.fetch;
      if (!fetcher) throw new Error("Fetch unavailable");
      const res = await fetcher(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      this.triggerDownload(objectUrl, finalName, true);
      this.UI.showToast("Download started!", { type: "success" });
    } catch (e) {
      console.error("[AudioOptions] download error", e);
      this.UI.showToast("Download failed.", { type: "error" });
    }
  }

  // Finds the nearest voice message URL around the clicked button
  handleClick(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    e?.nativeEvent?.stopImmediatePropagation?.();

    const btn = e.currentTarget;
    const root =
      btn.closest('[class*="voiceMessage"]') ||
      btn.closest('[class*="message"]') ||
      btn.closest('[class*="contents"]') ||
      btn.parentElement;

    const url = this.findAudioUrl(root);

    if (!url) {
      // Sometimes Discord only sets currentSrc after play
      this.UI.showToast("No audio URL found. Try pressing Play once, then click DL.", { type: "warning" });
      return;
    }

    const filename = this.getFilenameFromUrl(url);
    this.downloadFromUrl(url, filename);
  }

  patchVoiceMessage() {
    const mod = this.getVoiceModule();
    const pt = this.getPatchTarget(mod);
    if (!pt) {
      this.UI.showToast("AudioOptions: Voice module not found (Discord update).", { type: "error" });
      return;
    }

    const DownloadBtn = () =>
      this.React.createElement(
        "button",
        {
          type: "button",
          title: "Download voice message",
          className: "audio-options-download",
          onPointerDownCapture: (e) => this.handleClick(e),
          onMouseDownCapture: (e) => this.handleClick(e),
          onClickCapture: (e) => this.handleClick(e),
          tabIndex: 0,
          style: {
            marginLeft: 8,
            width: 34,
            height: 34,
            padding: 0,
            borderRadius: 8,
            border: "none",
            background: "var(--background-secondary-alt)",
            color: "var(--interactive-normal)",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: "34px",
            textAlign: "center",
            pointerEvents: "auto",
            position: "relative",
            zIndex: 9999,
          },
        },
        "DL"
      );

    const inject = (res) => {
      if (!res?.props) return;

      const btnEl = this.React.createElement(DownloadBtn, { key: "audio-options-download" });

      const ch = res.props.children;
      if (Array.isArray(ch)) {
        if (!ch.some((x) => x?.key === "audio-options-download")) ch.push(btnEl);
      } else if (ch) {
        res.props.children = [ch, btnEl];
      } else {
        res.props.children = [btnEl];
      }
    };

    if (pt.kind === "object") {
      this.Patcher.after(pt.target, "type", (_, __, res) => inject(res));
    } else {
      this.Patcher.after(pt.target, "call", (_, __, res) => inject(res));
    }
  }
};
