// ============================================================
//  AURA SLOT MACHINE
//  Aggiungere dopo script.js nel HTML
//  Usa i Punti Aura per girare — gli upgrade sopravvivono all'Aura Prestige
// ============================================================

(function() {

  // ── PREMI POSSIBILI ───────────────────────────────────────
  // Ogni simbolo ha: emoji, nome, colore, e un effetto
  // rarity: common(50%) | rare(30%) | epic(15%) | legendary(5%)
  const SYMBOLS = [
    { id:'click2',   emoji:'👆', name:'Click x2',        color:'#4fc3f7', rarity:'common',    apply: () => { auraUpgrades.clickMult    *= 2;   } },
    { id:'bps2',     emoji:'🌿', name:'BPS x2',          color:'#81c784', rarity:'common',    apply: () => { auraUpgrades.bpsMult      *= 2;   } },
    { id:'btc2',     emoji:'₿',  name:'BTC x2',          color:'#f9a825', rarity:'common',    apply: () => { auraUpgrades.btcMult      *= 2;   } },
    { id:'token2',   emoji:'🔷', name:'Token/s x2',      color:'#90caf9', rarity:'common',    apply: () => { auraUpgrades.tokenMult    *= 2;   } },
    { id:'prestige2',emoji:'✨', name:'Prestigio x2',    color:'#ce93d8', rarity:'rare',      apply: () => { auraUpgrades.prestigeMult *= 2;   } },
    { id:'click5',   emoji:'⚡', name:'Click x5',        color:'#4fc3f7', rarity:'rare',      apply: () => { auraUpgrades.clickMult    *= 5;   } },
    { id:'bps5',     emoji:'🏭', name:'BPS x5',          color:'#81c784', rarity:'rare',      apply: () => { auraUpgrades.bpsMult      *= 5;   } },
    { id:'btc5',     emoji:'💎', name:'BTC x5',          color:'#f9a825', rarity:'rare',      apply: () => { auraUpgrades.btcMult      *= 5;   } },
    { id:'all3',     emoji:'🌟', name:'Tutto x3',        color:'#ff6600', rarity:'epic',      apply: () => { auraUpgrades.clickMult *= 3; auraUpgrades.bpsMult *= 3; auraUpgrades.btcMult *= 3; auraUpgrades.tokenMult *= 3; } },
    { id:'prestige5',emoji:'👑', name:'Prestigio x5',    color:'#ce93d8', rarity:'epic',      apply: () => { auraUpgrades.prestigeMult *= 5;   } },
    { id:'aurabonus',emoji:'🔮', name:'+5 Punti Aura',   color:'#f9a825', rarity:'epic',      apply: () => { auraUpgrades.auraPointBonus += 5; } },
    { id:'godmode',  emoji:'🌈', name:'GOD MODE (x10)',  color:'#ff2266', rarity:'legendary', apply: () => { auraUpgrades.clickMult *= 10; auraUpgrades.bpsMult *= 10; auraUpgrades.btcMult *= 10; auraUpgrades.tokenMult *= 10; auraUpgrades.prestigeMult *= 10; } },
    { id:'aurabonus2',emoji:'💫',name:'+15 Punti Aura',  color:'#f9a825', rarity:'legendary', apply: () => { auraUpgrades.auraPointBonus += 15; } },
  ];

  // Pesi per rarità
  const RARITY_WEIGHT = { common: 50, rare: 30, epic: 15, legendary: 5 };
  const RARITY_LABEL  = { common: 'Comune', rare: 'Raro', epic: 'Epico', legendary: '⭐ LEGGENDARIO' };
  const RARITY_COLOR  = { common: '#90caf9', rare: '#81c784', epic: '#ff6600', legendary: '#ff2266' };

  const SPIN_COST = 5; // punti aura per giro
  const REELS = 3;

  // ── CSS ───────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #aura-slot-section {
      margin-top: 24px;
      background: linear-gradient(145deg, #0d0020, #0a1500);
      border: 2px solid #f9a825;
      border-radius: 16px;
      padding: 20px 18px;
      width: 100%; box-sizing: border-box;
    }
    #aura-slot-title {
      color: #f9a825; font-size: 20px; font-weight: 900;
      letter-spacing: 2px; text-align: center; margin-bottom: 4px;
    }
    #aura-slot-subtitle {
      color: #888; font-size: 12px; text-align: center;
      margin-bottom: 16px; letter-spacing: 1px;
    }
    #aura-slot-machine {
      background: #050010;
      border: 2px solid #8a2be2;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 14px;
    }
    #aura-slot-reels {
      display: flex; gap: 8px; justify-content: center;
      margin-bottom: 14px;
    }
    .aura-reel {
      width: 80px; height: 80px;
      background: #111;
      border: 2px solid #333;
      border-radius: 10px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-size: 32px;
      overflow: hidden;
      position: relative;
      transition: border-color 0.3s;
    }
    .aura-reel.spinning {
      border-color: #f9a825;
      animation: reelSpin 0.1s linear infinite;
    }
    .aura-reel.result-common    { border-color: #90caf9; box-shadow: 0 0 12px rgba(144,202,249,0.5); }
    .aura-reel.result-rare      { border-color: #81c784; box-shadow: 0 0 12px rgba(129,199,132,0.5); }
    .aura-reel.result-epic      { border-color: #ff6600; box-shadow: 0 0 16px rgba(255,102,0,0.6); }
    .aura-reel.result-legendary { border-color: #ff2266; box-shadow: 0 0 24px rgba(255,34,102,0.8); animation: legendaryPulse 0.6s ease infinite alternate; }
    @keyframes reelSpin {
      0%  { transform: translateY(0); }
      25% { transform: translateY(-4px); }
      75% { transform: translateY(4px); }
      100%{ transform: translateY(0); }
    }
    @keyframes legendaryPulse {
      from { box-shadow: 0 0 20px rgba(255,34,102,0.6); }
      to   { box-shadow: 0 0 40px rgba(255,34,102,1), 0 0 80px rgba(255,34,102,0.4); }
    }
    .aura-reel-name {
      font-size: 9px; color: #666; margin-top: 2px;
      letter-spacing: 0.5px; text-align: center;
      padding: 0 2px;
    }
    #aura-slot-result {
      text-align: center; min-height: 50px;
      margin-bottom: 10px;
    }
    #aura-slot-result-title {
      font-size: 13px; font-weight: bold; margin-bottom: 4px;
    }
    #aura-slot-result-prizes {
      display: flex; flex-wrap: wrap; gap: 6px;
      justify-content: center;
    }
    .aura-prize-chip {
      padding: 4px 10px; border-radius: 20px;
      font-size: 12px; font-weight: bold;
      border: 1px solid;
    }
    #aura-slot-cost {
      text-align: center; color: #888; font-size: 12px;
      margin-bottom: 10px;
    }
    #btn-aura-spin {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, #8a2be2, #f9a825);
      color: white; border: none; border-radius: 10px;
      font-size: 16px; font-weight: 900; letter-spacing: 2px;
      cursor: pointer; transition: all 0.2s;
    }
    #btn-aura-spin:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(249,168,37,0.5);
    }
    #btn-aura-spin:disabled {
      background: #333; color: #666; cursor: not-allowed;
    }
    #aura-slot-upgrades {
      margin-top: 16px;
      background: rgba(0,0,0,0.4);
      border: 1px solid #333;
      border-radius: 10px;
      padding: 12px;
    }
    #aura-slot-upgrades-title {
      color: #f9a825; font-size: 13px; font-weight: bold;
      margin-bottom: 8px; letter-spacing: 1px;
    }
    .aura-upg-row {
      display: flex; justify-content: space-between;
      color: #aaa; font-size: 12px; margin: 4px 0;
    }
    .aura-upg-row span:last-child { color: #00e676; font-weight: bold; }
    #aura-slot-history {
      margin-top: 10px;
      display: flex; gap: 4px; flex-wrap: wrap;
      justify-content: center;
    }
    .aura-hist-chip {
      padding: 2px 7px; border-radius: 12px;
      font-size: 10px; font-weight: bold;
      border: 1px solid;
    }
  `;
  document.head.appendChild(style);

  // ── INIETTA LA SEZIONE NELLA PAGINA AURA ─────────────────
  function injectSlotUI() {
    const auraPage = document.getElementById('page-aura');
    if (!auraPage) return;

    const section = document.createElement('div');
    section.id = 'aura-slot-section';
    section.innerHTML = `
      <div id="aura-slot-title">🎰 AURA SLOT MACHINE</div>
      <div id="aura-slot-subtitle">Gioca con i tuoi Punti Aura — i premi non si resettano mai</div>

      <div id="aura-slot-machine">
        <div id="aura-slot-reels">
          <div class="aura-reel" id="aura-reel-0"><span id="aura-reel-emoji-0">🎰</span><div class="aura-reel-name" id="aura-reel-name-0">—</div></div>
          <div class="aura-reel" id="aura-reel-1"><span id="aura-reel-emoji-1">🎰</span><div class="aura-reel-name" id="aura-reel-name-1">—</div></div>
          <div class="aura-reel" id="aura-reel-2"><span id="aura-reel-emoji-2">🎰</span><div class="aura-reel-name" id="aura-reel-name-2">—</div></div>
        </div>
        <div id="aura-slot-result">
          <div id="aura-slot-result-title" style="color:#666;">Gira per scoprire il tuo premio!</div>
          <div id="aura-slot-result-prizes"></div>
        </div>
      </div>

      <div id="aura-slot-cost">Costo per giro: <strong style="color:#f9a825;">${SPIN_COST} Punti Aura</strong> | Hai: <strong style="color:#f9a825;" id="aura-pts-slot">0</strong></div>
      <button id="btn-aura-spin" onclick="auraSlotSpin()">🎰 GIRA (${SPIN_COST} Aura)</button>

      <div id="aura-slot-upgrades">
        <div id="aura-slot-upgrades-title">📦 UPGRADE AURA ATTIVI</div>
        <div class="aura-upg-row"><span>⚡ Click Mult.</span><span id="aura-upg-click">x1</span></div>
        <div class="aura-upg-row"><span>🌿 BPS Mult.</span><span id="aura-upg-bps">x1</span></div>
        <div class="aura-upg-row"><span>₿ BTC Mult.</span><span id="aura-upg-btc">x1</span></div>
        <div class="aura-upg-row"><span>🔷 Token/s Mult.</span><span id="aura-upg-token">x1</span></div>
        <div class="aura-upg-row"><span>✨ Prestigio Mult.</span><span id="aura-upg-prestige">x1</span></div>
        <div class="aura-upg-row"><span>🔮 Bonus Punti Aura</span><span id="aura-upg-aurabonus">+0</span></div>
      </div>

      <div id="aura-slot-history"></div>
    `;

    // Inserisci prima del bottone aura prestige
    const btn = document.getElementById('btn-aura-prestige');
    if (btn) auraPage.insertBefore(section, btn);
    else auraPage.appendChild(section);

    updateSlotUI();
  }

  // ── LOGICA SLOT ───────────────────────────────────────────
  let isSpinning = false;
  let spinHistory = [];

  function pickSymbol() {
    const pool = [];
    SYMBOLS.forEach(s => {
      const w = RARITY_WEIGHT[s.rarity];
      for (let i = 0; i < w; i++) pool.push(s);
    });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  window.auraSlotSpin = function() {
    if (isSpinning) return;
    if (typeof auraPoints === 'undefined' || auraPoints < SPIN_COST) return;

    isSpinning = true;
    auraPoints -= SPIN_COST;
    updateSlotUI();

    // Scegli i 3 premi finali subito
    const results = [pickSymbol(), pickSymbol(), pickSymbol()];

    // Anima i rulli
    const reelDelays = [800, 1200, 1600]; // ms prima che ogni rullo si fermi
    let spinIntervals = [];

    const allEmojis = SYMBOLS.map(s => s.emoji);

    for (let i = 0; i < REELS; i++) {
      const reel = document.getElementById(`aura-reel-${i}`);
      const emojiEl = document.getElementById(`aura-reel-emoji-${i}`);
      const nameEl  = document.getElementById(`aura-reel-name-${i}`);
      if (!reel || !emojiEl) continue;

      reel.className = 'aura-reel spinning';
      emojiEl.textContent = '🎰';
      nameEl.textContent = '...';

      // Cambia emoji casuale velocemente
      spinIntervals[i] = setInterval(() => {
        emojiEl.textContent = allEmojis[Math.floor(Math.random() * allEmojis.length)];
      }, 80);

      // Ferma al momento giusto
      setTimeout((() => {
        const idx = i;
        const sym = results[idx];
        return () => {
          clearInterval(spinIntervals[idx]);
          const r = document.getElementById(`aura-reel-${idx}`);
          const e = document.getElementById(`aura-reel-emoji-${idx}`);
          const n = document.getElementById(`aura-reel-name-${idx}`);
          if (r) r.className = `aura-reel result-${sym.rarity}`;
          if (e) e.textContent = sym.emoji;
          if (n) n.textContent = sym.name;
        };
      })(), reelDelays[i]);
    }

    // Dopo che tutti i rulli si sono fermati, applica premi
    setTimeout(() => {
      applyResults(results);
      isSpinning = false;
      updateSlotUI();
    }, reelDelays[REELS - 1] + 200);
  };

  function applyResults(results) {
    // Applica tutti e 3 i premi
    results.forEach(sym => sym.apply());

    // Salva nello storico
    spinHistory.unshift(results);
    if (spinHistory.length > 5) spinHistory.pop();

    // Mostra risultato
    const titleEl  = document.getElementById('aura-slot-result-title');
    const prizesEl = document.getElementById('aura-slot-result-prizes');

    // Determina rarità massima ottenuta
    const rarities = ['legendary', 'epic', 'rare', 'common'];
    let topRarity = 'common';
    results.forEach(s => {
      if (rarities.indexOf(s.rarity) < rarities.indexOf(topRarity)) topRarity = s.rarity;
    });

    titleEl.textContent = `${topRarity === 'legendary' ? '🌈 LEGGENDARIO!!!' : topRarity === 'epic' ? '🔥 EPICO!' : topRarity === 'rare' ? '✨ RARO!' : '✅ Risultato:'}`;
    titleEl.style.color = RARITY_COLOR[topRarity];

    prizesEl.innerHTML = results.map(s => `
      <span class="aura-prize-chip" style="color:${s.color};border-color:${s.color};background:${s.color}22;">
        ${s.emoji} ${s.name}
      </span>
    `).join('');

    // Aggiorna storico HTML
    updateHistory();

    // Salva
    if (typeof saveGame === 'function') saveGame();
    if (typeof updateDisplay === 'function') updateDisplay();
    if (typeof updateAuraDisplay === 'function') updateAuraDisplay();
  }

  function updateHistory() {
    const el = document.getElementById('aura-slot-history');
    if (!el || spinHistory.length === 0) return;
    el.innerHTML = spinHistory.map((spin, gi) =>
      spin.map(s => `<span class="aura-hist-chip" style="color:${s.color};border-color:${s.color};background:${s.color}18;">${s.emoji}</span>`).join('')
    ).join('<span style="color:#333;margin:0 4px;">|</span>');
  }

  function updateSlotUI() {
    // Punti aura
    const ptsEl = document.getElementById('aura-pts-slot');
    if (ptsEl) ptsEl.textContent = typeof auraPoints !== 'undefined' ? auraPoints : 0;

    // Bottone spin
    const btn = document.getElementById('btn-aura-spin');
    if (btn) {
      const canSpin = !isSpinning && typeof auraPoints !== 'undefined' && auraPoints >= SPIN_COST;
      btn.disabled = !canSpin;
      btn.textContent = isSpinning ? '⏳ Girando...' : `🎰 GIRA (${SPIN_COST} Aura)`;
    }

    // Upgrade attivi
    if (typeof auraUpgrades === 'undefined') return;
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set('aura-upg-click',    `x${auraUpgrades.clickMult}`);
    set('aura-upg-bps',      `x${auraUpgrades.bpsMult}`);
    set('aura-upg-btc',      `x${auraUpgrades.btcMult}`);
    set('aura-upg-token',    `x${auraUpgrades.tokenMult}`);
    set('aura-upg-prestige', `x${auraUpgrades.prestigeMult}`);
    set('aura-upg-aurabonus',`+${auraUpgrades.auraPointBonus}`);
  }

  // ── PATCH updateAuraDisplay per aggiornare anche la slot UI ─
  const _origUpdateAura = window.updateAuraDisplay;
  window.updateAuraDisplay = function() {
    if (_origUpdateAura) _origUpdateAura();
    updateSlotUI();
  };

  // Inietta UI dopo che il DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSlotUI);
  } else {
    injectSlotUI();
  }

  window.auraSlotUpdateUI = updateSlotUI;

})();
