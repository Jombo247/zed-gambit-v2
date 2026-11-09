
// === ZED GAMBIT - CLEAN UPGRADE.JS ===

// 1. Tournament Banner - ONCE ONLY
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

// 2. Serious Board - No Toy Look
function styleBoard(){
  const board = document.querySelector('div[style*="chessboard"], [class*="board"]');
  if(!board || board.dataset.zgStyled) return;
  board.dataset.zgStyled = 'yes';
  board.style.cssText += 'border:1px solid #94a3b8;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.3);';
}

// 3. Chess Controls - Draw / Resign
function addChessControls(){
  if(document.getElementById('zg-chess-controls')) return;
  const board = document.querySelector('div[style*="chessboard"], [class*="board"]');
  if(!board) return;
  const c = document.createElement('div');
  c.id = 'zg-chess-controls';
  c.style.cssText = 'display:flex;gap:8px;margin:10px 0;';
  c.innerHTML = `
    <button style="flex:1;padding:10px;background:#3b82f6;color:#fff;border:0;border-radius:8px;font-weight:700">Offer Draw</button>
    <button style="flex:1;padding:10px;background:#ef4444;color:#fff;border:0;border-radius:8px;font-weight:700">Resign</button>
  `;
  board.after(c);
  c.children[0].onclick = () => alert('Draw offered');
  c.children[1].onclick = () => { if(confirm('Resign this game?')) alert('You resigned'); };
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
  if(phoneOk) return;
  document.querySelectorAll('button').forEach(btn=>{
    const t = btn.textContent.toLowerCase();
    if(t.includes('wallet') || t.includes('tournament') || t.includes('rated')){
      btn.onclick = () => {
        if(!emailOk){ alert('Please Register with Email first'); location.href='/register.html'; }
        else { alert('Verify Phone to use Wallet / Tournaments'); location.href='/verify-phone.html'; }
      };
    }
  });
}

// Run all
setInterval(()=>{ addSeriousBanner(); styleBoard(); addChessControls(); gatePhone(); }, 1000);


