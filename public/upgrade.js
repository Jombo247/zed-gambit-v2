
// === ZED GAMBIT - HIGH QUALITY PIECES FIX ===

const PIECE_MAP = {
  // White - top in your screenshot
  'wK': 'https://lichess1.org/assets/piece/cburnett/wK.svg',
  'wQ': 'https://lichess1.org/assets/piece/cburnett/wQ.svg',
  'wR': 'https://lichess1.org/assets/piece/cburnett/wR.svg',
  'wB': 'https://lichess1.org/assets/piece/cburnett/wB.svg',
  'wN': 'https://lichess1.org/assets/piece/cburnett/wN.svg',
  'wP': 'https://lichess1.org/assets/piece/cburnett/wP.svg',
  // Black - bottom in your screenshot
  'bK': 'https://lichess1.org/assets/piece/cburnett/bK.svg',
  'bQ': 'https://lichess1.org/assets/piece/cburnett/bQ.svg',
  'bR': 'https://lichess1.org/assets/piece/cburnett/bR.svg',
  'bB': 'https://lichess1.org/assets/piece/cburnett/bB.svg',
  'bN': 'https://lichess1.org/assets/piece/cburnett/bN.svg',
  'bP': 'https://lichess1.org/assets/piece/cburnett/bP.svg',
};

function fixPieces(){
  // Find all piece images on board
  document.querySelectorAll('img').forEach(img => {
    const src = img.src || '';
    // If it's a chess piece image, force high quality + big size
    if(src.includes('/pieces/') || src.includes('piece') || img.alt?.length===2){
      // Try to detect piece from alt or data
      const key = img.alt || img.dataset.piece;
      if(PIECE_MAP[key]){
        img.src = PIECE_MAP[key];
      }
      // Make it BIG - fill 92% of square, not 50%
      img.style.width = '92%';
      img.style.height = '92%';
      img.style.objectFit = 'contain';
      img.style.filter = 'drop-shadow(0 2px 2px rgba(0,0,0,0.4))';
      img.style.display = 'block';
      img.style.margin = 'auto';
    }
  });

  // Also fix div-based pieces (if your board uses divs not img)
  document.querySelectorAll('[class*="piece"]').forEach(el => {
    el.style.backgroundSize = '92% 92%';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
  });
}

function addControls(){
  if(document.getElementById('zg-game-controls')) return;
  const btn = Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('New Game'));
  if(!btn) return;
  const c = document.createElement('div');
  c.id = 'zg-game-controls';
  c.style.cssText = 'display:flex;gap:8px;margin:12px 0;';
  c.innerHTML = `
    <button style="flex:1;padding:12px;background:#3b82f6;color:#fff;border:0;border-radius:8px;font-weight:700">🤝 Offer Draw</button>
    <button style="flex:1;padding:12px;background:#ef4444;color:#fff;border:0;border-radius:8px;font-weight:700">🏳️ Resign</button>
  `;
  btn.after(c);
  c.children[0].onclick = ()=> alert('Draw offered');
  c.children[1].onclick = ()=> { if(confirm('Resign?')) location.reload(); };
}

setInterval(()=>{ fixPieces(); addControls(); }, 500);


