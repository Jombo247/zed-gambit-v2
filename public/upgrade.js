
// === ZED GAMBIT - REAL PIECES - YOUR 12 LINKS ===

const REAL = {
  'wK': 'https://lichess1.org/assets/piece/cburnett/wK.svg',
  'wQ': 'https://lichess1.org/assets/piece/cburnett/wQ.svg',
  'wR': 'https://lichess1.org/assets/piece/cburnett/wR.svg',
  'wB': 'https://lichess1.org/assets/piece/cburnett/wB.svg',
  'wN': 'https://lichess1.org/assets/piece/cburnett/wN.svg',
  'wP': 'https://lichess1.org/assets/piece/cburnett/wP.svg',
  'bK': 'https://lichess1.org/assets/piece/cburnett/bK.svg',
  'bQ': 'https://lichess1.org/assets/piece/cburnett/bQ.svg',
  'bR': 'https://lichess1.org/assets/piece/cburnett/bR.svg',
  'bB': 'https://lichess1.org/assets/piece/cburnett/bB.svg',
  'bN': 'https://lichess1.org/assets/piece/cburnett/bN.svg',
  'bP': 'https://lichess1.org/assets/piece/cburnett/bP.svg',
};

// Toy -> Real mapping
const TOY = {
  '♔':'wK', '♕':'wQ', '♖':'wR', '♗':'wB', '♘':'wN', '♙':'wP',
  '♚':'bK', '♛':'bQ', '♜':'bR', '♝':'bB', '♞':'bN', '♟':'bP',
  'K':'wK', 'Q':'wQ', 'R':'wR', 'B':'wB', 'N':'wN', 'P':'wP',
  'k':'bK', 'q':'bQ', 'r':'bR', 'b':'bB', 'n':'bN', 'p':'bP',
};

function fixRealPieces(){
  document.querySelectorAll('div, span, td, button').forEach(el => {
    if(el.children.length > 0) return;
    const t = el.textContent.trim();
    const key = TOY[t];
    if(!key) return;

    // Don't re-replace if already an image
    if(el.dataset.zgReal) return;
    el.dataset.zgReal = 'yes';
    el.textContent = '';

    const img = document.createElement('img');
    img.src = REAL[key];
    img.alt = key;
    img.style.cssText = 'width:100%;height:100%;display:block;object-fit:contain;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.45));pointer-events:none;';
    el.style.cssText += 'display:flex;align-items:center;justify-content:center;padding:2px;';
    el.appendChild(img);
  });

  // If your board already uses <img> with toy / local pieces, swap src
  document.querySelectorAll('img').forEach(img => {
    const alt = img.alt || '';
    if(TOY[alt] && REAL[TOY[alt]] && img.src !== REAL[TOY[alt]]){
      img.src = REAL[TOY[alt]];
      img.style.width = '100%';
      img.style.height = '100%';
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
  c.innerHTML = `<button style="flex:1;padding:12px;background:#3b82f6;color:#fff;border:0;border-radius:8px;font-weight:700">🤝 Offer Draw</button><button style="flex:1;padding:12px;background:#ef4444;color:#fff;border:0;border-radius:8px;font-weight:700">🏳️ Resign</button><button style="flex:1;padding:12px;background:#1e293b;color:#fff;border:0;border-radius:8px;font-weight:700">📖 Rules</button>`;
  btn.after(c);
  c.children[0].onclick = ()=> alert('Draw offered');
  c.children[1].onclick = ()=> { if(confirm('Resign?')) location.reload(); };
  c.children[2].onclick = ()=> alert('Check / Checkmate / Stalemate / Castling / En Passant / Promotion / 50-move / Repetition all apply');
}

setInterval(()=>{ fixRealPieces(); addControls(); }, 500);


