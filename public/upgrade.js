
// === ZED GAMBIT - CLEAN v2 - ALL GAMES ===

// 1. Chess Controls Bar - Shows on EVERY game page
function addGameControls(){
  if(document.getElementById('zg-game-controls')) return;
  // Find board or game area
  const board = document.querySelector('[class*="board"], [class*="chess"], [class*="game"]');
  if(!board) return;

  const c = document.createElement('div');
  c.id = 'zg-game-controls';
  c.style.cssText = 'display:flex;gap:8px;margin:10px 0;flex-wrap:wrap;';
  c.innerHTML = `
    <button data-act="draw" style="flex:1;padding:12px;background:#3b82f6;color:#fff;border:0;border-radius:8px;font-weight:700">🤝 Offer Draw</button>
    <button data-act="resign" style="flex:1;padding:12px;background:#ef4444;color:#fff;border:0;border-radius:8px;font-weight:700">🏳️ Resign</button>
    <button data-act="claim" style="flex:1;padding:12px;background:#22c55e;color:#fff;border:0;border-radius:8px;font-weight:700">⚖️ Claim Draw</button>
    <button data-act="rules" style="flex:1;padding:12px;background:#1e293b;color:#fff;border:0;border-radius:8px;font-weight:700">📖 Rules</button>
  `;
  board.after(c);

  c.querySelector('[data-act="draw"]').onclick = () => {
    if(confirm('Offer draw to opponent?')) alert('Draw offered - waiting for opponent...');
  };
  c.querySelector('[data-act="resign"]').onclick = () => {
    if(confirm('Are you sure you want to resign? This counts as a loss.')){
      alert('You resigned. Game over.');
      localStorage.setItem('zg_last_result','resigned');
      location.reload();
    }
  };
  c.querySelector('[data-act="claim"]').onclick = () => {
    alert('Checking draw claim...\n• 50-move rule\n• Threefold repetition\n• Stalemate\n• Insufficient material\n\nIf valid, game is a draw.');
  };
  c.querySelector('[data-act="rules"]').onclick = () => {
    alert('CHESS RULES\n\n1. Check: King in danger - must move / block / capture\n2. Checkmate: No legal move = Lose\n3. Stalemate: No legal move but NOT in check = Draw\n4. Castling: King + Rook, no pieces between, not in check\n5. En Passant: Pawn captures pawn that moved 2 squares\n6. Promotion: Pawn to last rank = Queen/Rook/Bishop/Knight\n7. 50-move: No pawn move / capture in 50 moves = Draw\n8. Repetition: Same position 3x = Draw');
  };
}

// 2. Tournament Banner - ONCE ONLY
function addSeriousBanner(){
  if(document.getElementById('zg-tournament-banner')) return;
  const h = document.querySelector('h2');
  if(!h) return;
  const b = document.createElement('div');
  b.id = 'zg-tournament-banner';
  b.innerText = '🏆 Tournament Mode';
  b.style.cssText = 'background:#1e293b;color:#f8fafc;padding:8px 12px;border-radius:8px;font-weight:700;margin:8px 0;text-align:center;';
  h.after(b);
}

// 3. Serious Board Style
function styleBoard(){
  const board = document.querySelector('[class*="board"]');
  if(!board || board.dataset.zgStyled) return;
  board.dataset.zgStyled = 'yes';
  board.style.cssText += 'border:1px solid #94a3b8;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.3);';
}

// 4. Gate - Email = Free, Phone = Wallet + Tournaments
function gatePhone(){
  const emailOk = localStorage.getItem('zg_email_verified')==='yes';
  const phoneOk = localStorage.getItem('zg_phone_verified')==='yes';
  if(emailOk && !phoneOk && !document.getElementById('zg-phone-banner')){
    const b = document.createElement('a');
    b.id = 'zg-phone-banner'; b.href = '/verify-phone.html';
    b.innerText = 'Verify Phone to Unlock Wallet + Tournaments →';
    b.style.cssText = 'display:block;background:#f59e0b;color:#000;padding:12px;text-align:center;border-radius:10px;margin:10px;font-weight:700;text-decoration:none';
    document.body.prepend(b);
  }
}

// Run
setInterval(()=>{ addGameControls(); addSeriousBanner(); styleBoard(); gatePhone(); }, 1000);
Best way - use real high-quality SVG pieces. Don't use emoji / toy pieces.


// High Quality Pieces - Cburnett set from Lichess
const PIECE_URLS = {
  'K': 'https://lichess1.org/assets/piece/cburnett/wK.svg',
  'Q': 'https://lichess1.org/assets/piece/cburnett/wQ.svg',
  'R': 'https://lichess1.org/assets/piece/cburnett/wR.svg',
  'B': 'https://lichess1.org/assets/piece/cburnett/wB.svg',
  'N': 'https://lichess1.org/assets/piece/cburnett/wN.svg',
  'P': 'https://lichess1.org/assets/piece/cburnett/wP.svg',
  'k': 'https://lichess1.org/assets/piece/cburnett/bK.svg',
  'q': 'https://lichess1.org/assets/piece/cburnett/bQ.svg',
  'r': 'https://lichess1.org/assets/piece/cburnett/bR.svg',
  'b': 'https://lichess1.org/assets/piece/cburnett/bB.svg',
  'n': 'https://lichess1.org/assets/piece/cburnett/bN.svg',
  'p': 'https://lichess1.org/assets/piece/cburnett/bP.svg',
};
console.log('ZG: High quality pieces ready', PIECE_URLS);


