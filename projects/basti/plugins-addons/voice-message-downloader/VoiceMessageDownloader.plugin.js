/**
 * @name VoiceMessageDownloader
 * @author Bastian
 * @version 1.0.0
 * @description Fügt neben jeder Discord-Sprachnachricht einen Download-Button hinzu. Speicherort, Dateiname und Unterordner sind frei einstellbar.
 */

const fs = require("fs");
const path = require("path");

// Kein require("os"): BetterDiscord reicht nur einen Teil der Node-Module durch und
// sucht "os" stattdessen als Datei im Discord-Ordner - das Plugin laedt dann gar nicht.
function homedir() {
    return process.env.USERPROFILE || process.env.HOME ||
        (process.env.HOMEDRIVE && process.env.HOMEPATH
            ? process.env.HOMEDRIVE + process.env.HOMEPATH
            : ".");
}

const NAME = "VoiceMessageDownloader";
const STYLE_ID = "vmd-styles";
const ACC_PREFIX = "message-accessories-";
const PLAYER_SEL = '[class*="voiceMessage"],[class*="audioPlayer"],[class*="wrapperAudio"],[class*="audioControls"]';

const DEFAULTS = {
    savePath: path.join(homedir(), "Downloads", "Discord Sprachnachrichten"),
    filenameTemplate: "{user} {date} {time}.{ext}",
    subfolders: "none",          // none | guild | guildchannel
    askEveryTime: false,
    showToast: true,
    overwrite: false
};

const ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 3v11m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

const CSS = `
.vmd-btn{
    position:absolute; left:100%; top:50%; transform:translateY(-50%); margin-left:8px;
    width:30px; height:30px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    color:var(--interactive-normal,#b5bac1); background:var(--background-secondary,#2b2d31);
    cursor:pointer; opacity:.75; transition:opacity .15s, color .15s, background .15s, transform .15s;
    z-index:2; flex:0 0 auto;
}
.vmd-btn:hover{ opacity:1; color:var(--interactive-active,#fff); background:var(--background-modifier-hover,#40444b); }
.vmd-btn:active{ transform:translateY(-50%) scale(.92); }
.vmd-btn.vmd-inline{ position:static; transform:none; margin:4px 0 0 0; }
.vmd-btn.vmd-inline:active{ transform:scale(.92); }
.vmd-btn.vmd-busy{ opacity:.5; pointer-events:none; }
.vmd-btn.vmd-busy svg{ animation:vmd-pulse .8s ease-in-out infinite; }
.vmd-btn.vmd-done{ color:var(--text-positive,#23a55a); opacity:1; }
.vmd-btn.vmd-fail{ color:var(--text-danger,#f23f43); opacity:1; }
@keyframes vmd-pulse{ 0%,100%{opacity:.35} 50%{opacity:1} }
.vmd-host{ position:relative; }

.vmd-settings{ color:var(--text-normal,#dbdee1); font-size:14px; }
.vmd-settings .vmd-row{ margin-bottom:20px; }
.vmd-settings .vmd-label{ font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.02em;
    color:var(--header-secondary,#b5bac1); margin-bottom:6px; }
.vmd-settings .vmd-note{ font-size:12px; color:var(--text-muted,#949ba4); margin-top:6px; line-height:1.4; }
.vmd-settings input[type=text], .vmd-settings select{
    width:100%; box-sizing:border-box; padding:9px 10px; border-radius:4px;
    background:var(--input-background,#1e1f22); color:var(--text-normal,#dbdee1);
    border:1px solid var(--input-border,transparent); outline:none; font-size:14px;
}
.vmd-settings input[type=text]:focus, .vmd-settings select:focus{ border-color:var(--brand-experiment,#5865f2); }
.vmd-settings .vmd-inputline{ display:flex; gap:8px; align-items:center; }
.vmd-settings .vmd-button{
    padding:9px 14px; border-radius:4px; border:none; cursor:pointer; white-space:nowrap;
    background:var(--button-secondary-background,#4e5058); color:#fff; font-size:14px; font-weight:500;
}
.vmd-settings .vmd-button:hover{ filter:brightness(1.15); }
.vmd-settings .vmd-check{ display:flex; align-items:flex-start; gap:10px; cursor:pointer; margin-bottom:12px; }
.vmd-settings .vmd-check input{ margin-top:2px; width:16px; height:16px; accent-color:var(--brand-experiment,#5865f2); cursor:pointer; }
.vmd-settings .vmd-check span b{ display:block; color:var(--header-primary,#f2f3f5); font-weight:600; }
.vmd-settings hr{ border:none; border-top:1px solid var(--background-modifier-accent,#3f4147); margin:18px 0; }
`;

function sanitize(value, fallback) {
    const cleaned = String(value == null ? "" : value)
        .replace(/[\\/:*?"<>|]/g, "-")
        .split("").filter(function (c) { return c.charCodeAt(0) > 31; }).join("")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[. ]+$/, "");
    return cleaned || (fallback || "unbenannt");
}

function pad(n) { return String(n).padStart(2, "0"); }

function messageDate(message) {
    try {
        const t = message && message.timestamp;
        if (t) {
            if (typeof t.toDate === "function") return t.toDate();
            if (typeof t.toISOString === "function") return new Date(t.toISOString());
            const d = new Date(t);
            if (!isNaN(d.getTime())) return d;
        }
        if (message && message.id) return new Date(Number(BigInt(message.id) >> 22n) + 1420070400000);
    } catch (e) { /* ignore */ }
    return new Date();
}

// Anhaenge einer Nachricht einsammeln - auch die aus weitergeleiteten Nachrichten.
// Discord haengt weitergeleitete Inhalte nicht an "attachments", sondern legt die
// Originalnachricht unter "message_snapshots" ab; ohne das bleibt der Knopf dort aus.
function sammleAnhaenge(message) {
    if (!message) return [];
    const liste = Array.isArray(message.attachments) ? message.attachments.slice() : [];
    const schnappschuesse = message.message_snapshots || message.messageSnapshots || [];
    for (const eintrag of schnappschuesse) {
        const innen = eintrag && (eintrag.message || eintrag);
        if (innen && Array.isArray(innen.attachments)) liste.push(...innen.attachments);
    }
    return liste;
}

function isVoiceAttachment(att) {
    if (!att) return false;
    const filename = String(att.filename || "").toLowerCase();
    if (filename.startsWith("voice-message")) return true;
    const hasWave = !!att.waveform;
    const hasDuration = att.duration_secs != null || att.durationSecs != null;
    if (!hasWave && !hasDuration) return false;
    const type = String(att.content_type || att.contentType || "");
    return type === "" || type.startsWith("audio");
}

function uniquePath(target) {
    if (!fs.existsSync(target)) return target;
    const dir = path.dirname(target);
    const ext = path.extname(target);
    const base = path.basename(target, ext);
    for (let i = 2; i < 1000; i++) {
        const candidate = path.join(dir, base + " (" + i + ")" + ext);
        if (!fs.existsSync(candidate)) return candidate;
    }
    return target;
}

module.exports = class VoiceMessageDownloader {
    constructor(meta) {
        this.meta = meta || { name: NAME };
        this.settings = Object.assign({}, DEFAULTS, BdApi.Data.load(NAME, "settings") || {});
        this.scanQueued = false;
        this.onMutation = this.onMutation.bind(this);
    }

    /* ---------- Lebenszyklus ---------- */

    start() {
        BdApi.DOM.addStyle(STYLE_ID, CSS);
        this.observer = new MutationObserver(this.onMutation);
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.scan();
    }

    stop() {
        if (this.observer) this.observer.disconnect();
        this.observer = null;
        clearTimeout(this.timer);
        document.querySelectorAll(".vmd-btn").forEach(function (b) { b.remove(); });
        document.querySelectorAll(".vmd-host").forEach(function (h) { h.classList.remove("vmd-host"); });
        BdApi.DOM.removeStyle(STYLE_ID);
    }

    saveSettings() { BdApi.Data.save(NAME, "settings", this.settings); }

    /* ---------- Stores ---------- */

    store(name) {
        this._stores = this._stores || {};
        if (!(name in this._stores)) {
            try { this._stores[name] = BdApi.Webpack.getStore(name); }
            catch (e) { this._stores[name] = null; }
        }
        return this._stores[name];
    }

    /* ---------- Suche nach Sprachnachrichten ---------- */

    onMutation() {
        if (this.scanQueued) return;
        this.scanQueued = true;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => { this.scanQueued = false; this.scan(); }, 200);
    }

    scan() {
        const list = document.querySelectorAll('[id^="' + ACC_PREFIX + '"]');
        for (const acc of list) {
            try { this.process(acc); }
            catch (err) { console.error("[" + NAME + "] scan", err); }
        }
    }

    process(acc) {
        const info = this.getMessageInfo(acc);
        if (!info) return;
        const attachments = sammleAnhaenge(info.message).filter(isVoiceAttachment);
        if (!attachments.length) return;
        if (acc.querySelectorAll(".vmd-btn").length >= attachments.length) return;

        const players = this.findPlayers(acc);
        attachments.forEach((att, index) => {
            const key = String(att.id || index);
            if (acc.querySelector('.vmd-btn[data-vmd-id="' + key + '"]')) return;
            const btn = this.createButton(att, info);
            btn.dataset.vmdId = key;
            const player = players[index];
            if (player) {
                player.classList.add("vmd-host");
                player.appendChild(btn);
            } else {
                btn.classList.add("vmd-inline");
                acc.appendChild(btn);
            }
        });
    }

    findPlayers(acc) {
        const all = Array.from(acc.querySelectorAll(PLAYER_SEL));
        return all.filter(function (el) {
            return !all.some(function (other) { return other !== el && other.contains(el); });
        });
    }

    getMessageInfo(acc) {
        const messageId = acc.id.slice(ACC_PREFIX.length);
        let channelId = null;
        const li = acc.closest('li[id^="chat-messages-"]');
        if (li) {
            const parts = li.id.split("-");
            if (parts.length >= 4) channelId = parts[2];
        }
        let message = null;
        const messageStore = this.store("MessageStore");
        if (messageStore && channelId) {
            try { message = messageStore.getMessage(channelId, messageId); } catch (e) { /* ignore */ }
        }
        if (!message) message = this.messageFromFiber(acc);
        if (!message) return null;
        return { message: message, channelId: message.channel_id || channelId, messageId: messageId };
    }

    messageFromFiber(node) {
        try {
            let fiber = BdApi.ReactUtils.getInternalInstance(node);
            for (let i = 0; i < 60 && fiber; i++, fiber = fiber.return) {
                const props = fiber.memoizedProps;
                const m = props && props.message;
                if (m && (Array.isArray(m.attachments) || m.message_snapshots || m.messageSnapshots)) return m;
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    /* ---------- Button ---------- */

    createButton(att, info) {
        const btn = document.createElement("div");
        btn.className = "vmd-btn";
        btn.setAttribute("role", "button");
        btn.setAttribute("tabindex", "0");
        btn.setAttribute("aria-label", "Sprachnachricht herunterladen");
        btn.title = "Sprachnachricht herunterladen\n(Shift-Klick oder Rechtsklick: Speichern unter …)";
        btn.innerHTML = ICON;

        const run = (useDialog) => this.handleDownload(btn, att, info, useDialog);
        btn.addEventListener("click", function (e) {
            e.preventDefault(); e.stopPropagation();
            run(e.shiftKey);
        });
        btn.addEventListener("contextmenu", function (e) {
            e.preventDefault(); e.stopPropagation();
            run(true);
        });
        btn.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); run(false); }
        });
        return btn;
    }

    flash(btn, cls) {
        btn.classList.remove("vmd-busy", "vmd-done", "vmd-fail");
        btn.classList.add(cls);
        setTimeout(function () { btn.classList.remove(cls); }, 1800);
    }

    toast(text, type) {
        if (!this.settings.showToast) return;
        try { BdApi.UI.showToast(text, { type: type || "info", timeout: 4000 }); } catch (e) { /* ignore */ }
    }

    async handleDownload(btn, att, info, forceDialog) {
        btn.classList.remove("vmd-done", "vmd-fail");
        btn.classList.add("vmd-busy");
        try {
            const bytes = await this.fetchBytes(att.url || att.proxy_url || att.proxyUrl);
            const target = this.buildTarget(att, info);
            const useDialog = forceDialog || this.settings.askEveryTime;
            const saved = await this.saveFile(bytes, target, useDialog);
            btn.classList.remove("vmd-busy");
            this.flash(btn, "vmd-done");
            if (saved) this.toast("Gespeichert: " + saved, "success");
            else this.toast("Sprachnachricht gespeichert", "success");
        } catch (err) {
            console.error("[" + NAME + "] download", err);
            btn.classList.remove("vmd-busy");
            this.flash(btn, "vmd-fail");
            try { BdApi.UI.showToast("Download fehlgeschlagen: " + (err && err.message ? err.message : err), { type: "error", timeout: 6000 }); }
            catch (e) { /* ignore */ }
        }
    }

    async fetchBytes(url) {
        if (!url) throw new Error("Keine Datei-URL gefunden");
        if (BdApi.Net && typeof BdApi.Net.fetch === "function") {
            try {
                const res = await BdApi.Net.fetch(url, { method: "GET" });
                if (res && res.ok !== false) return new Uint8Array(await res.arrayBuffer());
            } catch (e) { /* Fallback unten */ }
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error("HTTP " + res.status);
        return new Uint8Array(await res.arrayBuffer());
    }

    channelInfo(channelId) {
        const fallback = { guild: "Discord", channel: channelId || "unbekannt" };
        try {
            const channelStore = this.store("ChannelStore");
            const channel = channelStore && channelId ? channelStore.getChannel(channelId) : null;
            if (!channel) return fallback;
            if (!channel.guild_id) {
                const recipient = channel.rawRecipients && channel.rawRecipients[0];
                return {
                    guild: "Direktnachrichten",
                    channel: channel.name || (recipient && (recipient.global_name || recipient.username)) || "DM"
                };
            }
            const guildStore = this.store("GuildStore");
            const guild = guildStore ? guildStore.getGuild(channel.guild_id) : null;
            return { guild: (guild && guild.name) || channel.guild_id, channel: channel.name || channel.id };
        } catch (e) { return fallback; }
    }

    buildTarget(att, info) {
        const message = info.message;
        const date = messageDate(message);
        const author = message.author || {};
        const channel = this.channelInfo(info.channelId);
        const ext = ((att.filename || "").split(".").pop() || "ogg").toLowerCase().replace(/[^a-z0-9]/g, "") || "ogg";
        const seconds = Math.round(att.duration_secs != null ? att.duration_secs : (att.durationSecs || 0));

        const values = {
            user: author.globalName || author.global_name || author.username || "Unbekannt",
            userid: author.id || "",
            guild: channel.guild,
            channel: channel.channel,
            date: date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()),
            time: pad(date.getHours()) + "-" + pad(date.getMinutes()) + "-" + pad(date.getSeconds()),
            id: message.id || info.messageId,
            duration: seconds + "s",
            ext: ext
        };
        values.datetime = values.date + "_" + values.time;

        const template = this.settings.filenameTemplate || DEFAULTS.filenameTemplate;
        let name = template.replace(/\{(\w+)\}/g, function (match, key) {
            return values[key] != null ? String(values[key]) : match;
        });
        name = sanitize(name, "sprachnachricht");
        if (!name.toLowerCase().endsWith("." + ext)) name += "." + ext;

        let dir = this.settings.savePath || DEFAULTS.savePath;
        if (this.settings.subfolders === "guild") {
            dir = path.join(dir, sanitize(values.guild, "Discord"));
        } else if (this.settings.subfolders === "guildchannel") {
            dir = path.join(dir, sanitize(values.guild, "Discord"), sanitize(values.channel, "Kanal"));
        }
        return { dir: dir, name: name };
    }

    async saveFile(bytes, target, useDialog) {
        if (useDialog) {
            const native = window.DiscordNative;
            if (native && native.fileManager && typeof native.fileManager.saveWithDialog === "function") {
                await native.fileManager.saveWithDialog(bytes, target.name);
                return null;
            }
        }
        fs.mkdirSync(target.dir, { recursive: true });
        let full = path.join(target.dir, target.name);
        if (!this.settings.overwrite) full = uniquePath(full);
        fs.writeFileSync(full, Buffer.from(bytes));
        return full;
    }

    /* ---------- Einstellungen ---------- */

    getSettingsPanel() {
        const self = this;
        const panel = document.createElement("div");
        panel.className = "vmd-settings";

        function row(labelText, noteText, control) {
            const wrap = document.createElement("div");
            wrap.className = "vmd-row";
            const label = document.createElement("div");
            label.className = "vmd-label";
            label.textContent = labelText;
            wrap.appendChild(label);
            wrap.appendChild(control);
            if (noteText) {
                const note = document.createElement("div");
                note.className = "vmd-note";
                note.textContent = noteText;
                wrap.appendChild(note);
            }
            panel.appendChild(wrap);
            return wrap;
        }

        function checkbox(key, title, description) {
            const label = document.createElement("label");
            label.className = "vmd-check";
            const input = document.createElement("input");
            input.type = "checkbox";
            input.checked = !!self.settings[key];
            input.addEventListener("change", function () {
                self.settings[key] = input.checked;
                self.saveSettings();
            });
            const text = document.createElement("span");
            const strong = document.createElement("b");
            strong.textContent = title;
            text.appendChild(strong);
            text.appendChild(document.createTextNode(description));
            label.appendChild(input);
            label.appendChild(text);
            panel.appendChild(label);
        }

        // Speicherort
        const pathLine = document.createElement("div");
        pathLine.className = "vmd-inputline";
        const pathInput = document.createElement("input");
        pathInput.type = "text";
        pathInput.value = this.settings.savePath;
        pathInput.spellcheck = false;
        pathInput.addEventListener("change", function () {
            self.settings.savePath = pathInput.value.trim() || DEFAULTS.savePath;
            pathInput.value = self.settings.savePath;
            self.saveSettings();
        });

        const browseBtn = document.createElement("button");
        browseBtn.className = "vmd-button";
        browseBtn.textContent = "Durchsuchen";
        browseBtn.addEventListener("click", async function () {
            const chosen = await self.pickFolder();
            if (chosen) {
                self.settings.savePath = chosen;
                pathInput.value = chosen;
                self.saveSettings();
            }
        });

        const openBtn = document.createElement("button");
        openBtn.className = "vmd-button";
        openBtn.textContent = "Öffnen";
        openBtn.addEventListener("click", function () { self.openFolder(pathInput.value); });

        pathLine.appendChild(pathInput);
        pathLine.appendChild(browseBtn);
        pathLine.appendChild(openBtn);
        row("Speicherort", "Der Ordner wird automatisch angelegt, falls er noch nicht existiert.", pathLine);

        // Dateiname
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = this.settings.filenameTemplate;
        nameInput.spellcheck = false;
        nameInput.addEventListener("change", function () {
            self.settings.filenameTemplate = nameInput.value.trim() || DEFAULTS.filenameTemplate;
            nameInput.value = self.settings.filenameTemplate;
            self.saveSettings();
        });
        row("Dateiname-Vorlage",
            "Platzhalter: {user} {userid} {guild} {channel} {date} {time} {datetime} {id} {duration} {ext}",
            nameInput);

        // Unterordner
        const select = document.createElement("select");
        [["none", "Alles in einen Ordner"],
         ["guild", "Unterordner pro Server"],
         ["guildchannel", "Unterordner pro Server / Kanal"]].forEach(function (opt) {
            const o = document.createElement("option");
            o.value = opt[0];
            o.textContent = opt[1];
            if (self.settings.subfolders === opt[0]) o.selected = true;
            select.appendChild(o);
        });
        select.addEventListener("change", function () {
            self.settings.subfolders = select.value;
            self.saveSettings();
        });
        row("Unterordner", null, select);

        panel.appendChild(document.createElement("hr"));

        checkbox("askEveryTime", "Jedes Mal fragen",
            " – öffnet den Windows-Speichern-Dialog statt direkt zu speichern. (Geht auch spontan per Shift-Klick oder Rechtsklick auf den Button.)");
        checkbox("showToast", "Benachrichtigung anzeigen",
            " – zeigt nach dem Speichern kurz den Dateipfad an.");
        checkbox("overwrite", "Vorhandene Dateien überschreiben",
            " – ohne Haken wird an gleichnamige Dateien (2), (3) … angehängt.");

        return panel;
    }

    async pickFolder() {
        const native = window.DiscordNative;
        try {
            if (native && native.fileManager && typeof native.fileManager.showOpenDialog === "function") {
                const result = await native.fileManager.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
                const picked = Array.isArray(result) ? result[0] : (result && result.filePaths && result.filePaths[0]);
                if (picked) return picked;
            }
        } catch (e) { /* ignore */ }
        try {
            const electron = require("electron");
            const dialog = (electron.remote && electron.remote.dialog) || electron.dialog;
            if (dialog && dialog.showOpenDialog) {
                const result = await dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
                const picked = Array.isArray(result) ? result[0] : (result && result.filePaths && result.filePaths[0]);
                if (picked) return picked;
            }
        } catch (e) { /* ignore */ }
        try { BdApi.UI.showToast("Ordner-Dialog nicht verfügbar – bitte den Pfad manuell eintragen.", { type: "warning", timeout: 5000 }); }
        catch (e) { /* ignore */ }
        return null;
    }

    openFolder(dir) {
        const target = dir && dir.trim() ? dir.trim() : this.settings.savePath;
        try { fs.mkdirSync(target, { recursive: true }); } catch (e) { /* ignore */ }
        try {
            const electron = require("electron");
            const shell = electron.shell || (electron.remote && electron.remote.shell);
            if (shell && shell.openPath) { shell.openPath(target); return; }
        } catch (e) { /* ignore */ }
        try {
            const native = window.DiscordNative;
            if (native && native.fileManager && native.fileManager.showItemInFolder) {
                native.fileManager.showItemInFolder(target);
                return;
            }
        } catch (e) { /* ignore */ }
        try { BdApi.UI.showToast("Konnte den Ordner nicht öffnen: " + target, { type: "error" }); } catch (e) { /* ignore */ }
    }
};
