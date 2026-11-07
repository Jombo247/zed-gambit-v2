 ============================================
// ZED GAMBIT - FULL WORKER.MJS - DELETE + PASTE
// Auto Stakes K5+ | Winner 70% + 2nd 30% | Admin 10% | Tax 16% | Auto Refund 2 Mins
// ============================================

// In-memory store (for MVP - use D1/KV later for production)
let authUsers = new Map();
let transactions = [];
let tournaments = [
  { id: 'MEGA1', name: '🌍 Mega K5 Arena', stake: 5, max: 200, format: 'arena', timeControl: 'blitz', rated: true, avgRating: 1200, playerCount: 0, waitingCount: 0, pot: 0, joined: [], joinedAt: {}, gameStarted: false, refundMinutes: 2 },
  { id: 'BLITZ1', name: '⚡ Blitz K10 Arena', stake: 10, max: 100, format: 'arena', timeControl: 'blitz', rated: true, avgRating: 1250, playerCount: 0, waitingCount: 0, pot: 0, joined: [], joinedAt: {}, gameStarted: false, refundMinutes: 2 },
  { id: 'RAPID1', name: '🚀 Rapid K20 Arena', stake: 20, max: 100, format: 'arena', timeControl: 'rapid', rated: true, avgRating: 1300, playerCount: 0, waitingCount: 0, pot: 0, joined: [], joinedAt: {}, gameStarted: false, refundMinutes: 2 },
  { id: 'HIGH1', name: '👑 High Roller K100 Arena', stake: 100, max: 50, format: 'arena', timeControl: 'blitz', rated: true, avgRating: 1500, playerCount: 0, waitingCount: 0, pot: 0, joined: [], joinedAt: {}, gameStarted: false, refundMinutes: 2 },
];
let lobbySockets = new Set();
let lobbyUsers = new Map(); // ws -> {name, rating, username}
let waitingQueue = {}; // tournamentId -> [ {ws, username, name} ]

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
function addTransaction(type, amount, note, username) {
  const adminFee = type === 'stake_win' ? amount * 0.10 : 0;
  const tax = adminFee * 0.16;
  const payout = type === 'stake_win' ? amount - adminFee : 0;
  const net = adminFee - tax;
  const tx = { id: 'TX-' + Date.now() + '-' + Math.random().toString(36).slice(2,6), date: new Date().toISOString(), type, amount, note, username: username || 'system', adminFee, tax, payout, net };
  transactions.unshift(tx);
  return tx;
}
function broadcastLobby() {
  // Update playerCount from joined
  tournaments.forEach(t => { t.playerCount = (t.joined||[]).length; t.waitingCount = (waitingQueue[t.id]||[]).length; });
  const msg = JSON.stringify({ type: 'lobby', tournaments, users: Array.from(lobbyUsers.values()) });
  lobbySockets.forEach(ws => { try { ws.send(msg); } catch {} });
}
function broadcast(obj) {
  const msg = JSON.stringify(obj);
  lobbySockets.forEach(ws => { try { ws.send(msg); } catch {} });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });

    // ================= WEBSOCKET LOBBY =================
    if (url.pathname === '/ws/lobby') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      lobbySockets.add(server);
      server.addEventListener('message', (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m.type === 'ping') { server.send(JSON.stringify({ type: 'pong' })); return; }
          if (m.type === 'join-lobby') {
            lobbyUsers.set(server, { name: m.name, rating: m.rating || 1200, username: m.username || m.name });
            broadcastLobby();
          }
          if (m.type === 'join-tournament') {
            const tid = m.tournamentId || 'MEGA1';
            const t = tournaments.find(x => x.id === tid);
            if (!t) { server.send(JSON.stringify({ type: 'stake-failed', message: 'Arena not found' })); return; }
            if (!waitingQueue[tid]) waitingQueue[tid] = [];
            // If someone already waiting, pair them!
            const waiting = waitingQueue[tid].find(w => w.ws !== server);
            if (waiting) {
              waitingQueue[tid] = waitingQueue[tid].filter(w => w.ws !== server && w.ws !== waiting.ws);
              const room = Math.random().toString(36).slice(2,8).toUpperCase();
              // Mark game started - NO REFUND NOW
              t.gameStarted = true;
              if (t.joinedAt) t.joinedAt = {};
              const color1 = 'w', color2 = 'b';
              try { waiting.ws.send(JSON.stringify({ type: 'game-start', room, opponent: m.username || m.name || 'Opponent', color: color1 })); } catch {}
              server.send(JSON.stringify({ type: 'game-start', room, opponent: waiting.username || waiting.name || 'Opponent', color: color2 }));
              broadcast({ type: 'tournament-started', room, tournamentId: tid });
            } else {
              waitingQueue[tid].push({ ws: server, username: m.username || m.name, name: m.name });
              server.send(JSON.stringify({ type: 'waiting-for-opponent', message: 'Waiting for opponent in ' + t.name + ' — K' + t.stake + ' already deducted. Auto-refund in 2:00 if no one comes.' }));
            }
            broadcastLobby();
          }
          if (m.type === 'game-finished') {
            const tid = m.tournamentId || 'MEGA1';
            if (!waitingQueue[tid]) waitingQueue[tid] = [];
            waitingQueue[tid].push({ ws: server, username: m.username || 'Player', name: m.name || 'Player' });
            server.send(JSON.stringify({ type: 'waiting-for-opponent', message: 'Finding next opponent... Stay here!' }));
            // Try re-pair instantly
            const others = waitingQueue[tid].filter(w => w.ws !== server);
            if (others.length > 0) {
              const other = others[0];
              waitingQueue[tid] = waitingQueue[tid].filter(w => w.ws !== server && w.ws !== other.ws);
              const room = Math.random().toString(36).slice(2,8).toUpperCase();
              const t = tournaments.find(x => x.id === tid);
              if (t) { t.gameStarted = true; }
              try { other.ws.send(JSON.stringify({ type: 'game-start', room, opponent: m.username || 'Opponent', color: 'w' })); } catch {}
              server.send(JSON.stringify({ type: 'game-start', room, opponent: other.username || 'Opponent', color: 'b' }));
            }
            broadcastLobby();
          }
          if (m.type === 'create-rated-tournament') {
            const id = 'T' + Date.now().toString().slice(-6);
            const stake = Number(m.stake) || 5;
            const newT = { id, name: m.name || 'New Arena', stake: Math.max(5, stake), max: m.max || 16, format: m.format || 'arena', timeControl: m.timeControl || 'blitz', rated: true, avgRating: 1200, playerCount: 0, waitingCount: 0, pot: 0, joined: [], joinedAt: {}, gameStarted: false, refundMinutes: 2 };
            tournaments.push(newT);
            broadcastLobby();
            server.send(JSON.stringify({ type: 'tournament-created', tournament: newT }));
          }
        } catch {}
      });
      server.addEventListener('close', () => {
        lobbySockets.delete(server);
        lobbyUsers.delete(server);
        Object.keys(waitingQueue).forEach(k => { waitingQueue[k] = waitingQueue[k].filter(w => w.ws !== server); });
        broadcastLobby();
      });
      return new Response(null, { status: 101, webSocket: client });
    }

    // ================= AUTH =================
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const username = (b.username||'').toLowerCase().trim();
      if (!username || !b.password || !b.name) return json({ error: 'Name, username, password required' }, 400);
      if (authUsers.has(username)) return json({ error: 'Username taken' }, 400);
      const user = { name: b.name, username, password: b.password, rating: 1200, games: 0, wins: 0, role: username === 'admin' ? 'admin' : 'user', balance: 0, mobile: '', mobileVerified: false, payHistory: [], banned: false, createdAt: new Date().toISOString() };
      authUsers.set(username, user);
      return json({ ok: true, user: { name: user.name, username: user.username, rating: user.rating, role: user.role } });
    }
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const username = (b.username||'').toLowerCase().trim();
      const u = authUsers.get(username);
      if (!u) return json({ error: 'User not found. Register first.' }, 404);
      if (u.password !== b.password) return json({ error: 'Wrong password' }, 401);
      if (u.banned) return json({ error: 'Banned. Contact admin.' }, 403);
      return json({ ok: true, user: { name: u.name, username: u.username, rating: u.rating, role: u.role } });
    }

    // ================= TOURNAMENTS LIST =================
    if (url.pathname === '/api/tournaments' && request.method === 'GET') {
      tournaments.forEach(t => { t.playerCount = (t.joined||[]).length; t.waitingCount = (waitingQueue[t.id]||[]).length; });
      return json({ tournaments });
    }

    // ================= ADMIN =================
    if (url.pathname === '/api/admin/stats' && request.method === 'GET') {
      const users = Array.from(authUsers.values()).map(u => ({ name: u.name, username: u.username, rating: u.rating, games: u.games||0, wins: u.wins||0, role: u.role, banned: !!u.banned, balance: u.balance||0 }));
      return json({ totalUsers: users.length, onlineUsers: lobbySockets.size, totalTournaments: tournaments.length, totalGames: users.reduce((a,u)=>a+u.games,0), users, tournaments });
    }
    if (url.pathname === '/api/admin/finance' && request.method === 'GET') {
      const gross = transactions.filter(t=>t.type==='stake_win').reduce((a,t)=>a+t.amount,0);
      const adminFees = transactions.reduce((a,t)=>a+(t.adminFee||0),0);
      const taxReserve = transactions.reduce((a,t)=>a+(t.tax||0),0);
      const payouts = transactions.reduce((a,t)=>a+(t.payout||0),0);
      const profit = transactions.reduce((a,t)=>a+(t.net||0),0);
      return json({ gross, adminFees, taxReserve, payouts, profit, transactions: transactions.slice(0,100) });
    }
    if (url.pathname === '/api/admin/add-transaction' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const tx = addTransaction(b.type||'stake_win', Number(b.amount)||0, b.note||'Manual', b.username||'admin');
      return json({ ok: true, tx });
    }
    if (url.pathname === '/api/admin/ban' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const u = authUsers.get((b.username||'').toLowerCase());
      if (u) u.banned = !u.banned;
      return json({ ok: true, banned: u?.banned });
    }
    if (url.pathname === '/api/admin/delete-user' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      authUsers.delete((b.username||'').toLowerCase());
      return json({ ok: true });
    }

    // ================= PAY - WALLET =================
    if (url.pathname === '/api/pay/wallet' && request.method === 'GET') {
      const username = (url.searchParams.get('username')||'').toLowerCase();
      const u = authUsers.get(username);
      if (!u) return json({ error: 'User not found' }, 404);
      return json({ balance: u.balance||0, mobile: u.mobile||'', mobileVerified: !!u.mobileVerified, history: u.payHistory||[] });
    }
    if (url.pathname === '/api/pay/request-mobile-code' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const u = authUsers.get((b.username||'').toLowerCase());
      if (!u) return json({ error: 'User not found' }, 404);
      u.mobile = b.mobile; u.mobileCode = '123456'; // DEMO CODE - in live use PawaPay / SMS
      return json({ ok: true, message: 'Code sent. DEMO code is 123456', demoCode: '123456' });
    }
    if (url.pathname === '/api/pay/verify-mobile' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const u = authUsers.get((b.username||'').toLowerCase());
      if (!u) return json({ error: 'User not found' }, 404);
      if (b.code !== '123456' && b.code !== u.mobileCode) return json({ error: 'Wrong code. Demo code is 123456' }, 400);
      u.mobileVerified = true; u.mobile = b.mobile || u.mobile;
      return json({ ok: true, mobile: u.mobile });
    }
    if (url.pathname === '/api/pay/deposit' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const u = authUsers.get((b.username||'').toLowerCase());
      if (!u) return json({ error: 'User not found' }, 404);
      const amt = Number(b.amount)||0;
      if (amt < 5) return json({ error: 'Min deposit K5' }, 400);
      // DEMO: Instant credit. In LIVE, wait for PawaPay webhook.
      u.balance = (u.balance||0) + amt;
      if (!u.payHistory) u.payHistory = [];
      u.payHistory.unshift({ id: 'DEP-'+Date.now(), type: 'deposit', amount: amt, provider: b.provider||'MTN', status: 'completed', date: new Date().toISOString() });
      broadcast({ type: 'wallet-updated', username: u.username, balance: u.balance });
      return json({ ok: true, balance: u.balance, message: 'Deposited K'+amt+' (DEMO - Instant). In live PawaPay, check phone PIN.', status: 'completed' });
    }
    if (url.pathname === '/api/pay/withdraw' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const u = authUsers.get((b.username||'').toLowerCase());
      if (!u) return json({ error: 'User not found' }, 404);
      const amt = Number(b.amount)||0;
      if (amt < 5) return json({ error: 'Min withdraw K5' }, 400);
      if ((u.balance||0) < amt) return json({ error: 'Not enough balance' }, 400);
      u.balance = (u.balance||0) - amt;
      if (!u.payHistory) u.payHistory = [];
      u.payHistory.unshift({ id: 'WD-'+Date.now(), type: 'withdraw', amount: amt, provider: b.provider||'MTN', status: 'processing', date: new Date().toISOString() });
      broadcast({ type: 'wallet-updated', username: u.username, balance: u.balance });
      return json({ ok: true, balance: u.balance, reference: 'WD'+Date.now(), status: 'processing' });
    }

    // ================= PAY - JOIN ARENA (AUTO STAKE) =================
    if (url.pathname === '/api/pay/join-arena' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const u = authUsers.get((b.username||'').toLowerCase());
      if (!u) return json({ error: 'User not found' }, 404);
      const stake = Number(b.stake) || 0;
      if (stake < 5) return json({ error: 'Min stake is K5' }, 400);
      if ((u.balance||0) < stake) return json({ error: 'Not enough balance. You have K' + (u.balance||0).toFixed(2) + ', need K' + stake + '. Deposit first.' }, 400);
      const t = tournaments.find(x => x.id === b.tournamentId);
      if (!t) return json({ error: 'Arena not found' }, 404);
      if ((t.joined||[]).includes(u.username)) return json({ error: 'Already joined this arena' }, 400);
      // AUTO DEDUCT
      u.balance = (u.balance||0) - stake;
      if (!t.joined) t.joined = [];
      t.joined.push(u.username);
      if (!t.pot) t.pot = 0;
      t.pot += stake;
      // START 2 MIN REFUND TIMER
      if (!t.joinedAt) t.joinedAt = {};
      t.joinedAt[u.username] = Date.now();
      t.gameStarted = false;
      t.refundMinutes = 2;
      if (!u.payHistory) u.payHistory = [];
      u.payHistory.unshift({ id: 'STAKE-'+Date.now(), type: 'stake', amount: stake, provider: 'Arena '+t.name, status: 'deducted', date: new Date().toISOString() });
      broadcastLobby();
      return json({ ok: true, balance: u.balance, pot: t.pot, stake, arenaName: t.name, joinedAt: Date.now(), refundInSeconds: 120 });
    }

    // ================= PAY - REFUND ARENA (2 MINS) =================
    if (url.pathname === '/api/pay/refund-arena' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const u = authUsers.get((b.username||'').toLowerCase());
      if (!u) return json({ error: 'User not found' }, 404);
      const t = tournaments.find(x => x.id === b.tournamentId);
      if (!t) return json({ error: 'Arena not found' }, 404);
      // RULE 1: If game already started, NO REFUND
      if (t.gameStarted) return json({ error: 'Game already started — No refund. Stake stays in pot.' }, 400);
      // RULE 2: If not in arena, already refunded
      if (!(t.joined||[]).includes(u.username)) return json({ error: 'You are not in this arena or already refunded' }, 400);
      // RULE 3: Check 2 mins passed (or manual cancel)
      const joinedTime = (t.joinedAt && t.joinedAt[u.username]) || Date.now();
      const waitedMs = Date.now() - joinedTime;
      const isManual = b.manual === true;
      const isAuto = waitedMs >= 120000; // 120000ms = 2 MINS
      if (!isManual && !isAuto) {
        const left = Math.ceil((120000 - waitedMs) / 1000);
        return json({ error: 'Wait ' + left + 's more. Refund after 2 mins if no opponent.' }, 400);
      }
      const stake = Number(b.stake) || t.stake || 5;
      // REFUND
      u.balance = (u.balance||0) + stake;
      t.joined = t.joined.filter(x => x !== u.username);
      t.pot = Math.max(0, (t.pot||0) - stake);
      if (t.joinedAt) delete t.joinedAt[u.username];
      if (!u.payHistory) u.payHistory = [];
      u.payHistory.unshift({ id: 'REFUND-'+Date.now(), type: 'refund', amount: stake, provider: 'Arena Refund '+t.name, status: 'refunded', date: new Date().toISOString() });
      broadcastLobby();
      broadcast({ type: 'refund-done', username: u.username, balance: u.balance, stake, tournamentId: t.id });
      return json({ ok: true, balance: u.balance, stake, pot: t.pot, message: 'Refunded K' + stake + ' — No opponent in 2 mins' });
    }

    // ================= PAY - SETTLE ARENA (WINNER 70% + 2ND 30%) =================
    if (url.pathname === '/api/pay/settle-arena' && request.method === 'POST') {
      const b = await request.json().catch(()=>({}));
      const t = tournaments.find(x => x.id === b.tournamentId);
      if (!t) return json({ error: 'Arena not found' }, 404);
      const players = t.joined || [];
      const pot = t.pot || (players.length * (t.stake||5));
      const adminFee = pot * 0.10;
      const tax = adminFee * 0.16;
      const left = pot - adminFee;
      const winnerName = b.winner;
      const secondName = b.second;
      const winnerPayout = players.length >= 3 ? left * 0.70 : left;
      const secondPayout = players.length >= 3 ? left * 0.30 : 0;
      const w = authUsers.get((winnerName||'').toLowerCase());
      if (w) { w.balance = (w.balance||0) + winnerPayout; w.wins = (w.wins||0)+1; w.games = (w.games||0)+1; }
      const s = secondName ? authUsers.get(secondName.toLowerCase()) : null;
      if (s) { s.balance = (s.balance||0) + secondPayout; s.games = (s.games||0)+1; }
      addTransaction('stake_win', pot, 'Arena '+t.name+' settled: Winner '+winnerName+' K'+winnerPayout.toFixed(2)+' 2nd '+(secondName||'-')+' K'+secondPayout.toFixed(2), winnerName);
      broadcast({ type: 'stake-settled', winner: winnerName, winnerPayout: winnerPayout.toFixed(2), second: secondName || '', secondPayout: secondPayout.toFixed(2), adminFee: adminFee.toFixed(2), tax: tax.toFixed(2), pot });
      t.pot = 0; t.joined = []; t.joinedAt = {}; t.gameStarted = false;
      broadcastLobby();
      return json({ ok: true, pot, adminFee, tax, winnerPayout, secondPayout });
    }

    return json({ error: 'Not found: ' + url.pathname }, 404);
  }
};


