        
        /* D.1 CORE MOCK DATA SYSTEM */
        const INITIAL_SOFTWARE = [
            { id: 'Vanilla', name: 'Vanilla', desc: 'Die offizielle, unveränderte Minecraft Serversoftware von Mojang.', color: '#d32f2f' },
            { id: 'Spigot', name: 'Spigot', desc: 'Die klassische, weit verbreitete Software mit solider Plugin-Kompatibilität.', color: '#e65100' },
            { id: 'Paper', name: 'Paper', desc: 'Hochgradig optimierter Fork von Spigot, ideal für performance-kritische Server.', color: '#0288d1' },
            { id: 'Purpur', name: 'Purpur', desc: 'Paper-Fork mit zahlreichen zusätzlichen Gameplay- und Performance-Optionen.', color: '#8e24aa' },
            { id: 'Forge', name: 'Forge', desc: 'Der unangefochtene Standard für komplexe, umfangreiche Mods und Modpacks.', color: '#7b1fa2' },
            { id: 'Fabric', name: 'Fabric', desc: 'Die moderne, extrem leichtgewichtige Modding-API mit blitzschnellem Laden.', color: '#388e3c' },
            { id: 'Mohist', name: 'Mohist', desc: 'Smarter Hybrid, der sowohl Spigot-Plugins als auch Forge-Mods gleichzeitig ausführen kann.', color: '#fbc02d' },
            { id: 'Arclight', name: 'Arclight', desc: 'Hybrid-Server, der Bukkit/Spigot-Plugins zusammen mit Forge/Fabric-Mods lädt.', color: '#00897b' }
        ];

        const PLUGINS_DATABASE = [
            { id: 'EssentialsX', name: 'EssentialsX', desc: 'Bietet über 100 unverzichtbare Befehle wie /teleport, /warp, /home und Eco.', category: 'PLUGIN', version: '2.20.1' },
            { id: 'WorldEdit', name: 'WorldEdit', desc: 'Das ultimative Tool zur Ingame-Weltenbearbeitung mit Pinseln und Selektionen.', category: 'PLUGIN', version: '7.3.0' },
            { id: 'LuckPerms', name: 'LuckPerms', desc: 'Hochwertiges, sicheres und performantes Permission-Plugin zur Rechteverwaltung.', category: 'PLUGIN', version: '5.4.12' },
            { id: 'Vault', name: 'Vault', desc: 'Essenzielle Schnittstelle (API) zur einfachen Verknüpfung von Economy und Rechten.', category: 'PLUGIN', version: '1.7.3' },
            { id: 'Dynmap', name: 'Dynmap', desc: 'Generiert eine voll interaktive, zoombare 2D/3D Google-Maps-Karte deiner Welten im Web.', category: 'PLUGIN', version: '3.6.0' },
            { id: 'GeyserMC', name: 'GeyserMC', desc: 'Ermöglicht es Minecraft Bedrock (Handy/Konsole) Spielern, deinem Java-Server beizutreten.', category: 'PLUGIN', version: '2.2.0' },
            { id: 'Create', name: 'Create Mod', desc: 'Erweitert Minecraft um phantastische Zahnräder, mechanische Antriebe und Automationen.', category: 'MOD', version: '0.5.1' },
            { id: 'JEI', name: 'Just Enough Items', desc: 'Das unverzichtbare Ingame-Rezeptbuch zum Durchsuchen aller Items und Crafting-Wege.', category: 'MOD', version: '15.2.0' },
            { id: 'BiomesOPlenty', name: 'Biomes O\' Plenty', desc: 'Fügt Dutzende atemberaubende, realistische und fantasievolle neue Biome hinzu.', category: 'MOD', version: '19.0.0' },
            { id: 'Waystones', name: 'Waystones Mod', desc: 'Ermöglicht das Aufstellen von Teleportations-Steinen für schnelles Ingame-Reisen.', category: 'MOD', version: '14.1.0' }
        ];

        /* ---------------------------------------------------------------
           SICHERHEIT: HTML-Escaping
           Wird auf alle dynamischen Werte angewendet, die per innerHTML in
           Templates landen (Server-/Spielernamen, Logs, Modrinth-Titel,
           Backup-Namen, Tunnel-Domains, Dateinamen). Verhindert XSS.
           --------------------------------------------------------------- */
        function escapeHtml(value) {
            if (value === null || value === undefined) return '';
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        /* ===============================================================
           v1.2.0 INTERNATIONALISIERUNG (i18n)
           Englisch ist Standard, Deutsch umschaltbar. t(key, params) holt
           den String; data-i18n* Attribute werden von applyTranslations()
           ins DOM geschrieben.
           =============================================================== */
        const LANG_KEY = 'craftcontrol_lang';
        const I18N = {
            en: {
                // --- Login / Header ---
                'login.hint': 'This panel is protected with an access token.',
                'login.placeholder': 'Access token',
                'login.submit': 'Sign in',
                'login.error': 'Invalid token. Please try again.',
                'header.logout': 'Sign out',
                'header.language': 'Language',
                'theme.nether': 'Nether Core', 'theme.endvoid': 'End Void',
                'theme.overworld': 'Overworld', 'theme.cyberpunk': 'Redstone Grid',
                // --- Overview ---
                'overview.total': 'Total servers', 'overview.online': 'Online now',
                'overview.players': 'Players total',
                'overview.title': 'Your servers', 'overview.add': 'Create new server',
                'card.players': 'Players', 'card.manage': 'Manage',
                'card.start': 'Start server', 'card.stop': 'Stop server', 'card.delete': 'Delete server',
                // --- Sidebar nav ---
                'nav.status': 'Console & Status', 'nav.performance': 'Performance',
                'nav.software': 'Software / Version', 'nav.plugins': 'Plugins & Mods',
                'nav.backups': 'Backups', 'nav.files': 'Files', 'nav.settings': 'Settings',
                'nav.back': 'Back to overview', 'nav.delete': 'Delete server',
                // --- Dashboard header / power ---
                'dash.control': 'Server control', 'btn.start': 'Start', 'btn.stop': 'Stop',
                'btn.restart': 'Restart',
                // --- Gauges ---
                'gauge.cpu': 'CPU usage', 'gauge.ram': 'RAM usage', 'gauge.players': 'Players',
                // --- Connection / tunnel ---
                'conn.title': 'Connection', 'conn.port': 'Port', 'conn.local': 'Local network',
                'conn.internet': 'Internet (playit.gg)', 'conn.offline': 'offline',
                'conn.no_tunnel': 'No tunnel active yet.',
                'conn.copy_local': 'Copy to clipboard', 'conn.copy_domain': 'Copy domain',
                'tunnel.info_btn': 'How does playit.gg work?',
                'tw.image': 'Image pulled', 'tw.agent': 'Agent started',
                'tw.auth': 'Token / auth needed', 'tw.active': 'Tunnel active',
                'tunnel.claim': 'Claim link: ', 'tunnel.show_logs': 'Show playit logs',
                'tunnel.copy_logs': 'Copy', 'tunnel.start': 'Start tunnel', 'tunnel.stop': 'Stop tunnel',
                'tunnel.secret_label': 'playit.gg Secret-Key (optional)',
                'tunnel.secret_ph': 'Paste Secret-Key (or leave empty)',
                'tunnel.where': 'Where do I get this?',
                'tunnel.s.active': 'Tunnel active. Domain appears shortly …',
                'tunnel.s.agent': 'Agent running – detecting domain …',
                'tunnel.s.auth': 'Token / auth needed.',
                'tunnel.s.needs_secret': 'Secret-Key needed – see (i).',
                'tunnel.s.error': 'Tunnel error.',
                'tunnel.s.status': 'Tunnel status: {s}',
                'toast.tunnel_starting': 'Starting playit tunnel ...',
                'toast.tunnel_needs_secret': 'This agent needs a Secret-Key – see (i) for help.',
                'toast.tunnel_auth': 'Tunnel needs auth – open the claim link below.',
                'toast.tunnel_started': 'Tunnel started. Domain appears shortly.',
                'toast.copied': 'Copied.', 'toast.copy_fail': 'Copy failed.',
                'toast.nothing_copy': 'Nothing to copy.',
                'toast.settings_saved': 'Settings saved. A restart is recommended.',
                'toast.settings_load_fail': 'Could not load settings.',
                'toast.access_saved': 'Access settings saved.',
                'confirm.tunnel_stop': 'Really stop the tunnel? (the Minecraft server stays untouched)',
                'toast.tunnel_stopped': 'Tunnel stopped.',
                'toast.backend_unreachable': 'Backend unreachable: {e}',
                'toast.theme_changed': 'Theme changed to: {name}',
                'toast.deleting': 'Deleting "{name}" ...',
                'toast.deleted': 'Server "{name}" removed.',
                'toast.delete_fail': 'Delete failed: {e}',
                'toast.creating': 'Creating server "{name}"...',
                'toast.created': 'Server "{name}" created.',
                'toast.create_fail': 'Create failed: {e}',
                'toast.action_running': 'Running action "{action}"...',
                'toast.action_done': '"{name}" → {action} done.',
                'toast.error_generic': 'Error: {e}',
                'toast.server_online': 'Server "{name}" is now ONLINE!',
                'toast.server_stopped': 'Server "{name}" stopped.',
                'toast.server_restarting': 'Server "{name}" is restarting...',
                'toast.player_done': '{action} on "{name}" done.',
                'toast.player_fail': '{action} failed: {e}',
                'toast.optimizer_set': 'RAM optimizer: {state}.',
                'toast.opt_on': 'on', 'toast.opt_off': 'off',
                'toast.optimizer_fail': 'Optimizer update failed: {e}',
                'toast.file_load_fail': 'Could not load file: {e}',
                'toast.file_saved': '"{name}" saved. Restart recommended.',
                'toast.file_save_fail': 'Save failed: {e}',
                'toast.server_not_running': 'Server is not running.',
                'toast.cmd_fail': 'Command failed: {e}',
                'toast.engine_selected': 'Engine "{name}" selected. Press “Save” to apply.',
                'toast.config_saved': 'Configuration saved! Restart the server to apply.',
                'toast.invalid_target': 'Invalid choice. Please pick plugins or mods.',
                'toast.installing': 'Installing {name} ...',
                'toast.installed': '{name} installed ({dir}). Restart recommended.',
                'toast.install_fail': 'Installation failed: {e}',
                'toast.removed': '{name} removed.',
                'toast.remove_fail': 'Removal failed: {e}',
                'toast.jar_only': 'Only .jar files are allowed for Minecraft servers!',
                'toast.uploaded': '"{name}" uploaded ({dir}). Restart recommended.',
                'toast.upload_fail': 'Upload failed: {e}',
                'toast.upload_neterr': 'Upload failed (network error).',
                'toast.backup_creating': 'Creating backup – this can take a while depending on world size.',
                'toast.backup_created': 'Backup created successfully!',
                'toast.backup_create_fail': 'Backup failed: {e}',
                'toast.backup_restoring': 'Restoring backup...',
                'toast.backup_restored': 'Backup restored.',
                'toast.backup_restore_fail': 'Restore failed: {e}',
                'toast.backup_download': 'Download started: {name}',
                'toast.backup_download_fail': 'Download failed: {e}',
                'toast.backup_deleted': 'Backup "{name}" deleted.',
                'toast.backup_delete_fail': 'Delete failed: {e}',
                'toast.log_saved': 'Log saved: {name}',
                'toast.no_term_copy': 'No terminal content to copy.',
                'toast.term_copied': 'Terminal text copied.',
                'toast.no_term_save': 'No terminal content to save.',
                'log.console_cleared': 'Console cleared.',
                'confirm.delete_server': 'Really delete server "{name}" permanently?\n\nThe container AND its world volume will be removed. This cannot be undone.',
                'confirm.restore': 'Restore backup "{name}"? The current world will be overwritten. The server will be stopped and restarted afterwards.',
                'confirm.backup_delete': 'Really delete backup "{name}"?',
                // --- Console ---
                'console.title': 'craftcontrol@terminal:~ log-viewer',
                'console.copy': '[Copy]', 'console.download': '[Download log]', 'console.clear': '[Clear console]',
                'console.input_ph': 'Enter a Minecraft command (e.g. /help, /op basti, /say hi)...',
                'console.send': 'Send',
                'overload.banner': '⚠ Server overloaded – tick rate dropping!',
                // --- Players ---
                'players.title': 'Online players', 'players.empty': 'No players online.',
                'players.op': 'Grant admin (OP)', 'players.deop': 'Revoke OP',
                'players.kick': 'Kick', 'players.ban': 'Ban',
                // --- Performance ---
                'perf.title': 'Performance', 'perf.range': 'Range',
                'perf.range5': 'Last 5 minutes', 'perf.range30': 'Last 30 minutes', 'perf.range120': 'Last 2 hours',
                'perf.empty': 'No data collected yet – please wait a moment.',
                'perf.mode_normal': 'Normal', 'perf.mode_detailed': 'Detailed', 'perf.charts': 'Charts',
                'perf.cores': 'CPU cores', 'perf.per_core_na': 'Per-core data is not available on this host (cgroup v2).',
                'perf.net': 'Network', 'perf.disk': 'Disk I/O', 'perf.pids': 'Processes', 'perf.uptime': 'Uptime',
                'perf.in': 'in', 'perf.out': 'out', 'perf.read': 'read', 'perf.write': 'write',
                // --- Software panel ---
                'sw.title': 'Choose server software',
                'sw.desc': 'Switch your server’s Minecraft engine. Spigot, Paper and Fabric support plugins/mods.',
                'sw.version': 'Minecraft version', 'sw.ram': 'RAM allocation',
                'sw.optimizer': 'Automatic RAM optimizer',
                'sw.optimizer_desc': 'After 30 minutes without players it triggers a save-all + GC hint to reclaim RAM.',
                'sw.save': 'Save & apply software configuration',
                // --- Plugins ---
                'plug.title': 'Plugin & mod catalog',
                'plug.desc': 'Search and install popular server extensions with one click.',
                'plug.search_ph': 'Search plugin or mod...',
                'plug.cat_auto': 'Auto (matches software)', 'plug.cat_plugin': 'Plugins only',
                'plug.cat_mod': 'Mods only', 'plug.cat_all': 'All compatible',
                'plug.upload_title': 'Upload your own .jar', 'plug.upload_hint': 'Drag a file here or click',
                'plug.installed': 'Installed extensions', 'plug.none_installed': 'No extensions installed.',
                'plug.install': 'Install', 'plug.installed_badge': 'Installed', 'plug.uninstall': 'Uninstall',
                'plug.searching': 'Searching modrinth.com ...',
                'plug.no_results': 'No results for "{q}" ({kind} for {version}).',
                'plug.hybrid_prompt': 'Hybrid extension. Install as "plugins" or "mods"?',
                'plug.search_fail': 'Modrinth search failed: {e}',
                'plug.target': 'Target', 'plug.target_click': 'selectable on click', 'plug.target_unknown': 'unknown',
                'plug.clientside_warn': '⚠ Client-only mod – not active on the server.',
                'plug.not_installable': 'Not installable', 'plug.reload': 'Reload', 'plug.downloads': 'downloads',
                // --- Backups ---
                'bk.title': 'Server backups',
                'bk.desc': 'Back up the state of your worlds and configuration files.',
                'bk.create': 'Create backup', 'bk.compressing': 'Compressing world files & configs...',
                'bk.name': 'Backup name', 'bk.date': 'Created', 'bk.size': 'Size', 'bk.actions': 'Actions',
                'bk.empty': 'No backups yet. Click “Create backup” at the top right.',
                'bk.restore': 'Restore', 'bk.download': 'Download', 'bk.delete': 'Delete',
                // --- Files ---
                'files.loading': 'Loading files...', 'files.none_selected': 'No file selected',
                'files.pick': 'Pick a file on the left to edit it.', 'files.save': 'Save file',
                'files.textarea_ph': '// Select a file on the left...',
                'files.not_exists': 'File does not exist yet. It will be created on save.',
                // --- Settings (server.properties) ---
                'set.title': 'Server settings',
                'set.desc': 'Aternos-style options written to server.properties. A server restart is required to apply them.',
                'set.restart_hint': 'Changes require a server restart.',
                'set.save': 'Save settings',
                'set.maxplayers': 'Max players', 'set.gamemode': 'Game mode', 'set.difficulty': 'Difficulty',
                'set.whitelist': 'Whitelist', 'set.cracked': 'Cracked (offline mode)', 'set.pvp': 'PvP',
                'set.cmdblock': 'Command blocks', 'set.flight': 'Allow flight', 'set.monsters': 'Monsters',
                'set.nether': 'Nether', 'set.forcegm': 'Force game mode', 'set.spawnprot': 'Spawn protection',
                'set.motd': 'MOTD (server description)', 'set.resourcepack': 'Resource pack URL',
                'set.gm_survival': 'Survival', 'set.gm_creative': 'Creative', 'set.gm_adventure': 'Adventure', 'set.gm_spectator': 'Spectator',
                'set.diff_peaceful': 'Peaceful', 'set.diff_easy': 'Easy', 'set.diff_normal': 'Normal', 'set.diff_hard': 'Hard',
                'set.cracked_info': 'Cracked / offline mode',
                // --- Create modal ---
                'modal.create_title': 'Create a new server', 'modal.name': 'Server name',
                'modal.name_ph': 'e.g. Skyblock Fun', 'modal.software': 'Server software',
                'modal.version': 'Minecraft version', 'modal.ram': 'RAM allocation',
                'modal.cancel': 'Cancel', 'modal.create': 'Create server',
                // --- generic ---
                'modal.close': 'Close', 'common.loading': 'Loading...',
                // --- App settings (global) ---
                'app.settings': 'App settings', 'app.language': 'Language', 'app.theme': 'Theme',
                'app.access_title': 'External access (origins)',
                'app.access_desc': 'Same-origin access (e.g. via Tailscale hostname) always works. Only add origins here if you open the panel from a DIFFERENT host/port than it is served from (cross-origin).',
                'app.origins_ph': 'https://my-host.ts.net, http://100.x.y.z:8080',
                'app.allow_all': 'Allow all origins (not recommended)',
                'app.save': 'Save access settings',
                // --- playit info modal (HTML) ---
                'tunnel.info_title': 'Make your server reachable from the internet (playit.gg)',
                'tunnel.info_html':
                    '<p>playit.gg gives your server a public address for free – no port forwarding needed.</p>' +
                    '<ol style="margin:0.6rem 0 0.6rem 1.1rem; line-height:1.6;">' +
                    '<li>Create a <b>free account</b> at <a href="https://playit.gg" target="_blank" rel="noopener">playit.gg</a>.</li>' +
                    '<li>Open <a href="https://playit.gg/account/agents" target="_blank" rel="noopener">Account → Agents</a> and create an agent. Copy its <b>Secret&nbsp;Key</b>.</li>' +
                    '<li>Paste the Secret-Key into the field here and click <b>Start tunnel</b>.</li>' +
                    '<li>Wait a few seconds – the public <b>domain</b> appears here and players can join via it.</li>' +
                    '<li>If a <b>claim link</b> shows up instead, open it and link the agent to your account.</li>' +
                    '</ol>' +
                    '<p style="color:var(--text-muted); font-size:0.82rem;">Tip: the Secret-Key path is the most reliable for a headless Docker agent.</p>',
            },
            de: {
                'login.hint': 'Dieses Panel ist mit einem Zugriffs-Token geschützt.',
                'login.placeholder': 'Zugriffs-Token',
                'login.submit': 'Anmelden',
                'login.error': 'Token ungültig. Bitte erneut versuchen.',
                'header.logout': 'Abmelden',
                'header.language': 'Sprache',
                'theme.nether': 'Nether Core', 'theme.endvoid': 'End Void',
                'theme.overworld': 'Overworld', 'theme.cyberpunk': 'Redstone Grid',
                'overview.total': 'Server Gesamt', 'overview.online': 'Aktiv Online',
                'overview.players': 'Spieler Gesamt',
                'overview.title': 'Deine Server', 'overview.add': 'Neuen Server anlegen',
                'card.players': 'Spieler', 'card.manage': 'Verwalten',
                'card.start': 'Server starten', 'card.stop': 'Server stoppen', 'card.delete': 'Server löschen',
                'nav.status': 'Konsole & Status', 'nav.performance': 'Performance',
                'nav.software': 'Software / Version', 'nav.plugins': 'Plugins & Mods',
                'nav.backups': 'Backup-Verlauf', 'nav.files': 'Dateien', 'nav.settings': 'Einstellungen',
                'nav.back': 'Zurück zur Übersicht', 'nav.delete': 'Server löschen',
                'dash.control': 'Serversteuerung', 'btn.start': 'Starten', 'btn.stop': 'Stoppen',
                'btn.restart': 'Neustart',
                'gauge.cpu': 'CPU Auslastung', 'gauge.ram': 'RAM Belegung', 'gauge.players': 'Spielerzahl',
                'conn.title': 'Verbindung', 'conn.port': 'Port', 'conn.local': 'Lokales Netzwerk',
                'conn.internet': 'Internet (playit.gg)', 'conn.offline': 'offline',
                'conn.no_tunnel': 'Noch kein Tunnel aktiv.',
                'conn.copy_local': 'In die Zwischenablage kopieren', 'conn.copy_domain': 'Domain kopieren',
                'tunnel.info_btn': 'Wie funktioniert playit.gg?',
                'tw.image': 'Image gezogen', 'tw.agent': 'Agent gestartet',
                'tw.auth': 'Token / Auth nötig', 'tw.active': 'Tunnel aktiv',
                'tunnel.claim': 'Claim-Link: ', 'tunnel.show_logs': 'playit-Logs anzeigen',
                'tunnel.copy_logs': 'Kopieren', 'tunnel.start': 'Tunnel starten', 'tunnel.stop': 'Tunnel stoppen',
                'tunnel.secret_label': 'playit.gg Secret-Key (optional)',
                'tunnel.secret_ph': 'Secret-Key einfügen (oder leer lassen)',
                'tunnel.where': 'Wo bekomme ich den?',
                'tunnel.s.active': 'Tunnel aktiv. Domain wird gleich angezeigt …',
                'tunnel.s.agent': 'Agent läuft – Domain wird erkannt …',
                'tunnel.s.auth': 'Token / Auth nötig.',
                'tunnel.s.needs_secret': 'Secret-Key nötig – siehe (i).',
                'tunnel.s.error': 'Tunnel-Fehler.',
                'tunnel.s.status': 'Tunnel-Status: {s}',
                'toast.tunnel_starting': 'Starte playit-Tunnel ...',
                'toast.tunnel_needs_secret': 'Dieser Agent braucht einen Secret-Key – Hilfe über (i).',
                'toast.tunnel_auth': 'Tunnel braucht Auth – Claim-Link unten öffnen.',
                'toast.tunnel_started': 'Tunnel gestartet. Domain wird gleich angezeigt.',
                'toast.copied': 'Kopiert.', 'toast.copy_fail': 'Kopieren fehlgeschlagen.',
                'toast.nothing_copy': 'Nichts zum Kopieren.',
                'toast.settings_saved': 'Einstellungen gespeichert. Neustart empfohlen.',
                'toast.settings_load_fail': 'Einstellungen konnten nicht geladen werden.',
                'toast.access_saved': 'Zugriffs-Einstellungen gespeichert.',
                'confirm.tunnel_stop': 'Tunnel wirklich stoppen? (Minecraft-Server bleibt unangetastet)',
                'toast.tunnel_stopped': 'Tunnel gestoppt.',
                'toast.backend_unreachable': 'Backend nicht erreichbar: {e}',
                'toast.theme_changed': 'Theme gewechselt zu: {name}',
                'toast.deleting': 'Lösche "{name}" ...',
                'toast.deleted': 'Server "{name}" wurde entfernt.',
                'toast.delete_fail': 'Löschen fehlgeschlagen: {e}',
                'toast.creating': 'Lege Server "{name}" an...',
                'toast.created': 'Server "{name}" wurde angelegt.',
                'toast.create_fail': 'Fehler beim Anlegen: {e}',
                'toast.action_running': 'Aktion "{action}" wird ausgeführt...',
                'toast.action_done': '"{name}" → {action} ausgeführt.',
                'toast.error_generic': 'Fehler: {e}',
                'toast.server_online': 'Server "{name}" ist jetzt ONLINE!',
                'toast.server_stopped': 'Server "{name}" wurde gestoppt.',
                'toast.server_restarting': 'Server "{name}" wird neugestartet...',
                'toast.player_done': '{action} an "{name}" ausgeführt.',
                'toast.player_fail': '{action} fehlgeschlagen: {e}',
                'toast.optimizer_set': 'RAM-Optimierer: {state}.',
                'toast.opt_on': 'aktiv', 'toast.opt_off': 'deaktiviert',
                'toast.optimizer_fail': 'Optimierer-Update fehlgeschlagen: {e}',
                'toast.file_load_fail': 'Datei konnte nicht geladen werden: {e}',
                'toast.file_saved': '"{name}" gespeichert. Neustart empfohlen.',
                'toast.file_save_fail': 'Speichern fehlgeschlagen: {e}',
                'toast.server_not_running': 'Server läuft nicht.',
                'toast.cmd_fail': 'Befehl fehlgeschlagen: {e}',
                'toast.engine_selected': 'Engine "{name}" ausgewählt. Drücke „Speichern“ zum Übernehmen.',
                'toast.config_saved': 'Konfiguration gespeichert! Starte den Server neu zum Übernehmen.',
                'toast.invalid_target': 'Ungültige Auswahl. Bitte plugins oder mods wählen.',
                'toast.installing': 'Installiere {name} ...',
                'toast.installed': '{name} installiert ({dir}). Neustart empfohlen.',
                'toast.install_fail': 'Installation fehlgeschlagen: {e}',
                'toast.removed': '{name} wurde entfernt.',
                'toast.remove_fail': 'Entfernen fehlgeschlagen: {e}',
                'toast.jar_only': 'Nur .jar-Dateien sind für Minecraft-Server zulässig!',
                'toast.uploaded': '"{name}" hochgeladen ({dir}). Neustart empfohlen.',
                'toast.upload_fail': 'Upload fehlgeschlagen: {e}',
                'toast.upload_neterr': 'Upload fehlgeschlagen (Netzwerkfehler).',
                'toast.backup_creating': 'Backup wird erstellt – das kann je nach Welt-Größe etwas dauern.',
                'toast.backup_created': 'Backup wurde erfolgreich erstellt!',
                'toast.backup_create_fail': 'Backup fehlgeschlagen: {e}',
                'toast.backup_restoring': 'Backup-Wiederherstellung läuft...',
                'toast.backup_restored': 'Backup wurde eingespielt.',
                'toast.backup_restore_fail': 'Wiederherstellung fehlgeschlagen: {e}',
                'toast.backup_download': 'Download startet: {name}',
                'toast.backup_download_fail': 'Download fehlgeschlagen: {e}',
                'toast.backup_deleted': 'Backup "{name}" wurde gelöscht.',
                'toast.backup_delete_fail': 'Löschen fehlgeschlagen: {e}',
                'toast.log_saved': 'Log gespeichert: {name}',
                'toast.no_term_copy': 'Kein Terminal-Inhalt zum Kopieren.',
                'toast.term_copied': 'Terminal-Text kopiert.',
                'toast.no_term_save': 'Kein Terminal-Inhalt zum Speichern.',
                'log.console_cleared': 'Konsole geleert.',
                'confirm.delete_server': 'Server "{name}" wirklich endgültig löschen?\n\nDer Container UND das zugehörige Welt-Volume werden entfernt. Diese Aktion kann nicht rückgängig gemacht werden.',
                'confirm.restore': 'Backup "{name}" einspielen? Der aktuelle Serverzustand wird überschrieben. Der Server wird dafür gestoppt und danach wieder gestartet.',
                'confirm.backup_delete': 'Backup "{name}" wirklich löschen?',
                'console.title': 'craftcontrol@terminal:~ log-viewer',
                'console.copy': '[Kopieren]', 'console.download': '[Log herunterladen]', 'console.clear': '[Konsole Leeren]',
                'console.input_ph': 'Minecraft-Befehl eingeben (z.B. /help, /op basti, /say hallo)...',
                'console.send': 'Senden',
                'overload.banner': '⚠ Server überlastet – Tick-Rate sinkt!',
                'players.title': 'Online-Spieler', 'players.empty': 'Keine Spieler online.',
                'players.op': 'Adminrechte vergeben (OP)', 'players.deop': 'OP entziehen',
                'players.kick': 'Kicken', 'players.ban': 'Bannen',
                'perf.title': 'Performance', 'perf.range': 'Zeitraum',
                'perf.range5': 'Letzte 5 Minuten', 'perf.range30': 'Letzte 30 Minuten', 'perf.range120': 'Letzte 2 Stunden',
                'perf.empty': 'Noch keine Daten gesammelt – bitte einen Moment Geduld.',
                'perf.mode_normal': 'Normal', 'perf.mode_detailed': 'Detailliert', 'perf.charts': 'Diagramme',
                'perf.cores': 'CPU-Kerne', 'perf.per_core_na': 'Pro-Kern-Daten sind auf diesem Host nicht verfügbar (cgroup v2).',
                'perf.net': 'Netzwerk', 'perf.disk': 'Disk-I/O', 'perf.pids': 'Prozesse', 'perf.uptime': 'Laufzeit',
                'perf.in': 'rein', 'perf.out': 'raus', 'perf.read': 'gelesen', 'perf.write': 'geschrieben',
                'sw.title': 'Serversoftware wählen',
                'sw.desc': 'Wechsle die Minecraft-Engine deines Servers. Spigot, Paper und Fabric unterstützen Plugins/Mods.',
                'sw.version': 'Minecraft-Version', 'sw.ram': 'RAM Zuweisung',
                'sw.optimizer': 'Automatischer RAM-Optimierer',
                'sw.optimizer_desc': 'Triggert nach 30 Minuten ohne Spieler ein save-all + GC-Hilfe, um RAM zurückzugewinnen.',
                'sw.save': 'Software-Konfiguration speichern & übernehmen',
                'plug.title': 'Plugin & Mod Katalog',
                'plug.desc': 'Durchsuche und installiere beliebte Servererweiterungen per Klick.',
                'plug.search_ph': 'Plugin oder Mod suchen...',
                'plug.cat_auto': 'Auto (Software-passend)', 'plug.cat_plugin': 'Nur Plugins',
                'plug.cat_mod': 'Nur Mods', 'plug.cat_all': 'Alle kompatiblen',
                'plug.upload_title': 'Eigene .jar hochladen', 'plug.upload_hint': 'Datei hierher ziehen oder klicken',
                'plug.installed': 'Installierte Erweiterungen', 'plug.none_installed': 'Keine Erweiterungen installiert.',
                'plug.install': 'Installieren', 'plug.installed_badge': 'Installiert', 'plug.uninstall': 'Deinstallieren',
                'plug.searching': 'Suche auf modrinth.com ...',
                'plug.no_results': 'Keine Treffer für "{q}" ({kind} für {version}).',
                'plug.hybrid_prompt': 'Hybrid-Erweiterung. Als „plugins“ oder „mods“ installieren?',
                'plug.search_fail': 'Modrinth-Suche fehlgeschlagen: {e}',
                'plug.target': 'Ziel', 'plug.target_click': 'bei Klick wählbar', 'plug.target_unknown': 'unbekannt',
                'plug.clientside_warn': '⚠ Reines Client-Mod – auf dem Server nicht aktiv.',
                'plug.not_installable': 'Nicht installierbar', 'plug.reload': 'Erneut laden', 'plug.downloads': 'Downloads',
                'bk.title': 'Server-Backups',
                'bk.desc': 'Sichere den Zustand deiner Welten und Konfigurationsdateien.',
                'bk.create': 'Backup Erstellen', 'bk.compressing': 'Komprimiere Weltdateien & Konfigurationen...',
                'bk.name': 'Backup Name', 'bk.date': 'Erstelldatum', 'bk.size': 'Größe', 'bk.actions': 'Aktionen',
                'bk.empty': 'Keine Backups vorhanden. Klicke oben rechts auf „Backup Erstellen“.',
                'bk.restore': 'Restore', 'bk.download': 'Herunterladen', 'bk.delete': 'Löschen',
                'files.loading': 'Lade Dateien...', 'files.none_selected': 'Keine Datei ausgewählt',
                'files.pick': 'Wähle links eine Datei aus, um sie zu bearbeiten.', 'files.save': 'Datei speichern',
                'files.textarea_ph': '// Datei links auswählen...',
                'files.not_exists': 'Datei existiert noch nicht. Beim Speichern wird sie erstellt.',
                'set.title': 'Server-Einstellungen',
                'set.desc': 'Aternos-artige Optionen, die in server.properties geschrieben werden. Zum Übernehmen ist ein Server-Neustart nötig.',
                'set.restart_hint': 'Änderungen erfordern einen Server-Neustart.',
                'set.save': 'Einstellungen speichern',
                'set.maxplayers': 'Maximale Spieler', 'set.gamemode': 'Spielmodus', 'set.difficulty': 'Schwierigkeit',
                'set.whitelist': 'Whitelist', 'set.cracked': 'Gecrackt (Offline-Modus)', 'set.pvp': 'PvP',
                'set.cmdblock': 'Befehlsblöcke', 'set.flight': 'Fliegen erlauben', 'set.monsters': 'Monster',
                'set.nether': 'Nether', 'set.forcegm': 'Spielmodus erzwingen', 'set.spawnprot': 'Spawn-Schutz',
                'set.motd': 'MOTD (Server-Beschreibung)', 'set.resourcepack': 'Ressourcenpaket-URL',
                'set.gm_survival': 'Überleben', 'set.gm_creative': 'Kreativ', 'set.gm_adventure': 'Abenteuer', 'set.gm_spectator': 'Zuschauer',
                'set.diff_peaceful': 'Friedlich', 'set.diff_easy': 'Einfach', 'set.diff_normal': 'Normal', 'set.diff_hard': 'Schwer',
                'set.cracked_info': 'Gecrackt / Offline-Modus',
                'modal.create_title': 'Neuen Server anlegen', 'modal.name': 'Servername',
                'modal.name_ph': 'z.B. Skyblock Fun', 'modal.software': 'Serversoftware',
                'modal.version': 'Minecraft Version', 'modal.ram': 'RAM Zuweisung',
                'modal.cancel': 'Abbrechen', 'modal.create': 'Server Erstellen',
                'modal.close': 'Schließen', 'common.loading': 'Lade...',
                'app.settings': 'App-Einstellungen', 'app.language': 'Sprache', 'app.theme': 'Design',
                'app.access_title': 'Externer Zugriff (Origins)',
                'app.access_desc': 'Zugriff vom selben Origin (z.B. über den Tailscale-Hostnamen) funktioniert immer. Füge hier nur dann Origins hinzu, wenn du das Panel von einem ANDEREN Host/Port öffnest als dem, von dem es ausgeliefert wird (Cross-Origin).',
                'app.origins_ph': 'https://mein-host.ts.net, http://100.x.y.z:8080',
                'app.allow_all': 'Alle Origins erlauben (nicht empfohlen)',
                'app.save': 'Zugriffs-Einstellungen speichern',
                'tunnel.info_title': 'Server aus dem Internet erreichbar machen (playit.gg)',
                'tunnel.info_html':
                    '<p>playit.gg gibt deinem Server kostenlos eine öffentliche Adresse – ohne Portfreigabe.</p>' +
                    '<ol style="margin:0.6rem 0 0.6rem 1.1rem; line-height:1.6;">' +
                    '<li>Erstelle ein <b>kostenloses Konto</b> bei <a href="https://playit.gg" target="_blank" rel="noopener">playit.gg</a>.</li>' +
                    '<li>Öffne <a href="https://playit.gg/account/agents" target="_blank" rel="noopener">Account → Agents</a> und erstelle einen Agent. Kopiere dessen <b>Secret&nbsp;Key</b>.</li>' +
                    '<li>Füge den Secret-Key hier ins Feld ein und klicke auf <b>Tunnel starten</b>.</li>' +
                    '<li>Warte ein paar Sekunden – die öffentliche <b>Domain</b> erscheint hier und Spieler können über sie beitreten.</li>' +
                    '<li>Falls stattdessen ein <b>Claim-Link</b> erscheint, öffne ihn und verknüpfe den Agent mit deinem Konto.</li>' +
                    '</ol>' +
                    '<p style="color:var(--text-muted); font-size:0.82rem;">Tipp: Der Secret-Key-Weg ist für einen Headless-Docker-Agent am zuverlässigsten.</p>',
            },
        };
        let CURRENT_LANG = (localStorage.getItem(LANG_KEY) === 'de') ? 'de' : 'en';
        function t(key, params) {
            const dict = I18N[CURRENT_LANG] || I18N.en;
            let s = (dict[key] !== undefined) ? dict[key]
                    : (I18N.en[key] !== undefined ? I18N.en[key] : key);
            if (params) {
                for (const k in params) s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
            }
            return s;
        }
        function applyTranslations(root) {
            root = root || document;
            root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
            root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
            root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'))); });
            root.querySelectorAll('[data-i18n-title]').forEach(el => { el.setAttribute('title', t(el.getAttribute('data-i18n-title'))); });
            document.documentElement.setAttribute('lang', CURRENT_LANG);
        }

        /* ---------------------------------------------------------------
           D.0 BACKEND-API CLIENT
           Spricht das FastAPI-Backend an. Wenn das Frontend aus dem Container
           ausgeliefert wird, ist Origin gleich -> relative URL reicht.
           --------------------------------------------------------------- */
        const AUTH_TOKEN_KEY = 'craftcontrol_token';
        const API = (() => {
            const base = window.CRAFTCONTROL_API || '';
            function authHeaders() {
                const token = localStorage.getItem(AUTH_TOKEN_KEY);
                return token ? { 'Authorization': `Bearer ${token}` } : {};
            }
            async function req(method, path, body) {
                const opts = { method, headers: { 'Accept': 'application/json', ...authHeaders() } };
                if (body !== undefined) {
                    opts.headers['Content-Type'] = 'application/json';
                    opts.body = JSON.stringify(body);
                }
                const res = await fetch(base + path, opts);
                if (res.status === 401) {
                    // Token fehlt/ungueltig -> Login erzwingen
                    if (window.app && typeof window.app.requireLogin === 'function') {
                        window.app.requireLogin();
                    }
                    throw new Error('Nicht autorisiert');
                }
                if (res.status === 204) return null;
                let data = null;
                try { data = await res.json(); } catch (_) { /* ignore */ }
                if (!res.ok) {
                    const msg = (data && (data.detail || data.message)) || res.statusText;
                    throw new Error(msg);
                }
                return data;
            }
            return {
                _base: base,
                authHeaders,
                authCheck: () => req('GET', '/api/auth/check'),
                listServers: () => req('GET', '/api/servers'),
                getServer:   (id) => req('GET', `/api/servers/${id}`),
                createServer:(payload) => req('POST', '/api/servers', payload),
                deleteServer:(id) => req('DELETE', `/api/servers/${id}`),
                start:       (id) => req('POST', `/api/servers/${id}/start`),
                stop:        (id) => req('POST', `/api/servers/${id}/stop`),
                restart:     (id) => req('POST', `/api/servers/${id}/restart`),
                logs:        (id, tail = 200) => req('GET', `/api/servers/${id}/logs?tail=${tail}`),
                command:     (id, command) => req('POST', `/api/servers/${id}/command`, { command }),
                stats:       () => req('GET', '/api/stats'),
                minecraftVersions: () => req('GET', '/api/minecraft/versions'),
                // Plugin / Mod (Modrinth)
                searchPlugins: (id, query, type = 'auto', limit = 25) =>
                    req('GET', `/api/servers/${id}/plugins/search?query=${encodeURIComponent(query || '')}&type=${type}&limit=${limit}`),
                installPlugin: (id, projectId, versionId, target) =>
                    req('POST', `/api/servers/${id}/plugins/install`, { project_id: projectId, version_id: versionId || null, target: target || null }),
                installedPlugins: (id) => req('GET', `/api/servers/${id}/plugins/installed`),
                deleteInstalledPlugin: (id, filename) =>
                    req('DELETE', `/api/servers/${id}/plugins/installed/${encodeURIComponent(filename)}`),
                // v1.0.4: Spieler / Dateien / Optimierer / Tunnel
                listPlayers: (id) => req('GET', `/api/servers/${id}/players`),
                playerOp:    (id, player) => req('POST', `/api/servers/${id}/players/op`,    { player }),
                playerDeop:  (id, player) => req('POST', `/api/servers/${id}/players/deop`,  { player }),
                playerKick:  (id, player, reason) => req('POST', `/api/servers/${id}/players/kick`, { player, reason }),
                playerBan:   (id, player, reason) => req('POST', `/api/servers/${id}/players/ban`,  { player, reason }),
                listFiles:   (id) => req('GET', `/api/servers/${id}/files`),
                readFile:    (id, name) => req('GET', `/api/servers/${id}/files/${encodeURIComponent(name)}`),
                writeFile:   (id, name, content) =>
                    req('PUT', `/api/servers/${id}/files/${encodeURIComponent(name)}`, { content }),
                setOptimizer:(id, enabled) => req('PUT', `/api/servers/${id}/optimizer`, { enabled }),
                tunnelStatus:(id) => req('GET', `/api/servers/${id}/tunnel`),
                tunnelStart: (id, secret) => req('POST', `/api/servers/${id}/tunnel/start`, { secret: secret || null }),
                tunnelStop:  (id) => req('POST', `/api/servers/${id}/tunnel/stop`),
                // v1.1.0: Echte Backups
                listBackups:   (id) => req('GET', `/api/servers/${id}/backups`),
                createBackup:  (id) => req('POST', `/api/servers/${id}/backups`),
                deleteBackup:  (id, name) => req('DELETE', `/api/servers/${id}/backups/${encodeURIComponent(name)}`),
                restoreBackup: (id, name) => req('POST', `/api/servers/${id}/backups/${encodeURIComponent(name)}/restore`),
                backupDownloadUrl: (id, name) => `${base}/api/servers/${id}/backups/${encodeURIComponent(name)}`,
                // v1.2.0: App-Konfiguration (erlaubte Origins fuer externen Zugriff)
                getAppConfig: () => req('GET', '/api/app/config'),
                setAppConfig: (cfg) => req('PUT', '/api/app/config', cfg),
            };
        })();

        // In-Memory-Cache der vom Backend gelieferten Server (DTOs).
        // Pro Server haengen wir clientseitig logs/installedExtensions/backups an,
        // bis diese Bereiche ebenfalls vom Backend gepflegt werden.
        let servers = [];


        /* D.2 VIEW & SIMULATION CONTROLLER */
        class DashboardApp {
            constructor() {
                this.activeServerId = null;
                this.activeTab = 'status';
                this.simulationInterval = null;
                this._statusSub = 'console';
                
                // Form element references
                this.ramSlider = document.getElementById('new-server-ram');
                this.ramValueLabel = document.getElementById('new-ram-value-label');
                
                // Modal RAM Slider event
                this.ramSlider.addEventListener('input', (e) => {
                    this.ramValueLabel.innerText = e.target.value + ' GB';
                });

                // Version Panel RAM Slider event
                document.getElementById('input-allocated-ram').addEventListener('input', (e) => {
                    document.getElementById('label-allocated-ram').innerText = e.target.value + ' GB';
                });

                // Listen for drag & drop uploads
                this.setupDragAndDrop();

                // v1.0.4: globaler Klick-Handler schliesst offene Spieler-Menues
                document.addEventListener('click', () => this._closeAllPlayerMenus());
            }

            async init() {
                // v1.1.0: Auth-Gate. Prueft, ob das Backend einen Token verlangt.
                this._setupLoginForm();
                let authed = false;
                try {
                    const check = await API.authCheck();
                    this._authRequired = !!(check && check.auth_required);
                    authed = !this._authRequired || !!(check && check.ok);
                } catch (_) {
                    authed = true;  // /auth/check ist nie geschuetzt; Fehler -> App trotzdem starten
                }
                if (!authed) {
                    this.requireLogin();
                    return;
                }
                this._startApp();
            }

            _startApp() {
                if (this._appStarted) return;
                this._appStarted = true;
                this._hideLogin();
                this._applySavedTheme();
                this._applyLanguageUI();
                applyTranslations();

                // Abmelden-Button nur zeigen, wenn ein Token verlangt wird
                const logoutBtn = document.getElementById('btn-logout');
                if (logoutBtn) logoutBtn.style.display = this._authRequired ? 'inline-flex' : 'none';

                // Initial Software-Karten anzeigen (Default Vanilla)
                this.renderSoftwareCards('Vanilla');

                // v1.0.7: Minecraft-Versionsliste laden (Mojang-Manifest oder Fallback)
                this.loadMinecraftVersions();

                // Erstes Laden + Polling
                this.refreshServers().then(() => {
                    this.renderServerGrid();
                    this.renderGlobalStats();
                });
                this.startResourceSimulation();
            }

            /* --- v1.1.0: LOGIN / TOKEN-HANDLING --- */
            _setupLoginForm() {
                const form = document.getElementById('login-form');
                if (form && !form._wired) {
                    form._wired = true;
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.attemptLogin();
                    });
                }
            }

            requireLogin() {
                const overlay = document.getElementById('login-overlay');
                if (overlay) overlay.style.display = 'flex';
                const input = document.getElementById('login-token-input');
                if (input) { input.value = ''; setTimeout(() => input.focus(), 50); }
            }

            _hideLogin() {
                const overlay = document.getElementById('login-overlay');
                if (overlay) overlay.style.display = 'none';
            }

            async attemptLogin() {
                const input = document.getElementById('login-token-input');
                const errEl = document.getElementById('login-error');
                const token = (input && input.value || '').trim();
                if (!token) return;
                localStorage.setItem(AUTH_TOKEN_KEY, token);
                try {
                    const check = await API.authCheck();
                    if (check && check.ok) {
                        if (errEl) errEl.style.display = 'none';
                        this._startApp();
                    } else {
                        throw new Error('Token ungültig');
                    }
                } catch (_) {
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                    if (errEl) { errEl.textContent = 'Token ungültig. Bitte erneut versuchen.'; errEl.style.display = 'block'; }
                }
            }

            logout() {
                localStorage.removeItem(AUTH_TOKEN_KEY);
                location.reload();
            }

            // v1.0.7: Versions-Dropdowns aus dem Backend befuellen.
            // Aufgerufen beim Init und nochmal beim Oeffnen des Dashboards
            // (zum Vorbelegen der aktuellen Server-Version).
            async loadMinecraftVersions() {
                try {
                    const data = await API.minecraftVersions();
                    const versions = data && Array.isArray(data.versions) ? data.versions : [];
                    if (!versions.length) return;
                    this._mcVersions = versions;
                    this._mcLatest = data.latest_release || versions[0];

                    const buildOptions = () => versions.map(v => {
                        const isLatest = v === this._mcLatest;
                        const label = isLatest ? `${v} (Neueste Version)` : v;
                        return `<option value="${v}">${label}</option>`;
                    }).join('');

                    const sel1 = document.getElementById('select-mc-version');
                    const sel2 = document.getElementById('new-server-version');
                    if (sel1) {
                        const prev = sel1.value;
                        sel1.innerHTML = buildOptions();
                        sel1.value = prev && versions.includes(prev) ? prev : this._mcLatest;
                    }
                    if (sel2) {
                        sel2.innerHTML = buildOptions();
                        sel2.value = this._mcLatest;
                    }
                } catch (err) {
                    console.warn('Konnte Minecraft-Versionen nicht laden:', err);
                }
            }

            /* --- BACKEND SYNC --- */
            // Holt die aktuelle Server-Liste vom Backend und merged sie mit
            // den client-only-Feldern (logs/installedExtensions/backups).
            async refreshServers() {
                let dtos = [];
                try {
                    dtos = await API.listServers();
                } catch (err) {
                    console.error('Server-Liste konnte nicht geladen werden:', err);
                    this.showToast(t('toast.backend_unreachable', { e: err.message }), 'error');
                    return;
                }

                const previous = new Map(servers.map(s => [s.id, s]));
                servers = dtos.map(dto => this._mergeDto(dto, previous.get(dto.id)));
                return servers;
            }

            async refreshServer(id) {
                try {
                    const dto = await API.getServer(id);
                    const idx = servers.findIndex(s => s.id === id);
                    const prev = idx >= 0 ? servers[idx] : null;
                    const merged = this._mergeDto(dto, prev);
                    if (idx >= 0) servers[idx] = merged;
                    else servers.push(merged);
                    return merged;
                } catch (err) {
                    console.warn('refreshServer:', err);
                    return null;
                }
            }

            // Mappt ein Backend-DTO auf das vom UI erwartete Schema.
            _mergeDto(dto, prev) {
                return {
                    id: dto.id,
                    containerId: dto.container_id,
                    name: dto.name,
                    status: dto.status,                // running | starting | stopping | offline
                    software: dto.software,
                    version: dto.version,
                    ramMax: dto.ram_max,
                    ramUsed: dto.ram_used,
                    ramPct: dto.ram_pct || 0,
                    cpuUsed: dto.cpu_used,
                    overloaded: !!dto.overloaded,
                    optimizer: !!dto.optimizer,
                    playersCurrent: dto.players_current,
                    playersMax: dto.players_max,
                    port: dto.port,
                    // v1.2.0: erweiterte Performance-Metriken
                    cpu_cores: dto.cpu_cores || [],
                    cpu_count: dto.cpu_count || 0,
                    per_core_available: !!dto.per_core_available,
                    net_rx: dto.net_rx || 0,
                    net_tx: dto.net_tx || 0,
                    blk_read: dto.blk_read || 0,
                    blk_write: dto.blk_write || 0,
                    pids: dto.pids || 0,
                    uptime_seconds: dto.uptime_seconds || 0,
                    installedExtensions: prev ? prev.installedExtensions : [],
                    backups: prev ? prev.backups : [],
                    logs: prev ? prev.logs : [],
                    onlinePlayers: prev ? prev.onlinePlayers : [],
                    tunnel: prev ? prev.tunnel : null,
                };
            }

            /* --- THEME SWITCHING --- */
            switchTheme(themeName) {
                document.documentElement.setAttribute('data-theme', themeName);
                localStorage.setItem('craftcontrol_theme', themeName);

                // Toggle active styling on buttons
                document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
                const targetBtn = document.getElementById(`theme-btn-${themeName}`);
                if (targetBtn) targetBtn.classList.add('active');

                this.showToast(t('toast.theme_changed', { name: themeName.replace('-', ' ').toUpperCase() }), 'success');
            }

            _applySavedTheme() {
                const saved = localStorage.getItem('craftcontrol_theme');
                const theme = saved || document.documentElement.getAttribute('data-theme') || 'nether';
                document.documentElement.setAttribute('data-theme', theme);
                document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
                const targetBtn = document.getElementById(`theme-btn-${theme}`);
                if (targetBtn) targetBtn.classList.add('active');
            }

            /* --- v1.2.0: SPRACHE --- */
            _applyLanguageUI() {
                ['lang-select', 'set-app-language'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = CURRENT_LANG;
                });
            }

            setLanguage(lang) {
                lang = (lang === 'de') ? 'de' : 'en';
                CURRENT_LANG = lang;
                localStorage.setItem(LANG_KEY, lang);
                this._applyLanguageUI();
                applyTranslations();
                // Dynamisch gerenderte Bereiche neu aufbauen, damit auch sie uebersetzt sind.
                try {
                    this.renderServerGrid();
                    this.renderGlobalStats();
                    if (this.activeServerId) {
                        const s = this.getServer(this.activeServerId);
                        if (s) {
                            this.renderPlayers(s);
                            this.renderBackupsTable(s);
                            this.renderInstalledExtensionsList(s);
                            this._renderTunnelInfo(s);
                            if (this.activeTab === 'performance') this.renderPerformance();
                        }
                    }
                } catch (_) { /* noop */ }
            }

            /* --- VIEW NAVIGATION --- */
            showOverview() {
                document.getElementById('view-dashboard').classList.remove('active');
                document.getElementById('view-overview').classList.add('active');
                this.activeServerId = null;
                this.refreshServers().then(() => {
                    this.renderServerGrid();
                    this.renderGlobalStats();
                });
            }

            async showDashboard(serverId) {
                this.activeServerId = serverId;
                let server = this.getServer(serverId);
                if (!server) {
                    server = await this.refreshServer(serverId);
                }
                if (!server) return;

                document.getElementById('view-overview').classList.remove('active');
                document.getElementById('view-dashboard').classList.add('active');

                // Populate Server specific sidebar metadata
                document.getElementById('dash-server-title').innerText = server.name;
                document.getElementById('dash-server-software-label').innerText = `${server.software} ${server.version}`;

                // Re-render server icon
                const iconContainer = document.getElementById('dash-server-icon');
                iconContainer.innerHTML = this.getSoftwareSVG(server.software, server.status === 'running');

                this.updateDashboardHeaderAndControls(server);

                // Switch to default console tab
                this.switchTab('status');
                this.updateResourceMeters(server);
                this.loadBackups(server.id);
                this.loadInstalledExtensions(server);
                this.renderSoftwareCards(server.software);

                // Pre-fill versions configuration
                // v1.0.7: Versionsliste sicherstellen, bevor wir den Wert setzen.
                if (!this._mcVersions || !this._mcVersions.length) {
                    await this.loadMinecraftVersions();
                }
                const sel = document.getElementById('select-mc-version');
                if (sel && server.version && !Array.from(sel.options).some(o => o.value === server.version)) {
                    const opt = document.createElement('option');
                    opt.value = server.version;
                    opt.text = `${server.version} (aktiv)`;
                    sel.insertBefore(opt, sel.firstChild);
                }
                if (sel) sel.value = server.version;
                document.getElementById('input-allocated-ram').value = server.ramMax;
                document.getElementById('label-allocated-ram').innerText = server.ramMax + ' GB';

                // Live-Logs vom Backend
                this.refreshLogs(server.id);
                // v1.0.4: Spieler + Tunnel-Status
                this.loadPlayers(server.id);
                this.refreshTunnel(server.id);
            }

            /* --- TAB CONTROLLER --- */
            switchTab(tabId) {
                this.activeTab = tabId;
                
                // Deactivate all nav buttons and panels
                document.querySelectorAll('.dash-nav-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

                // Activate specific
                document.getElementById(`tab-btn-${tabId}`).classList.add('active');
                document.getElementById(`panel-${tabId}`).classList.add('active');

                if (tabId === 'plugins') {
                    this.renderPluginsCatalog();
                    const server = this.getServer(this.activeServerId);
                    if (server) this.loadInstalledExtensions(server);
                }
                if (tabId === 'files') {
                    this.loadFilesIndex();
                }
                if (tabId === 'performance') {
                    this.renderPerformance();
                }
                if (tabId === 'settings') {
                    if (this.activeServerId) this.loadSettings(this.activeServerId);
                    this.loadAccessConfig();
                    this._applyLanguageUI();
                }
            }

            /* --- SERVER MANAGEMENT & LISTING --- */
            getServer(id) {
                return servers.find(s => s.id === id);
            }

            renderGlobalStats() {
                const total = servers.length;
                const online = servers.filter(s => s.status === 'running').length;
                let activePlayers = 0;
                let maxPlayers = 0;

                servers.forEach(s => {
                    if (s.status === 'running') {
                        activePlayers += s.playersCurrent;
                        maxPlayers += s.playersMax;
                    }
                });

                document.getElementById('stat-total-servers').innerText = total;
                document.getElementById('stat-online-servers').innerText = online;
                document.getElementById('stat-total-players').innerText = `${activePlayers} / ${maxPlayers}`;
            }

            renderServerGrid() {
                const container = document.getElementById('server-list-container');
                container.innerHTML = '';

                servers.forEach(server => {
                    const isRunning = server.status === 'running';
                    const isStarting = server.status === 'starting';
                    const statusClass = server.status; // running, starting, stopping, offline
                    const displayStatus = server.status.toUpperCase();

                    const card = document.createElement('div');
                    card.className = `server-card glass-panel ${statusClass}`;
                    card.setAttribute('onclick', `app.handleCardClick(event, '${server.id}')`);

                    // Resource display logic
                    const ramPercent = isRunning ? (server.ramUsed / server.ramMax) * 100 : 0;
                    const cpuVal = isRunning ? server.cpuUsed : 0;
                    const playersVal = isRunning ? `${server.playersCurrent}/${server.playersMax}` : '0/0';

                    card.innerHTML = `
                        <div>
                            <div class="server-card-top">
                                <div class="server-icon">
                                    ${this.getSoftwareSVG(server.software, isRunning)}
                                </div>
                                <div class="status-badge">
                                    <span class="status-dot"></span>
                                    <span class="status-text">${displayStatus}</span>
                                </div>
                            </div>
                            
                            <div class="server-card-info">
                                <h3>${this._escape(server.name)}</h3>
                                <p>
                                    <span class="badge-software">${this._escape(server.software)}</span>
                                    <span>Minecraft ${this._escape(server.version)}</span>
                                </p>
                            </div>
                        </div>

                        <div>
                            <div class="server-card-meters">
                                <div class="meter-row">
                                    <span class="meter-label">
                                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> ${t('card.players')}
                                    </span>
                                    <span>${playersVal}</span>
                                </div>
                                <div class="meter-row">
                                    <span class="meter-label">CPU</span>
                                    <span>${cpuVal}%</span>
                                </div>
                                <div class="meter-bar-container">
                                    <div class="meter-bar-fill" style="width: ${cpuVal}%"></div>
                                </div>
                                <div class="meter-row" style="margin-top: 4px;">
                                    <span class="meter-label">RAM</span>
                                    <span>${isRunning ? server.ramUsed.toFixed(1) : 0} / ${server.ramMax} GB</span>
                                </div>
                                <div class="meter-bar-container">
                                    <div class="meter-bar-fill" style="width: ${ramPercent}%"></div>
                                </div>
                            </div>

                            <div class="server-card-actions">
                                <button class="btn btn-primary" style="flex-grow:1;" onclick="app.manageServerDirectly(event, '${server.id}')">${t('card.manage')}</button>
                                ${isRunning ? `
                                    <button class="btn btn-danger btn-circle" title="${t('card.stop')}" onclick="app.quickTogglePower(event, '${server.id}', 'stop')">
                                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/></svg>
                                    </button>
                                ` : `
                                    <button class="btn btn-success btn-circle" title="${t('card.start')}" ${isStarting ? 'disabled' : ''} onclick="app.quickTogglePower(event, '${server.id}', 'start')">
                                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>
                                    </button>
                                `}
                                <button class="btn btn-danger btn-circle" title="${t('card.delete')}" onclick="app.deleteServer(event, '${server.id}', '${this._escape ? this._escape(server.name) : server.name}')">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                                </button>
                            </div>
                        </div>
                    `;

                    container.appendChild(card);
                });

                // Add Plus card to grid
                const plusCard = document.createElement('div');
                plusCard.className = 'add-server-card';
                plusCard.setAttribute('onclick', 'app.openCreateModal()');
                plusCard.innerHTML = `
                    <div class="plus-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    <span>Neuen Server anlegen</span>
                `;
                container.appendChild(plusCard);
            }

            handleCardClick(event, serverId) {
                // Prevent routing to dashboard if a button is clicked
                if (event.target.closest('.btn') || event.target.closest('.server-card-actions')) {
                    return;
                }
                this.showDashboard(serverId);
            }

            manageServerDirectly(event, serverId) {
                event.stopPropagation();
                this.showDashboard(serverId);
            }

            /* --- LOESCHEN --- */
            // Aufruf von der Karte (Overview)
            async deleteServer(event, serverId, displayName) {
                if (event) event.stopPropagation();
                const ok = confirm(t('confirm.delete_server', { name: displayName || serverId }));
                if (!ok) return;
                await this._performDelete(serverId, displayName);
            }

            // Aufruf vom Dashboard-Sidebar
            async deleteActiveServer() {
                if (!this.activeServerId) return;
                const server = this.getServer(this.activeServerId);
                await this.deleteServer(null, this.activeServerId, server ? server.name : null);
            }

            async _performDelete(serverId, displayName) {
                this.showToast(t('toast.deleting', { name: displayName || serverId }), 'warn');
                try {
                    await API.deleteServer(serverId);
                    this.showToast(t('toast.deleted', { name: displayName || serverId }), 'success');
                    if (this.activeServerId === serverId) {
                        this.activeServerId = null;
                        document.getElementById('view-dashboard').classList.remove('active');
                        document.getElementById('view-overview').classList.add('active');
                    }
                    await this.refreshServers();
                    this.renderServerGrid();
                    this.renderGlobalStats();
                } catch (err) {
                    console.error(err);
                    this.showToast(t('toast.delete_fail', { e: err.message }), 'error');
                }
            }

            /* --- MODAL LOGIC --- */
            openCreateModal() {
                document.getElementById('createServerModal').classList.add('active');
            }

            closeCreateModal() {
                document.getElementById('createServerModal').classList.remove('active');
                document.getElementById('create-server-form').reset();
                this.ramValueLabel.innerText = '4 GB';
            }

            async handleCreateServer(event) {
                event.preventDefault();
                const name = document.getElementById('new-server-name').value.trim();
                const software = document.getElementById('new-server-software').value;
                const version = document.getElementById('new-server-version').value;
                const ram = parseInt(document.getElementById('new-server-ram').value);

                if (!name) return;

                const submitBtn = event.submitter || event.target.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = true;
                this.showToast(t('toast.creating', { name }), 'warn');

                try {
                    await API.createServer({ name, software, version, ram });
                    this.closeCreateModal();
                    await this.refreshServers();
                    this.renderServerGrid();
                    this.renderGlobalStats();
                    this.showToast(t('toast.created', { name }), 'success');
                } catch (err) {
                    console.error(err);
                    this.showToast(t('toast.create_fail', { e: err.message }), 'error');
                } finally {
                    if (submitBtn) submitBtn.disabled = false;
                }
            }

            /* --- POWER STATE CONTROLLER (BACKEND) --- */
            async quickTogglePower(event, serverId, action) {
                event.stopPropagation();
                await this._powerAction(serverId, action);
            }

            async triggerActiveServerPower(action) {
                if (!this.activeServerId) return;
                await this._powerAction(this.activeServerId, action);
            }

            async _powerAction(serverId, action) {
                const server = this.getServer(serverId);
                if (!server) return;
                const map = { start: API.start, stop: API.stop, restart: API.restart };
                const fn = map[action];
                if (!fn) return;

                // Optimistisches UI-Feedback
                if (action === 'start') server.status = 'starting';
                else if (action === 'stop') server.status = 'stopping';
                else server.status = 'starting';
                this.syncAllUIs();

                this.showToast(t('toast.action_running', { action }), 'warn');
                try {
                    await fn(serverId);
                    await this.refreshServer(serverId);
                    this.syncAllUIs();
                    this.refreshLogs(serverId);
                    this.showToast(t('toast.action_done', { name: server.name, action }), 'success');
                } catch (err) {
                    console.error(err);
                    this.showToast(t('toast.error_generic', { e: err.message }), 'error');
                    await this.refreshServer(serverId);
                    this.syncAllUIs();
                }
            }

            // Holt Logs vom Backend und schreibt sie in das logs-Array.
            async refreshLogs(serverId) {
                const server = this.getServer(serverId);
                if (!server) return;
                try {
                    const data = await API.logs(serverId, 200);
                    server.logs = data.lines || [];
                } catch (err) {
                    server.logs = [`[SYSTEM]: Logs konnten nicht geladen werden: ${err.message}`];
                }
                if (this.activeServerId === serverId && this.activeTab === 'status') {
                    this.renderConsoleLogs(server);
                }
            }

            executeStartupSequence(server) {
                if (server.status === 'starting' || server.status === 'running') return;

                server.status = 'starting';
                server.cpuUsed = 15;
                server.ramUsed = 0.5;
                
                this.addLog(server, 'SYSTEM', 'Serverstart initiiert...');
                this.addLog(server, 'INFO', 'Loading libraries, please wait...');
                
                // Live UI Sync
                this.syncAllUIs();

                let step = 0;
                const startupTimer = setInterval(() => {
                    if (this.activeServerId === server.id && this.activeTab === 'status') {
                        this.renderConsoleLogs(server);
                    }
                    
                    step++;
                    if (step === 1) {
                        this.addLog(server, 'INFO', `Starting minecraft server version ${server.version}`);
                        server.cpuUsed = 45;
                        server.ramUsed = 1.2;
                    } else if (step === 2) {
                        this.addLog(server, 'INFO', 'Loading properties and binding server port 25565...');
                        server.cpuUsed = 75;
                        server.ramUsed = 2.4;
                    } else if (step === 3) {
                        this.addLog(server, 'INFO', `Preparing level "world" under ${server.software} environment`);
                        server.cpuUsed = 92;
                        server.ramUsed = 3.6;
                    } else if (step === 4) {
                        this.addLog(server, 'INFO', 'Preparing start region for dimension minecraft:overworld (0%)');
                        this.addLog(server, 'INFO', 'Preparing start region for dimension minecraft:the_nether (42%)');
                        this.addLog(server, 'INFO', 'Preparing start region for dimension minecraft:the_end (86%)');
                        server.ramUsed = server.ramMax * 0.75;
                    } else if (step === 5) {
                        this.addLog(server, 'INFO', `Done (8.42s)! Server binds on port 25565. For help, type "help" or "/plugins"`);
                        
                        server.status = 'running';
                        server.cpuUsed = 8;
                        server.playersCurrent = 0;
                        
                        clearInterval(startupTimer);
                        this.syncAllUIs();
                        this.showToast(t('toast.server_online', { name: server.name }), 'success');
                    }
                    
                    this.syncAllUIs();
                }, 1200);
            }

            executeShutdownSequence(server) {
                if (server.status === 'stopping' || server.status === 'offline') return;

                server.status = 'stopping';
                server.playersCurrent = 0;
                server.cpuUsed = 30;
                
                this.addLog(server, 'SYSTEM', 'Server-Shutdown initiiert...');
                this.addLog(server, 'INFO', 'Saving players and saving worlds...');
                
                this.syncAllUIs();

                let step = 0;
                const shutdownTimer = setInterval(() => {
                    step++;
                    if (step === 1) {
                        this.addLog(server, 'INFO', 'Saving chunks to disk...');
                        server.ramUsed = server.ramUsed * 0.5;
                        server.cpuUsed = 50;
                    } else if (step === 2) {
                        this.addLog(server, 'INFO', 'Closing server socket listener on 25565');
                        server.ramUsed = 0.5;
                        server.cpuUsed = 10;
                    } else if (step === 3) {
                        this.addLog(server, 'INFO', 'Server shutdown successfully completed.');
                        
                        server.status = 'offline';
                        server.cpuUsed = 0;
                        server.ramUsed = 0;
                        
                        clearInterval(shutdownTimer);
                        this.syncAllUIs();
                        this.showToast(t('toast.server_stopped', { name: server.name }), 'warn');
                    }
                    
                    this.syncAllUIs();
                }, 1000);
            }

            executeRestartSequence(server) {
                this.showToast(t('toast.server_restarting', { name: server.name }), 'warn');
                this.executeShutdownSequence(server);
                
                // Queue startup after shutdown completes
                const restartInterval = setInterval(() => {
                    if (server.status === 'offline') {
                        clearInterval(restartInterval);
                        this.executeStartupSequence(server);
                    }
                }, 1000);
            }

            syncAllUIs() {
                this.renderServerGrid();
                this.renderGlobalStats();
                
                if (this.activeServerId) {
                    const server = this.getServer(this.activeServerId);
                    if (server) {
                        this.updateDashboardHeaderAndControls(server);
                        this.updateResourceMeters(server);
                        this.renderConsoleLogs(server);
                    }
                }
            }

            updateDashboardHeaderAndControls(server) {
                // Background indicators and texts
                const badge = document.getElementById('dash-server-badge');
                const badgeText = badge.querySelector('.status-text');
                const headerText = document.getElementById('dash-header-status-text');
                const sidebarIcon = document.getElementById('dash-server-icon');

                // Reset statuses
                badge.className = `status-badge ${server.status}`;
                badgeText.innerText = server.status.toUpperCase();
                headerText.innerText = `Steuerung: ${server.name}`;
                
                // Enable/disable buttons based on status
                const btnStart = document.getElementById('dash-btn-start');
                const btnStop = document.getElementById('dash-btn-stop');
                const btnRestart = document.getElementById('dash-btn-restart');

                sidebarIcon.innerHTML = this.getSoftwareSVG(server.software, server.status === 'running');

                if (server.status === 'running') {
                    btnStart.disabled = true;
                    btnStop.disabled = false;
                    btnRestart.disabled = false;
                } else if (server.status === 'offline') {
                    btnStart.disabled = false;
                    btnStop.disabled = true;
                    btnRestart.disabled = true;
                } else {
                    // stopping or starting
                    btnStart.disabled = true;
                    btnStop.disabled = true;
                    btnRestart.disabled = true;
                }

                // Verbindungs-Info aktualisieren
                this._renderConnectionInfo(server);
            }

            /* --- v1.0.5 PERFORMANCE-VERLAUF (Sub-Tab) --- */
            // Wir sammeln alle 4 s einen Datenpunkt und behalten max 1800
            // (= 2 h bei 4 s). Der Range-Selector entscheidet, wie viele
            // Punkte gerendert werden. Pro Server eigene History.
            _perfBucket(serverId) {
                if (!this._perf) this._perf = {};
                if (!this._perf[serverId]) this._perf[serverId] = { points: [] };
                return this._perf[serverId];
            }

            _recordPerfPoint(server) {
                if (!server) return;
                const bucket = this._perfBucket(server.id);
                bucket.points.push({
                    t: Date.now(),
                    cpu: Number(server.cpuUsed) || 0,
                    ramPct: Number(server.ramPct) || 0,
                    ramUsed: Number(server.ramUsed) || 0,
                    ramMax: Number(server.ramMax) || 0,
                    overloaded: !!server.overloaded,
                });
                // 2 h * 60/4 = 1800 Punkte hard cap
                if (bucket.points.length > 1800) bucket.points.shift();

                if (this.activeServerId === server.id && this.activeTab === 'performance') {
                    this.renderPerformance();
                }
            }

            /* --- v1.2.0: Performance-Tab (Normal / Detailed / Diagramme) --- */
            setPerfMode(mode) {
                this._perfMode = (mode === 'detailed') ? 'detailed' : 'normal';
                localStorage.setItem('craftcontrol_perf_mode', this._perfMode);
                this.renderPerformance();
            }

            togglePerfCharts(on) {
                this._perfCharts = !!on;
                localStorage.setItem('craftcontrol_perf_charts', on ? '1' : '0');
                this.renderPerformance();
            }

            changePerfRange() {
                this.renderPerfChart();
            }

            _fmtBytes(n) {
                n = Number(n) || 0;
                const u = ['B', 'KB', 'MB', 'GB', 'TB'];
                let i = 0;
                while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
                return `${n.toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
            }

            _fmtUptime(sec) {
                sec = Number(sec) || 0;
                const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
                if (d > 0) return `${d}d ${h}h ${m}m`;
                if (h > 0) return `${h}h ${m}m`;
                return `${m}m`;
            }

            _metricTile(labelKey, value) {
                return `<div class="metric-tile"><div class="m-label">${escapeHtml(t(labelKey))}</div><div class="m-value">${escapeHtml(value)}</div></div>`;
            }

            renderPerformance() {
                // Modi-Zustand init
                if (this._perfMode === undefined) this._perfMode = localStorage.getItem('craftcontrol_perf_mode') || 'normal';
                if (this._perfCharts === undefined) this._perfCharts = localStorage.getItem('craftcontrol_perf_charts') === '1';

                // Toggle-Buttons / Checkbox spiegeln
                const nb = document.getElementById('perf-mode-normal');
                const db = document.getElementById('perf-mode-detailed');
                if (nb) nb.classList.toggle('active', this._perfMode === 'normal');
                if (db) db.classList.toggle('active', this._perfMode === 'detailed');
                const ct = document.getElementById('perf-charts-toggle');
                if (ct) ct.checked = this._perfCharts;

                const detailed = document.getElementById('perf-detailed');
                const chartsWrap = document.getElementById('perf-charts-wrap');
                const normal = document.getElementById('perf-normal');
                if (detailed) detailed.style.display = (this._perfMode === 'detailed') ? 'block' : 'none';
                if (normal) normal.style.display = (this._perfMode === 'normal') ? 'grid' : 'none';
                if (chartsWrap) chartsWrap.style.display = this._perfCharts ? 'block' : 'none';

                const server = this.getServer(this.activeServerId);
                if (!server) return;

                const cpu = (Number(server.cpuUsed) || 0).toFixed(1);
                const ramUsed = (Number(server.ramUsed) || 0).toFixed(1);
                const ramMax = server.ramMax || 0;

                // Normal: kompakte Live-Kacheln
                if (normal) {
                    normal.innerHTML =
                        this._metricTile('gauge.cpu', `${cpu}%`) +
                        this._metricTile('gauge.ram', `${ramUsed} / ${ramMax} GB`) +
                        this._metricTile('gauge.players', `${server.playersCurrent || 0} / ${server.playersMax || 20}`) +
                        this._metricTile('perf.uptime', this._fmtUptime(server.uptime_seconds));
                }

                // Detailed: Pro-Core-Balken + Metriken
                if (detailed && this._perfMode === 'detailed') {
                    const grid = document.getElementById('perf-cores-grid');
                    const na = document.getElementById('perf-cores-na');
                    const cores = Array.isArray(server.cpu_cores) ? server.cpu_cores : [];
                    if (cores.length && server.per_core_available) {
                        if (na) na.style.display = 'none';
                        if (grid) grid.innerHTML = cores.map((v, i) => {
                            const h = Math.max(0, Math.min(100, Number(v) || 0));
                            return `<div class="core-cell"><div class="core-label">Core ${i}</div>` +
                                   `<div class="core-track"><div class="core-fill" style="height:${h}%"></div></div>` +
                                   `<div class="core-val">${h.toFixed(0)}%</div></div>`;
                        }).join('');
                    } else {
                        if (grid) grid.innerHTML = '';
                        if (na) na.style.display = 'block';
                    }
                    const metrics = document.getElementById('perf-metrics');
                    if (metrics) {
                        metrics.innerHTML =
                            this._metricTile('gauge.cpu', `${cpu}%`) +
                            this._metricTile('gauge.ram', `${ramUsed} / ${ramMax} GB`) +
                            this._metricTile('perf.net', `↓ ${this._fmtBytes(server.net_rx)} ${t('perf.in')} · ↑ ${this._fmtBytes(server.net_tx)} ${t('perf.out')}`) +
                            this._metricTile('perf.disk', `${this._fmtBytes(server.blk_read)} ${t('perf.read')} · ${this._fmtBytes(server.blk_write)} ${t('perf.write')}`) +
                            this._metricTile('perf.pids', String(server.pids || 0)) +
                            this._metricTile('perf.uptime', this._fmtUptime(server.uptime_seconds)) +
                            this._metricTile('perf.cores', String(server.cpu_count || cores.length || 0));
                    }
                }

                // Charts (History) – wiederverwendet renderPerfChart
                if (this._perfCharts) this.renderPerfChart();

                // Empty-Hinweis nur zeigen, wenn weder Normal-Werte noch Charts etwas haben
                const empty = document.getElementById('perf-empty-hint');
                if (empty) empty.style.display = 'none';
            }

            renderPerfChart() {
                const cpuRow = document.getElementById('perf-cpu-bars');
                const ramRow = document.getElementById('perf-ram-bars');
                const cpuNow = document.getElementById('perf-cpu-now');
                const ramNow = document.getElementById('perf-ram-now');
                const empty = document.getElementById('perf-empty-hint');
                const rangeSel = document.getElementById('perf-range');
                if (!cpuRow || !ramRow || !rangeSel) return;

                if (!this.activeServerId) return;
                const server = this.getServer(this.activeServerId);
                const bucket = this._perfBucket(this.activeServerId);

                const minutes = parseInt(rangeSel.value, 10) || 5;
                const cutoff = Date.now() - minutes * 60_000;
                const points = bucket.points.filter(p => p.t >= cutoff);

                // Aktuell-Werte oben rechts
                if (server) {
                    cpuNow.innerText = `${(server.cpuUsed || 0).toFixed ? server.cpuUsed.toFixed(1) : server.cpuUsed}%`;
                    const ramMax = server.ramMax || 0;
                    const ramUsed = server.ramUsed || 0;
                    ramNow.innerText = `${ramUsed.toFixed(1)} / ${ramMax}.0 GB`;
                }

                if (!points.length) {
                    cpuRow.innerHTML = '';
                    ramRow.innerHTML = '';
                    empty.style.display = 'block';
                    return;
                }
                empty.style.display = 'none';

                // Wir samplen die Punkte auf max 60 Balken pro Chart, damit
                // auch 2-h-Verlaeufe sauber dargestellt werden.
                const target = 60;
                const stride = Math.max(1, Math.floor(points.length / target));
                const sampled = [];
                for (let i = 0; i < points.length; i += stride) {
                    const slice = points.slice(i, i + stride);
                    const avgCpu = slice.reduce((s, p) => s + p.cpu, 0) / slice.length;
                    const avgRam = slice.reduce((s, p) => s + p.ramPct, 0) / slice.length;
                    const overloaded = slice.some(p => p.overloaded);
                    sampled.push({ cpu: avgCpu, ram: avgRam, overloaded });
                }

                cpuRow.innerHTML = sampled.map(p => {
                    const h = Math.max(0, Math.min(100, p.cpu));
                    const cls = p.overloaded ? 'cpu overloaded' : 'cpu';
                    return `<div class="perf-bar ${cls}" style="height:${h}%" title="${p.cpu.toFixed(1)}%"></div>`;
                }).join('');

                ramRow.innerHTML = sampled.map(p => {
                    const h = Math.max(0, Math.min(100, p.ram));
                    return `<div class="perf-bar ram" style="height:${h}%" title="${p.ram.toFixed(1)}%"></div>`;
                }).join('');
            }

            /* --- (zurueck zu v1.0.4-Methoden) --- */

            _renderConnectionInfo(server) {
                const portBadge = document.getElementById('dash-server-port-badge');
                const localEl = document.getElementById('conn-local-address');
                const copyBtn = document.getElementById('conn-local-copy');
                if (!localEl) return;

                const host = window.location.hostname || 'localhost';
                const port = server.port || '?';
                const fullAddr = `${host}:${port}`;

                localEl.innerText = server.port ? fullAddr : 'Port noch nicht zugewiesen';
                if (portBadge) portBadge.innerText = `Port: ${server.port || '--'}`;

                if (copyBtn) {
                    copyBtn.onclick = (ev) => {
                        ev.stopPropagation();
                        if (!server.port) return;
                        this.copyText(fullAddr);
                    };
                }

                this._renderTunnelInfo(server);
            }

            _renderTunnelInfo(server) {
                const status = document.getElementById('conn-tunnel-status');
                const domainEl = document.getElementById('conn-tunnel-domain');
                const copyBtn = document.getElementById('conn-tunnel-copy');
                const startBtn = document.getElementById('btn-tunnel-start');
                const stopBtn = document.getElementById('btn-tunnel-stop');
                const wizard = document.getElementById('tunnel-wizard');
                const claimRow = document.getElementById('tunnel-claim-row');
                const claimLink = document.getElementById('tunnel-claim-link');
                const logsDetails = document.getElementById('tunnel-logs-details');
                const logsPre = document.getElementById('tunnel-logs-pre');
                const messageEl = document.getElementById('tunnel-message');
                if (!status) return;

                const tn = server.tunnel || { status: 'not_started' };
                const s = (tn.status || 'not_started').toLowerCase();
                const hasDomain = !!tn.domain;

                status.innerText = s.replace('_', ' ');
                if (hasDomain) {
                    domainEl.innerText = tn.domain;
                    copyBtn.style.display = 'inline-flex';
                    copyBtn.onclick = (ev) => {
                        ev.stopPropagation();
                        this.copyText(tn.domain);
                    };
                } else {
                    copyBtn.style.display = 'none';
                    if (s === 'active') {
                        domainEl.innerText = t('tunnel.s.active');
                    } else if (s === 'agent_started') {
                        domainEl.innerText = t('tunnel.s.agent');
                    } else if (s === 'auth_required') {
                        domainEl.innerText = t('tunnel.s.auth');
                    } else if (s === 'needs_secret') {
                        domainEl.innerText = t('tunnel.s.needs_secret');
                    } else if (s === 'not_started') {
                        domainEl.innerText = t('conn.no_tunnel');
                    } else if (s === 'error') {
                        domainEl.innerText = t('tunnel.s.error');
                    } else {
                        domainEl.innerText = t('tunnel.s.status', { s });
                    }
                }

                // Wizard-Schritte
                if (wizard) {
                    const order = ['image_pull', 'agent_started', 'auth_required', 'active'];
                    const reachedIndex = {
                        'not_started': -1,
                        'image_pull':   0,
                        'agent_started':1,
                        'needs_secret': 1,
                        'auth_required':2,
                        'active':       3,
                        'error':       -2,
                    }[s] ?? -1;
                    wizard.style.display = (s === 'not_started' && !tn.container) ? 'none' : 'flex';
                    wizard.querySelectorAll('li').forEach((li) => {
                        const step = li.dataset.step;
                        const idx = order.indexOf(step);
                        li.classList.remove('done', 'active', 'warn', 'error');
                        if (s === 'error' || s === 'needs_secret') {
                            if (idx <= 1) li.classList.add(idx === 1 ? 'warn' : 'done');
                        } else if (idx <= reachedIndex - 1) {
                            li.classList.add('done');
                        } else if (idx === reachedIndex) {
                            li.classList.add(step === 'auth_required' ? 'warn' : 'active');
                        }
                    });
                }

                // Claim-Link
                if (claimRow && claimLink) {
                    if (tn.claim_url) {
                        claimRow.style.display = 'block';
                        claimLink.href = tn.claim_url;
                        claimLink.innerText = tn.claim_url;
                    } else {
                        claimRow.style.display = 'none';
                    }
                }

                // Log-Auszug
                if (logsDetails && logsPre) {
                    if (tn.logs_tail) {
                        logsDetails.style.display = 'block';
                        logsPre.textContent = tn.logs_tail;
                    } else {
                        logsDetails.style.display = 'none';
                    }
                }

                // Fehlermeldung / Hinweis (kommt vom Backend, je nach Sprache gemischt)
                if (messageEl) {
                    if (tn.message && (s === 'error' || s === 'auth_required' || s === 'agent_started' || s === 'needs_secret')) {
                        messageEl.style.display = 'block';
                        messageEl.innerText = tn.message;
                    } else {
                        messageEl.style.display = 'none';
                    }
                }

                // Buttons
                const sidecarLive = !!tn.container && (s === 'agent_started' || s === 'auth_required' || s === 'active' || s === 'needs_secret');
                startBtn.style.display = sidecarLive ? 'none' : 'inline-flex';
                stopBtn.style.display  = sidecarLive ? 'inline-flex' : 'none';
                startBtn.disabled = !!startBtn._loading;
            }

            async refreshTunnel(serverId) {
                const id = serverId || this.activeServerId;
                if (!id) return;
                const server = this.getServer(id);
                if (!server) return;
                try {
                    const data = await API.tunnelStatus(id);
                    server.tunnel = data;
                } catch (err) {
                    server.tunnel = { status: 'error', message: err.message };
                }
                if (this.activeServerId === id) this._renderTunnelInfo(server);
            }

            /* v1.2.0: animiertes Modal */
            openModal(titleKey, bodyHtmlKey) {
                const overlay = document.getElementById('cc-modal');
                const titleEl = document.getElementById('cc-modal-title');
                const bodyEl = document.getElementById('cc-modal-body');
                if (!overlay) return;
                if (titleEl) titleEl.textContent = t(titleKey);
                if (bodyEl) bodyEl.innerHTML = t(bodyHtmlKey);
                overlay.classList.add('open');
                this._modalEsc = (e) => { if (e.key === 'Escape') this.closeModal(); };
                document.addEventListener('keydown', this._modalEsc);
            }
            closeModal() {
                const overlay = document.getElementById('cc-modal');
                if (overlay) overlay.classList.remove('open');
                if (this._modalEsc) { document.removeEventListener('keydown', this._modalEsc); this._modalEsc = null; }
            }
            openTunnelInfo() { this.openModal('tunnel.info_title', 'tunnel.info_html'); }
            openCrackedInfo() { this.openModal('set.cracked_info', 'set.cracked'); }

            /* v1.2.0: generisches Kopieren (Clipboard mit execCommand-Fallback fuer HTTP) */
            async copyText(text) {
                text = (text == null) ? '' : String(text);
                if (!text) { this.showToast(t('toast.nothing_copy'), 'warn'); return; }
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
                        await navigator.clipboard.writeText(text);
                    } else {
                        const ta = document.createElement('textarea');
                        ta.value = text; ta.setAttribute('readonly', '');
                        ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.left = '-9999px';
                        document.body.appendChild(ta); ta.select();
                        const ok = document.execCommand && document.execCommand('copy');
                        document.body.removeChild(ta);
                        if (!ok) throw new Error('execCommand');
                    }
                    this.showToast(t('toast.copied'), 'success');
                } catch (_) {
                    this.showToast(t('toast.copy_fail'), 'error');
                }
            }
            copyTunnelLogs() {
                const pre = document.getElementById('tunnel-logs-pre');
                const sel = window.getSelection ? window.getSelection().toString() : '';
                this.copyText(sel && pre && pre.contains(window.getSelection().anchorNode) ? sel : (pre ? pre.textContent : ''));
            }

            async startTunnel() {
                if (!this.activeServerId) return;
                const startBtn = document.getElementById('btn-tunnel-start');
                const secretInput = document.getElementById('tunnel-secret-input');
                if (startBtn) { startBtn._loading = true; startBtn.disabled = true; }
                this.showToast(t('toast.tunnel_starting'), 'warn');
                try {
                    const secret = (secretInput && secretInput.value || '').trim();
                    const data = await API.tunnelStart(this.activeServerId, secret || null);
                    const server = this.getServer(this.activeServerId);
                    if (server) server.tunnel = data;
                    this._renderTunnelInfo(server);
                    if (secretInput) secretInput.value = '';

                    if (data && data.ok === false) {
                        this.showToast('Tunnel: ' + (data.message || data.status || 'Error'), 'error');
                    } else if (data && data.status === 'needs_secret') {
                        this.showToast(t('toast.tunnel_needs_secret'), 'warn');
                    } else if (data && data.status === 'auth_required') {
                        this.showToast(t('toast.tunnel_auth'), 'warn');
                    } else {
                        this.showToast(t('toast.tunnel_started'), 'success');
                    }
                } catch (err) {
                    this.showToast('Tunnel: ' + (err && err.message ? err.message : err), 'error');
                } finally {
                    if (startBtn) { startBtn._loading = false; startBtn.disabled = false; }
                }
            }

            async stopTunnel() {
                if (!this.activeServerId) return;
                if (!confirm(t('confirm.tunnel_stop'))) return;
                try {
                    await API.tunnelStop(this.activeServerId);
                    const server = this.getServer(this.activeServerId);
                    if (server) server.tunnel = { status: 'not_started' };
                    this._renderTunnelInfo(server);
                    this.showToast(t('toast.tunnel_stopped'), 'warn');
                } catch (err) {
                    this.showToast('Tunnel: ' + err.message, 'error');
                }
            }

            /* --- v1.2.0: Server-Einstellungen (server.properties) --- */
            _settingsFields() {
                return {
                    'max-players':         { id: 'set-max-players', type: 'int' },
                    'gamemode':            { id: 'set-gamemode', type: 'str' },
                    'difficulty':          { id: 'set-difficulty', type: 'str' },
                    'white-list':          { id: 'set-white-list', type: 'bool' },
                    'online-mode':         { id: 'set-cracked', type: 'boolinv' }, // Gecrackt = online-mode false
                    'pvp':                 { id: 'set-pvp', type: 'bool' },
                    'enable-command-block':{ id: 'set-enable-command-block', type: 'bool' },
                    'allow-flight':        { id: 'set-allow-flight', type: 'bool' },
                    'spawn-monsters':      { id: 'set-spawn-monsters', type: 'bool' },
                    'allow-nether':        { id: 'set-allow-nether', type: 'bool' },
                    'force-gamemode':      { id: 'set-force-gamemode', type: 'bool' },
                    'spawn-protection':    { id: 'set-spawn-protection', type: 'int' },
                    'motd':                { id: 'set-motd', type: 'str' },
                    'resource-pack':       { id: 'set-resource-pack', type: 'str' },
                };
            }

            async loadSettings(serverId) {
                const id = serverId || this.activeServerId;
                if (!id) return;
                try {
                    const data = await API.readFile(id, 'server.properties');
                    const props = {};
                    (data.content || '').split('\n').forEach(line => {
                        const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)$/);
                        if (m) props[m[1].trim()] = m[2].trim();
                    });
                    this._settingsRaw = data.content || '';
                    const fields = this._settingsFields();
                    for (const key in fields) {
                        const f = fields[key]; const el = document.getElementById(f.id);
                        if (!el) continue;
                        const val = props[key];
                        if (f.type === 'bool') el.checked = (val === 'true');
                        else if (f.type === 'boolinv') el.checked = (val === 'false');
                        else if (val !== undefined) el.value = val;
                    }
                } catch (err) {
                    this.showToast(t('toast.settings_load_fail'), 'warn');
                }
            }

            async saveSettings() {
                const id = this.activeServerId;
                if (!id) return;
                const fields = this._settingsFields();
                const updates = {};
                for (const key in fields) {
                    const f = fields[key]; const el = document.getElementById(f.id);
                    if (!el) continue;
                    if (f.type === 'bool') updates[key] = el.checked ? 'true' : 'false';
                    else if (f.type === 'boolinv') updates[key] = el.checked ? 'false' : 'true';
                    else if (f.type === 'int') updates[key] = String(parseInt(el.value, 10) || 0);
                    else updates[key] = el.value;
                }
                // Bestehende Datei zeilenweise mergen (unbekannte Zeilen erhalten).
                const lines = (this._settingsRaw || '').split('\n');
                const seen = {};
                const out = lines.map(line => {
                    const m = line.match(/^\s*([^#=\s]+)\s*=(.*)$/);
                    if (m && updates[m[1].trim()] !== undefined) {
                        const k = m[1].trim(); seen[k] = true;
                        return `${k}=${updates[k]}`;
                    }
                    return line;
                });
                for (const k in updates) if (!seen[k]) out.push(`${k}=${updates[k]}`);
                const content = out.join('\n');
                try {
                    await API.writeFile(id, 'server.properties', content);
                    this._settingsRaw = content;
                    this.showToast(t('toast.settings_saved'), 'success');
                } catch (err) {
                    this.showToast('Error: ' + err.message, 'error');
                }
            }

            /* --- v1.2.0: Externer Zugriff (Origins) --- */
            async loadAccessConfig() {
                try {
                    const cfg = await API.getAppConfig();
                    const all = document.getElementById('set-allow-all-origins');
                    const ta = document.getElementById('set-cors-origins');
                    if (all) all.checked = !!(cfg && cfg.allow_all_origins);
                    if (ta) ta.value = (cfg && Array.isArray(cfg.cors_origins)) ? cfg.cors_origins.join(', ') : '';
                } catch (_) { /* noop */ }
            }

            async saveAccessConfig() {
                const all = document.getElementById('set-allow-all-origins');
                const ta = document.getElementById('set-cors-origins');
                const origins = (ta && ta.value || '').split(',').map(s => s.trim()).filter(Boolean);
                try {
                    await API.setAppConfig({ allow_all_origins: !!(all && all.checked), cors_origins: origins });
                    this.showToast(t('toast.access_saved'), 'success');
                } catch (err) {
                    this.showToast('Error: ' + err.message, 'error');
                }
            }

            /* --- v1.0.4 SPIELER --- */
            async loadPlayers(serverId) {
                const id = serverId || this.activeServerId;
                if (!id) return;
                const server = this.getServer(id);
                if (!server) return;
                try {
                    const data = await API.listPlayers(id);
                    server.onlinePlayers = data.players || [];
                    server.playersCurrent = data.count || 0;
                    server.playersMax = data.max || server.playersMax || 20;
                } catch (err) {
                    server.onlinePlayers = [];
                }
                if (this.activeServerId === id) this.renderPlayers(server);
            }

            renderPlayers(server) {
                const list = document.getElementById('players-list-container');
                const badge = document.getElementById('players-count-badge');
                if (!list) return;
                const players = server.onlinePlayers || [];

                if (badge) badge.innerText = `${players.length} / ${server.playersMax || 20}`;

                if (!players.length) {
                    list.innerHTML = `<div class="player-empty">${escapeHtml(t('players.empty'))}</div>`;
                    return;
                }

                list.innerHTML = '';
                players.forEach((name) => {
                    const safe = this._escape(name);
                    const row = document.createElement('div');
                    row.className = 'player-row';
                    row.innerHTML = `
                        <div class="player-info">
                            <img class="player-avatar" alt="" loading="lazy"
                                 src="https://mc-heads.net/avatar/${encodeURIComponent(name)}/32"
                                 onerror="this.style.visibility='hidden'">
                            <span class="player-name">${safe}</span>
                        </div>
                        <button class="player-menu-btn" title="Aktionen" data-name="${safe}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                        </button>
                        <div class="player-menu" data-menu-for="${safe}">
                            <button class="player-menu-item"        data-action="op"   data-name="${safe}">Adminrechte vergeben (OP)</button>
                            <button class="player-menu-item"        data-action="deop" data-name="${safe}">OP entziehen</button>
                            <button class="player-menu-item danger" data-action="kick" data-name="${safe}">Kicken</button>
                            <button class="player-menu-item danger" data-action="ban"  data-name="${safe}">Bannen</button>
                        </div>
                    `;
                    row.querySelector('.player-menu-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        this._togglePlayerMenu(row);
                    });
                    row.querySelectorAll('.player-menu-item').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this._closeAllPlayerMenus();
                            this.playerAction(btn.dataset.action, btn.dataset.name);
                        });
                    });
                    list.appendChild(row);
                });
            }

            _togglePlayerMenu(row) {
                const menu = row.querySelector('.player-menu');
                const open = menu.classList.contains('open');
                this._closeAllPlayerMenus();
                if (!open) menu.classList.add('open');
            }

            _closeAllPlayerMenus() {
                document.querySelectorAll('.player-menu.open').forEach(m => m.classList.remove('open'));
            }

            async playerAction(action, name) {
                if (!this.activeServerId || !name) return;
                const id = this.activeServerId;
                try {
                    if (action === 'op')   await API.playerOp(id, name);
                    if (action === 'deop') await API.playerDeop(id, name);
                    if (action === 'kick') await API.playerKick(id, name, 'Vom Admin gekickt');
                    if (action === 'ban')  await API.playerBan(id, name, 'Vom Admin gebannt');
                    this.showToast(t('toast.player_done', { action: action.toUpperCase(), name }), 'success');
                    this.loadPlayers(id);
                } catch (err) {
                    this.showToast(t('toast.player_fail', { action, e: err.message }), 'error');
                }
            }

            /* --- v1.0.4 OPTIMIZER --- */
            async toggleOptimizer(enabled) {
                if (!this.activeServerId) return;
                try {
                    await API.setOptimizer(this.activeServerId, !!enabled);
                    const server = this.getServer(this.activeServerId);
                    if (server) server.optimizer = !!enabled;
                    this.showToast(t('toast.optimizer_set', { state: enabled ? t('toast.opt_on') : t('toast.opt_off') }), 'success');
                } catch (err) {
                    this.showToast(t('toast.optimizer_fail', { e: err.message }), 'error');
                }
            }

            /* --- v1.0.4 / v1.0.7 DATEI-MANAGER --- */
            async loadFilesIndex() {
                const id = this.activeServerId;
                if (!id) return;
                const list = document.getElementById('file-list-container');
                if (!list) return;
                list.innerHTML = `<div style="color:var(--text-muted); padding: 0.75rem; font-size: 0.85rem;">${escapeHtml(t('files.loading'))}</div>`;

                let data;
                try {
                    data = await API.listFiles(id);
                } catch (err) {
                    list.innerHTML = `<div style="color:var(--status-offline); padding: 0.75rem; font-size: 0.85rem;">${this._escape(err.message)}</div>`;
                    return;
                }

                list.innerHTML = '';
                this._fileMeta = {};
                (data.files || []).forEach(f => {
                    this._fileMeta[f.name] = f;
                    const btn = document.createElement('button');
                    btn.className = 'file-list-item';
                    btn.dataset.name = f.name;
                    let badge = '';
                    if (!f.exists) {
                        badge = f.optional
                            ? '<span class="badge-missing optional" title="Optional - existiert nicht">optional</span>'
                            : '<span class="badge-missing">leer</span>';
                    }
                    btn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span>${this._escape(f.name)}</span>
                        ${badge}
                    `;
                    btn.onclick = () => this.openFile(f.name);
                    list.appendChild(btn);
                });
            }

            async openFile(name) {
                const id = this.activeServerId;
                if (!id) return;
                document.querySelectorAll('#file-list-container .file-list-item').forEach(b => {
                    b.classList.toggle('active', b.dataset.name === name);
                });
                const ta = document.getElementById('file-editor-textarea');
                const nameEl = document.getElementById('file-editor-name');
                const pathEl = document.getElementById('file-editor-path');
                const saveBtn = document.getElementById('btn-file-save');
                const hint = document.getElementById('file-editor-hint');

                ta.value = '// Lade ...';
                nameEl.innerText = name;
                pathEl.innerText = 'Lade ...';
                saveBtn.disabled = true;
                if (hint) hint.style.display = 'none';
                this._activeFile = name;

                const meta = (this._fileMeta || {})[name] || {};
                const isOptional = !!meta.optional;

                try {
                    const data = await API.readFile(id, name);
                    ta.value = data.content || '';
                    pathEl.innerText = data.path || '';
                    saveBtn.disabled = false;

                    // v1.0.7: optionale Datei existiert noch nicht -> Banner statt Toast.
                    if (data && data.exists === false && data.optional && hint) {
                        hint.style.display = 'block';
                        hint.innerText = t('files.not_exists');
                    }
                } catch (err) {
                    // Wenn der Server doch hart 404 wirft (z.B. Pflicht-Datei),
                    // bei Optionalen *kein* roter Toast - nur leerer Editor + Hinweis.
                    if (isOptional) {
                        ta.value = '';
                        pathEl.innerText = meta.path || '';
                        saveBtn.disabled = false;
                        if (hint) {
                            hint.style.display = 'block';
                            hint.innerText = t('files.not_exists');
                        }
                    } else {
                        ta.value = '';
                        pathEl.innerText = 'Fehler';
                        this.showToast(t('toast.file_load_fail', { e: err.message }), 'error');
                    }
                }
            }

            async saveActiveFile() {
                if (!this.activeServerId || !this._activeFile) return;
                const ta = document.getElementById('file-editor-textarea');
                const saveBtn = document.getElementById('btn-file-save');
                const hint = document.getElementById('file-editor-hint');
                saveBtn.disabled = true;
                try {
                    await API.writeFile(this.activeServerId, this._activeFile, ta.value);
                    this.showToast(t('toast.file_saved', { name: this._activeFile }), 'success');
                    if (hint) hint.style.display = 'none';
                    this.loadFilesIndex();   // 'optional'/'leer'-Badge ggf. entfernen
                } catch (err) {
                    this.showToast(t('toast.file_save_fail', { e: err.message }), 'error');
                } finally {
                    saveBtn.disabled = false;
                }
            }

            updateResourceMeters(server) {
                const isRunning = server.status === 'running';

                // CPU
                const cpuVal = isRunning ? server.cpuUsed : 0;
                document.getElementById('dash-gauge-cpu').innerText = `${cpuVal}%`;
                const cpuBar = document.getElementById('dash-gauge-cpu-bar');
                if (cpuBar) {
                    cpuBar.style.width = `${Math.max(0, Math.min(100, cpuVal))}%`;
                    cpuBar.classList.toggle('overloaded', !!server.overloaded);
                }

                // RAM
                const ramMax = server.ramMax;
                const ramUsed = isRunning ? server.ramUsed.toFixed(1) : '0.0';
                document.getElementById('dash-gauge-ram').innerText = `${ramUsed} / ${ramMax}.0 GB`;
                const ramBar = document.getElementById('dash-gauge-ram-bar');
                if (ramBar) {
                    const ramPct = isRunning ? (server.ramPct || (server.ramUsed / Math.max(ramMax, 1) * 100)) : 0;
                    ramBar.style.width = `${Math.max(0, Math.min(100, ramPct))}%`;
                    ramBar.classList.toggle('overloaded', ramPct >= 90);
                }

                // Players
                const playMax = server.playersMax;
                const playCur = isRunning ? server.playersCurrent : 0;
                document.getElementById('dash-gauge-players').innerText = `${playCur} / ${playMax}`;

                // Overload-Banner
                const banner = document.getElementById('overload-banner');
                if (banner) banner.classList.toggle('active', !!server.overloaded && isRunning);

                // Optimizer-Toggle nachziehen, falls man im Software-Tab ist
                const opt = document.getElementById('toggle-optimizer');
                if (opt) opt.checked = !!server.optimizer;
            }


            /* --- LIVE METRIC POLLER (Backend) --- */
            startResourceSimulation() {
                // Periodisches Refresh statt Mock-Simulation.
                this._tick = 0;
                this.simulationInterval = setInterval(async () => {
                    this._tick++;
                    if (this.activeServerId) {
                        // Detail-Refresh + Logs fuer aktiven Server
                        const updated = await this.refreshServer(this.activeServerId);
                        if (updated) {
                            this.updateDashboardHeaderAndControls(updated);
                            this.updateResourceMeters(updated);
                            this._recordPerfPoint(updated);
                        }
                        if (this.activeTab === 'status') {
                            this.refreshLogs(this.activeServerId);
                            this.loadPlayers(this.activeServerId);
                            // Tunnel-Status seltener pollen (jede 2. Runde ~8s); der
                            // Verbindungs-Block ist im Status-Tab immer sichtbar.
                            if (this._tick % 2 === 0) {
                                this.refreshTunnel(this.activeServerId);
                            }
                        }
                    } else {
                        await this.refreshServers();
                        this.renderServerGrid();
                        this.renderGlobalStats();
                        // Auch im Overview Performance sammeln (alle Server)
                        servers.forEach(s => this._recordPerfPoint(s));
                    }
                }, 4000);
            }

            /* --- CONSOLE TERMINAL ENGINE --- */
            addLog(server, level, message) {
                const time = new Date().toLocaleTimeString();
                let entry = `[${time} ${level}]: ${message}`;
                server.logs.push(entry);
                
                // Cap log arrays to preserve memory mock
                if (server.logs.length > 100) {
                    server.logs.shift();
                }
            }

            renderConsoleLogs(server) {
                const pane = document.getElementById('console-logs-pane');
                if (!pane) return;

                // v1.0.6: Wenn der Nutzer gerade Text im Terminal markiert hat,
                // ueberspringen wir den Repaint, damit die Auswahl nicht verloren geht.
                try {
                    const sel = window.getSelection && window.getSelection();
                    if (sel && sel.rangeCount && !sel.isCollapsed && sel.anchorNode && pane.contains(sel.anchorNode)) {
                        return;
                    }
                } catch (_) { /* noop */ }

                pane.innerHTML = '';

                server.logs.forEach(log => {
                    const line = document.createElement('div');
                    line.className = 'log-entry';

                    // SICHERHEIT: Log-Zeilen kommen roh aus dem Container (inkl.
                    // Spieler-Chat) -> erst HTML-escapen, DANN nur den Zeitstempel
                    // und das Level mit <span> einfaerben. Kein Roh-HTML mehr.
                    const safe = escapeHtml(log);
                    const withTime = safe.replace(/(\[\d{2}:\d{2}:\d{2}\])/, '<span class="log-time">$1</span>');

                    if (log.includes('INFO')) {
                        line.innerHTML = withTime.replace(/(INFO):/, '<span class="log-info">$1:</span>');
                    } else if (log.includes('WARN')) {
                        line.innerHTML = withTime.replace(/(WARN):/, '<span class="log-warn">$1:</span>');
                    } else if (log.includes('ERROR')) {
                        line.innerHTML = withTime.replace(/(ERROR):/, '<span class="log-error">$1:</span>');
                    } else if (log.includes('COMMAND')) {
                        line.innerHTML = withTime.replace(/(COMMAND):/, '<span class="log-command">$1:</span>');
                    } else if (log.includes('SYSTEM')) {
                        line.innerHTML = withTime.replace(/(SYSTEM):/, '<span class="log-system">$1:</span>');
                    } else {
                        line.textContent = log;
                    }
                    pane.appendChild(line);
                });

                // Auto-scroll to bottom of console logs
                pane.scrollTop = pane.scrollHeight;
            }

            async submitConsoleCommand() {
                const input = document.getElementById('console-cmd-input');
                const command = input.value.trim();
                if (!command) return;

                const server = this.getServer(this.activeServerId);
                if (!server) return;

                input.value = '';
                if (server.status !== 'running') {
                    this.showToast(t('toast.server_not_running'), 'warn');
                    return;
                }

                // Befehl an Backend (rcon-cli)
                try {
                    const result = await API.command(server.id, command.replace(/^\//, ''));
                    if (result && result.output) {
                        // Output direkt anhaengen, danach Logs nachladen
                        server.logs.push(`> ${command}`);
                        result.output.split('\n').forEach(line => {
                            if (line.trim()) server.logs.push(line);
                        });
                        this.renderConsoleLogs(server);
                    }
                    setTimeout(() => this.refreshLogs(server.id), 600);
                } catch (err) {
                    this.showToast(t('toast.cmd_fail', { e: err.message }), 'error');
                }
            }

            executeSimulatedCommand(server, commandString) {
                const command = commandString.toLowerCase();
                
                if (server.status !== 'running' && !command.startsWith('/start')) {
                    this.addLog(server, 'WARN', 'Befehl konnte nicht gesendet werden. Server ist offline.');
                    this.renderConsoleLogs(server);
                    return;
                }

                if (command.startsWith('/help')) {
                    this.addLog(server, 'INFO', '--- Verfügbare CraftControl Simulator Befehle ---');
                    this.addLog(server, 'INFO', '/help - Listet alle Befehle auf.');
                    this.addLog(server, 'INFO', '/op [Spielername] - Erhebt einen Spieler zum Operator.');
                    this.addLog(server, 'INFO', '/say [Text] - Sendet eine Broadcast-Nachricht.');
                    this.addLog(server, 'INFO', '/plugins - Listet alle installierten Erweiterungen auf.');
                    this.addLog(server, 'INFO', '/stop - Stoppt den Server.');
                    this.addLog(server, 'INFO', '/tps - Zeigt die simulierten Server-Ticks pro Sekunde.');
                } else if (command.startsWith('/op ')) {
                    const player = commandString.substring(4).trim();
                    this.addLog(server, 'INFO', `Made ${player} a server operator`);
                    this.showToast(t('toast.player_done', { action: 'OP', name: player }), 'success');
                } else if (command.startsWith('/say ')) {
                    const msg = commandString.substring(5).trim();
                    this.addLog(server, 'INFO', `[Server] Broadcast: ${msg}`);
                } else if (command.startsWith('/plugins')) {
                    const list = server.installedExtensions.join(', ');
                    this.addLog(server, 'INFO', `Installierte Erweiterungen (${server.installedExtensions.length}): ${list || 'Keine'}`);
                } else if (command.startsWith('/stop')) {
                    this.executeShutdownSequence(server);
                } else if (command.startsWith('/tps')) {
                    const randTps = (19.8 + Math.random() * 0.2).toFixed(2);
                    this.addLog(server, 'INFO', `TPS: ${randTps} (100% stable, Allocation RAM: ${server.ramMax}GB)`);
                } else {
                    this.addLog(server, 'INFO', `Befehl "${commandString}" wurde an Konsole gesendet. (Keine Simulation hinterlegt, aber registriert!)`);
                }
                this.renderConsoleLogs(server);
            }

            clearConsoleLogs() {
                const server = this.getServer(this.activeServerId);
                if (server) {
                    server.logs = [`[${new Date().toLocaleTimeString()} SYSTEM]: ${t('log.console_cleared')}`];
                    this.renderConsoleLogs(server);
                }
            }

            /* --- v1.0.6: Terminal kopieren / herunterladen ---------------- */
            // Liest den sichtbaren Terminal-Inhalt als reinen Text (kein HTML).
            // Bevorzugt das im Server gehaltene logs-Array, faellt auf das
            // DOM zurueck, falls das Frontend gerade keinen Server geladen hat.
            getTerminalText() {
                const server = this.getServer(this.activeServerId);
                if (server && Array.isArray(server.logs) && server.logs.length) {
                    return server.logs.join('\n');
                }
                const pane = document.getElementById('console-logs-pane');
                if (!pane) return '';
                // textContent statt innerHTML -> nie HTML in der Ausgabe
                const lines = Array.from(pane.children).map(el => el.textContent.replace(/\s+$/g, ''));
                return lines.join('\n');
            }

            // Kopiert die aktuelle Auswahl (wenn vorhanden) oder den ganzen Terminal-Text.
            async copyTerminalText() {
                const sel = window.getSelection ? window.getSelection().toString() : '';
                const pane = document.getElementById('console-logs-pane');
                let text = '';
                if (sel && pane && pane.contains(window.getSelection().anchorNode)) {
                    text = sel;
                } else {
                    text = this.getTerminalText();
                }

                if (!text) {
                    this.showToast(t('toast.no_term_copy'), 'warn');
                    return;
                }

                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(text);
                    } else {
                        // Fallback: unsichtbare textarea + execCommand('copy')
                        const ta = document.createElement('textarea');
                        ta.value = text;
                        ta.setAttribute('readonly', '');
                        ta.style.position = 'fixed';
                        ta.style.opacity = '0';
                        ta.style.left = '-9999px';
                        document.body.appendChild(ta);
                        ta.select();
                        const ok = document.execCommand && document.execCommand('copy');
                        document.body.removeChild(ta);
                        if (!ok) throw new Error('execCommand copy nicht erlaubt');
                    }
                    this.showToast(t('toast.term_copied'), 'success');
                } catch (err) {
                    this.showToast(t('toast.copy_fail'), 'error');
                }
            }

            // Laedt den Terminal-Inhalt als .log-Datei herunter (rein clientseitig).
            downloadTerminalLog() {
                const text = this.getTerminalText();
                if (!text) {
                    this.showToast(t('toast.no_term_save'), 'warn');
                    return;
                }

                const server = this.getServer(this.activeServerId);
                const safeName = server && server.name
                    ? server.name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
                    : '';
                const now = new Date();
                const pad = n => String(n).padStart(2, '0');
                const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
                const filename = safeName
                    ? `craftcontrol-${safeName}-terminal-${ts}.log`
                    : `craftcontrol-terminal-${ts}.log`;

                try {
                    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    this.showToast(t('toast.log_saved', { name: filename }), 'success');
                } catch (err) {
                    this.showToast(t('toast.backup_download_fail', { e: (err && err.message ? err.message : err) }), 'error');
                }
            }


            /* --- TAB 2: SOFTWARE CONFIGURATION PANEL --- */
            renderSoftwareCards(activeSoftware) {
                const container = document.getElementById('software-selector-cards');
                container.innerHTML = '';

                INITIAL_SOFTWARE.forEach(sw => {
                    const card = document.createElement('div');
                    card.className = `software-card ${sw.id === activeSoftware ? 'active' : ''}`;
                    card.setAttribute('onclick', `app.selectSoftware('${sw.id}')`);

                    card.innerHTML = `
                        ${this.getSoftwareSVG(sw.id, false)}
                        <h4>${sw.name}</h4>
                        <p>${sw.desc}</p>
                    `;
                    container.appendChild(card);
                });
            }

            selectSoftware(softwareId) {
                this.renderSoftwareCards(softwareId);
                this.showToast(t('toast.engine_selected', { name: softwareId }), 'warn');
            }

            saveSoftwareConfig() {
                const server = this.getServer(this.activeServerId);
                if (!server) return;

                // Find currently active card selection
                const activeCard = document.querySelector('.software-card.active h4');
                const selectedSoftware = activeCard ? activeCard.innerText : server.software;
                const selectedVersion = document.getElementById('select-mc-version').value;
                const selectedRam = parseInt(document.getElementById('input-allocated-ram').value);

                server.software = selectedSoftware;
                server.version = selectedVersion;
                server.ramMax = selectedRam;

                this.addLog(server, 'SYSTEM', `Softwarekonfiguration aktualisiert auf: ${selectedSoftware} ${selectedVersion} mit ${selectedRam}GB RAM.`);
                
                this.syncAllUIs();
                this.showToast(t('toast.config_saved'), 'success');

                // If running, warn user or trigger automatic simulation reboot!
                if (server.status === 'running') {
                    this._powerAction(server.id, 'restart');
                }
            }


            /* --- TAB 3: PLUGINS & MODS WORKFLOW (Modrinth) --- */
            // Wird aus dem Tab-Wechsel und durch das Suchfeld aufgerufen.
            async renderPluginsCatalog(searchQuery = '', filterCategory = 'auto') {
                const container = document.getElementById('plugin-catalog-list');
                if (!container) return;

                const server = this.getServer(this.activeServerId);
                if (!server) return;

                // Vanilla unterstuetzt von Haus aus weder Plugins noch Mods.
                if ((server.software || '').toLowerCase() === 'vanilla') {
                    container.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding: 2rem;">
                        Vanilla unterstuetzt keine Plugins oder Mods. Wechsle in den Software-Tab z.B. zu Paper, Forge oder Fabric.
                    </div>`;
                    return;
                }

                container.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding: 1.5rem;">${escapeHtml(t('plug.searching'))}</div>`;

                let data;
                try {
                    data = await API.searchPlugins(server.id, searchQuery, filterCategory, 25);
                } catch (err) {
                    container.innerHTML = `<div style="color:var(--status-offline); text-align:center; padding: 1.5rem;">${escapeHtml(t('plug.search_fail', { e: err.message }))}</div>`;
                    return;
                }

                const installed = new Set((server.installedExtensions || []).map(x => (x.id || x).toLowerCase()));
                const results = data.results || [];
                container.innerHTML = '';

                if (results.length === 0) {
                    container.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding: 2rem;">
                        ${escapeHtml(t('plug.no_results', { q: searchQuery || '', kind: data.kind || '', version: data.version || '—' }))}
                    </div>`;
                    return;
                }

                results.forEach(plugin => {
                    const candidate = (plugin.slug || '').toLowerCase();
                    const isInstalledHint = [...installed].some(name => name.includes(candidate));
                    const cls = (plugin.classification || 'unknown').toLowerCase();
                    const clsLabel = cls.toUpperCase();
                    const loaderPills = (plugin.loaders || [])
                        .map(l => `<span class="plugin-loader-pill">${this._escape(l)}</span>`)
                        .join('');
                    const targetLabel = plugin.target_dir
                        ? `${escapeHtml(t('plug.target'))}: <code>${this._escape(plugin.target_dir)}</code>`
                        : `${escapeHtml(t('plug.target'))}: ${escapeHtml(cls === 'hybrid' ? t('plug.target_click') : t('plug.target_unknown'))}`;
                    const clientWarn = plugin.server_side === 'unsupported'
                        ? `<div class="plugin-clientside-warn">${escapeHtml(t('plug.clientside_warn'))}</div>`
                        : '';

                    const installable = cls !== 'unknown';
                    const buttonLabel = !installable
                        ? t('plug.not_installable')
                        : (isInstalledHint ? t('plug.reload') : t('plug.install'));

                    const item = document.createElement('div');
                    item.className = 'plugin-item';
                    item.innerHTML = `
                        <div class="plugin-info" style="display:flex; gap:0.85rem; align-items:flex-start;">
                            ${plugin.icon_url
                                ? `<img src="${this._escape(plugin.icon_url)}" alt="" loading="lazy" style="width:42px; height:42px; border-radius:8px; object-fit:cover; flex:0 0 42px; background:var(--bg-tertiary);">`
                                : ''}
                            <div style="flex:1; min-width:0;">
                                <h4 style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                                    ${this._escape(plugin.title || plugin.slug)}
                                    <span class="plugin-classification ${this._escape(cls)}">${this._escape(clsLabel)}</span>
                                </h4>
                                <p style="margin-top:2px;">${this._escape(plugin.description || '')}</p>
                                <div style="margin-top:6px;">${loaderPills}</div>
                                <div class="plugin-target-line">${targetLabel}</div>
                                ${clientWarn}
                                <div class="plugin-meta-row" style="margin-top:6px;">
                                    <span style="font-size:0.75rem; color: var(--text-muted);">
                                        ${plugin.downloads ? plugin.downloads.toLocaleString(CURRENT_LANG === 'de' ? 'de-DE' : 'en-US') + ' ' + t('plug.downloads') : ''}
                                    </span>
                                    <a href="${this._escape(plugin.url)}" target="_blank" rel="noopener"
                                       style="font-size:0.75rem; color: var(--accent-color); text-decoration:none;">
                                        modrinth.com
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-success" style="padding: 6px 12px; font-size: 0.8rem;"
                                    ${installable ? '' : 'disabled'}
                                    data-pid="${this._escape(plugin.project_id)}"
                                    data-name="${this._escape(plugin.title || plugin.slug)}"
                                    data-class="${this._escape(cls)}">
                                ${this._escape(buttonLabel)}
                            </button>
                        </div>
                    `;
                    const btn = item.querySelector('button');
                    if (installable) {
                        btn.addEventListener('click', () => this.installExtension(btn.dataset.pid, btn.dataset.name, btn, btn.dataset.class));
                    }
                    container.appendChild(item);
                });
            }

            filterPluginsCatalog() {
                const query = document.getElementById('search-plugin-input').value;
                const cat = document.getElementById('filter-plugin-category').value;
                clearTimeout(this._pluginSearchTimer);
                this._pluginSearchTimer = setTimeout(() => {
                    this.renderPluginsCatalog(query, cat);
                }, 350);
            }

            async installExtension(projectId, displayName, btn, classification) {
                const server = this.getServer(this.activeServerId);
                if (!server || !projectId) return;

                let target = null;  // 'plugins' | 'mods' (Override fuer Hybrid)
                if ((classification || '').toLowerCase() === 'hybrid') {
                    const ans = window.prompt(t('plug.hybrid_prompt'), 'plugins');
                    if (ans === null) return;
                    target = (ans || '').trim().toLowerCase();
                    if (!['plugins', 'mods'].includes(target)) {
                        this.showToast(t('toast.invalid_target'), 'warn');
                        return;
                    }
                }

                if (btn) {
                    btn.disabled = true;
                    btn.innerText = t('common.loading');
                }
                this.showToast(t('toast.installing', { name: displayName || projectId }), 'warn');

                try {
                    const res = await API.installPlugin(server.id, projectId, null, target);
                    this.addLog(server, 'INFO', `[CraftControl] Installiert: ${res.filename} (${res.version_number || 'latest'}) -> ${res.directory}`);
                    this.showToast(t('toast.installed', { name: res.filename, dir: res.directory }), 'success');
                    await this.loadInstalledExtensions(server);
                } catch (err) {
                    console.error(err);
                    this.showToast(t('toast.install_fail', { e: err.message }), 'error');
                } finally {
                    if (btn) {
                        btn.disabled = false;
                        btn.innerText = t('plug.install');
                    }
                }
            }

            async uninstallExtension(filename) {
                const server = this.getServer(this.activeServerId);
                if (!server || !filename) return;

                if (!confirm(t('confirm.backup_delete', { name: filename }))) return;

                try {
                    await API.deleteInstalledPlugin(server.id, filename);
                    this.addLog(server, 'INFO', `[CraftControl] Erweiterung entfernt: ${filename}`);
                    this.showToast(t('toast.removed', { name: filename }), 'warn');
                    await this.loadInstalledExtensions(server);
                } catch (err) {
                    this.showToast(t('toast.remove_fail', { e: err.message }), 'error');
                }
            }

            // Holt die echten installierten .jar-Dateien aus dem Container
            async loadInstalledExtensions(server) {
                if (!server) return;
                try {
                    const data = await API.installedPlugins(server.id);
                    server.installedExtensions = (data.items || []).map(it => ({
                        id: it.name,
                        name: it.name,
                        size: it.size,
                    }));
                } catch (err) {
                    server.installedExtensions = [];
                    console.warn('installedPlugins failed:', err);
                }
                this.renderInstalledExtensionsList(server);
            }

            renderInstalledExtensionsList(server) {
                const panel = document.getElementById('installed-plugins-panel');
                if (!panel) return;
                panel.innerHTML = '';

                const items = server.installedExtensions || [];
                if (items.length === 0) {
                    panel.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:1rem 0;">${escapeHtml(t('plug.none_installed'))}</div>`;
                    return;
                }

                items.forEach(ext => {
                    const filename = (ext && (ext.id || ext.name)) || ext;
                    const sizeKb = ext && ext.size ? ` (${(ext.size / 1024).toFixed(0)} KB)` : '';
                    const item = document.createElement('div');
                    item.className = 'installed-item';
                    item.innerHTML = `
                        <span title="${this._escape(filename)}">${this._escape(filename)}<span style="color:var(--text-muted); font-size:0.75rem;">${sizeKb}</span></span>
                        <button class="btn btn-danger btn-circle" style="width:24px; height:24px; font-size: 0.75rem;" title="${escapeHtml(t('plug.uninstall'))}" data-file="${this._escape(filename)}">
                            &times;
                        </button>
                    `;
                    item.querySelector('button').addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.uninstallExtension(e.currentTarget.dataset.file);
                    });
                    panel.appendChild(item);
                });
            }

            // Mini-Helper gegen XSS in den eingefuegten Modrinth-Strings
            _escape(s) {
                return String(s == null ? '' : s)
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            }

            /* --- PLUGIN DRAG & DROP JAR FILE UPLOAD SYSTEM --- */
            setupDragAndDrop() {
                const dropzone = document.getElementById('plugin-upload-dropzone');
                const fileInput = document.getElementById('plugin-file-upload-input');

                dropzone.addEventListener('click', () => {
                    fileInput.click();
                });

                fileInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        this.uploadJarFile(e.target.files[0]);
                        e.target.value = '';  // erlaubt erneutes Hochladen derselben Datei
                    }
                });

                dropzone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    dropzone.classList.add('dragover');
                });

                dropzone.addEventListener('dragleave', () => {
                    dropzone.classList.remove('dragover');
                });

                dropzone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropzone.classList.remove('dragover');
                    if (e.dataTransfer.files.length > 0) {
                        this.uploadJarFile(e.dataTransfer.files[0]);
                    }
                });
            }

            /* v1.1.0: Echter .jar-Upload via XHR (mit Fortschrittsanzeige). */
            uploadJarFile(file) {
                const server = this.getServer(this.activeServerId);
                if (!server) return;

                if (!file.name.toLowerCase().endsWith('.jar')) {
                    this.showToast(t('toast.jar_only'), 'error');
                    return;
                }

                const filename = file.name;
                const progressBox = document.getElementById('plugin-upload-progress');
                const progressBar = document.getElementById('plugin-upload-progress-bar-fill');
                const filenameLabel = document.getElementById('plugin-upload-filename');
                const percentLabel = document.getElementById('plugin-upload-percent');

                filenameLabel.innerText = filename;
                progressBox.style.display = 'flex';
                progressBar.style.width = '0%';
                percentLabel.innerText = '0%';

                const form = new FormData();
                form.append('file', file, filename);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${API._base}/api/servers/${server.id}/plugins/upload`);
                const auth = API.authHeaders();
                if (auth.Authorization) xhr.setRequestHeader('Authorization', auth.Authorization);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const pct = Math.round((e.loaded / e.total) * 100);
                        progressBar.style.width = `${pct}%`;
                        percentLabel.innerText = `${pct}%`;
                    }
                };

                xhr.onload = () => {
                    progressBox.style.display = 'none';
                    if (xhr.status >= 200 && xhr.status < 300) {
                        let res = {};
                        try { res = JSON.parse(xhr.responseText); } catch (_) { /* noop */ }
                        this.showToast(t('toast.uploaded', { name: filename, dir: res.directory || '' }), 'success');
                        this.loadInstalledExtensions(server);
                    } else if (xhr.status === 401) {
                        this.requireLogin();
                    } else {
                        let msg = xhr.statusText;
                        try { msg = JSON.parse(xhr.responseText).detail || msg; } catch (_) { /* noop */ }
                        this.showToast(t('toast.upload_fail', { e: msg }), 'error');
                    }
                };
                xhr.onerror = () => {
                    progressBox.style.display = 'none';
                    this.showToast(t('toast.upload_neterr'), 'error');
                };
                xhr.send(form);
            }


            /* --- TAB 4: BACKUPS MANAGEMENT WORKFLOW (v1.1.0: echtes Backend) --- */
            async loadBackups(serverId) {
                const server = this.getServer(serverId);
                if (!server) return;
                try {
                    const data = await API.listBackups(serverId);
                    server.backups = (data && data.items) ? data.items : [];
                } catch (err) {
                    console.warn('listBackups failed:', err);
                    server.backups = server.backups || [];
                }
                if (this.activeServerId === serverId) this.renderBackupsTable(server);
            }

            renderBackupsTable(server) {
                const tbody = document.getElementById('backup-list-tbody');
                if (!tbody) return;
                tbody.innerHTML = '';

                const backups = server.backups || [];
                if (backups.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="4" style="text-align:center; color: var(--text-muted); font-size:0.9rem; padding: 2rem;">
                                ${escapeHtml(t('bk.empty'))}
                            </td>
                        </tr>
                    `;
                    return;
                }

                backups.forEach(backup => {
                    const name = this._escape(backup.name);
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <div class="backup-file-name">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent-color);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <span>${name}</span>
                            </div>
                        </td>
                        <td style="color:var(--text-muted); font-size:0.9rem;">${this._escape(backup.date)}</td>
                        <td style="color:var(--text-muted); font-size:0.9rem;">${this._escape(backup.size_human || '')}</td>
                        <td>
                            <div style="display:flex; gap: 8px;">
                                <button class="btn btn-secondary" style="padding: 6px 12px; font-size:0.75rem;" title="${escapeHtml(t('bk.restore'))}" data-backup-restore="${name}">${escapeHtml(t('bk.restore'))}</button>
                                <button class="btn btn-secondary btn-circle" style="width:30px; height:30px;" title="${escapeHtml(t('bk.download'))}" data-backup-download="${name}">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                </button>
                                <button class="btn btn-danger btn-circle" style="width:30px; height:30px;" title="${escapeHtml(t('bk.delete'))}" data-backup-delete="${name}">
                                    &times;
                                </button>
                            </div>
                        </td>
                    `;
                    row.querySelector('[data-backup-restore]').addEventListener('click', () => this.restoreBackup(backup.name));
                    row.querySelector('[data-backup-download]').addEventListener('click', () => this.downloadBackup(backup.name));
                    row.querySelector('[data-backup-delete]').addEventListener('click', () => this.deleteBackup(backup.name));
                    tbody.appendChild(row);
                });
            }

            async createNewBackup() {
                const server = this.getServer(this.activeServerId);
                if (!server) return;

                const btn = document.getElementById('btn-create-backup');
                const progressBox = document.getElementById('backup-generation-progress');
                const progressFill = document.getElementById('backup-progress-fill');
                const percentLabel = document.getElementById('backup-progress-percent');

                // UI sperren + unbestimmten Fortschritt zeigen (Backend liefert kein %).
                btn.disabled = true;
                progressBox.style.display = 'flex';
                progressFill.style.width = '85%';
                percentLabel.innerText = '...';
                this.showToast(t('toast.backup_creating'), 'warn');

                try {
                    await API.createBackup(server.id);
                    this.showToast(t('toast.backup_created'), 'success');
                    await this.loadBackups(server.id);
                } catch (err) {
                    this.showToast(t('toast.backup_create_fail', { e: err.message }), 'error');
                } finally {
                    progressFill.style.width = '100%';
                    setTimeout(() => {
                        progressBox.style.display = 'none';
                        progressFill.style.width = '0%';
                        btn.disabled = false;
                    }, 400);
                }
            }

            async restoreBackup(backupName) {
                const server = this.getServer(this.activeServerId);
                if (!server) return;

                const confirmRestore = confirm(t('confirm.restore', { name: backupName }));
                if (!confirmRestore) return;

                this.showToast(t('toast.backup_restoring'), 'warn');
                try {
                    await API.restoreBackup(server.id, backupName);
                    this.showToast(t('toast.backup_restored'), 'success');
                    await this.refreshServer(server.id);
                } catch (err) {
                    this.showToast(t('toast.backup_restore_fail', { e: err.message }), 'error');
                }
            }

            downloadBackup(backupName) {
                // Echter Download. Token muss per Query nicht uebergeben werden,
                // da der Browser den Authorization-Header bei <a> nicht setzen kann;
                // wir holen die Datei daher per fetch (mit Header) und triggern blob.
                this.showToast(t('toast.backup_download', { name: backupName }), 'success');
                const url = API.backupDownloadUrl(this.activeServerId, backupName);
                fetch(url, { headers: API.authHeaders() })
                    .then(res => {
                        if (!res.ok) throw new Error(res.statusText);
                        return res.blob();
                    })
                    .then(blob => {
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = backupName;
                        document.body.appendChild(a);
                        a.click();
                        URL.revokeObjectURL(a.href);
                        document.body.removeChild(a);
                    })
                    .catch(err => this.showToast(t('toast.backup_download_fail', { e: err.message }), 'error'));
            }

            async deleteBackup(backupName) {
                const server = this.getServer(this.activeServerId);
                if (!server) return;
                if (!confirm(t('confirm.backup_delete', { name: backupName }))) return;
                try {
                    await API.deleteBackup(server.id, backupName);
                    this.showToast(t('toast.backup_deleted', { name: backupName }), 'warn');
                    await this.loadBackups(server.id);
                } catch (err) {
                    this.showToast(t('toast.backup_delete_fail', { e: err.message }), 'error');
                }
            }


            /* --- E. GLOBAL HELPER UTILS & TOASTS --- */
            showToast(message, type = 'success') {
                const wrapper = document.getElementById('toast-wrapper');
                const toast = document.createElement('div');
                toast.className = `toast-msg ${type}`;
                
                let icon = '';
                if (type === 'success') icon = '✓';
                if (type === 'error') icon = '✗';
                if (type === 'warn') icon = '⚠';

                toast.innerText = `${icon} ${message}`;
                wrapper.appendChild(toast);

                // Auto destroy toast after 4s
                setTimeout(() => {
                    toast.style.animation = 'slideInToast 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
                    setTimeout(() => {
                        toast.remove();
                    }, 300);
                }, 3500);
            }

            // Beautiful SVG selectors representing server software engines
            getSoftwareSVG(softwareId, isActive) {
                const activeColor = 'var(--accent-color)';
                const inactiveColor = 'var(--text-muted)';
                const color = isActive ? activeColor : inactiveColor;

                switch(softwareId) {
                    case 'Vanilla':
                        return `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                <line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                        `;
                    case 'Spigot':
                        return `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                        `;
                    case 'Paper':
                        return `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                            </svg>
                        `;
                    case 'Forge':
                        return `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="6 2 18 2 18 6 12 11 18 16 18 20 6 20 6 16 12 11 6 6"/>
                            </svg>
                        `;
                    case 'Fabric':
                        return `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                <path d="m9 12 2 2 4-4"/>
                            </svg>
                        `;
                    case 'Mohist':
                        return `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                                <line x1="9" y1="9" x2="9.01" y2="9"/>
                                <line x1="15" y1="9" x2="15.01" y2="9"/>
                            </svg>
                        `;
                    default:
                        return `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="${color}" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                            </svg>
                        `;
                }
            }
        }

        // Mount global App controller
        const app = new DashboardApp();
        window.app = app;  // explizit, damit z.B. der 401-Handler app.requireLogin findet
        window.onload = () => {
            app.init();
        };

