
// Zed Gambit - Worker + Auth + Admin + Finance (Tax + Admin % from Stake)
import { DurableObject } from "cloudflare:workers";
function calcElo(rA, rB, score, gamesPlayed) {
  const K = gamesPlayed < 30 ? 32 : 20
  const expected = 1 / (1 + Math.pow(10, (rB - rA) / 400))
  return Math.round(rA + K * (score - expected))
}
function hashPass(p) { let h = 0; for (let i=0;i<p.length;i++){ h = ((h<<5)-h)+p.charCodeAt(i); h=h&h; } return 'h'+Math.abs(h).toString(36)+p.length; }
const TAX_RATE = 0.16; // Zambia VAT 16% on admin fee
const ADMIN_FEE = 0.10; // Admin takes 10% from stake won - CHANGE HERE
function seedTournaments() {
  return new Map([
    ['ARENA1', { id: 'ARENA1', name: '🔥 Open Arena - Blitz Rated', format: 'arena', timeControl: 'blitz', stake: 0, rated: true, max: 32, status: 'waiting', players: [], waiting: [], round: 1 }],
    ['RAPID1', { id: 'RAPID1', name: '⚡ Open Arena - Rapid Rated', format: 'arena', timeControl: 'rapid', stake: 0, rated: true, max: 32, status: 'waiting', players: [], waiting: [], round: 1 }],
    ['BULLET1', { id: 'BULLET1', name: '💎 Open Arena - Bullet Rated', format: 'arena', timeControl: 'bullet', stake: 0, rated: true, max: 32, status: 'waiting', players: [], waiting: [], round: 1 }],
    ['MEGA1', { id: 'MEGA1', name: '🌍 Mega Open Arena - Everyone Can Join', format: 'arena', timeControl: 'blitz', stake: 0, rated: true, max: 100, status: 'waiting', players: [], waiting: [], round: 1 }],
    ['STAKE1', { id: 'STAKE1', name: '💰 Stake Arena - K50 Stake (Admin 10%)', format: 'arena', timeControl: 'blitz', stake: 50, rated: true, max: 32, status: 'waiting', players: [], waiting: [], round: 1 }],
    ['STAKE2', { id: 'STAKE2', name: '💰 Stake Arena - K100 Stake (Admin 10%)', format: 'arena', timeControl: 'blitz', stake: 100, rated: true, max: 32, status: 'waiting', players: [], waiting: [], round: 1 }],
  ])
}

export class ChessRoom extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.ctx = ctx; this.env = env; this.sockets = new Set(); this.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; this.players = []; }
  async fetch(request) {
    const pair = new WebSocketPair(); const [client, server] = Object.values(pair);
    server.accept(); this.sockets.add(server);
    const url = new URL(request.url); const room = url.searchParams.get('room') || 'default';
    const color = this.players.length === 0 ? 'w' : 'b';
    if (this.players.length < 2) this.players.push(server);
    server.send(JSON.stringify({ type: 'assign', color, fen: this.fen, players: this.players.length, room }));
    server.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.type === 'move') { this.fen = m.fen; for (const s of this.sockets) { if (s !== server) { try { s.send(JSON.stringify({ type: 'move', fen: m.fen, from: m.from, to: m.to })) } catch {} } } }
      if (m.type === 'game-over' && m.rated) {
        const wScore = m.winner === 'draw' ? 0.5 : (m.winner === 'w' ? 1 : 0); const bScore = 1 - wScore;
        const newW = calcElo(m.whiteRating, m.blackRating, wScore, m.whiteGames || 0); const newB = calcElo(m.blackRating, m.whiteRating, bScore, m.blackGames || 0);
        for (const s of this.sockets) { try { s.send(JSON.stringify({ type: 'rating-update', whiteNew: newW, blackNew: newB, whiteDelta: newW - m.whiteRating, blackDelta: newB - m.blackRating })) } catch {} }
      }
    });
    server.addEventListener('close', () => { this.sockets.delete(server); this.players = this.players.filter(p => p !== server); for (const s of this.sockets) { try { s.send(JSON.stringify({ type: 'player-left' })) } catch {} } });
    return new Response(null, { status: 101, webSocket: client });
  }
}

export class Lobby extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env); this.ctx = ctx; this.env = env; this.users = new Map(); this.tournaments = seedTournaments();
    this.authUsers = new Map([['admin', { username: 'admin', name: 'Admin', password: hashPass('ZedAdmin2026!'), role: 'admin', rating: 1500, games: 0, wins: 0, created: new Date().toISOString(), banned: false }]]);
    this.totalGames = 0;
    // --- FINANCE - 4 SEPARATE ACCOUNTS ---
    this.finance = { gross: 0, taxReserve: 0, adminFees: 0, payouts: 0, profit: 0, transactions: [] };
    // Demo: K100 stake game - 2 players, pot K200
    this.addTransaction('stake_win', 200, 'Demo: K100 Stake Game - Pot K200 (2 x K100)', 'Themba');
  }
  addTransaction(type, amount, note, username) {
    let tax = 0, adminFee = 0, net = 0, payout = 0;
    if (type === 'stake_win') {
      // Pot = amount. Admin takes 10%, Tax 16% on admin fee, Winner gets rest
      adminFee = Math.round(amount * ADMIN_FEE * 100) / 100;
      tax = Math.round(adminFee * TAX_RATE * 100) / 100;
      payout = Math.round((amount - adminFee) * 100) / 100;
      net = Math.round((adminFee - tax) * 100) / 100; // Admin net profit
      this.finance.gross += amount; this.finance.adminFees += adminFee; this.finance.taxReserve += tax; this.finance.payouts += payout; this.finance.profit += net;
    } else if (type === 'payout') {
      payout = amount; this.finance.payouts += amount; this.finance.profit -= amount; net = -amount;
    } else if (type === 'entry_fee' || type === 'stake' || type === 'subscription') {
      // For entry fee, admin fee = full amount, tax on it
      adminFee = amount; tax = Math.round(amount * TAX_RATE * 100) / 100; net = Math.round((amount - tax) * 100) / 100;
      this.finance.gross += amount; this.finance.adminFees += adminFee; this.finance.taxReserve += tax; this.finance.profit += net;
    } else {
      this.finance.gross += amount; net = amount; this.finance.profit += net;
    }
    const tx = { id: Date.now().toString(36) + Math.random().toString(36).slice(2,4), type, amount, adminFee, tax, payout, net, note, username: username || 'system', date: new Date().toISOString() };
    this.finance.transactions.unshift(tx);
    if (this.finance.transactions.length > 200) this.finance.transactions = this.finance.transactions.slice(0,200);
    return tx;
  }
  async fetch(request) {
    const url = new URL(request.url);
    const json = (obj, status=200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const username = (b.username||'').toLowerCase().trim(); const name = (b.name||username).trim(); const password = b.password||'';
      if (!username || password.length < 4) return json({ error: 'Username + password (min 4 chars) required' }, 400);
      if (this.authUsers.has(username)) return json({ error: 'Username already taken' }, 400);
      const user = { username, name, password: hashPass(password), role: 'user', rating: 1200, games: 0, wins: 0, created: new Date().toISOString(), banned: false };
      this.authUsers.set(username, user);
      return json({ ok: true, user: { username, name, role: 'user', rating: 1200 }, token: 'tok_'+username });
    }
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const username = (b.username||'').toLowerCase().trim(); const user = this.authUsers.get(username);
      if (!user || user.password !== hashPass(b.password||'')) return json({ error: 'Wrong username or password' }, 401);
      if (user.banned) return json({ error: 'Account banned by admin' }, 403);
      return json({ ok: true, user: { username: user.username, name: user.name, role: user.role, rating: user.rating, games: user.games, wins: user.wins }, token: 'tok_'+username });
    }
    if (url.pathname === '/api/admin/finance') {
      return json({ taxRate: TAX_RATE, adminFeeRate: ADMIN_FEE, gross: this.finance.gross, taxReserve: this.finance.taxReserve, adminFees: this.finance.adminFees, payouts: this.finance.payouts, profit: this.finance.profit, availableToWithdraw: Math.round(this.finance.profit*100)/100, transactions: this.finance.transactions });
    }
    if (url.pathname === '/api/admin/add-transaction' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      // If admin adds stake_win, amount = total pot (e.g. 200 for 2x100)
      const tx = this.addTransaction(b.type || 'entry_fee', Number(b.amount)||0, b.note || '', b.username || '');
      return json({ ok: true, tx, finance: { gross: this.finance.gross, taxReserve: this.finance.taxReserve, adminFees: this.finance.adminFees, profit: this.finance.profit } });
    }
    // NEW: When a stake game finishes, frontend calls this to split pot
    if (url.pathname === '/api/admin/settle-stake' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const pot = Number(b.pot)||0; const winner = b.winner || 'Winner';
      const tx = this.addTransaction('stake_win', pot, `Stake game settled - Winner: ${winner} - Pot K${pot}`, winner);
      return json({ ok: true, tx, winnerPayout: tx.payout, adminFee: tx.adminFee, tax: tx.tax, profit: tx.net });
    }
    if (url.pathname === '/api/admin/stats') {
      const users = [...this.authUsers.values()].map(u=>({ username: u.username, name: u.name, role: u.role, rating: u.rating, games: u.games, wins: u.wins, created: u.created, banned: u.banned }));
      const tournaments = [...this.tournaments.values()].map(t=>({ id: t.id, name: t.name, format: t.format, timeControl: t.timeControl, rated: t.rated, max: t.max, status: t.status, playerCount: t.players.length, waitingCount: (t.waiting||[]).length, stake: t.stake }));
      return json({ totalUsers: users.length, onlineUsers: this.users.size, totalTournaments: tournaments.length, totalGames: this.totalGames, finance: { gross: this.finance.gross, taxReserve: this.finance.taxReserve, adminFees: this.finance.adminFees, payouts: this.finance.payouts, profit: this.finance.profit }, users, tournaments });
    }
    if (url.pathname === '/api/admin/ban' && request.method === 'POST') {
      const b = await request.json().catch(()=>({})); const u = this.authUsers.get((b.username||'').toLowerCase());
      if (u && u.role !== 'admin') { u.banned = !u.banned; return json({ ok: true, banned: u.banned }); }
      return json({ error: 'Cannot ban admin or not found' }, 400);
    }
    if (url.pathname === '/api/admin/delete-user' && request.method === 'POST') {
      const b = await request.json().catch(()=>({})); const key = (b.username||'').toLowerCase();
      if (key !== 'admin' && this.authUsers.has(key)) { this.authUsers.delete(key); return json({ ok: true }); }
      return json({ error: 'Cannot delete admin' }, 400);
    }
    if (url.pathname === '/api/tournaments') {
      const tournaments = [...this.tournaments.values()].map(t => ({ id: t.id, name: t.name, format: t.format, timeControl: t.timeControl, stake: t.stake, rated: t.rated, max: t.max, status: t.status, players: t.players.map(p => p.name), playerCount: t.players.length, waitingCount: (t.waiting || []).length, avgRating: t.players.length ? Math.round(t.players.reduce((a,p)=>a+p.rating,0)/t.players.length) : 1200 }));
      return json({ tournaments });
    }
    const pair = new WebSocketPair(); const [client, server] = Object.values(pair);
    server.accept();
    let myId = Math.random().toString(36).slice(2, 8).toUpperCase();
    server.send(JSON.stringify({ type: 'welcome', id: myId }));
    const broadcastLobby = () => {
      const users = [...this.users.values()].map(u => ({ id: u.id, name: u.name, rating: u.rating }));
      const tournaments = [...this.tournaments.values()].map(t => ({ id: t.id, name: t.name, format: t.format, timeControl: t.timeControl, stake: t.stake, rated: t.rated, max: t.max, status: t.status, players: t.players.map(p => p.name), playerCount: t.players.length, waitingCount: (t.waiting||[]).length, avgRating: t.players.length ? Math.round(t.players.reduce((a,p)=>a+p.rating,0)/t.players.length) : 1200 }));
      for (const u of this.users.values()) { try { u.ws.send(JSON.stringify({ type: 'lobby', users, tournaments })) } catch {} }
    };
    setTimeout(() => {
      const tournaments = [...this.tournaments.values()].map(t => ({ id: t.id, name: t.name, format: t.format, timeControl: t.timeControl, stake: t.stake, rated: t.rated, max: t.max, status: t.status, players: t.players.map(p => p.name), playerCount: t.players.length, waitingCount: (t.waiting||[]).length, avgRating: t.players.length ? Math.round(t.players.reduce((a,p)=>a+p.rating,0)/t.players.length) : 1200 }));
      try { server.send(JSON.stringify({ type: 'lobby', users: [...this.users.values()].map(u => ({ id: u.id, name: u.name, rating: u.rating })), tournaments })) } catch {}
    }, 100);
    server.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.type === 'join-lobby') { this.users.set(myId, { id: myId, name: m.name || 'Player', rating: m.rating || 1200, ws: server }); broadcastLobby(); }
      if (m.type === 'challenge') { const target = this.users.get(m.to); const me = this.users.get(myId); if (target) target.ws.send(JSON.stringify({ type: 'challenge-incoming', from: myId, fromName: me?.name || 'Player', stake: m.stake, room: m.room })); }
      if (m.type === 'challenge-accept') { const target = this.users.get(m.to); if (target) target.ws.send(JSON.stringify({ type: 'challenge-accepted', room: m.room })); }
      if (m.type === 'challenge-decline') { const target = this.users.get(m.to); if (target) target.ws.send(JSON.stringify({ type: 'challenge-declined' })); }
      if (m.type === 'create-tournament') { const id = Math.random().toString(36).slice(2, 6).toUpperCase(); const me = this.users.get(myId); this.tournaments.set(id, { id, name: m.name, format: 'swiss', timeControl: 'blitz', stake: m.stake, rated: false, max: m.max || 8, status: 'waiting', players: me ? [{ id: myId, name: me.name, rating: me.rating }] : [], waiting: [] }); broadcastLobby(); }
      if (m.type === 'create-rated-tournament') { const id = Math.random().toString(36).slice(2, 6).toUpperCase(); const me = this.users.get(myId); this.tournaments.set(id, { id, name: m.name, format: m.format || 'arena', timeControl: m.timeControl || 'blitz', stake: m.stake || 0, rated: m.rated !== false, max: m.max || 16, status: 'waiting', players: me ? [{ id: myId, name: me.name, rating: me.rating }] : [], waiting: [], round: 1 }); broadcastLobby(); }
      if (m.type === 'join-tournament') {
        const t = this.tournaments.get(m.tournamentId); const me = this.users.get(myId);
        if (t && me && !t.players.find(p => p.id === myId)) {
          t.players.push({ id: myId, name: me.name, rating: me.rating });
          if (!t.waiting) t.waiting = [];
          if (t.format === 'arena') {
            const waitingId = t.waiting.find(id => id !== myId && this.users.get(id));
            if (waitingId) {
              t.waiting = t.waiting.filter(id => id !== waitingId);
              const room = Math.random().toString(36).slice(2, 8).toUpperCase();
              const opponent = this.users.get(waitingId); const meUser = this.users.get(myId);
              if (opponent) opponent.ws.send(JSON.stringify({ type: 'game-start', tournamentId: t.id, room, format: t.format, timeControl: t.timeControl, rated: t.rated, stake: t.stake, opponent: me?.name, opponentRating: me?.rating, color: 'w', message: 'Opponent found! Your rated game is starting...' }));
              if (meUser) meUser.ws.send(JSON.stringify({ type: 'game-start', tournamentId: t.id, room, format: t.format, timeControl: t.timeControl, rated: t.rated, stake: t.stake, opponent: opponent?.name, opponentRating: opponent?.rating, color: 'b', message: 'Opponent found! Your rated game is starting...' }));
              for (const p of [waitingId, myId]) { const u = this.users.get(p); if (u) u.ws.send(JSON.stringify({ type: 'tournament-started', tournamentId: t.id, room, format: t.format })); }
              this.totalGames++;
            } else {
              t.waiting.push(myId);
              const meUser = this.users.get(myId);
              if (meUser) meUser.ws.send(JSON.stringify({ type: 'waiting-for-opponent', tournamentId: t.id, message: 'Searching for opponent...' }));
            }
          } else {
            if (t.players.length >= 4 && t.status === 'waiting') { t.status = 'started'; const room = Math.random().toString(36).slice(2, 8).toUpperCase(); for (const p of t.players) { const u = this.users.get(p.id); if (u) u.ws.send(JSON.stringify({ type: 'tournament-started', tournamentId: t.id, room, format: t.format })); } }
          }
          broadcastLobby();
        }
      }
      if (m.type === 'game-finished') { const t = this.tournaments.get(m.tournamentId); if (t && t.format === 'arena') { if (!t.waiting) t.waiting = []; if (!t.waiting.includes(myId)) t.waiting.push(myId); const meUser = this.users.get(myId); if (meUser) meUser.ws.send(JSON.stringify({ type: 'waiting-for-opponent', tournamentId: t.id, message: 'Game finished! Searching for next opponent...' })); broadcastLobby(); } }
      // NEW: When stake game ends, split pot automatically
      if (m.type === 'stake-game-won') {
        const t = this.tournaments.get(m.tournamentId);
        const stake = t?.stake || m.stake || 0;
        if (stake > 0) {
          const pot = stake * 2;
          const tx = this.addTransaction('stake_win', pot, `Stake game - Winner: ${me?.name} - Pot K${pot} (${stake} x 2)`, me?.name);
          for (const s of this.users.values()) { try { s.ws.send(JSON.stringify({ type: 'stake-settled', winner: me?.name, pot, winnerPayout: tx.payout, adminFee: tx.adminFee, tax: tx.tax })) } catch {} }
        }
      }
    });
    server.addEventListener('close', () => { for (const t of this.tournaments.values()) { if (t.waiting) t.waiting = t.waiting.filter(id => id !== myId); } this.users.delete(myId); broadcastLobby(); });
    return new Response(null, { status: 101, webSocket: client });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) { const id = env.LOBBY.idFromName('global-lobby'); return env.LOBBY.get(id).fetch(request); }
    if (url.pathname === '/ws/lobby') { const id = env.LOBBY.idFromName('global-lobby'); return env.LOBBY.get(id).fetch(request); }
    if (url.pathname === '/ws') { const room = url.searchParams.get('room') || 'default'; const id = env.CHESS_ROOM.idFromName(room); return env.CHESS_ROOM.get(id).fetch(request); }
    return env.ASSETS.fetch(request);
  }
}


STEP 2: src/AdminDashboard.jsx — Delete ALL, Paste ONLY this

jsx
import { useState, useEffect } from 'react'

export default function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null)
  const [fin, setFin] = useState(null)
  const [tab, setTab] = useState('finance')
  const [txType, setTxType] = useState('stake_win')
  const [txAmount, setTxAmount] = useState('')
  const [txNote, setTxNote] = useState('')
  const load = async () => {
    const s = await (await fetch('/api/admin/stats')).json(); setStats(s)
    const f = await (await fetch('/api/admin/finance')).json(); setFin(f)
  }
  useEffect(()=>{ load(); const i=setInterval(load, 5000); return ()=>clearInterval(i) },[])
  const ban = async (username) => { await fetch('/api/admin/ban',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})}); load() }
  const del = async (username) => { if(!confirm('Delete '+username+'?')) return; await fetch('/api/admin/delete-user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})}); load() }
  const addTx = async (e) => {
    e.preventDefault(); if(!txAmount) return
    await fetch('/api/admin/add-transaction',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type: txType, amount: Number(txAmount), note: txNote, username: user.username})})
    setTxAmount(''); setTxNote(''); load()
  }
  if (!stats || !fin) return <div style={{padding:20, color:'#fff'}}>Loading admin...</div>
  return (
    <div style={{padding:16, maxWidth:1000, margin:'0 auto', color:'#fff', background:'#0f172a', minHeight:'100vh'}}>
      <h1>🛡️ Admin Dashboard</h1>
      <p>Logged in as <b>{user.name} (@{user.username})</b> — {user.role} <button onClick={onLogout}>Logout</button></p>
      <div style={{display:'flex', gap:12, margin:'16px 0', flexWrap:'wrap'}}>
        <button onClick={()=>setTab('finance')}>💰 Cash Flow / Tax / Admin %</button>
        <button onClick={()=>setTab('overview')}>Overview</button>
        <button onClick={()=>setTab('users')}>Users ({stats.totalUsers})</button>
        <button onClick={()=>setTab('tournaments')}>Tournaments ({stats.totalTournaments})</button>
      </div>

      {tab==='finance' && (
        <div>
          <h2>💰 Cash Flow — Admin % From Stake Won</h2>
          <p style={{fontSize:13, opacity:0.7}}>Admin Fee: {Math.round(fin.adminFeeRate*100)}% of pot • Tax: {Math.round(fin.taxRate*100)}% on admin fee only</p>
          <div style={{background:'#1e293b', padding:14, borderRadius:12, marginBottom:12, fontSize:14}}>
            <b>Example:</b> 2 players stake K100 each = Pot K200 → Admin Fee K20 (10%) → Tax K3.20 (16% of K20) → Winner gets K180 → Your Profit K16.80
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:12}}>
            <div style={{background:'#1e293b', padding:14, borderRadius:12}}><small>GROSS POTS</small><h2>K{fin.gross.toFixed(2)}</h2><p style={{fontSize:11}}>All pots collected</p></div>
            <div style={{background:'#581c87', padding:14, borderRadius:12, border:'2px solid #a855f7'}}><small>👑 ADMIN FEES</small><h2>K{fin.adminFees.toFixed(2)}</h2><p style={{fontSize:11}}>{Math.round(fin.adminFeeRate*100)}% of every pot</p></div>
            <div style={{background:'#7f1d1d', padding:14, borderRadius:12, border:'2px solid #ef4444'}}><small>🧾 TAX - LOCKED</small><h2>K{fin.taxReserve.toFixed(2)}</h2><p style={{fontSize:11}}>For ZRA. Do NOT spend.</p></div>
            <div style={{background:'#1e293b', padding:14, borderRadius:12}}><small>WINNERS PAID</small><h2>K{fin.payouts.toFixed(2)}</h2><p style={{fontSize:11}}>To winners</p></div>
            <div style={{background:'#14532d', padding:14, borderRadius:12, border:'2px solid #22c55e'}}><small>📈 NET PROFIT</small><h2>K{fin.profit.toFixed(2)}</h2><p style={{fontSize:11}}>Withdraw: K{fin.availableToWithdraw.toFixed(2)}</p></div>
          </div>

          <div style={{background:'#1e293b', padding:16, borderRadius:12, marginTop:16}}>
            <h3>+ Record Stake Game / Transaction</h3>
            <form onSubmit={addTx} style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              <select value={txType} onChange={e=>setTxType(e.target.value)} style={{padding:10, borderRadius:8}}>
                <option value="stake_win">Stake Game Won - Amount = Total Pot (e.g. 200 for 2x100)</option>
                <option value="entry_fee">Entry Fee (Taxed)</option>
                <option value="payout">Manual Payout</option>
              </select>
              <input placeholder="Pot / Amount K e.g. 200" value={txAmount} onChange={e=>setTxAmount(e.target.value)} style={{padding:10, borderRadius:8}} />
              <input placeholder="Note e.g. Themba won K100 stake" value={txNote} onChange={e=>setTxNote(e.target.value)} style={{padding:10, borderRadius:8, flex:1}} />
              <button style={{padding:10, background:'#22c55e', border:0, borderRadius:8, fontWeight:700}}>Add</button>
            </form>
          </div>

          <h3 style={{marginTop:20}}>📋 Ledger</h3>
          <table style={{width:'100%', background:'#1e293b', borderRadius:12, padding:8, fontSize:13}}>
            <thead><tr><th align="left">Date</th><th align="left">Type</th><th align="left">Note</th><th>Pot</th><th>Admin Fee</th><th>Tax</th><th>Winner Gets</th><th>Your Profit</th></tr></thead>
            <tbody>{fin.transactions.map(t=>(
              <tr key={t.id}><td>{new Date(t.date).toLocaleString()}</td><td>{t.type}</td><td>{t.note}</td><td>K{t.amount.toFixed(2)}</td><td style={{color:'#c084fc'}}>K{(t.adminFee||0).toFixed(2)}</td><td style={{color:'#f87171'}}>K{(t.tax||0).toFixed(2)}</td><td>K{(t.payout||0).toFixed(2)}</td><td style={{color:'#4ade80'}}>+K{(t.net||0).toFixed(2)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab==='overview' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12}}>
          <div style={{background:'#1e293b', padding:16, borderRadius:12}}><h2>{stats.totalUsers}</h2><p>Total Users</p></div>
          <div style={{background:'#1e293b', padding:16, borderRadius:12}}><h2>{stats.onlineUsers}</h2><p>Online Now</p></div>
          <div style={{background:'#1e293b', padding:16, borderRadius:12}}><h2>{stats.totalTournaments}</h2><p>Tournaments</p></div>
          <div style={{background:'#1e293b', padding:16, borderRadius:12}}><h2>{stats.totalGames}</h2><p>Games Started</p></div>
        </div>
      )}
      {tab==='users' && (
        <table style={{width:'100%', background:'#1e293b', borderRadius:12, padding:8}}>
          <thead><tr><th align="left">User</th><th>Role</th><th>Rating</th><th>Games</th><th>Action</th></tr></thead>
          <tbody>{stats.users.map(u=>(
            <tr key={u.username}><td>{u.name}<br/><small>@{u.username} {u.banned?'🚫 BANNED':''}</small></td><td>{u.role}</td><td>{u.rating}</td><td>{u.games}</td>
            <td><button onClick={()=>ban(u.username)}>{u.banned?'Unban':'Ban'}</button> <button onClick={()=>del(u.username)}>Delete</button></td></tr>
          ))}</tbody>
        </table>
      )}
      {tab==='tournaments' && stats.tournaments.map(t=>(
        <div key={t.id} style={{background:'#1e293b', padding:12, borderRadius:12, marginBottom:8}}>
          <b>{t.name}</b> — {t.playerCount}/{t.max} • Waiting: {t.waitingCount} • Stake: K{t.stake||0} • {t.format} • {t.timeControl} • {t.rated?'Rated':'Casual'}
        </div>
      ))}
    </div>
  )
}


