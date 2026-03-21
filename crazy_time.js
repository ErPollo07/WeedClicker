// ============================================================
//  CRAZY TIME - Sistema puntate per categoria
//  Punti su una o più categorie, vinci solo se esce quella
// ============================================================
(function() {

  // ── CATEGORIE ─────────────────────────────────────────────
  const CATS = [
    { key:'1',        label:'1x',          color:'#e63950', type:'num',      mult:1   },
    { key:'2',        label:'2x',          color:'#1565c0', type:'num',      mult:2   },
    { key:'5',        label:'5x',          color:'#2e7d32', type:'num',      mult:5   },
    { key:'10',       label:'10x',         color:'#f9a825', type:'num',      mult:10  },
    { key:'coinflip', label:'Coin Flip',   color:'#00acc1', type:'coinflip'           },
    { key:'cashhunt', label:'Cash Hunt',   color:'#7b1fa2', type:'cashhunt'           },
    { key:'pachinko', label:'Pachinko',    color:'#e65100', type:'pachinko'           },
    { key:'crazytime',label:'Crazy Time',  color:'#c62828', type:'crazytime'          },
  ];

  const WHEEL_DIST = [
    ...Array(22).fill('1'),
    ...Array(14).fill('2'),
    ...Array(7 ).fill('5'),
    ...Array(4 ).fill('10'),
    ...Array(4 ).fill('coinflip'),
    ...Array(3 ).fill('cashhunt'),
    ...Array(2 ).fill('pachinko'),
    ...Array(1 ).fill('crazytime'),
  ].sort(() => Math.random() - 0.5);

  const TOTAL = WHEEL_DIST.length;
  const DEG_PER_SEG = 360 / TOTAL;

  let ctBets = {};
  let ctSpinning = false;
  let ctWheelDeg = 0;
  let ctBonusActive = false;
  let ctCurrentBetAmount = 1000;

  function catByKey(k) { return CATS.find(c => c.key === k); }
  function totalBet()  { return Object.values(ctBets).reduce((a,b)=>a+b,0); }
  function fmt(v)      { return typeof formatNum==='function' ? formatNum(v) : Math.floor(v); }

  // ── CSS ───────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #ct-wrap{width:100%;display:flex;flex-direction:column;align-items:center;font-family:'Courier New',monospace;}
    #ct-title{font-size:24px;font-weight:900;letter-spacing:3px;background:linear-gradient(90deg,#f9a825,#e63950,#00acc1,#2e7d32);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px;}
    #ct-subtitle{color:#666;font-size:10px;letter-spacing:2px;margin-bottom:12px;}
    #ct-wheel-area{position:relative;width:260px;height:260px;margin-bottom:14px;}
    #ct-canvas{border-radius:50%;display:block;}
    #ct-pointer{position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:13px solid transparent;border-right:13px solid transparent;border-top:26px solid #fff;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9));z-index:10;}
    #ct-center-btn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:48px;height:48px;border-radius:50%;background:radial-gradient(circle,#fff 40%,#bbb);border:3px solid #999;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(0,0,0,0.7);z-index:10;font-weight:900;color:#111;transition:transform 0.1s;}
    #ct-center-btn:active{transform:translate(-50%,-50%) scale(0.92);}
    #ct-center-btn:disabled{cursor:not-allowed;opacity:0.4;}

    #ct-amount-area{width:100%;background:#111;border:1px solid #333;border-radius:10px;padding:10px 12px;box-sizing:border-box;margin-bottom:8px;}
    #ct-amount-label{color:#888;font-size:10px;letter-spacing:2px;margin-bottom:6px;}
    #ct-amount-row{display:flex;gap:5px;margin-bottom:6px;}
    .ct-amt-q{flex:1;background:#1a1a1a;border:1px solid #333;border-radius:6px;color:#aaa;font-size:10px;padding:6px 2px;cursor:pointer;text-align:center;}
    .ct-amt-q:hover{background:#333;color:#fff;}
    #ct-amount-input{width:100%;background:#000;border:1px solid #444;border-radius:7px;color:#f9a825;font-size:16px;font-weight:900;font-family:monospace;padding:8px 10px;outline:none;text-align:right;box-sizing:border-box;}
    #ct-amount-input:focus{border-color:#f9a825;}
    #ct-saldo{color:#666;font-size:11px;}

    #ct-bets-table{width:100%;margin-bottom:8px;border:1px solid #222;border-radius:10px;overflow:hidden;}
    .ct-brow{display:flex;align-items:center;padding:8px 10px;border-bottom:1px solid #181818;gap:8px;cursor:pointer;transition:background 0.1s;}
    .ct-brow:last-child{border-bottom:none;}
    .ct-brow:hover{background:#161616;}
    .ct-bdot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
    .ct-bname{flex:1;font-size:12px;color:#aaa;}
    .ct-bval{font-size:13px;font-weight:900;font-family:monospace;}
    .ct-bval.on{color:#f9a825;}.ct-bval.off{color:#333;}
    .ct-bclear{background:none;border:none;color:#444;cursor:pointer;font-size:13px;padding:0 4px;}
    .ct-bclear:hover{color:#e63946;}

    #ct-summary{display:flex;justify-content:space-between;align-items:center;background:#0a0a0a;border-radius:8px;padding:7px 12px;margin-bottom:8px;font-size:12px;}
    #ct-tot-label{color:#666;}
    #ct-tot-val{color:#f9a825;font-weight:900;font-family:monospace;font-size:14px;}

    #ct-spin-btn{width:100%;padding:13px;background:linear-gradient(135deg,#f9a825,#e63950);color:#fff;border:none;border-radius:11px;font-size:16px;font-weight:900;letter-spacing:2px;cursor:pointer;transition:all 0.2s;margin-bottom:7px;}
    #ct-spin-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 5px 18px rgba(249,168,37,0.5);}
    #ct-spin-btn:disabled{background:#222;color:#555;cursor:not-allowed;transform:none;}
    #ct-clear-btn{width:100%;padding:9px;background:#1a0505;color:#e63946;border:1px solid #e63946;border-radius:9px;font-size:12px;font-weight:bold;cursor:pointer;transition:all 0.2s;margin-bottom:10px;}
    #ct-clear-btn:hover{background:#2a0808;}

    #ct-result-banner{width:100%;text-align:center;min-height:36px;border-radius:9px;padding:9px 10px;box-sizing:border-box;margin-bottom:10px;font-size:13px;font-weight:bold;display:none;line-height:1.5;}
    #ct-result-banner.show{display:block;}
    #ct-result-banner.win  {background:rgba(0,230,118,0.12);color:#00e676;border:1px solid #00e676;}
    #ct-result-banner.lose {background:rgba(230,57,70,0.12); color:#e63946;border:1px solid #e63946;}
    #ct-result-banner.bonus{background:rgba(249,168,37,0.12);color:#f9a825;border:1px solid #f9a825;}
    #ct-result-banner.mixed{background:rgba(100,200,100,0.1);color:#aaffaa;border:1px solid #4caf50;}

    #ct-hint{color:#444;font-size:10px;text-align:center;line-height:1.6;}

    /* BONUS */
    #ct-bonus-overlay{position:fixed;inset:0;z-index:11000;background:rgba(0,0,0,0.95);display:none;flex-direction:column;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;}
    #ct-bonus-overlay.active{display:flex;}
    #ct-bonus-modal{background:#0a0a0a;border-radius:18px;padding:20px 16px;max-width:400px;width:100%;text-align:center;}
    .ct-btitle{font-size:20px;font-weight:900;letter-spacing:2px;margin-bottom:4px;}
    .ct-bsub{color:#666;font-size:11px;margin-bottom:14px;letter-spacing:1px;}

    #cf-coin{width:86px;height:86px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:40px;border:4px solid #555;}
    #cf-coin.red{background:radial-gradient(circle,#c62828,#7f0000);border-color:#e53935;}
    #cf-coin.blue{background:radial-gradient(circle,#1565c0,#0d47a1);border-color:#1e88e5;}
    #cf-coin.spin{animation:cfSpin 0.12s linear infinite;}
    @keyframes cfSpin{0%{transform:scaleX(1)}50%{transform:scaleX(0.05)}100%{transform:scaleX(1)}}
    #cf-res{font-size:13px;font-weight:bold;margin-top:10px;min-height:18px;}
    .cf-cbtns{display:flex;gap:10px;margin-bottom:10px;}
    .cf-btn{flex:1;padding:11px;border:none;border-radius:9px;font-size:14px;font-weight:900;cursor:pointer;}
    .cf-btn.red{background:#c62828;color:#fff;}.cf-btn.blue{background:#1565c0;color:#fff;}
    .cf-mults{display:flex;gap:7px;margin-bottom:12px;}
    .cf-mbox{flex:1;padding:7px;border-radius:7px;font-size:12px;font-weight:bold;}
    .cf-mbox.red{background:rgba(198,40,40,0.2);border:1px solid #c62828;color:#ef9a9a;}
    .cf-mbox.blue{background:rgba(21,101,192,0.2);border:1px solid #1565c0;color:#90caf9;}

    #ch-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:10px;}
    .ch-cell{aspect-ratio:1;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;transition:all 0.12s;}
    .ch-cell:hover:not(.revealed){background:#333;transform:scale(1.06);}
    .ch-cell.revealed{cursor:default;}
    .ch-cell.winner{background:rgba(0,230,118,0.25);border-color:#00e676;}
    .ch-cell.loser{background:rgba(230,57,70,0.12);border-color:#444;}
    #ch-res{font-size:13px;font-weight:bold;min-height:18px;}

    #pk-board{width:100%;background:#050510;border-radius:9px;padding:7px;box-sizing:border-box;margin-bottom:9px;}
    #pk-canvas{display:block;width:100%;}
    #pk-res{font-size:13px;font-weight:bold;min-height:18px;margin-bottom:7px;}
    #pk-btn{width:100%;padding:11px;background:linear-gradient(135deg,#e65100,#ff6600);color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:900;cursor:pointer;}
    #pk-btn:disabled{background:#222;color:#555;cursor:not-allowed;}

    #ctb-warea{position:relative;width:220px;height:220px;margin:0 auto 12px;}
    #ctb-canvas{border-radius:50%;display:block;}
    #ctb-ptr{position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:20px solid #ff2266;filter:drop-shadow(0 2px 8px #ff2266);}
    #ctb-btn{display:block;width:100%;padding:11px;background:linear-gradient(135deg,#c62828,#ff2266);color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:900;cursor:pointer;margin-bottom:8px;}
    #ctb-btn:disabled{background:#222;color:#555;cursor:not-allowed;}
    #ctb-res{font-size:13px;font-weight:bold;min-height:18px;}

    #ct-bclose{width:100%;padding:10px;background:#222;color:#888;border:1px solid #444;border-radius:9px;font-size:13px;font-weight:bold;cursor:pointer;margin-top:10px;display:none;}
    #ct-bclose:hover{background:#333;color:#fff;}
  `;
  document.head.appendChild(style);

  // ── BUILD PAGE ────────────────────────────────────────────
  function buildCasinoPage() {
    const page = document.getElementById('page-casino');
    if (!page) return;

    const rows = CATS.map(c=>`
      <div class="ct-brow" id="ct-brow-${c.key}" onclick="ctAddBet('${c.key}')">
        <div class="ct-bdot" style="background:${c.color}"></div>
        <span class="ct-bname">${c.label}</span>
        <span class="ct-bval off" id="ct-bval-${c.key}">0</span>
        <button class="ct-bclear" onclick="event.stopPropagation();ctClearCat('${c.key}')" title="Rimuovi">✕</button>
      </div>`).join('');

    page.innerHTML = `
      <div id="ct-wrap">
        <div id="ct-title">CRAZY TIME</div>
        <div id="ct-subtitle">PUNTA · GIRA · VINCI SOLO SE ESCE LA TUA CATEGORIA</div>

        <div id="ct-wheel-area">
          <div id="ct-pointer"></div>
          <canvas id="ct-canvas" width="260" height="260"></canvas>
          <button id="ct-center-btn" onclick="ctSpin()">▶</button>
        </div>

        <div id="ct-amount-area">
          <div id="ct-amount-label">IMPORTO PER CLICK</div>
          <div id="ct-amount-row">
            <button class="ct-amt-q" onclick="ctSetAmt(100)">100</button>
            <button class="ct-amt-q" onclick="ctSetAmt(500)">500</button>
            <button class="ct-amt-q" onclick="ctSetAmt(1000)">1K</button>
            <button class="ct-amt-q" onclick="ctSetAmt(5000)">5K</button>
            <button class="ct-amt-q" onclick="ctSetAmt(10000)">10K</button>
            <button class="ct-amt-q" onclick="ctSetAmt(50000)">50K</button>
          </div>
          <input id="ct-amount-input" type="number" min="1" value="1000" oninput="ctAmtChange()" placeholder="Importo personalizzato">
          <div id="ct-saldo">💰 <span id="ct-saldo-val">0</span> grammi disponibili</div>
        </div>

        <div id="ct-bets-table">${rows}</div>

        <div id="ct-summary">
          <span id="ct-tot-label">Puntata totale:</span>
          <span id="ct-tot-val">0 grammi</span>
        </div>

        <button id="ct-spin-btn" onclick="ctSpin()" disabled>🎡 GIRA!</button>
        <button id="ct-clear-btn" onclick="ctClearAll()">🗑 Cancella tutto</button>
        <div id="ct-result-banner"></div>
        <div id="ct-hint">Clicca una riga per aggiungere la puntata su quella categoria.<br>Vinci solo se la ruota si ferma su quella che hai scelto.</div>
      </div>`;

    if (!document.getElementById('ct-bonus-overlay')) {
      const ov = document.createElement('div');
      ov.id = 'ct-bonus-overlay';
      ov.innerHTML = '<div id="ct-bonus-modal"></div>';
      document.body.appendChild(ov);
    }

    drawWheel();
    setTimeout(ctRefreshUI, 80);
  }

  // ── PUNTATE ───────────────────────────────────────────────
  window.ctAddBet = function(key) {
    if (ctSpinning || ctBonusActive) return;
    const amt = ctCurrentBetAmount;
    if (amt < 1) return;
    if (totalBet() + amt > Math.floor(score)) return;
    ctBets[key] = (ctBets[key] || 0) + amt;
    ctRefreshUI();
  };
  window.ctClearCat = function(key) { delete ctBets[key]; ctRefreshUI(); };
  window.ctClearAll = function() { ctBets = {}; ctRefreshUI(); };
  window.ctSetAmt = function(v) {
    ctCurrentBetAmount = v;
    const inp = document.getElementById('ct-amount-input');
    if (inp) inp.value = v;
  };
  window.ctAmtChange = function() {
    const inp = document.getElementById('ct-amount-input');
    if (inp) ctCurrentBetAmount = Math.max(1, Math.floor(parseFloat(inp.value)||1));
  };

  function ctRefreshUI() {
    const sEl = document.getElementById('ct-saldo-val');
    if (sEl) sEl.textContent = fmt(Math.floor(score));

    CATS.forEach(c => {
      const el = document.getElementById(`ct-bval-${c.key}`);
      if (!el) return;
      const v = ctBets[c.key] || 0;
      el.textContent = v > 0 ? fmt(v) : '0';
      el.className = `ct-bval ${v > 0 ? 'on' : 'off'}`;
    });

    const tot = totalBet();
    const tv = document.getElementById('ct-tot-val');
    if (tv) tv.textContent = `${fmt(tot)} grammi`;

    const canSpin = tot > 0 && tot <= Math.floor(score) && !ctSpinning && !ctBonusActive;
    const sb = document.getElementById('ct-spin-btn');
    const cb = document.getElementById('ct-center-btn');
    if (sb) sb.disabled = !canSpin;
    if (cb) cb.disabled = !canSpin;
  }

  // ── RUOTA ─────────────────────────────────────────────────
  function drawWheel(rotDeg = 0) {
    const canvas = document.getElementById('ct-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), cx=130, cy=130, r=126;
    ctx.clearRect(0,0,260,260);
    WHEEL_DIST.forEach((key,i) => {
      const cat = catByKey(key);
      const sa = (i*DEG_PER_SEG+rotDeg-90)*Math.PI/180;
      const ea = ((i+1)*DEG_PER_SEG+rotDeg-90)*Math.PI/180;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,sa,ea); ctx.closePath();
      ctx.fillStyle = cat.color; ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1; ctx.stroke();
      if (ctBets[key]>0) {
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,sa,ea); ctx.closePath();
        ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fill();
      }
      ctx.save(); ctx.translate(cx,cy);
      ctx.rotate((sa+ea)/2+Math.PI/2); ctx.translate(0,-r*0.72); ctx.rotate(-Math.PI/2);
      ctx.fillStyle='#fff'; ctx.font='bold 8px monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      const lbl = key==='coinflip'?'CF':key==='cashhunt'?'CH':key==='pachinko'?'PK':key==='crazytime'?'CT':key+'x';
      ctx.fillText(lbl,0,0); ctx.restore();
    });
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.strokeStyle='#555'; ctx.lineWidth=4; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,24,0,Math.PI*2); ctx.fillStyle='#111'; ctx.fill();
    ctx.strokeStyle='#555'; ctx.lineWidth=2; ctx.stroke();
  }

  // ── SPIN ──────────────────────────────────────────────────
  window.ctSpin = function() {
    if (ctSpinning || ctBonusActive) return;
    const tot = totalBet();
    if (tot < 1 || tot > Math.floor(score)) return;
    score -= tot;
    ctSpinning = true;
    if (typeof updateDisplay==='function') updateDisplay();
    hideBanner();
    const sb=document.getElementById('ct-spin-btn'), cb=document.getElementById('ct-center-btn');
    if(sb) sb.disabled=true; if(cb) cb.disabled=true;

    const ri = Math.floor(Math.random()*TOTAL);
    const rkey = WHEEL_DIST[ri];
    const sc = ri*DEG_PER_SEG+DEG_PER_SEG/2;
    const totalRot = ctWheelDeg+360*8+((360-sc)-(ctWheelDeg%360)+360)%360;
    const from=ctWheelDeg, dur=5000, st=performance.now();
    function eo(t){return 1-Math.pow(1-t,4);}
    function anim(now){
      const t=Math.min((now-st)/dur,1);
      const cur=from+(totalRot-from)*eo(t);
      ctWheelDeg=cur; drawWheel(cur);
      if(t<1){requestAnimationFrame(anim);}
      else{
        ctWheelDeg=totalRot%360; drawWheel(ctWheelDeg);
        ctSpinning=false;
        handleResult(rkey);
      }
    }
    requestAnimationFrame(anim);
  };

  // ── RISULTATO ─────────────────────────────────────────────
  function handleResult(rkey) {
    const cat = catByKey(rkey);
    const betHere = ctBets[rkey] || 0;
    const otherLost = Object.entries(ctBets).filter(([k])=>k!==rkey).reduce((a,[,v])=>a+v,0);
    const snapshotBets = {...ctBets};
    ctBets = {};

    const sb=document.getElementById('ct-spin-btn'), cb=document.getElementById('ct-center-btn');

    if (betHere === 0) {
      // Non hai puntato su questo
      const lost = Object.entries(snapshotBets).map(([k,v])=>`${catByKey(k).label}: ${fmt(v)}`).join(', ');
      showBanner(`💥 Uscito ${cat.label}! Non avevi puntato su questa.\nPersi: ${lost}`, 'lose');
      if(typeof updateDisplay==='function') updateDisplay();
      if(typeof saveGame==='function') saveGame();
      ctRefreshUI();
    } else if (cat.type === 'num') {
      const win = Math.floor(betHere * cat.mult);
      score += win;
      if(typeof updateDisplay==='function') updateDisplay();
      if(typeof saveGame==='function') saveGame();
      if (otherLost > 0) {
        showBanner(`🎉 Uscito ${cat.label} ×${cat.mult}!\nVinto ${fmt(win)} grammi sulla tua. Persi ${fmt(otherLost)} sulle altre.`, 'mixed');
      } else {
        showBanner(`🎉 Uscito ${cat.label} ×${cat.mult}! Vinto ${fmt(win)} grammi!`, 'win');
      }
      ctRefreshUI();
    } else {
      // Bonus
      if(typeof updateDisplay==='function') updateDisplay();
      showBanner(`🎰 Uscito ${cat.label}! Bonus game in partenza...`, 'bonus');
      setTimeout(() => startBonus(rkey, betHere), 1200);
      ctRefreshUI();
    }
  }

  // ── BONUS ─────────────────────────────────────────────────
  function startBonus(type, bet) {
    ctBonusActive = true;
    const ov = document.getElementById('ct-bonus-overlay');
    const mo = document.getElementById('ct-bonus-modal');
    ov.classList.add('active');
    if(type==='coinflip')  showCF(mo, bet);
    if(type==='cashhunt')  showCH(mo, bet);
    if(type==='pachinko')  showPK(mo, bet);
    if(type==='crazytime') showCTB(mo, bet);
  }

  function closeBonus() {
    document.getElementById('ct-bonus-overlay').classList.remove('active');
    ctBonusActive = false;
    ctRefreshUI();
    if(typeof saveGame==='function') saveGame();
  }
  window.closeBonus = closeBonus;

  // COIN FLIP
  function showCF(mo, bet) {
    const rm=[2,3,5,7,10][Math.floor(Math.random()*5)], bm=[2,3,5,7,10][Math.floor(Math.random()*5)];
    mo.innerHTML=`
      <div class="ct-btitle" style="color:#00acc1">🪙 COIN FLIP</div>
      <div class="ct-bsub">POSTA: ${fmt(bet)} GRAMMI</div>
      <div class="cf-mults">
        <div class="cf-mbox red">🔴 ROSSO<br><strong>×${rm}</strong></div>
        <div class="cf-mbox blue">🔵 BLU<br><strong>×${bm}</strong></div>
      </div>
      <div id="cf-coin" class="red">🔴</div>
      <div class="cf-cbtns">
        <button class="cf-btn red" onclick="cfPick('red',${bet},${rm},${bm})">🔴 ×${rm}</button>
        <button class="cf-btn blue" onclick="cfPick('blue',${bet},${rm},${bm})">🔵 ×${bm}</button>
      </div>
      <div id="cf-res"></div>
      <button id="ct-bclose" onclick="closeBonus()">Continua</button>`;
  }
  window.cfPick = function(pick, bet, rm, bm) {
    document.querySelectorAll('.cf-btn').forEach(b=>b.disabled=true);
    const coin=document.getElementById('cf-coin');
    coin.classList.add('spin');
    setTimeout(()=>{
      const out=Math.random()<0.5?'red':'blue';
      coin.classList.remove('spin'); coin.className=`cf-coin ${out}`;
      coin.textContent=out==='red'?'🔴':'🔵';
      const mult=out==='red'?rm:bm, res=document.getElementById('cf-res');
      if(pick===out){
        const win=Math.floor(bet*mult); score+=win;
        res.style.color='#00e676'; res.textContent=`✅ ${out==='red'?'ROSSO':'BLU'}! ×${mult} = ${fmt(win)} grammi!`;
      } else {
        res.style.color='#e63946'; res.textContent=`❌ Era ${out==='red'?'ROSSO':'BLU'}! Perso.`;
      }
      if(typeof updateDisplay==='function') updateDisplay();
      document.getElementById('ct-bclose').style.display='block';
    },1800);
  };

  // CASH HUNT
  function showCH(mo, bet) {
    const M=[2,3,5,7,10,15,20,25,50], IC=['💰','🌿','💎','⭐','🔥','🏆','💫','🎯','🌟'];
    const pr=Array.from({length:49},()=>{const i=Math.floor(Math.random()*M.length);return{m:M[i],ic:IC[i]};});
    let done=false;
    mo.innerHTML=`
      <div class="ct-btitle" style="color:#7b1fa2">🎯 CASH HUNT</div>
      <div class="ct-bsub">POSTA: ${fmt(bet)} GRAMMI — SCEGLI UNA CELLA</div>
      <div id="ch-grid"></div>
      <div id="ch-res"></div>
      <button id="ct-bclose" onclick="closeBonus()">Continua</button>`;
    const g=document.getElementById('ch-grid');
    pr.forEach((p,i)=>{
      const c=document.createElement('div'); c.className='ch-cell'; c.textContent='❓';
      c.onclick=()=>{
        if(done) return; done=true;
        document.querySelectorAll('.ch-cell').forEach((el,ci)=>{
          el.textContent=pr[ci].ic; el.classList.add('revealed',ci===i?'winner':'loser');
        });
        const win=Math.floor(bet*p.m); score+=win;
        const r=document.getElementById('ch-res');
        r.style.color='#00e676'; r.textContent=`🎯 ×${p.m}! Vinto ${fmt(win)} grammi!`;
        if(typeof updateDisplay==='function') updateDisplay();
        document.getElementById('ct-bclose').style.display='block';
      };
      g.appendChild(c);
    });
  }

  // PACHINKO
  function showPK(mo, bet) {
    const SL=[2,3,5,7,10,15,20,50];
    mo.innerHTML=`
      <div class="ct-btitle" style="color:#e65100">🎳 PACHINKO</div>
      <div class="ct-bsub">POSTA: ${fmt(bet)} GRAMMI</div>
      <div id="pk-board"><canvas id="pk-canvas" width="330" height="180"></canvas></div>
      <div id="pk-res"></div>
      <button id="pk-btn" onclick="pkLancia()">🎳 LANCIA!</button>
      <button id="ct-bclose" onclick="closeBonus()">Continua</button>`;
    drawPK(SL);
    window.pkLancia=function(){
      document.getElementById('pk-btn').disabled=true;
      animPK(SL,bet);
    };
  }
  function drawPK(sl){
    const cv=document.getElementById('pk-canvas'); if(!cv) return;
    const ctx=cv.getContext('2d'),W=330,H=180;
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#050510'; ctx.fillRect(0,0,W,H);
    for(let r=0;r<5;r++) for(let c=0;c<=(6-(r%2));c++){
      const x=(r%2===0)?c*(W/7)+W/14:c*(W/7), y=16+r*24;
      ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fillStyle='#555'; ctx.fill();
    }
    const cols=['#e63950','#1565c0','#2e7d32','#f9a825','#7b1fa2','#e65100','#00acc1','#c62828'];
    sl.forEach((s,i)=>{
      const x=i*(W/sl.length),w=W/sl.length-2;
      ctx.fillStyle=cols[i%cols.length]; ctx.fillRect(x+1,H-26,w,24);
      ctx.fillStyle='#fff'; ctx.font='bold 10px monospace'; ctx.textAlign='center';
      ctx.fillText(`×${s}`,x+w/2+1,H-9);
    });
  }
  function animPK(sl,bet){
    const cv=document.getElementById('pk-canvas'); if(!cv) return;
    const ctx=cv.getContext('2d'),W=330,H=180;
    const res=sl[Math.floor(Math.random()*sl.length)];
    const rx=(sl.indexOf(res)+0.5)*(W/sl.length);
    let bx=W/2,by=10,vx=(rx-bx)/90;
    function step(){
      drawPK(sl); by+=1.8; bx+=vx+(Math.random()-0.5)*2.5;
      bx=Math.max(10,Math.min(W-10,bx));
      ctx.beginPath(); ctx.arc(bx,by,8,0,Math.PI*2);
      ctx.fillStyle='#ffeb3b'; ctx.fill(); ctx.strokeStyle='#f9a825'; ctx.lineWidth=2; ctx.stroke();
      if(by<H-26) requestAnimationFrame(step);
      else{
        const win=Math.floor(bet*res); score+=win;
        const r=document.getElementById('pk-res');
        if(r){r.style.color='#00e676';r.textContent=`🎳 ×${res}! Vinto ${fmt(win)} grammi!`;}
        if(typeof updateDisplay==='function') updateDisplay();
        document.getElementById('ct-bclose').style.display='block';
      }
    }
    step();
  }

  // CRAZY TIME BONUS
  function showCTB(mo, bet) {
    const SEG=[
      {l:'2x',c:'#e63950',m:2},{l:'5x',c:'#1565c0',m:5},{l:'10x',c:'#2e7d32',m:10},
      {l:'15x',c:'#f9a825',m:15},{l:'20x',c:'#7b1fa2',m:20},{l:'40x',c:'#00acc1',m:40},
      {l:'2x',c:'#e63950',m:2},{l:'50x',c:'#c62828',m:50},
      {l:'5x',c:'#1565c0',m:5},{l:'10x',c:'#2e7d32',m:10},
      {l:'2x',c:'#f9a825',m:2},{l:'25x',c:'#7b1fa2',m:25},
    ];
    mo.innerHTML=`
      <div class="ct-btitle" style="color:#ff2266">🌀 CRAZY TIME</div>
      <div class="ct-bsub">POSTA: ${fmt(bet)} GRAMMI — LA RUOTA FOLLE</div>
      <div id="ctb-warea"><div id="ctb-ptr"></div><canvas id="ctb-canvas" width="220" height="220"></canvas></div>
      <button id="ctb-btn" onclick="ctbLancia()">🌀 GIRA!</button>
      <div id="ctb-res"></div>
      <button id="ct-bclose" onclick="closeBonus()">Continua</button>`;
    let deg=0; drawCTB(SEG,0);
    window.ctbLancia=function(){
      document.getElementById('ctb-btn').disabled=true;
      const N=SEG.length,ri=Math.floor(Math.random()*N),s=SEG[ri];
      const sd=ri*(360/N)+(360/N)/2;
      const tot=deg+360*6+(360-sd-deg%360+360)%360;
      const fr=deg,st=performance.now(),dur=4000;
      function eo(t){return 1-Math.pow(1-t,4);}
      function a(now){
        const t=Math.min((now-st)/dur,1); deg=fr+(tot-fr)*eo(t); drawCTB(SEG,deg);
        if(t<1) requestAnimationFrame(a);
        else{
          const win=Math.floor(bet*s.m); score+=win;
          const r=document.getElementById('ctb-res');
          if(r){r.style.color='#ff2266';r.textContent=`🌀 ${s.l}! Vinto ${fmt(win)} grammi!`;}
          if(typeof updateDisplay==='function') updateDisplay();
          document.getElementById('ct-bclose').style.display='block';
        }
      }
      requestAnimationFrame(a);
    };
  }
  function drawCTB(segs,rot){
    const cv=document.getElementById('ctb-canvas'); if(!cv) return;
    const ctx=cv.getContext('2d'),cx=110,cy=110,r=106,N=segs.length,dp=360/N;
    ctx.clearRect(0,0,220,220);
    segs.forEach((s,i)=>{
      const sa=(i*dp+rot-90)*Math.PI/180, ea=((i+1)*dp+rot-90)*Math.PI/180;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,sa,ea);ctx.closePath();
      ctx.fillStyle=s.c;ctx.fill();ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1;ctx.stroke();
      ctx.save();ctx.translate(cx,cy);ctx.rotate((sa+ea)/2+Math.PI/2);
      ctx.translate(0,-r*0.7);ctx.rotate(-Math.PI/2);
      ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(s.l,0,0);ctx.restore();
    });
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='#555';ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,17,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();
  }

  // ── HELPERS ───────────────────────────────────────────────
  function showBanner(msg, type) {
    const el=document.getElementById('ct-result-banner'); if(!el) return;
    el.textContent=msg; el.className=`show ${type}`; el.style.display='block';
  }
  function hideBanner() {
    const el=document.getElementById('ct-result-banner'); if(el) el.style.display='none';
  }

  // Sync saldo ogni 500ms
  setInterval(()=>{
    const el=document.getElementById('ct-saldo-val');
    if(el) el.textContent=fmt(Math.floor(score));
    if(!ctSpinning&&!ctBonusActive) ctRefreshUI();
  },500);

  // ── INIT ──────────────────────────────────────────────────
  const _orig=window.switchPage;
  window.switchPage=function(name){
    _orig(name);
    if(name==='casino') setTimeout(()=>{
      if(!document.getElementById('ct-wrap')) buildCasinoPage();
      else ctRefreshUI();
    },50);
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',buildCasinoPage);
  else buildCasinoPage();

})();
