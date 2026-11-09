
// === ZED GAMBIT - REAL PIECES - FIX CSS BACKGROUND ===

const REAL = {
  wK: 'https://lichess1.org/assets/piece/cburnett/wK.svg',
  wQ: 'https://lichess1.org/assets/piece/cburnett/wQ.svg',
  wR: 'https://lichess1.org/assets/piece/cburnett/wR.svg',
  wB: 'https://lichess1.org/assets/piece/cburnett/wB.svg',
  wN: 'https://lichess1.org/assets/piece/cburnett/wN.svg',
  wP: 'https://lichess1.org/assets/piece/cburnett/wP.svg',
  bK: 'https://lichess1.org/assets/piece/cburnett/bK.svg',
  bQ: 'https://lichess1.org/assets/piece/cburnett/bQ.svg',
  bR: 'https://lichess1.org/assets/piece/cburnett/bR.svg',
  bB: 'https://lichess1.org/assets/piece/cburnett/bB.svg',
  bN: 'https://lichess1.org/assets/piece/cburnett/bN.svg',
  bP: 'https://lichess1.org/assets/piece/cburnett/bP.svg',
};

// 1. Force Cburnett via CSS - overrides your old toy set
function injectRealPieceCSS(){
  if(document.getElementById('zg-real-pieces-css')) return;
  const s = document.createElement('style');
  s.id = 'zg-real-pieces-css';
  s.innerHTML = `
    [class*="piece"], [class*="Piece"], [data-piece] {
      background-size: 95% 95% !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
    }
    /* If your code uses wK / bN class names */
    .wK, [data-piece="wK"] { background-image: url(${REAL.wK}) !important; }
    .wQ, [data-piece="wQ"] { background-image: url(${REAL.wQ}) !important; }
    .wR, [data-piece="wR"] { background-image: url(${REAL.wR}) !important; }
    .wB, [data-piece="wB"] { background-image: url(${REAL.wB}) !important; }
    .wN, [data-piece="wN"] { background-image: url(${REAL.wN}) !important; }
    .wP, [data-piece="wP"] { background-image: url(${REAL.wP}) !important; }
    .bK, [data-piece="bK"] { background-image: url(${REAL.bK}) !important; }
    .bQ, [data-piece="bQ"] { background-image: url(${REAL.bQ}) !important; }
    .bR, [data-piece="bR"] { background-image: url(${REAL.bR}) !important; }
    .bB, [data-piece="bB"] { background-image: url(${REAL.bB}) !important; }
    .bN, [data-piece="bN"] { background-image: url(${REAL.bN}) !important; }
    .bP, [data-piece="bP"] { background-image: url(${REAL.bP}) !important; }
    /* Kill the white outline / toy look */
    img { filter: drop-shadow(0 2px 2px rgba(0,0,0,0.45)) !important; }
  `;
  document.head.appendChild(s);
}

// 2. Also fix <img> and unicode pieces if they exist
function fixImages(){
  document.querySelectorAll('img').forEach(img => {
    if(img.src.includes('piece') || img.src.includes('pieces')){
      const key = img.alt || img.src.split('/').pop().replace('.svg','').replace('.png','');
      if(REAL[key]) img.src = REAL[key];
      img.style.width = '95%';
      img.style.height = '95%';
      img.style.objectFit = 'contain';
    }
  });
}

function addControls(){
  if(document.getElementById('zg-game-controls')) return;
  const btn = Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('New Game'));
  if(!btn) return;
  const c = document.createElement('div');
  c.id = 'zg-game-controls';
  c.style.cssText = 'display:flex;gap:8px;margin:12px 0;';
  c.innerHTML = `<button style="flex:1;padding:12px;background:#3b82f6;color:#fff;border:0;border-radius:8px;font-weight:700">🤝 Offer Draw</button><button style="flex:1;padding:12px;background:#ef4444;color:#fff;border:0;border-radius:8px;font-weight:700">🏳️ Resign</button>`;
  btn.after(c);
  c.children[0].onclick = ()=> alert('Draw offered');
  c.children[1].onclick = ()=> { if(confirm('Resign?')) location.reload(); };
}

setInterval(()=>{ injectRealPieceCSS(); fixImages(); addControls(); }, 500);


