// ---------------------------------------------------------------------------
// games.js — entry point for the Games section bonus games:
//   • Memory match   (pairs, move counter, persistent best score)
//   • Tic-Tac-Toe    (vs CPU or 2 players, persistent score)
//   • Connect Four   (vs CPU or 2 players, persistent score)
// Paddle Force lives on its own pages (game.html / game-classic.html).
// ---------------------------------------------------------------------------

import { t } from './i18n.js';

export function initGames() {
  initMemory();
  initTicTacToe();
  initConnectFour();
}

// ----------------------------------------------------------------- helpers
function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode etc. — scores just don't persist */
  }
}
/** Feeds the "game starts" stat in the admin dashboard (see analytics.js). */
function fireGameStart(game) {
  document.dispatchEvent(new CustomEvent('gamestart', { detail: { game } }));
}

// ===========================================================================
// Memory match
// ===========================================================================
function initMemory() {
  const root = document.querySelector('[data-memory]');
  if (!root) return;
  const grid = root.querySelector('[data-memory-grid]');
  const movesEl = root.querySelector('[data-memory-moves]');
  const bestEl = root.querySelector('[data-memory-best]');
  const restartBtn = root.querySelector('[data-memory-restart]');

  const SYMBOLS = ['⛏️', '💎', '🧟', '🐷', '🌳', '🔥', '⭐', '🏹'];
  const BEST_KEY = 'bb_memory_best';
  let moves = 0;
  let first = null;
  let lock = false;
  let matched = 0;
  let started = false;

  let status = root.querySelector('[data-memory-status]');
  if (!status) {
    status = document.createElement('p');
    status.className = 'muted';
    status.setAttribute('data-memory-status', '');
    status.setAttribute('role', 'status');
    root.appendChild(status);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function renderBest() {
    const best = loadJSON(BEST_KEY, null);
    if (bestEl) bestEl.textContent = best ? String(best) : '–';
  }

  function build() {
    moves = 0;
    matched = 0;
    first = null;
    lock = false;
    started = false;
    movesEl.textContent = '0';
    status.textContent = '';
    grid.innerHTML = '';
    renderBest();

    const deck = shuffle([...SYMBOLS, ...SYMBOLS]);
    deck.forEach((sym) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'mem-card';
      card.setAttribute('aria-label', 'Memory card');
      card.dataset.sym = sym;
      card.innerHTML =
        '<span class="mem-inner">' +
        '<span class="mem-face mem-front">?</span>' +
        `<span class="mem-face mem-back">${sym}</span>` +
        '</span>';
      card.addEventListener('click', () => flip(card));
      grid.appendChild(card);
    });
  }

  function flip(card) {
    if (lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (!started) {
      started = true;
      fireGameStart('memory');
    }
    card.classList.add('flipped');

    if (!first) {
      first = card;
      return;
    }
    moves++;
    movesEl.textContent = String(moves);

    if (first.dataset.sym === card.dataset.sym) {
      first.classList.add('matched');
      card.classList.add('matched');
      matched += 2;
      first = null;
      if (matched === SYMBOLS.length * 2) {
        const best = loadJSON(BEST_KEY, null);
        if (!best || moves < best) saveJSON(BEST_KEY, moves);
        renderBest();
        status.textContent = t('memoryWon').replace('{n}', String(moves));
      }
    } else {
      lock = true;
      const a = first;
      first = null;
      setTimeout(() => {
        a.classList.remove('flipped');
        card.classList.remove('flipped');
        lock = false;
      }, 750);
    }
  }

  restartBtn?.addEventListener('click', build);
  document.addEventListener('languagechange', () => {
    if (matched === SYMBOLS.length * 2) {
      status.textContent = t('memoryWon').replace('{n}', String(moves));
    }
  });
  build();
}

// ===========================================================================
// Tic-Tac-Toe — X is always the human in CPU mode; CPU plays O
// ===========================================================================
function initTicTacToe() {
  const root = document.querySelector('[data-ttt]');
  if (!root) return;
  const grid = root.querySelector('[data-ttt-grid]');
  const statusEl = root.querySelector('[data-ttt-status]');
  const scoreEls = {
    X: root.querySelector('[data-ttt-score-x]'),
    O: root.querySelector('[data-ttt-score-o]'),
    D: root.querySelector('[data-ttt-score-draw]'),
  };
  const modeBtns = root.querySelectorAll('[data-ttt-mode]');
  const restartBtn = root.querySelector('[data-ttt-restart]');

  const SCORE_KEY = 'bb_ttt_score';
  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  let board, turn, over, started, cpuTimer = 0;
  let mode = 'cpu';
  let score = loadJSON(SCORE_KEY, { X: 0, O: 0, D: 0 });
  const cells = [];

  grid.setAttribute('role', 'grid');
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'ttt-cell';
    cell.setAttribute('aria-label', `Field ${i + 1}`);
    cell.addEventListener('click', () => humanMove(i));
    grid.appendChild(cell);
    cells.push(cell);
  }

  function playerName(p) {
    return mode === 'cpu' && p === 'O' ? `O (${t('miniCpu')})` : p;
  }

  function renderScore() {
    scoreEls.X.textContent = String(score.X);
    scoreEls.O.textContent = String(score.O);
    scoreEls.D.textContent = String(score.D);
  }

  function renderStatus(result) {
    if (result === 'draw') statusEl.textContent = t('miniDraw');
    else if (result) statusEl.textContent = t('miniWin').replace('{p}', playerName(result));
    else statusEl.textContent = t('miniTurn').replace('{p}', playerName(turn));
  }

  function winnerOf(b) {
    for (const [a, m, z] of LINES) {
      if (b[a] && b[a] === b[m] && b[a] === b[z]) return { p: b[a], line: [a, m, z] };
    }
    return null;
  }

  function newRound() {
    clearTimeout(cpuTimer);
    board = Array(9).fill('');
    turn = 'X';
    over = false;
    started = false;
    cells.forEach((c) => {
      c.textContent = '';
      c.className = 'ttt-cell';
      c.disabled = false;
    });
    renderScore();
    renderStatus(null);
  }

  function place(i) {
    board[i] = turn;
    const cell = cells[i];
    cell.textContent = turn;
    cell.classList.add(turn === 'X' ? 'p1' : 'p2');

    const win = winnerOf(board);
    if (win) {
      over = true;
      win.line.forEach((j) => cells[j].classList.add('win'));
      score[win.p]++;
      saveJSON(SCORE_KEY, score);
      renderScore();
      renderStatus(win.p);
      return;
    }
    if (board.every(Boolean)) {
      over = true;
      score.D++;
      saveJSON(SCORE_KEY, score);
      renderScore();
      renderStatus('draw');
      return;
    }
    turn = turn === 'X' ? 'O' : 'X';
    renderStatus(null);
    if (mode === 'cpu' && turn === 'O') {
      cpuTimer = setTimeout(cpuMove, 380);
    }
  }

  function humanMove(i) {
    if (over || board[i]) return;
    if (mode === 'cpu' && turn === 'O') return; // CPU is thinking
    if (!started) {
      started = true;
      fireGameStart('tictactoe');
    }
    place(i);
  }

  // Minimax, but with a 20% chance of a random move so it stays beatable.
  function cpuMove() {
    if (over) return;
    const free = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    if (!free.length) return;
    let pick;
    if (Math.random() < 0.2) {
      pick = free[Math.floor(Math.random() * free.length)];
    } else {
      let bestVal = -Infinity;
      for (const i of free) {
        board[i] = 'O';
        const v = minimax(board, false, 0);
        board[i] = '';
        if (v > bestVal) {
          bestVal = v;
          pick = i;
        }
      }
    }
    place(pick);
  }

  function minimax(b, maximizing, depth) {
    const win = winnerOf(b);
    if (win) return win.p === 'O' ? 10 - depth : depth - 10;
    if (b.every(Boolean)) return 0;
    const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    let best = maximizing ? -Infinity : Infinity;
    for (const i of free) {
      b[i] = maximizing ? 'O' : 'X';
      const v = minimax(b, !maximizing, depth + 1);
      b[i] = '';
      best = maximizing ? Math.max(best, v) : Math.min(best, v);
    }
    return best;
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (mode === btn.dataset.tttMode) return;
      mode = btn.dataset.tttMode;
      modeBtns.forEach((b) => b.classList.toggle('active', b === btn));
      newRound();
    });
  });
  restartBtn?.addEventListener('click', newRound);
  document.addEventListener('languagechange', () => {
    const win = winnerOf(board);
    renderStatus(over ? (win ? win.p : 'draw') : null);
  });

  newRound();
}

// ===========================================================================
// Connect Four — board is cols×rows; player 1 = orange, player 2 = blue (CPU)
// ===========================================================================
function initConnectFour() {
  const root = document.querySelector('[data-c4]');
  if (!root) return;
  const boardEl = root.querySelector('[data-c4-board]');
  const statusEl = root.querySelector('[data-c4-status]');
  const scoreEls = {
    1: root.querySelector('[data-c4-score-p1]'),
    2: root.querySelector('[data-c4-score-p2]'),
    D: root.querySelector('[data-c4-score-draw]'),
  };
  const modeBtns = root.querySelectorAll('[data-c4-mode]');
  const restartBtn = root.querySelector('[data-c4-restart]');

  const COLS = 7;
  const ROWS = 6;
  const SCORE_KEY = 'bb_c4_score';

  let board, turn, over, started, cpuTimer = 0;
  let mode = 'cpu';
  let starter = 1;
  let score = loadJSON(SCORE_KEY, { 1: 0, 2: 0, D: 0 });
  const cells = []; // [col][row], row 0 = top

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'c4-cell';
      cell.setAttribute('aria-label', `Column ${c + 1}`);
      cell.addEventListener('click', () => humanMove(c));
      cell.addEventListener('mouseenter', () => highlightCol(c, true));
      cell.addEventListener('mouseleave', () => highlightCol(c, false));
      boardEl.appendChild(cell);
      (cells[c] = cells[c] || [])[r] = cell;
    }
  }

  function playerName(p) {
    const base = t(p === 1 ? 'c4P1' : 'c4P2');
    return mode === 'cpu' && p === 2 ? `${base} (${t('miniCpu')})` : base;
  }

  function renderScore() {
    scoreEls[1].textContent = String(score[1]);
    scoreEls[2].textContent = String(score[2]);
    scoreEls.D.textContent = String(score.D);
  }

  function renderStatus(result) {
    if (result === 'draw') statusEl.textContent = t('miniDraw');
    else if (result) statusEl.textContent = t('miniWin').replace('{p}', playerName(result));
    else statusEl.textContent = t('miniTurn').replace('{p}', playerName(turn));
  }

  function highlightCol(c, on) {
    if (over) on = false;
    cells[c].forEach((cell) => cell.classList.toggle('hover', on));
  }

  function newRound() {
    clearTimeout(cpuTimer);
    board = Array.from({ length: COLS }, () => Array(ROWS).fill(0));
    over = false;
    started = false;
    turn = starter;
    starter = starter === 1 ? 2 : 1; // alternate who begins next round
    for (const col of cells) {
      for (const cell of col) cell.className = 'c4-cell';
    }
    renderScore();
    renderStatus(null);
    if (mode === 'cpu' && turn === 2) cpuTimer = setTimeout(cpuMove, 420);
  }

  function dropRow(b, c) {
    for (let r = ROWS - 1; r >= 0; r--) if (!b[c][r]) return r;
    return -1;
  }

  function winningCells(b, p) {
    const dirs = [
      [1, 0], [0, 1], [1, 1], [1, -1],
    ];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (b[c][r] !== p) continue;
        for (const [dc, dr] of dirs) {
          const run = [[c, r]];
          let cc = c + dc, rr = r + dr;
          while (cc >= 0 && cc < COLS && rr >= 0 && rr < ROWS && b[cc][rr] === p) {
            run.push([cc, rr]);
            if (run.length === 4) return run;
            cc += dc;
            rr += dr;
          }
        }
      }
    }
    return null;
  }

  function place(c) {
    const r = dropRow(board, c);
    if (r < 0) return false;
    board[c][r] = turn;
    cells[c][r].classList.add(turn === 1 ? 'p1' : 'p2', 'drop');

    const win = winningCells(board, turn);
    if (win) {
      over = true;
      win.forEach(([wc, wr]) => cells[wc][wr].classList.add('win'));
      score[turn]++;
      saveJSON(SCORE_KEY, score);
      renderScore();
      renderStatus(turn);
      return true;
    }
    if (board.every((col) => col.every(Boolean))) {
      over = true;
      score.D++;
      saveJSON(SCORE_KEY, score);
      renderScore();
      renderStatus('draw');
      return true;
    }
    turn = turn === 1 ? 2 : 1;
    renderStatus(null);
    if (mode === 'cpu' && turn === 2) cpuTimer = setTimeout(cpuMove, 420);
    return true;
  }

  function humanMove(c) {
    if (over) return;
    if (mode === 'cpu' && turn === 2) return;
    if (dropRow(board, c) < 0) return;
    if (!started) {
      started = true;
      fireGameStart('connect4');
    }
    place(c);
  }

  // CPU: win if possible → block opponent's win → avoid gifting a win on top
  // of the own move → prefer central columns.
  function cpuMove() {
    if (over) return;
    const open = [];
    for (let c = 0; c < COLS; c++) if (dropRow(board, c) >= 0) open.push(c);
    if (!open.length) return;

    const tryMove = (c, p) => {
      const r = dropRow(board, c);
      board[c][r] = p;
      const won = !!winningCells(board, p);
      board[c][r] = 0;
      return won;
    };

    let pick = open.find((c) => tryMove(c, 2));
    if (pick === undefined) pick = open.find((c) => tryMove(c, 1));
    if (pick === undefined) {
      const order = [3, 2, 4, 1, 5, 0, 6].filter((c) => open.includes(c));
      // skip columns where our disc lets the player win directly above it
      pick = order.find((c) => {
        const r = dropRow(board, c);
        board[c][r] = 2;
        let gift = false;
        if (r > 0) {
          board[c][r - 1] = 1;
          gift = !!winningCells(board, 1);
          board[c][r - 1] = 0;
        }
        board[c][r] = 0;
        return !gift;
      });
      if (pick === undefined) pick = order[0];
    }
    place(pick);
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (mode === btn.dataset.c4Mode) return;
      mode = btn.dataset.c4Mode;
      modeBtns.forEach((b) => b.classList.toggle('active', b === btn));
      starter = 1;
      newRound();
    });
  });
  restartBtn?.addEventListener('click', newRound);
  document.addEventListener('languagechange', () => {
    if (!over) renderStatus(null);
    else {
      const win = winningCells(board, 1) || winningCells(board, 2);
      renderStatus(win ? board[win[0][0]][win[0][1]] : 'draw');
    }
  });

  newRound();
}
