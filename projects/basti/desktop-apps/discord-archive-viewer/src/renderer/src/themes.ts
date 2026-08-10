// Theme-Definitionen für den Discord Archive Viewer.

export interface Theme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  hashIcon: string;
  pinIcon: string;
  wallpaper: string;
  vars: Record<string, string>;
}

const D = (
  bg: { app: string; primary: string; secondary: string; tertiary: string; floating: string; msgHover: string; input: string; elev: string },
  border: string,
  text: { primary: string; secondary: string; muted: string; link: string },
  accent: { c: string; hover: string },
  status: { danger: string; warning: string; success: string },
  reply: string,
  shadow: string,
  radius = '8px',
): Record<string, string> => ({
  '--bg-app': bg.app,
  '--bg-primary': bg.primary,
  '--bg-secondary': bg.secondary,
  '--bg-tertiary': bg.tertiary,
  '--bg-floating': bg.floating,
  '--bg-message-hover': bg.msgHover,
  '--bg-input': bg.input,
  '--bg-elev': bg.elev,
  '--border': border,
  '--text-primary': text.primary,
  '--text-secondary': text.secondary,
  '--text-muted': text.muted,
  '--text-link': text.link,
  '--accent': accent.c,
  '--accent-hover': accent.hover,
  '--danger': status.danger,
  '--warning': status.warning,
  '--success': status.success,
  '--reply-bar': reply,
  '--shadow': shadow,
  '--radius': radius,
});

export const THEMES: Theme[] = [
  // 1
  { id: 'discord-dark', name: 'Discord Dark', emoji: '🌙', description: 'Das klassische Discord-Erlebnis in Dunkel.', hashIcon: '#', pinIcon: '★', wallpaper: 'transparent',
    vars: D({ app: '#1e1f22', primary: '#313338', secondary: '#2b2d31', tertiary: '#1e1f22', floating: '#111214', msgHover: '#2e3035', input: '#1e1f22', elev: '#232428' },
      '#1f2024', { primary: '#f2f3f5', secondary: '#b5bac1', muted: '#80848e', link: '#00a8fc' }, { c: '#5865f2', hover: '#4752c4' },
      { danger: '#f23f43', warning: '#f0b232', success: '#23a559' }, '#4e5058', '0 8px 24px rgba(0,0,0,0.45)') },
  // 2
  { id: 'discord-light', name: 'Discord Light', emoji: '☀️', description: 'Hell, freundlich, Augen schonen am Tag.', hashIcon: '#', pinIcon: '★', wallpaper: 'transparent',
    vars: D({ app: '#ffffff', primary: '#ffffff', secondary: '#f2f3f5', tertiary: '#e3e5e8', floating: '#ffffff', msgHover: '#f7f8fa', input: '#ebedef', elev: '#ffffff' },
      '#d4d7dc', { primary: '#060607', secondary: '#4e5058', muted: '#6d6f78', link: '#006ce7' }, { c: '#5865f2', hover: '#4752c4' },
      { danger: '#d83a3e', warning: '#d68a00', success: '#248045' }, '#c4c9cf', '0 6px 18px rgba(0,0,0,0.18)') },
  // 3
  { id: 'midnight', name: 'Midnight', emoji: '🌌', description: 'Tiefes Nachtblau mit violettem Akzent.', hashIcon: '#', pinIcon: '✦',
    wallpaper: 'radial-gradient(circle at 70% 0%, rgba(124,92,255,0.08), transparent 50%)',
    vars: D({ app: '#07080a', primary: '#0c0d10', secondary: '#0f1115', tertiary: '#07080a', floating: '#050608', msgHover: '#14171c', input: '#0c0d10', elev: '#14171c' },
      '#1a1d22', { primary: '#e5e9f0', secondary: '#a8b0bd', muted: '#6a7280', link: '#7ec8ff' }, { c: '#7c5cff', hover: '#6748e6' },
      { danger: '#ff5566', warning: '#ffb14e', success: '#43d17a' }, '#353a44', '0 10px 30px rgba(0,0,0,0.6)') },
  // 4
  { id: 'synthwave', name: 'Synthwave', emoji: '🌆', description: 'Retro-futuristische 80er Neon-Vibes.', hashIcon: '⫶', pinIcon: '✧',
    wallpaper: 'linear-gradient(180deg, rgba(255,32,180,0.08), rgba(0,200,255,0.06))',
    vars: D({ app: '#1a0b2e', primary: '#1f0d36', secondary: '#180828', tertiary: '#0d0419', floating: '#0a0314', msgHover: '#2a1147', input: '#180828', elev: '#241140' },
      '#3a1b58', { primary: '#fef3ff', secondary: '#ffb3ec', muted: '#a07fb6', link: '#00f0ff' }, { c: '#ff2bd6', hover: '#d622b2' },
      { danger: '#ff4060', warning: '#ffd23f', success: '#2bffaa' }, '#a335c8', '0 0 32px rgba(255,43,214,0.35)', '10px') },
  // 5
  { id: 'forest', name: 'Forest', emoji: '🌲', description: 'Naturtöne, beruhigend wie ein Waldspaziergang.', hashIcon: '#', pinIcon: '🍃',
    wallpaper: 'radial-gradient(circle at 0% 100%, rgba(76,175,80,0.06), transparent 60%)',
    vars: D({ app: '#0e1d12', primary: '#162b1c', secondary: '#13261a', tertiary: '#0a1610', floating: '#081109', msgHover: '#1c3624', input: '#102015', elev: '#1c3624' },
      '#214d2c', { primary: '#e8f5e9', secondary: '#a5d6a7', muted: '#739a78', link: '#9ccc65' }, { c: '#66bb6a', hover: '#4ca050' },
      { danger: '#ef5350', warning: '#ffa726', success: '#26a69a' }, '#3e6b46', '0 8px 24px rgba(0,40,0,0.5)') },
  // 6
  { id: 'ocean', name: 'Ocean', emoji: '🌊', description: 'Tiefe Ozeantöne, kühl und klar.', hashIcon: '~', pinIcon: '⚓',
    wallpaper: 'linear-gradient(180deg, rgba(0,150,200,0.05), rgba(0,80,140,0.08))',
    vars: D({ app: '#0a1a2a', primary: '#0f2236', secondary: '#0d1c2e', tertiary: '#08141f', floating: '#040b13', msgHover: '#143049', input: '#0a1a2a', elev: '#162d44' },
      '#1c3a55', { primary: '#e1f5fe', secondary: '#b3d7e8', muted: '#7396ad', link: '#4fc3f7' }, { c: '#0288d1', hover: '#0277bd' },
      { danger: '#ef5350', warning: '#ffa000', success: '#26a69a' }, '#3a5b78', '0 8px 24px rgba(0,30,60,0.55)') },
  // 7
  { id: 'sunset', name: 'Sunset', emoji: '🌅', description: 'Warmer Abendhimmel über dem Horizont.', hashIcon: '#', pinIcon: '🔆',
    wallpaper: 'linear-gradient(180deg, rgba(255,140,80,0.05), rgba(255,80,120,0.04))',
    vars: D({ app: '#1f1015', primary: '#2a1820', secondary: '#241318', tertiary: '#180a10', floating: '#100509', msgHover: '#3a1f28', input: '#1f1015', elev: '#321a23' },
      '#4a2230', { primary: '#ffeede', secondary: '#ffc59c', muted: '#bf8b75', link: '#ffab91' }, { c: '#ff7043', hover: '#e55a2b' },
      { danger: '#e53935', warning: '#ffca28', success: '#9ccc65' }, '#5e2e3c', '0 10px 30px rgba(80,20,40,0.6)') },
  // 8
  { id: 'cyberpunk', name: 'Cyberpunk', emoji: '🤖', description: 'Neonleuchten der dystopischen Zukunft.', hashIcon: '◊', pinIcon: '⚡',
    wallpaper: 'linear-gradient(135deg, rgba(255,235,59,0.04), rgba(0,255,255,0.04))',
    vars: D({ app: '#0a0a12', primary: '#11111d', secondary: '#0e0e18', tertiary: '#06060c', floating: '#020205', msgHover: '#1a1a2c', input: '#0a0a12', elev: '#161624' },
      '#2a2a44', { primary: '#fff8d6', secondary: '#ffe066', muted: '#9c9ec0', link: '#00fff0' }, { c: '#ffeb3b', hover: '#fdd835' },
      { danger: '#ff1744', warning: '#ff9100', success: '#00e676' }, '#5e5e8a', '0 0 28px rgba(255,235,59,0.18)', '4px') },
  // 9
  { id: 'sakura', name: 'Sakura', emoji: '🌸', description: 'Sanfte Kirschblüten-Atmosphäre.', hashIcon: '✿', pinIcon: '🌸',
    wallpaper: 'radial-gradient(circle at 80% 20%, rgba(255,180,200,0.18), transparent 60%)',
    vars: D({ app: '#fff0f5', primary: '#fff7fa', secondary: '#ffe9f1', tertiary: '#fcd9e6', floating: '#ffffff', msgHover: '#ffe0eb', input: '#ffeff5', elev: '#ffffff' },
      '#f0c4d8', { primary: '#3d1928', secondary: '#7a3f55', muted: '#a86d80', link: '#d81b60' }, { c: '#ec407a', hover: '#d81b60' },
      { danger: '#e53935', warning: '#ffa000', success: '#43a047' }, '#e8a8c0', '0 6px 24px rgba(220,90,150,0.18)', '12px') },
  // 10
  { id: 'volcano', name: 'Volcano', emoji: '🌋', description: 'Glühende Lava, dunkle Asche.', hashIcon: '✦', pinIcon: '🔥',
    wallpaper: 'radial-gradient(circle at 50% 100%, rgba(255,80,30,0.10), transparent 65%)',
    vars: D({ app: '#160a08', primary: '#22100c', secondary: '#1a0c0a', tertiary: '#0c0605', floating: '#070302', msgHover: '#311612', input: '#160a08', elev: '#2c1410' },
      '#4a1c14', { primary: '#fff0e6', secondary: '#ffb499', muted: '#bd8472', link: '#ff8a65' }, { c: '#ff5722', hover: '#e64a19' },
      { danger: '#ff1744', warning: '#ffc400', success: '#aed581' }, '#6e2418', '0 10px 30px rgba(120,25,10,0.55)') },
  // 11
  { id: 'arctic', name: 'Arctic', emoji: '❄️', description: 'Eisige Klarheit am Polarkreis.', hashIcon: '❅', pinIcon: '❄',
    wallpaper: 'linear-gradient(180deg, rgba(180,220,240,0.18), transparent 70%)',
    vars: D({ app: '#eaf4fb', primary: '#f5fbff', secondary: '#dbeaf3', tertiary: '#c4d8e5', floating: '#ffffff', msgHover: '#d1e3ed', input: '#e3eef6', elev: '#ffffff' },
      '#bcd1de', { primary: '#0a2440', secondary: '#385676', muted: '#6c89a0', link: '#0277bd' }, { c: '#03a9f4', hover: '#0288d1' },
      { danger: '#d32f2f', warning: '#f57c00', success: '#388e3c' }, '#a8c0d0', '0 6px 18px rgba(50,90,140,0.18)') },
  // 12
  { id: 'mocha', name: 'Mocha', emoji: '☕', description: 'Warmes Kaffeehaus, gemütlich und braun.', hashIcon: '#', pinIcon: '☕',
    wallpaper: 'radial-gradient(circle at 20% 0%, rgba(180,130,90,0.06), transparent 60%)',
    vars: D({ app: '#1f1611', primary: '#291d15', secondary: '#221811', tertiary: '#15100c', floating: '#0a0706', msgHover: '#3a281d', input: '#1f1611', elev: '#352419' },
      '#4d3624', { primary: '#f4e7d8', secondary: '#d4b896', muted: '#a08866', link: '#ffb74d' }, { c: '#a1683a', hover: '#84522c' },
      { danger: '#c62828', warning: '#f57c00', success: '#558b2f' }, '#5e4231', '0 10px 30px rgba(40,25,10,0.55)') },
  // 13
  { id: 'matrix', name: 'Matrix', emoji: '💚', description: 'Terminal-Grün auf Pechschwarz.', hashIcon: '$', pinIcon: '✓',
    wallpaper: 'linear-gradient(180deg, rgba(0,255,80,0.04), transparent 80%)',
    vars: D({ app: '#020602', primary: '#040a04', secondary: '#030803', tertiary: '#020502', floating: '#000200', msgHover: '#072007', input: '#040a04', elev: '#0a1a0a' },
      '#0f2d10', { primary: '#7cffaa', secondary: '#3fdc80', muted: '#1d9b50', link: '#88ffaa' }, { c: '#00e676', hover: '#00c853' },
      { danger: '#ff1744', warning: '#ffea00', success: '#00e676' }, '#1d6638', '0 0 24px rgba(0,255,128,0.20)', '4px') },
  // 14
  { id: 'pastel', name: 'Pastel Dream', emoji: '🦄', description: 'Sanfte Pastelltöne wie Cotton Candy.', hashIcon: '✦', pinIcon: '🌟',
    wallpaper: 'linear-gradient(135deg, rgba(255,200,230,0.20), rgba(180,220,255,0.14))',
    vars: D({ app: '#f3edff', primary: '#fbf6ff', secondary: '#efe5fb', tertiary: '#e2d3f5', floating: '#ffffff', msgHover: '#e7d8f8', input: '#f0e6fb', elev: '#ffffff' },
      '#d4c4e8', { primary: '#2c1d4a', secondary: '#5b4682', muted: '#8a76b3', link: '#7e57c2' }, { c: '#ba68c8', hover: '#9c46af' },
      { danger: '#ec407a', warning: '#ffa726', success: '#66bb6a' }, '#c1b0d8', '0 6px 24px rgba(140,90,180,0.20)', '14px') },
  // 15
  { id: 'amoled', name: 'Pure Black', emoji: '⚫', description: 'Reines OLED-Schwarz. Maximaler Kontrast.', hashIcon: '#', pinIcon: '★', wallpaper: 'transparent',
    vars: D({ app: '#000000', primary: '#000000', secondary: '#080808', tertiary: '#000000', floating: '#000000', msgHover: '#0e0e0e', input: '#000000', elev: '#101010' },
      '#1a1a1a', { primary: '#ffffff', secondary: '#cccccc', muted: '#888888', link: '#4fc3f7' }, { c: '#ffffff', hover: '#cccccc' },
      { danger: '#ff5252', warning: '#ffd740', success: '#69f0ae' }, '#2a2a2a', '0 4px 12px rgba(0,0,0,0.9)', '4px') },
  // 16
  { id: 'crimson', name: 'Crimson Gold', emoji: '🩸', description: 'Edles Tiefrot mit goldenem Glanz.', hashIcon: '⌘', pinIcon: '👑',
    wallpaper: 'radial-gradient(circle at 100% 0%, rgba(255,200,80,0.05), transparent 55%)',
    vars: D({ app: '#170707', primary: '#1f0a0a', secondary: '#180808', tertiary: '#0d0404', floating: '#080202', msgHover: '#2c1010', input: '#170707', elev: '#260e0e' },
      '#411717', { primary: '#fbeacb', secondary: '#e8c47a', muted: '#a47a4b', link: '#ffd54f' }, { c: '#c62828', hover: '#a01e1e' },
      { danger: '#ff1744', warning: '#ffd700', success: '#9ccc65' }, '#5e1f1f', '0 10px 30px rgba(80,10,10,0.65)') },
  // 17
  { id: 'nord', name: 'Nord', emoji: '🏔️', description: 'Skandinavisch klar, blau-grau, ruhig.', hashIcon: '#', pinIcon: '◆', wallpaper: 'transparent',
    vars: D({ app: '#2e3440', primary: '#3b4252', secondary: '#363d4a', tertiary: '#2e3440', floating: '#242933', msgHover: '#434c5e', input: '#2e3440', elev: '#434c5e' },
      '#4c566a', { primary: '#eceff4', secondary: '#d8dee9', muted: '#9499a3', link: '#88c0d0' }, { c: '#88c0d0', hover: '#5e81ac' },
      { danger: '#bf616a', warning: '#ebcb8b', success: '#a3be8c' }, '#4c566a', '0 6px 18px rgba(20,30,50,0.5)') },
  // 18
  { id: 'dracula', name: 'Dracula', emoji: '🧛', description: 'Klassisches Dracula-Theme der Code-Welt.', hashIcon: '#', pinIcon: '✦', wallpaper: 'transparent',
    vars: D({ app: '#282a36', primary: '#2e303f', secondary: '#21222c', tertiary: '#1d1e26', floating: '#181920', msgHover: '#383a4a', input: '#21222c', elev: '#3a3c4d' },
      '#3a3c4d', { primary: '#f8f8f2', secondary: '#bd93f9', muted: '#6272a4', link: '#8be9fd' }, { c: '#bd93f9', hover: '#9d77d8' },
      { danger: '#ff5555', warning: '#f1fa8c', success: '#50fa7b' }, '#44475a', '0 8px 22px rgba(0,0,0,0.55)') },
  // 19
  { id: 'monokai', name: 'Monokai', emoji: '🎨', description: 'Lebendige Editor-Farben, Pink und Cyan.', hashIcon: '#', pinIcon: '✦', wallpaper: 'transparent',
    vars: D({ app: '#272822', primary: '#2d2e26', secondary: '#23241e', tertiary: '#1c1d18', floating: '#171812', msgHover: '#3e3f33', input: '#23241e', elev: '#3e3f33' },
      '#49483e', { primary: '#f8f8f2', secondary: '#a6e22e', muted: '#75715e', link: '#66d9ef' }, { c: '#f92672', hover: '#cf1d59' },
      { danger: '#f92672', warning: '#fd971f', success: '#a6e22e' }, '#75715e', '0 8px 22px rgba(0,0,0,0.55)') },
  // 20
  { id: 'rose-pine', name: 'Rosé Pine', emoji: '🌹', description: 'Stilles Rosenholz, sanftes Lila.', hashIcon: '#', pinIcon: '❀', wallpaper: 'transparent',
    vars: D({ app: '#191724', primary: '#1f1d2e', secondary: '#191724', tertiary: '#16141f', floating: '#100e1a', msgHover: '#26233a', input: '#1f1d2e', elev: '#26233a' },
      '#26233a', { primary: '#e0def4', secondary: '#c4a7e7', muted: '#6e6a86', link: '#9ccfd8' }, { c: '#eb6f92', hover: '#c8587a' },
      { danger: '#eb6f92', warning: '#f6c177', success: '#9ccfd8' }, '#3e3a55', '0 8px 22px rgba(0,0,0,0.55)') },
  // 21
  { id: 'tokyo-night', name: 'Tokyo Night', emoji: '🗾', description: 'Neonschimmer der Tokyoter Nacht.', hashIcon: '#', pinIcon: '✦',
    wallpaper: 'linear-gradient(180deg, rgba(122,162,247,0.06), transparent 60%)',
    vars: D({ app: '#1a1b26', primary: '#1f2335', secondary: '#16161e', tertiary: '#13141c', floating: '#0d0e15', msgHover: '#2a2c3d', input: '#1a1b26', elev: '#292e42' },
      '#292e42', { primary: '#c0caf5', secondary: '#a9b1d6', muted: '#565f89', link: '#7dcfff' }, { c: '#7aa2f7', hover: '#5a82d8' },
      { danger: '#f7768e', warning: '#e0af68', success: '#9ece6a' }, '#414868', '0 8px 22px rgba(0,0,0,0.55)') },
  // 22
  { id: 'gruvbox', name: 'Gruvbox', emoji: '🍂', description: 'Erdig, warm, retro-terminal.', hashIcon: '#', pinIcon: '◆', wallpaper: 'transparent',
    vars: D({ app: '#282828', primary: '#32302f', secondary: '#282828', tertiary: '#1d2021', floating: '#181a1b', msgHover: '#3c3836', input: '#282828', elev: '#3c3836' },
      '#504945', { primary: '#fbf1c7', secondary: '#ebdbb2', muted: '#a89984', link: '#83a598' }, { c: '#fe8019', hover: '#d65d0e' },
      { danger: '#fb4934', warning: '#fabd2f', success: '#b8bb26' }, '#665c54', '0 8px 22px rgba(0,0,0,0.5)') },
  // 23
  { id: 'solarized-dark', name: 'Solarized Dark', emoji: '🌑', description: 'Klassisches Solarized in dunkel.', hashIcon: '#', pinIcon: '⚙', wallpaper: 'transparent',
    vars: D({ app: '#002b36', primary: '#073642', secondary: '#002b36', tertiary: '#001f27', floating: '#001318', msgHover: '#0d4250', input: '#073642', elev: '#0d4250' },
      '#0a4a5a', { primary: '#fdf6e3', secondary: '#93a1a1', muted: '#586e75', link: '#268bd2' }, { c: '#2aa198', hover: '#1e7d76' },
      { danger: '#dc322f', warning: '#b58900', success: '#859900' }, '#586e75', '0 8px 22px rgba(0,0,0,0.55)') },
  // 24
  { id: 'solarized-light', name: 'Solarized Light', emoji: '☼', description: 'Klassisches Solarized in hell.', hashIcon: '#', pinIcon: '⚙', wallpaper: 'transparent',
    vars: D({ app: '#fdf6e3', primary: '#ffffff', secondary: '#eee8d5', tertiary: '#e3dcc4', floating: '#ffffff', msgHover: '#e8e2c8', input: '#eee8d5', elev: '#ffffff' },
      '#cfc9b3', { primary: '#073642', secondary: '#586e75', muted: '#93a1a1', link: '#268bd2' }, { c: '#2aa198', hover: '#1e7d76' },
      { danger: '#dc322f', warning: '#b58900', success: '#859900' }, '#cfc9b3', '0 6px 18px rgba(80,80,40,0.18)') },
  // 25
  { id: 'aurora', name: 'Aurora', emoji: '🌠', description: 'Polarlicht über den Bergen.', hashIcon: '#', pinIcon: '✦',
    wallpaper: 'linear-gradient(135deg, rgba(80,250,180,0.06), rgba(120,80,255,0.05) 60%, rgba(40,80,160,0.04))',
    vars: D({ app: '#0a1428', primary: '#0e1c38', secondary: '#0a162d', tertiary: '#060f20', floating: '#03081a', msgHover: '#15294a', input: '#0a1428', elev: '#1a2e54' },
      '#1c3258', { primary: '#e0f7ff', secondary: '#a5d4ff', muted: '#5d7fa3', link: '#5cffd0' }, { c: '#5cffd0', hover: '#3ad4a8' },
      { danger: '#ff4f70', warning: '#ffc857', success: '#5cffd0' }, '#36507a', '0 10px 30px rgba(0,30,80,0.6)', '10px') },
  // 26
  { id: 'lavender', name: 'Lavender', emoji: '💜', description: 'Sanftes Lavendelfeld an einem Sommertag.', hashIcon: '#', pinIcon: '🪻',
    wallpaper: 'radial-gradient(circle at 30% 20%, rgba(180,150,240,0.12), transparent 60%)',
    vars: D({ app: '#1a1426', primary: '#251c38', secondary: '#1f1830', tertiary: '#15102a', floating: '#0c0820', msgHover: '#2e234a', input: '#1a1426', elev: '#322553' },
      '#3a2e5a', { primary: '#f1ebff', secondary: '#cdb8f7', muted: '#8a7aa8', link: '#bba6f0' }, { c: '#a78bfa', hover: '#8a6bdc' },
      { danger: '#ff7aa6', warning: '#ffce6b', success: '#7adfb8' }, '#4d3e75', '0 10px 30px rgba(50,30,100,0.5)', '10px') },
  // 27
  { id: 'inferno', name: 'Inferno', emoji: '🔥', description: 'Rot, Orange, Gelb — pure Energie.', hashIcon: '#', pinIcon: '🔥',
    wallpaper: 'radial-gradient(circle at 50% 100%, rgba(255,100,30,0.10), transparent 60%)',
    vars: D({ app: '#150202', primary: '#1f0606', secondary: '#180404', tertiary: '#0c0202', floating: '#060101', msgHover: '#2e0a0a', input: '#150202', elev: '#290909' },
      '#451111', { primary: '#fff5d6', secondary: '#ffae5e', muted: '#a87354', link: '#ffae5e' }, { c: '#ff4d1f', hover: '#e0380e' },
      { danger: '#ff1744', warning: '#ffc107', success: '#cddc39' }, '#612215', '0 12px 32px rgba(120,30,5,0.6)') },
  // 28
  { id: 'minty', name: 'Minty', emoji: '🌿', description: 'Frisches Mint mit weißem Hintergrund.', hashIcon: '#', pinIcon: '🍀',
    wallpaper: 'linear-gradient(180deg, rgba(100,220,180,0.10), transparent 70%)',
    vars: D({ app: '#f1fbf6', primary: '#ffffff', secondary: '#e6f6ed', tertiary: '#d2ebde', floating: '#ffffff', msgHover: '#daf0e3', input: '#e6f6ed', elev: '#ffffff' },
      '#b8d8c5', { primary: '#0d3322', secondary: '#286048', muted: '#6c9384', link: '#00897b' }, { c: '#26a69a', hover: '#00897b' },
      { danger: '#e53935', warning: '#fb8c00', success: '#43a047' }, '#a8cdb8', '0 6px 18px rgba(20,80,60,0.18)') },
  // 29
  { id: 'space', name: 'Deep Space', emoji: '🚀', description: 'Sterne, Planeten, schwarze Löcher.', hashIcon: '#', pinIcon: '🛰',
    wallpaper: 'radial-gradient(circle at 75% 30%, rgba(80,140,255,0.06), transparent 50%), radial-gradient(circle at 20% 80%, rgba(255,80,180,0.04), transparent 60%)',
    vars: D({ app: '#040414', primary: '#0a0a22', secondary: '#070718', tertiary: '#020210', floating: '#000008', msgHover: '#13133a', input: '#0a0a22', elev: '#181845' },
      '#1c1c50', { primary: '#dde6ff', secondary: '#a0b4ff', muted: '#5566aa', link: '#7c9eff' }, { c: '#5d6fff', hover: '#4555e0' },
      { danger: '#ff5577', warning: '#ffce40', success: '#3ff0a8' }, '#3a4080', '0 12px 36px rgba(0,0,80,0.7)', '10px') },
  // 30
  { id: 'cherry', name: 'Cherry Coke', emoji: '🍒', description: 'Knalliges Kirschrot auf dunkel.', hashIcon: '#', pinIcon: '🍒', wallpaper: 'transparent',
    vars: D({ app: '#1a0a10', primary: '#220d14', secondary: '#1c0a11', tertiary: '#10060a', floating: '#080304', msgHover: '#341520', input: '#1a0a10', elev: '#3a1828' },
      '#4c1f30', { primary: '#ffe5ec', secondary: '#ffadc4', muted: '#a96b81', link: '#ff80a6' }, { c: '#e91e63', hover: '#c4144d' },
      { danger: '#ff1744', warning: '#ffab00', success: '#a4d44c' }, '#5a2638', '0 10px 30px rgba(80,10,30,0.55)') },
  // 31
  { id: 'lemon', name: 'Lemon', emoji: '🍋', description: 'Gelbe Sommerstimmung.', hashIcon: '#', pinIcon: '🍋',
    wallpaper: 'linear-gradient(180deg, rgba(255,235,80,0.08), transparent 70%)',
    vars: D({ app: '#fffce0', primary: '#ffffff', secondary: '#fff7c2', tertiary: '#fceea8', floating: '#ffffff', msgHover: '#fff09a', input: '#fff7c2', elev: '#ffffff' },
      '#e0c66c', { primary: '#3d3705', secondary: '#766926', muted: '#a09356', link: '#f9a825' }, { c: '#fdd835', hover: '#fbc02d' },
      { danger: '#e53935', warning: '#fb8c00', success: '#43a047' }, '#d8b85a', '0 6px 18px rgba(160,140,30,0.18)') },
  // 32
  { id: 'high-contrast', name: 'High Contrast', emoji: '🎯', description: 'Maximale Lesbarkeit, kontrastreich.', hashIcon: '#', pinIcon: '★', wallpaper: 'transparent',
    vars: D({ app: '#000000', primary: '#0a0a0a', secondary: '#000000', tertiary: '#000000', floating: '#000000', msgHover: '#1a1a1a', input: '#000000', elev: '#1a1a1a' },
      '#ffffff', { primary: '#ffffff', secondary: '#ffff00', muted: '#cccccc', link: '#00ffff' }, { c: '#ffff00', hover: '#dddd00' },
      { danger: '#ff0000', warning: '#ff8800', success: '#00ff00' }, '#ffffff', '0 4px 12px rgba(0,0,0,0.9)', '2px') },
  // 33
  { id: 'paper', name: 'Paper', emoji: '📄', description: 'Klassisch wie ein Buch.', hashIcon: '#', pinIcon: '★', wallpaper: 'transparent',
    vars: D({ app: '#f5f0e1', primary: '#fbf8ee', secondary: '#ede5cd', tertiary: '#dccfa9', floating: '#fffaef', msgHover: '#e8dfc2', input: '#ede5cd', elev: '#fffaef' },
      '#c8b994', { primary: '#3d2e0e', secondary: '#5d4818', muted: '#8a7745', link: '#7d4f00' }, { c: '#a07614', hover: '#8a6411' },
      { danger: '#a01818', warning: '#a06414', success: '#3d6c14' }, '#b8a876', '0 4px 14px rgba(140,110,40,0.20)', '6px') },
  // 34
  { id: 'cobalt', name: 'Cobalt', emoji: '🟦', description: 'Tiefes Cobaltblau, klassisch IDE.', hashIcon: '#', pinIcon: '◆', wallpaper: 'transparent',
    vars: D({ app: '#002240', primary: '#002b51', secondary: '#002240', tertiary: '#001a30', floating: '#000d18', msgHover: '#003860', input: '#002240', elev: '#003860' },
      '#0a4070', { primary: '#ffffff', secondary: '#a8d0ff', muted: '#5e88b3', link: '#ffc600' }, { c: '#ff9d00', hover: '#e07d00' },
      { danger: '#ff628c', warning: '#ffc600', success: '#3ad900' }, '#1c5085', '0 8px 22px rgba(0,15,60,0.65)') },
  // 35
  { id: 'royal', name: 'Royal', emoji: '👑', description: 'Königliches Lila mit Goldakzent.', hashIcon: '#', pinIcon: '👑',
    wallpaper: 'radial-gradient(circle at 100% 0%, rgba(255,200,80,0.06), transparent 55%)',
    vars: D({ app: '#100726', primary: '#180a36', secondary: '#13082b', tertiary: '#0a0418', floating: '#06020e', msgHover: '#241248', input: '#100726', elev: '#2a1556' },
      '#3c1f70', { primary: '#f5e6ff', secondary: '#d6b5ff', muted: '#8e6dba', link: '#ffd700' }, { c: '#ffb300', hover: '#e69f00' },
      { danger: '#ff4060', warning: '#ffd700', success: '#9ccc65' }, '#4d2885', '0 12px 32px rgba(60,20,120,0.55)') },
];

// fix accidental typo in cobalt definition
// (cleanup section removed - cobalt entry is correct now)

export const THEME_BY_ID: Record<string, Theme> = Object.fromEntries(THEMES.map((t) => [t.id, t]));

export function applyTheme(themeId: string, accentOverride?: string) {
  const t = THEME_BY_ID[themeId] ?? THEME_BY_ID['discord-dark'];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t.vars)) root.style.setProperty(k, v);
  root.style.setProperty('--wallpaper', t.wallpaper);
  root.style.setProperty('--hash-icon', `'${t.hashIcon}'`);
  root.setAttribute('data-theme-id', t.id);
  if (accentOverride) {
    root.style.setProperty('--accent', accentOverride);
    root.style.setProperty('--accent-hover', shade(accentOverride, -0.18));
  }
}

function shade(hex: string, amt: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  const adj = (c: number) => {
    const n = Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt));
    return Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  };
  return `#${adj(r)}${adj(g)}${adj(b)}`;
}
