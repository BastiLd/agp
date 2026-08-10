// ---------------------------------------------------------------------------
// Internationalisation (i18n).
//
// `translations` holds every user-visible string in English (en) and German
// (de). Elements opt in with:
//   data-i18n="key"                -> sets textContent
//   data-i18n-attr="attr:key;..."  -> sets attribute(s), e.g. aria-label / placeholder
//
// setLanguage() persists the choice, updates <html lang>, re-renders the DOM
// and fires a `languagechange` event so dynamic modules (games, comments) can
// re-localise too.
// ---------------------------------------------------------------------------

export const translations = {
  en: {
    // --- Generic / nav ---
    skipLink: 'Skip to main content',
    navHome: 'Home',
    navRestore: 'RestoreInventory',
    navGames: 'Games',
    navMods: 'Mods',
    langToggle: 'Switch language to German',
    langName: 'EN',

    // --- Hero ---
    heroTitle: 'BastiLd Mod Hub',
    heroSubtitle: 'Explore mods and play mini-games.',
    heroLead:
      'A small hub for my Minecraft mods. Start with RestoreInventory — never lose your inventory again — then stick around for a game.',
    heroCtaRestore: 'Explore RestoreInventory',
    heroCtaGames: 'Play a game',

    // --- RestoreInventory ---
    riTitle: 'RestoreInventory',
    riTagline:
      'A Fabric mod that automatically backs up your inventory and lets you restore it on demand — across deaths, mistakes and even mod updates.',
    featuresTitle: 'Features',
    feat1_t: 'Four save slots per player',
    feat1_d: 'Auto (short), Auto (long), Manual and Death — every player gets all four.',
    feat2_t: 'Configurable auto-save intervals',
    feat2_d: 'Choose how often the two Auto slots save your inventory.',
    feat3_t: 'Auto-save just before death',
    feat3_d: 'Moments before dying, the inventory is captured into the dedicated Death slot.',
    feat4_t: 'Undo restoration',
    feat4_d: '/restoreinv undo — before any restore, the current inventory is saved first, so nothing is ever lost.',
    feat5_t: 'Inventory preview GUI',
    feat5_d: 'A 9×6 view showing armor, main inventory, hotbar and off-hand before you restore.',
    feat6_t: 'Detailed tooltips',
    feat6_d: 'Relative time, item count and your best tool at a glance.',
    feat7_t: 'Pin protection',
    feat7_d: 'Right-click a save to pin it and prevent it from being overwritten.',
    feat8_t: '1–9 saves per slot',
    feat8_d: 'Configure how many saves each slot keeps around.',
    feat9_t: 'Sound & per-player settings',
    feat9_d: 'Toggle the restore sound; every player keeps their own settings.',
    feat10_t: 'Multilingual',
    feat10_d: 'English and German are fully supported.',
    feat11_t: 'Asynchronous saving',
    feat11_d: 'Saving runs off the server thread — no lag spikes.',
    feat12_t: 'Saves survive updates',
    feat12_d: 'Stored in restoreinv/<uuid>, persisting across mod updates.',
    feat13_t: 'Supported Minecraft versions',
    feat13_d: '1.21–1.21.1, 1.21.2–1.21.4 and 1.21.9–1.21.11 — three JARs cover all ranges.',
    feat14_t: 'Full command set',
    feat14_d: '/restoreinv 1|2|3|4, save, undo, saves, config, version — plus aliases /rinv and /restoreInv.',
    feat15_t: 'Permissions',
    feat15_d: 'restoreinv.admin and restoreinv.restore; falls back to OP level without fabric-permissions-api.',
    feat16_t: 'MIT license',
    feat16_d: 'Open source; saves survive updates and stay backward-compatible.',

    // --- Downloads ---
    downloadsTitle: 'Downloads',
    thVersion: 'Version Range',
    thJar: 'JAR Name',
    thDownload: 'Download',
    btnModrinth: 'Modrinth',
    btnGithub: 'GitHub Release',
    downloadNote: 'Saves survive updates.',

    // --- Commands ---
    commandsTitle: 'Commands',
    thCommand: 'Command',
    thDescription: 'Description',
    cmd1: 'Restore from Auto-short / Auto-long / Manual / Death.',
    cmd2: 'Save current inventory to the Manual slot.',
    cmd3: 'Undo the last restoration.',
    cmd4: 'Open your save list GUI.',
    cmd5: 'Open the configuration GUI (admins only).',
    cmd6: 'Show the mod and Minecraft version.',
    cmdAliasesLabel: 'Aliases',
    cmdAliases: 'Shortcuts for /restoreinv.',

    // --- Permissions ---
    permissionsTitle: 'Permissions',
    thNode: 'Node',
    thEffect: 'Effect',
    perm1: 'Access config GUI, admin panel, restore other players.',
    perm2: 'Restore your own inventory (/restoreinv and undo).',

    // --- Comments ---
    commentsTitle: 'Comments',
    commentsIntro: 'Got feedback or a bug report? Leave a comment.',
    commentsLoading: 'Loading comments…',
    commentsEmpty: 'No comments yet — be the first!',
    commentsError: 'Comments are unavailable right now. (Has the database been set up?)',
    formName: 'Name',
    formNamePh: 'Your name',
    formBody: 'Comment',
    formBodyPh: 'Write something nice…',
    formSubmit: 'Post comment',
    formReply: 'Reply',
    formReplyTo: 'Replying to',
    formCancel: 'Cancel',
    rateLimited: 'Please wait a moment before posting again.',
    commentEmptyFields: 'Please enter both a name and a comment.',
    commentPosted: 'Thanks! Your comment was posted.',

    // --- Games ---
    gamesTitle: 'Games',
    gamesIntro: "A quick break? Two takes on Paddle Force — the original by Flobotron and BastiLd's remake.",
    pfOrigTitle: 'Paddle Force (Original)',
    pfOrigDesc:
      "The original by Flobotron — © 2019 Luke Pacholski, Bobby Richter & Devon Bird. Hosted here with the developers' permission.",
    pongTitle: 'Paddle Force Classic',
    pongHowto: 'P1: W A S D move · C / V rotate. P2: arrows move · , / . rotate. Capture the field to win a round.',
    pongAria: 'Paddle Force game board',
    p1Label: 'Player 1',
    p2Label: 'Player 2',
    cpuLabel: 'CPU',
    gameWinner: 'wins!',
    gameRestart: 'Restart',
    gameStartHint: 'Press Space or Restart to play.',
    ctrlUp: 'Move up',
    ctrlDown: 'Move down',
    ctrlLeft: 'Move left',
    ctrlRight: 'Move right',
    ctrlRotL: 'Rotate counter-clockwise',
    ctrlRotR: 'Rotate clockwise',
    // Paddle Force menu
    pgTitle: 'Paddle Force',
    pgMode: 'Mode',
    pgModeCpu: 'vs CPU',
    pgModePvp: '2 Players',
    pgModeDemo: 'CPU vs CPU',
    pgDifficulty: 'Difficulty',
    pgDiffEasy: 'Easy',
    pgDiffMedium: 'Medium',
    pgDiffHard: 'Hard',
    pgRounds: 'Best of',
    pgPowerups: 'Power-ups',
    pgStart: 'Start',
    pgPlayFull: '▶ Play fullscreen',
    pgResume: 'Resume',
    pgRematch: 'Rematch',
    pgMenu: 'Menu',
    pgPaused: 'Paused',
    pgHintStart: 'Pick your settings and press Start. Space/P = pause, M = mute.',
    pgBestOf: 'Best of',
    pgWin: '{p} wins the match!',
    pgCapture: '{p} captures the field!',
    pgMute: 'Mute sound',
    pgUnmute: 'Unmute sound',
    pu_grow: 'Grow',
    pu_ghost: 'Ghost',
    pu_spin: 'Spin',
    pu_bones: 'Bones',
    pu_sticky: 'Sticky',
    pu_mines: 'Mine',
    memoryTitle: 'Memory Match',
    memoryIntro: 'Bonus round — flip the cards and find every pair.',
    memoryMoves: 'Moves',
    memoryBest: 'Best',
    memoryWon: 'Solved in {n} moves!',
    memoryRestart: 'New game',
    // Mini games (Tic-Tac-Toe + Connect Four)
    tttTitle: 'Tic-Tac-Toe',
    tttIntro: 'Three in a row wins — play a friend or the CPU.',
    c4Title: 'Connect Four',
    c4Intro: 'Drop your discs — four in a row wins the round.',
    c4P1: 'Orange',
    c4P2: 'Blue',
    modeVsCpu: 'vs CPU',
    modeTwoPlayers: '2 players',
    miniNewGame: 'New game',
    scoreDraws: 'Draws',
    miniTurn: '{p} to move',
    miniWin: '{p} wins!',
    miniDraw: 'Draw!',
    miniCpu: 'CPU',

    // --- Mods ---
    modsTitle: 'Mods',
    modsIntro: 'Everything I have published, plus what is coming next.',
    modsRestoreCard: 'Inventory backups & restoration for Fabric.',
    modsSoonTitle: 'More coming soon',
    modsSoon: 'New mods will appear here. Have an idea? Drop it in the comments.',
    modsView: 'View',

    // --- Admin / Dashboard ---
    navDashboard: 'Dashboard',
    adminTitle: 'Dashboard',
    adminLoginAria: 'Admin login',
    adminLoginLead: 'Sign in to manage comments and view stats.',
    adminEmail: 'Email',
    adminPassword: 'Password',
    adminSignIn: 'Sign in',
    adminSigningIn: 'Signing in…',
    adminLoginError: 'Login failed. Check your email and password.',
    adminNotAuthorized: 'This account is not an admin.',
    adminRefresh: 'Refresh',
    adminLogout: 'Log out',
    adminStatsTitle: 'Statistics',
    adminGamesTitle: 'Games',
    adminCommentsTitle: 'Comment moderation',
    adminLoading: 'Loading…',
    adminLoadError: 'Could not load data. (Is the database set up?)',
    adminNoComments: 'No comments yet.',
    statPageviews: 'Page views',
    statDownloads: 'Download clicks',
    statGameStarts: 'Game starts',
    statGameOpens: 'Game opens',
    statComments: 'Comments total',
    statVisible: 'Visible',
    statHidden: 'Hidden / deleted',
    breakdownDownloads: 'Downloads by target',
    breakdownSections: 'Views by section',
    breakdownGameOpens: 'Opens by game',
    breakdownGameLaunches: 'Launch clicks by game',
    status_visible: 'visible',
    status_hidden: 'hidden',
    status_deleted: 'deleted',
    adminReply: 'Reply',
    adminReplyPh: 'Write a reply…',
    adminReplySend: 'Send',
    adminHide: 'Hide',
    adminShow: 'Show',
    adminDelete: 'Delete',
    adminDeleteConfirm: 'Delete this comment (and its replies) permanently?',
    // Mods manager
    adminModsTitle: 'Manage mods',
    modFormModrinth: 'Modrinth slug',
    modFormGithub: 'GitHub repo (owner/repo)',
    modFormFetch: 'Fetch info',
    modFormName: 'Name',
    modFormSort: 'Sort',
    modFormSumEn: 'Summary (EN)',
    modFormSumDe: 'Summary (DE)',
    modFormSave: 'Save mod',
    modFetchOk: 'Data fetched — review and save.',
    modFetchError: 'Fetch failed:',
    modFetchNoSource: 'Enter a Modrinth slug and/or a GitHub repo first.',
    modSaved: 'Mod saved!',
    modRefetch: 'Refresh data',
    modLayoutTitle: 'Card layout',
    modLayout_standard: 'Layout: standard',
    modLayout_downloads_top: 'Layout: downloads on top',
    modLayout_downloads_under_title: 'Layout: downloads under title',
    modLayout_buttons_top: 'Layout: buttons on top',
    modLayout_custom: 'Layout: custom (editor)',
    // Mod editor page
    editorOpen: 'Open mod editor',
    editorTitle: 'Mod Editor',
    editorBack: '← Dashboard',
    editorBackToList: '← All mods',
    editorPickMod: 'Choose a mod to edit',
    editorEdit: 'Edit',
    editorContent: 'Content',
    editorLayout: 'Layout',
    editorModeGrid: 'Grid (order)',
    editorModeFree: 'Free (drag)',
    editorGridHint: 'Drag the blocks (or use ↑ ↓) to change their order. Toggle visibility and alignment per block.',
    editorFreeHint: 'Drag the blocks directly on the preview card. Set each block width below the preview.',
    editorCardHeight: 'Card height (px)',
    editorPreview: 'Live preview',
    editorFreeDragHint: 'Drag blocks directly on the preview. Width per block is set below.',
    editorSave: 'Save',
    editorReset: 'Reset layout',
    editorSaved: 'Saved!',
    editorVisible: 'Visible on the site',
    editorIconUrl: 'Icon URL',
    editorModrinthUrl: 'Modrinth URL',
    editorGithubUrl: 'GitHub URL',
    editorBlockVisible: 'Show block',
    block_head: 'Title + icon',
    block_summary: 'Description',
    block_stats: 'Downloads / stats',
    block_actions: 'Buttons',
    align_left: 'Left',
    align_center: 'Centered',
    align_right: 'Right',
    modDeleteConfirm: 'Delete the mod "{n}" from the site?',
    modListEmpty: 'No mods yet — add your first one above.',
    modTableMissing: 'Could not load mods. (Has the mods table been created?)',
    modDownloads: 'downloads',

    // --- Footer ---
    footerMade: 'Made by BastiLd · MIT licensed',
    footerSource: 'Source on GitHub',
  },

  de: {
    // --- Generic / nav ---
    skipLink: 'Zum Hauptinhalt springen',
    navHome: 'Startseite',
    navRestore: 'RestoreInventory',
    navGames: 'Spiele',
    navMods: 'Mods',
    langToggle: 'Sprache auf Englisch umstellen',
    langName: 'DE',

    // --- Hero ---
    heroTitle: 'BastiLds Mod-Hub',
    heroSubtitle: 'Entdecke Mods und spiele Mini-Spiele.',
    heroLead:
      'Ein kleiner Hub für meine Minecraft-Mods. Starte mit RestoreInventory – verliere nie wieder dein Inventar – und bleib für eine Runde Spiel.',
    heroCtaRestore: 'RestoreInventory entdecken',
    heroCtaGames: 'Spiel spielen',

    // --- RestoreInventory ---
    riTitle: 'RestoreInventory',
    riTagline:
      'Eine Fabric-Mod, die dein Inventar automatisch sichert und es auf Wunsch wiederherstellt – über Tode, Fehler und sogar Mod-Updates hinweg.',
    featuresTitle: 'Funktionen',
    feat1_t: 'Vier Speicher-Slots pro Spieler',
    feat1_d: 'Auto (kurz), Auto (lang), Manuell und Tod – jeder Spieler hat alle vier.',
    feat2_t: 'Konfigurierbare Auto-Speicher-Intervalle',
    feat2_d: 'Lege fest, wie oft die beiden Auto-Slots dein Inventar sichern.',
    feat3_t: 'Auto-Speichern kurz vor dem Tod',
    feat3_d: 'Augenblicke vor dem Tod wird das Inventar im dedizierten Tod-Slot gesichert.',
    feat4_t: 'Wiederherstellung rückgängig machen',
    feat4_d: '/restoreinv undo – vor jeder Wiederherstellung wird das aktuelle Inventar zuerst gesichert; nichts geht verloren.',
    feat5_t: 'Inventar-Vorschau-GUI',
    feat5_d: 'Eine 9×6-Ansicht mit Rüstung, Hauptinventar, Hotbar und Zweithand – vor dem Wiederherstellen.',
    feat6_t: 'Detaillierte Tooltips',
    feat6_d: 'Relative Zeit, Item-Anzahl und bestes Werkzeug auf einen Blick.',
    feat7_t: 'Pin-Schutz',
    feat7_d: 'Rechtsklick pinnt einen Speicherstand und verhindert das Überschreiben.',
    feat8_t: '1–9 Saves pro Slot',
    feat8_d: 'Stelle ein, wie viele Speicherstände jeder Slot behält.',
    feat9_t: 'Sound & Spieler-Einstellungen',
    feat9_d: 'Wiederherstellungs-Sound umschaltbar; jeder Spieler behält eigene Einstellungen.',
    feat10_t: 'Mehrsprachig',
    feat10_d: 'Englisch und Deutsch werden vollständig unterstützt.',
    feat11_t: 'Asynchrones Speichern',
    feat11_d: 'Das Speichern läuft außerhalb des Server-Threads – keine Lag-Spitzen.',
    feat12_t: 'Saves überstehen Updates',
    feat12_d: 'Gespeichert in restoreinv/<uuid> – bleibt über Mod-Updates hinweg erhalten.',
    feat13_t: 'Unterstützte Minecraft-Versionen',
    feat13_d: '1.21–1.21.1, 1.21.2–1.21.4 und 1.21.9–1.21.11 – drei JARs decken alle Bereiche ab.',
    feat14_t: 'Volles Befehls-Set',
    feat14_d: '/restoreinv 1|2|3|4, save, undo, saves, config, version – plus Aliase /rinv und /restoreInv.',
    feat15_t: 'Berechtigungen',
    feat15_d: 'restoreinv.admin und restoreinv.restore; ohne fabric-permissions-api Rückfall auf OP-Level.',
    feat16_t: 'MIT-Lizenz',
    feat16_d: 'Open Source; Speicherstände überstehen Updates und sind abwärtskompatibel.',

    // --- Downloads ---
    downloadsTitle: 'Downloads',
    thVersion: 'Versionsbereich',
    thJar: 'JAR-Name',
    thDownload: 'Download',
    btnModrinth: 'Modrinth',
    btnGithub: 'GitHub-Release',
    downloadNote: 'Saves überstehen Updates.',

    // --- Commands ---
    commandsTitle: 'Befehle',
    thCommand: 'Befehl',
    thDescription: 'Beschreibung',
    cmd1: 'Wiederherstellen aus Auto-kurz / Auto-lang / Manuell / Tod.',
    cmd2: 'Aktuelles Inventar im Manuell-Slot speichern.',
    cmd3: 'Letzte Wiederherstellung rückgängig machen.',
    cmd4: 'Eigene Save-Liste (GUI) öffnen.',
    cmd5: 'Config-GUI öffnen (nur Admins).',
    cmd6: 'Mod- und Minecraft-Version anzeigen.',
    cmdAliasesLabel: 'Aliase',
    cmdAliases: 'Kurzformen für /restoreinv.',

    // --- Permissions ---
    permissionsTitle: 'Berechtigungen',
    thNode: 'Node',
    thEffect: 'Wirkung',
    perm1: 'Zugriff auf Config-GUI, Admin-Panel, fremde Inventare wiederherstellen.',
    perm2: 'Eigenes Inventar wiederherstellen (/restoreinv und undo).',

    // --- Comments ---
    commentsTitle: 'Kommentare',
    commentsIntro: 'Feedback oder einen Bug gefunden? Hinterlasse einen Kommentar.',
    commentsLoading: 'Kommentare werden geladen…',
    commentsEmpty: 'Noch keine Kommentare – sei der oder die Erste!',
    commentsError: 'Kommentare sind gerade nicht verfügbar. (Wurde die Datenbank eingerichtet?)',
    formName: 'Name',
    formNamePh: 'Dein Name',
    formBody: 'Kommentar',
    formBodyPh: 'Schreib etwas Nettes…',
    formSubmit: 'Kommentar posten',
    formReply: 'Antworten',
    formReplyTo: 'Antwort an',
    formCancel: 'Abbrechen',
    rateLimited: 'Bitte warte einen Moment, bevor du erneut postest.',
    commentEmptyFields: 'Bitte gib einen Namen und einen Kommentar ein.',
    commentPosted: 'Danke! Dein Kommentar wurde gepostet.',

    // --- Games ---
    gamesTitle: 'Spiele',
    gamesIntro: 'Kurze Pause? Zweimal Paddle Force — das Original von Flobotron und BastiLds Remake.',
    pfOrigTitle: 'Paddle Force (Original)',
    pfOrigDesc:
      'Das Original von Flobotron — © 2019 Luke Pacholski, Bobby Richter & Devon Bird. Mit Erlaubnis der Entwickler hier gehostet.',
    pongTitle: 'Paddle Force Classic',
    pongHowto: 'S1: W A S D bewegen · C / V drehen. S2: Pfeile bewegen · , / . drehen. Feld erobern = Runde gewinnen.',
    pongAria: 'Paddle-Force-Spielfeld',
    p1Label: 'Spieler 1',
    p2Label: 'Spieler 2',
    cpuLabel: 'CPU',
    gameWinner: 'gewinnt!',
    gameRestart: 'Neustart',
    gameStartHint: 'Drücke Leertaste oder Neustart zum Spielen.',
    ctrlUp: 'Nach oben bewegen',
    ctrlDown: 'Nach unten bewegen',
    ctrlLeft: 'Nach links bewegen',
    ctrlRight: 'Nach rechts bewegen',
    ctrlRotL: 'Gegen den Uhrzeigersinn drehen',
    ctrlRotR: 'Im Uhrzeigersinn drehen',
    // Paddle Force Menü
    pgTitle: 'Paddle Force',
    pgMode: 'Modus',
    pgModeCpu: 'gegen CPU',
    pgModePvp: '2 Spieler',
    pgModeDemo: 'CPU gegen CPU',
    pgDifficulty: 'Schwierigkeit',
    pgDiffEasy: 'Leicht',
    pgDiffMedium: 'Mittel',
    pgDiffHard: 'Schwer',
    pgRounds: 'Best of',
    pgPowerups: 'Power-ups',
    pgStart: 'Start',
    pgPlayFull: '▶ Vollbild spielen',
    pgResume: 'Weiter',
    pgRematch: 'Nochmal',
    pgMenu: 'Menü',
    pgPaused: 'Pausiert',
    pgHintStart: 'Einstellungen wählen und Start drücken. Leertaste/P = Pause, M = Ton.',
    pgBestOf: 'Best of',
    pgWin: '{p} gewinnt das Match!',
    pgCapture: '{p} erobert das Feld!',
    pgMute: 'Ton aus',
    pgUnmute: 'Ton an',
    pu_grow: 'Grow',
    pu_ghost: 'Ghost',
    pu_spin: 'Spin',
    pu_bones: 'Bones',
    pu_sticky: 'Sticky',
    pu_mines: 'Mine',
    memoryTitle: 'Memory',
    memoryIntro: 'Bonusrunde – dreh die Karten um und finde alle Paare.',
    memoryMoves: 'Züge',
    memoryBest: 'Bestwert',
    memoryWon: 'Gelöst in {n} Zügen!',
    memoryRestart: 'Neues Spiel',
    // Minispiele (Tic-Tac-Toe + Vier gewinnt)
    tttTitle: 'Tic-Tac-Toe',
    tttIntro: 'Drei in einer Reihe gewinnt — gegen Freunde oder die CPU.',
    c4Title: 'Vier gewinnt',
    c4Intro: 'Lass deine Steine fallen — vier in einer Reihe gewinnen die Runde.',
    c4P1: 'Orange',
    c4P2: 'Blau',
    modeVsCpu: 'gegen CPU',
    modeTwoPlayers: '2 Spieler',
    miniNewGame: 'Neues Spiel',
    scoreDraws: 'Unentschieden',
    miniTurn: '{p} ist dran',
    miniWin: '{p} gewinnt!',
    miniDraw: 'Unentschieden!',
    miniCpu: 'CPU',

    // --- Mods ---
    modsTitle: 'Mods',
    modsIntro: 'Alles, was ich veröffentlicht habe, und was als Nächstes kommt.',
    modsRestoreCard: 'Inventar-Backups & Wiederherstellung für Fabric.',
    modsSoonTitle: 'Bald mehr',
    modsSoon: 'Neue Mods erscheinen hier. Eine Idee? Schreib sie in die Kommentare.',
    modsView: 'Ansehen',

    // --- Admin / Dashboard ---
    navDashboard: 'Dashboard',
    adminTitle: 'Dashboard',
    adminLoginAria: 'Admin-Login',
    adminLoginLead: 'Melde dich an, um Kommentare zu verwalten und Statistiken zu sehen.',
    adminEmail: 'E-Mail',
    adminPassword: 'Passwort',
    adminSignIn: 'Anmelden',
    adminSigningIn: 'Anmeldung läuft…',
    adminLoginError: 'Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort.',
    adminNotAuthorized: 'Dieses Konto ist kein Admin.',
    adminRefresh: 'Aktualisieren',
    adminLogout: 'Abmelden',
    adminStatsTitle: 'Statistiken',
    adminGamesTitle: 'Spiele',
    adminCommentsTitle: 'Kommentar-Moderation',
    adminLoading: 'Lädt…',
    adminLoadError: 'Daten konnten nicht geladen werden. (Ist die Datenbank eingerichtet?)',
    adminNoComments: 'Noch keine Kommentare.',
    statPageviews: 'Seitenaufrufe',
    statDownloads: 'Download-Klicks',
    statGameStarts: 'Spielstarts',
    statGameOpens: 'Spiel-Aufrufe',
    statComments: 'Kommentare gesamt',
    statVisible: 'Sichtbar',
    statHidden: 'Versteckt / gelöscht',
    breakdownDownloads: 'Downloads nach Ziel',
    breakdownSections: 'Aufrufe nach Bereich',
    breakdownGameOpens: 'Aufrufe nach Spiel',
    breakdownGameLaunches: 'Start-Klicks nach Spiel',
    status_visible: 'sichtbar',
    status_hidden: 'versteckt',
    status_deleted: 'gelöscht',
    adminReply: 'Antworten',
    adminReplyPh: 'Antwort schreiben…',
    adminReplySend: 'Senden',
    adminHide: 'Verstecken',
    adminShow: 'Anzeigen',
    adminDelete: 'Löschen',
    adminDeleteConfirm: 'Diesen Kommentar (und seine Antworten) endgültig löschen?',
    // Mods-Verwaltung
    adminModsTitle: 'Mods verwalten',
    modFormModrinth: 'Modrinth-Slug',
    modFormGithub: 'GitHub-Repo (owner/repo)',
    modFormFetch: 'Daten holen',
    modFormName: 'Name',
    modFormSort: 'Sortierung',
    modFormSumEn: 'Kurzbeschreibung (EN)',
    modFormSumDe: 'Kurzbeschreibung (DE)',
    modFormSave: 'Mod speichern',
    modFetchOk: 'Daten geholt – prüfen und speichern.',
    modFetchError: 'Abruf fehlgeschlagen:',
    modFetchNoSource: 'Bitte zuerst Modrinth-Slug und/oder GitHub-Repo eingeben.',
    modSaved: 'Mod gespeichert!',
    modRefetch: 'Daten aktualisieren',
    modLayoutTitle: 'Karten-Layout',
    modLayout_standard: 'Layout: Standard',
    modLayout_downloads_top: 'Layout: Downloads ganz oben',
    modLayout_downloads_under_title: 'Layout: Downloads unter dem Titel',
    modLayout_buttons_top: 'Layout: Buttons oben',
    modLayout_custom: 'Layout: individuell (Editor)',
    // Mod-Editor-Seite
    editorOpen: 'Mod-Editor öffnen',
    editorTitle: 'Mod-Editor',
    editorBack: '← Dashboard',
    editorBackToList: '← Alle Mods',
    editorPickMod: 'Wähle eine Mod zum Bearbeiten',
    editorEdit: 'Bearbeiten',
    editorContent: 'Inhalt',
    editorLayout: 'Layout',
    editorModeGrid: 'Raster (Reihenfolge)',
    editorModeFree: 'Frei (ziehen)',
    editorGridHint: 'Ziehe die Blöcke (oder nutze ↑ ↓), um die Reihenfolge zu ändern. Sichtbarkeit und Ausrichtung pro Block.',
    editorFreeHint: 'Ziehe die Blöcke direkt auf der Vorschau-Karte. Die Breite stellst du unter der Vorschau ein.',
    editorCardHeight: 'Kartenhöhe (px)',
    editorPreview: 'Live-Vorschau',
    editorFreeDragHint: 'Blöcke direkt auf der Vorschau ziehen. Breite pro Block unten einstellen.',
    editorSave: 'Speichern',
    editorReset: 'Layout zurücksetzen',
    editorSaved: 'Gespeichert!',
    editorVisible: 'Auf der Seite sichtbar',
    editorIconUrl: 'Icon-URL',
    editorModrinthUrl: 'Modrinth-URL',
    editorGithubUrl: 'GitHub-URL',
    editorBlockVisible: 'Block anzeigen',
    block_head: 'Titel + Icon',
    block_summary: 'Beschreibung',
    block_stats: 'Downloads / Statistiken',
    block_actions: 'Buttons',
    align_left: 'Links',
    align_center: 'Zentriert',
    align_right: 'Rechts',
    modDeleteConfirm: 'Die Mod „{n}" von der Website löschen?',
    modListEmpty: 'Noch keine Mods – füge oben die erste hinzu.',
    modTableMissing: 'Mods konnten nicht geladen werden. (Wurde die mods-Tabelle angelegt?)',
    modDownloads: 'Downloads',

    // --- Footer ---
    footerMade: 'Erstellt von BastiLd · MIT-Lizenz',
    footerSource: 'Quellcode auf GitHub',
  },
};

let current = 'en';

export function getLanguage() {
  return current;
}

/** Translate a key for the current language, falling back to EN then the key. */
export function t(key) {
  const langTable = translations[current] || translations.en;
  if (key in langTable) return langTable[key];
  if (key in translations.en) return translations.en[key];
  return key;
}

/** Pick the initial language from localStorage, then the browser preference. */
export function detectLanguage() {
  let saved = null;
  try {
    saved = localStorage.getItem('lang');
  } catch {
    /* storage may be blocked */
  }
  if (saved && translations[saved]) return saved;
  return (navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en';
}

/** Update every translatable element inside `root` for the current language. */
export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.getAttribute('data-i18n-attr')
      .split(';')
      .forEach((pair) => {
        const [attr, key] = pair.split(':');
        if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
      });
  });
}

/** Set the active language, persist it, re-render and notify listeners. */
export function setLanguage(lang) {
  if (!translations[lang]) lang = 'en';
  current = lang;
  try {
    localStorage.setItem('lang', lang);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang;
  applyTranslations();
  document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
}
