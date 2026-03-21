// ============================================================
//  EVENTO CAMPO MINATO - Allarme + Minesweeper opzionale
//  Aggiungere DOPO socrate_event.js nel HTML
// ============================================================

(function() {

  // ── INTERVALLO: 5-10 minuti ────────────────────────────────
  const MIN_INTERVAL = 5 * 60 * 1000;
  const MAX_INTERVAL = 10 * 60 * 1000;

  let mineEventActive = false;
  let mineEventTimer  = null;

  // ── COORDINATE GLOBALI CON SOCRATE ────────────────────────
  // Entrambi gli eventi leggono/scrivono window.__anyEventActive
  // così non si sovrappongono mai
  function isAnyEventActive() {
    return !!window.__anyEventActive;
  }
  function setEventActive(val) {
    window.__anyEventActive = val;
  }

  // ── CSS ────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    /* ===== ALLARME MINE ===== */
    #mine-alarm-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: #0a0a00;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: 'Courier New', monospace;
      animation: mineAlarmPulse 0.5s ease infinite alternate;
    }
    @keyframes mineAlarmPulse {
      from { background: #0a0a00; }
      to   { background: #1a0800; }
    }
    .mine-alarm-icon {
      font-size: clamp(80px, 20vw, 140px);
      animation: mineShake 0.3s infinite;
      line-height: 1;
    }
    @keyframes mineShake {
      0%  { transform: translate(0,0) rotate(0deg); }
      25% { transform: translate(-4px,2px) rotate(-3deg); }
      50% { transform: translate(4px,-2px) rotate(3deg); }
      75% { transform: translate(-2px,3px) rotate(-1deg); }
      100%{ transform: translate(2px,-3px) rotate(2deg); }
    }
    .mine-alarm-title {
      font-size: clamp(24px, 6vw, 48px);
      font-weight: 900;
      color: #ff6600;
      text-shadow: 0 0 30px #ff6600, 0 0 60px #ff660066;
      letter-spacing: 4px;
      margin-top: 16px;
    }
    .mine-alarm-sub {
      color: #ff4400; font-size: 16px;
      letter-spacing: 2px; margin-top: 8px;
      animation: mineAlarmPulse 0.4s infinite alternate;
    }
    .mine-alarm-counter {
      color: #ffaa00; font-size: 48px; font-weight: 900;
      font-family: monospace;
      text-shadow: 0 0 20px #ffaa00;
      margin-top: 20px;
    }

    /* ===== MODAL SCELTA ===== */
    #mine-choice-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.9);
      display: flex; align-items: center; justify-content: center;
      padding: 16px; box-sizing: border-box;
      animation: mineFadeIn 0.4s ease;
    }
    @keyframes mineFadeIn { from { opacity:0; } to { opacity:1; } }
    #mine-choice-modal {
      background: linear-gradient(145deg, #1a1000, #0d1a0d);
      border: 2px solid #ff6600;
      border-radius: 20px;
      padding: 28px 24px;
      max-width: 400px; width: 100%;
      box-shadow: 0 0 40px rgba(255,102,0,0.5), 0 0 80px rgba(255,102,0,0.2);
      text-align: center;
      animation: mineSlideUp 0.4s cubic-bezier(.17,.67,.1,1);
    }
    @keyframes mineSlideUp {
      from { transform: translateY(60px); opacity:0; }
      to   { transform: translateY(0); opacity:1; }
    }
    .mine-choice-icon { font-size: 70px; margin-bottom: 8px; }
    .mine-choice-title {
      color: #ff6600; font-size: 22px; font-weight: 900;
      letter-spacing: 2px; margin-bottom: 4px;
    }
    .mine-choice-sub {
      color: #ff4400; font-size: 12px; letter-spacing: 3px;
      margin-bottom: 16px; text-transform: uppercase;
    }
    .mine-choice-info {
      background: rgba(255,102,0,0.1);
      border: 1px solid rgba(255,102,0,0.4);
      border-radius: 12px; padding: 14px;
      color: #ffcc88; font-size: 14px;
      margin-bottom: 20px; line-height: 1.6;
    }
    .mine-choice-stake {
      color: #ffeb3b; font-size: 13px;
      background: rgba(255,235,59,0.08);
      border-radius: 8px; padding: 8px;
      margin-bottom: 18px;
    }
    .mine-choice-buttons { display: flex; gap: 12px; }
    .mine-btn-play {
      flex: 1; background: linear-gradient(135deg,#ff6600,#ff3300);
      color: white; border: none; border-radius: 10px;
      padding: 14px; font-size: 15px; font-weight: 900;
      cursor: pointer; transition: all 0.2s;
    }
    .mine-btn-play:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(255,102,0,0.5); }
    .mine-btn-skip {
      flex: 1; background: rgba(255,255,255,0.05);
      color: #888; border: 1px solid #444; border-radius: 10px;
      padding: 14px; font-size: 15px; font-weight: bold;
      cursor: pointer; transition: all 0.2s;
    }
    .mine-btn-skip:hover { background: rgba(255,255,255,0.1); color: #bbb; }

    /* ===== MODAL MINESWEEPER ===== */
    #mine-game-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.92);
      display: flex; align-items: center; justify-content: center;
      padding: 12px; box-sizing: border-box;
      animation: mineFadeIn 0.3s ease;
    }
    #mine-game-modal {
      background: linear-gradient(145deg, #111800, #0a1200);
      border: 2px solid #ff6600;
      border-radius: 20px;
      padding: 20px 18px;
      max-width: 420px; width: 100%;
      box-shadow: 0 0 40px rgba(255,102,0,0.4);
      text-align: center;
    }
    #mine-game-title {
      color: #ff6600; font-size: 18px; font-weight: 900;
      letter-spacing: 2px; margin-bottom: 4px;
    }
    #mine-game-info {
      color: #888; font-size: 12px; margin-bottom: 12px;
    }
    #mine-status-bar {
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(0,0,0,0.4); border-radius: 8px;
      padding: 8px 12px; margin-bottom: 12px; font-family: monospace;
    }
    .mine-stat { font-size: 13px; font-weight: bold; }
    .mine-stat.bombs { color: #ff4444; }
    .mine-stat.flags { color: #ffaa00; }
    .mine-stat.stake { color: #ffeb3b; font-size: 11px; }
    #mine-grid-wrap {
      display: inline-block;
      border: 2px solid #333;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 14px;
    }
    #mine-grid {
      display: grid;
      gap: 0;
    }
    .mine-cell {
      width: 34px; height: 34px;
      background: #2a3a1a;
      border: 1px solid #1a2a0a;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: bold;
      cursor: pointer;
      user-select: none;
      transition: background 0.1s;
      box-sizing: border-box;
    }
    .mine-cell:hover:not(.revealed):not(.flagged) {
      background: #3a5020;
    }
    .mine-cell.revealed {
      background: #1a2a0a;
      cursor: default;
    }
    .mine-cell.flagged { background: #2a2a00; cursor: pointer; }
    .mine-cell.mine-boom { background: #4a0000 !important; }
    .mine-cell.mine-safe-reveal { background: #0a3a0a; }
    .mine-n1 { color: #4fc3f7; }
    .mine-n2 { color: #81c784; }
    .mine-n3 { color: #ff8a65; }
    .mine-n4 { color: #ce93d8; }
    .mine-n5 { color: #ef9a9a; }
    .mine-n6 { color: #80deea; }
    .mine-n7 { color: #fff176; }
    .mine-n8 { color: #e0e0e0; }
    #mine-game-result {
      font-size: 16px; font-weight: bold; min-height: 22px;
      margin-bottom: 10px;
    }
    #mine-game-result.win  { color: #00e676; text-shadow: 0 0 10px #00e67688; }
    #mine-game-result.lose { color: #ff4444; text-shadow: 0 0 10px #ff444488; }
    #mine-close-btn {
      background: #ff6600; color: white;
      border: none; border-radius: 10px;
      padding: 12px 30px; font-size: 15px;
      font-weight: bold; cursor: pointer;
      display: none; transition: background 0.2s;
    }
    #mine-close-btn:hover { background: #e65500; }
    #mine-flag-mode-btn {
      background: rgba(255,170,0,0.15);
      border: 1px solid #ffaa00;
      color: #ffaa00; border-radius: 8px;
      padding: 8px 16px; font-size: 13px;
      font-weight: bold; cursor: pointer;
      margin-bottom: 10px; transition: all 0.2s;
    }
    #mine-flag-mode-btn.active {
      background: rgba(255,170,0,0.35);
      box-shadow: 0 0 10px rgba(255,170,0,0.4);
    }
    .mine-hint { color: #666; font-size: 11px; margin-bottom: 8px; }
  `;
  document.head.appendChild(style);

  // ── TRIGGER PRINCIPALE ────────────────────────────────────
  function triggerMineEvent() {
    if (isAnyEventActive()) {
      // Qualcuno (Socrate) è attivo, riprova tra 2 minuti
      mineEventTimer = setTimeout(triggerMineEvent, 2 * 60 * 1000);
      return;
    }
    setEventActive(true);
    mineEventActive = true;
    showAlarm();
  }

  // ── ALLARME (3 secondi) ───────────────────────────────────
  function showAlarm() {
    const overlay = document.createElement('div');
    overlay.id = 'mine-alarm-overlay';
    overlay.innerHTML = `
      <div class="mine-alarm-icon">💣</div>
      <div class="mine-alarm-title">CAMPO MINATO RILEVATO</div>
      <div class="mine-alarm-sub">⚠ ATTENZIONE — PERICOLO ⚠</div>
      <div class="mine-alarm-counter" id="mine-alarm-cd">3</div>
    `;
    document.body.appendChild(overlay);

    let cd = 3;
    const iv = setInterval(() => {
      cd--;
      const el = document.getElementById('mine-alarm-cd');
      if (el) el.textContent = cd;
      if (cd <= 0) {
        clearInterval(iv);
        overlay.remove();
        showChoice();
      }
    }, 1000);
  }

  // ── SCELTA: GIOCA O PASSA ─────────────────────────────────
  function showChoice() {
    const btcNow = typeof btcBalance !== 'undefined' ? btcBalance : 0;
    const win  = (btcNow * 0.5).toFixed(3);
    const lose = (btcNow * 0.5).toFixed(3);

    const overlay = document.createElement('div');
    overlay.id = 'mine-choice-overlay';
    overlay.innerHTML = `
      <div id="mine-choice-modal">
        <div class="mine-choice-icon">💣</div>
        <div class="mine-choice-title">CAMPO MINATO</div>
        <div class="mine-choice-sub">— Un'opportunità esplosiva —</div>
        <div class="mine-choice-info">
          Un campo minato è stato rilevato nelle tue transazioni.<br>
          Se riesci a <strong style="color:#ff6600">svuotarlo senza esplodere</strong>,<br>
          guadagni il 50% dei tuoi Bitcoin.<br>
          Se salti in aria… ne perdi il 50%.
        </div>
        <div class="mine-choice-stake">
          ✅ Vinci: <strong>+${win} ₿</strong> (+50%)<br>
          💥 Esplodi: <strong>-${lose} ₿</strong> (-50%)
        </div>
        <div class="mine-choice-buttons">
          <button class="mine-btn-play" onclick="mineStartGame()">💣 GIOCA</button>
          <button class="mine-btn-skip" onclick="mineSkip()">🚶 Passa</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  window.mineSkip = function() {
    const overlay = document.getElementById('mine-choice-overlay');
    if (overlay) overlay.remove();
    mineEventActive = false;
    setEventActive(false);
    scheduleNextMineEvent();
  };

  // ── MINESWEEPER GAME ──────────────────────────────────────
  const ROWS = 9, COLS = 9, MINES = 10;
  let mineGrid = [];
  let mineRevealed = [];
  let mineFlagged = [];
  let mineGameOver = false;
  let mineWon = false;
  let mineFlagMode = false;
  let mineFirstClick = true;

  window.mineStartGame = function() {
    const choiceOverlay = document.getElementById('mine-choice-overlay');
    if (choiceOverlay) choiceOverlay.remove();

    const btcNow = typeof btcBalance !== 'undefined' ? btcBalance : 0;
    const stakeAmount = (btcNow * 0.5).toFixed(3);

    // Init stato
    mineGrid     = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    mineRevealed = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    mineFlagged  = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    mineGameOver = false;
    mineWon      = false;
    mineFlagMode = false;
    mineFirstClick = true;

    const overlay = document.createElement('div');
    overlay.id = 'mine-game-overlay';
    overlay.innerHTML = `
      <div id="mine-game-modal">
        <div id="mine-game-title">💣 CAMPO MINATO</div>
        <div id="mine-game-info">Rivela tutte le celle sicure per vincere</div>
        <div id="mine-status-bar">
          <span class="mine-stat bombs">💣 ${MINES}</span>
          <span class="mine-stat stake">Posta: ${stakeAmount} ₿</span>
          <span class="mine-stat flags" id="mine-flag-count">🚩 0</span>
        </div>
        <button id="mine-flag-mode-btn" onclick="mineToggleFlagMode()">🚩 Modalità Bandiera: OFF</button>
        <p class="mine-hint">Click sinistro = rivela | Tieni premuto = bandiera (mobile)</p>
        <div id="mine-grid-wrap"><div id="mine-grid"></div></div>
        <div id="mine-game-result"></div>
        <button id="mine-close-btn" onclick="mineClose()">Continua il Giro</button>
      </div>
    `;
    document.body.appendChild(overlay);

    renderGrid();
  };

  function placeMines(safeR, safeC) {
    // Piazza le mine evitando la prima cella cliccata e i suoi vicini
    const forbidden = new Set();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = safeR + dr, nc = safeC + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          forbidden.add(nr * COLS + nc);
        }
      }
    }

    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      const key = r * COLS + c;
      if (mineGrid[r][c] !== -1 && !forbidden.has(key)) {
        mineGrid[r][c] = -1;
        placed++;
      }
    }
    // Calcola numeri
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (mineGrid[r][c] === -1) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r+dr, nc = c+dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && mineGrid[nr][nc] === -1) count++;
          }
        }
        mineGrid[r][c] = count;
      }
    }
  }

  function renderGrid() {
    const grid = document.getElementById('mine-grid');
    if (!grid) return;
    grid.style.gridTemplateColumns = `repeat(${COLS}, 34px)`;
    grid.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        if (mineRevealed[r][c]) {
          cell.classList.add('revealed');
          if (mineGrid[r][c] === -1) {
            cell.classList.add('mine-boom');
            cell.textContent = '💣';
          } else if (mineGrid[r][c] > 0) {
            cell.textContent = mineGrid[r][c];
            cell.classList.add(`mine-n${mineGrid[r][c]}`);
          }
        } else if (mineFlagged[r][c]) {
          cell.classList.add('flagged');
          cell.textContent = '🚩';
        } else {
          cell.textContent = '';
        }

        // Desktop: click sinistro = rivela, destro = bandiera
        cell.addEventListener('click', () => handleCellClick(r, c));
        cell.addEventListener('contextmenu', (e) => { e.preventDefault(); handleFlag(r, c); });

        // Mobile: pressione lunga = bandiera
        let pressTimer;
        cell.addEventListener('touchstart', (e) => {
          pressTimer = setTimeout(() => { e.preventDefault(); handleFlag(r, c); }, 500);
        }, { passive: false });
        cell.addEventListener('touchend', () => clearTimeout(pressTimer));
        cell.addEventListener('touchmove', () => clearTimeout(pressTimer));

        grid.appendChild(cell);
      }
    }
    updateFlagCount();
  }

  function handleCellClick(r, c) {
    if (mineGameOver) return;
    if (mineFlagged[r][c]) return;
    if (mineRevealed[r][c]) return;

    if (mineFlagMode) { handleFlag(r, c); return; }

    // Prima click: piazza mine sicure
    if (mineFirstClick) {
      mineFirstClick = false;
      placeMines(r, c);
    }

    if (mineGrid[r][c] === -1) {
      // BOOM
      mineRevealed[r][c] = true;
      mineGameOver = true;
      revealAllMines();
      renderGrid();
      endMineGame(false);
    } else {
      floodReveal(r, c);
      renderGrid();
      if (checkWin()) {
        mineGameOver = true;
        mineWon = true;
        endMineGame(true);
      }
    }
  }

  function handleFlag(r, c) {
    if (mineGameOver) return;
    if (mineRevealed[r][c]) return;
    mineFlagged[r][c] = !mineFlagged[r][c];
    renderGrid();
  }

  window.mineToggleFlagMode = function() {
    mineFlagMode = !mineFlagMode;
    const btn = document.getElementById('mine-flag-mode-btn');
    if (btn) {
      btn.textContent = `🚩 Modalità Bandiera: ${mineFlagMode ? 'ON' : 'OFF'}`;
      btn.classList.toggle('active', mineFlagMode);
    }
  };

  function floodReveal(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (mineRevealed[r][c] || mineFlagged[r][c]) return;
    if (mineGrid[r][c] === -1) return;
    mineRevealed[r][c] = true;
    if (mineGrid[r][c] === 0) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if (dr !== 0 || dc !== 0) floodReveal(r+dr, c+dc);
    }
  }

  function revealAllMines() {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (mineGrid[r][c] === -1) mineRevealed[r][c] = true;
  }

  function checkWin() {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (mineGrid[r][c] !== -1 && !mineRevealed[r][c]) return false;
    return true;
  }

  function updateFlagCount() {
    let flags = 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (mineFlagged[r][c]) flags++;
    const el = document.getElementById('mine-flag-count');
    if (el) el.textContent = `🚩 ${flags}`;
  }

  function endMineGame(won) {
    const btcNow = typeof btcBalance !== 'undefined' ? btcBalance : 0;
    const amount = parseFloat((btcNow * 0.5).toFixed(3));

    const resultEl = document.getElementById('mine-game-result');
    if (won) {
      if (typeof btcBalance !== 'undefined') btcBalance += amount;
      if (resultEl) {
        resultEl.textContent = `💰 Hai vinto! +${amount} ₿ (+50%)`;
        resultEl.className = 'win';
      }
    } else {
      if (typeof btcBalance !== 'undefined') btcBalance = Math.max(0, btcBalance - amount);
      if (resultEl) {
        resultEl.textContent = `💥 BOOM! -${amount} ₿ (-50%)`;
        resultEl.className = 'lose';
      }
    }

    if (typeof updateDisplay === 'function') updateDisplay();
    if (typeof updateBtcDisplay === 'function') updateBtcDisplay();

    const closeBtn = document.getElementById('mine-close-btn');
    if (closeBtn) closeBtn.style.display = 'inline-block';
  }

  window.mineClose = function() {
    const overlay = document.getElementById('mine-game-overlay');
    if (overlay) overlay.remove();
    mineEventActive = false;
    setEventActive(false);
    scheduleNextMineEvent();
  };

  // ── SCHEDULING ────────────────────────────────────────────
  function scheduleNextMineEvent() {
    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    mineEventTimer = setTimeout(triggerMineEvent, delay);
  }

  scheduleNextMineEvent();
  window.triggerMineEvent = triggerMineEvent;

})();

// ── PATCH SOCRATE: usa __anyEventActive ───────────────────
// Aspetta che socrate_event.js sia caricato e wrappa il suo flag
(function patchSocrateCoordination() {
  // Override di socraticEventActive tramite __anyEventActive
  // Socrate già setta socraticEventActive internamente;
  // qui intercettiamo triggerSocrateEvent per bloccarla se un altro evento è attivo
  const _origTrigger = window.triggerSocrateEvent;
  if (_origTrigger) {
    window.triggerSocrateEvent = function() {
      if (window.__anyEventActive) return; // mine event in corso
      window.__anyEventActive = true;
      _origTrigger();
    };
    // Quando Socrate chiude, libera anche __anyEventActive
    const _origClose = window.socrateClose;
    if (_origClose) {
      window.socrateClose = function() {
        window.__anyEventActive = false;
        _origClose();
      };
    }
  }
})();
