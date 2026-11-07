
// ZED GAMBIT v2 - Full Worker
export class Lobby {
  constructor(state) { this.state = state; }
  async fetch(request) {
    return new Response(JSON.stringify({ ok: true, msg: "Lobby DO alive" }), { headers: { "Content-Type": "application/json" } });
  }
}

export class ChessRoom {
  constructor(state) { this.state = state; this.sessions = new Set(); }
  async fetch(request) {
    const upgrade = request.headers.get('Upgrade');
    if (upgrade === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      this.sessions.add(server);
      server.addEventListener('message', (e) => {
        for (const s of this.sessions) { try { if (s !== server) s.send(e.data); } catch {} }
      });
      server.addEventListener('close', () => { this.sessions.delete(server); });
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response(JSON.stringify({ ok: true, msg: "ChessRoom DO alive" }), { headers: { "Content-Type": "application/json" } });
  }
}

let users = {};
let balances = {};
let tournaments = [
  { id: "MEGA1", name: "🌍 Mega K5 Arena", stake: 5, playerCount: 12, max: 200, prize: "K70", status: "LIVE" },
  { id: "PRO10", name: "🔥 Pro K10 Arena", stake: 10, playerCount: 8, max: 100, prize: "K140", status: "LIVE" },
  { id: "VIP50", name: "👑 VIP K50 Arena", stake: 50, playerCount: 3, max: 50, prize: "K700", status: "LIVE" },
  { id: "FREE1", name: "🎁 Free Practice", stake: 0, playerCount: 25, max: 200, prize: "K0", status: "LIVE" },
];
let leaderboard = [];
let waiting = null;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" }
  });
}

function calcPayout(stake, players) {
  const pot = stake * players;
  const fee = pot * 0.10;
  const tax = fee * 0.16;
  const net = pot - fee - tax;
  return { pot, fee, tax, net, winner: net * 0.70, second: net * 0.30 };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api') && !url.pathname.startsWith('/ws')) {
      try {
        if (env.ASSETS) {
          let asset = await env.ASSETS.fetch(request);
          if (asset.status !== 404) return asset;
          return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
        }
      } catch {}
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" } });
    }
    if (url.pathname === '/ws') {
      const upgrade = request.headers.get('Upgrade');
      if (upgrade !== 'websocket') return new Response('Expected websocket', { status: 426 });
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      server.addEventListener('message', (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m.type === 'join-tournament') {
            server.send(JSON.stringify({ type: 'joined', tournamentId: m.tournamentId }));
          }
          if (m.type === 'find-game') {
            if (!waiting) {
              waiting = { ws: server, username: m.username };
              server.send(JSON.stringify({ type: 'waiting', msg: 'Waiting for opponent...' }));
            } else {
              const opp = waiting;
              waiting = null;
              const room = 'ROOM-' + Math.floor(Math.random() * 9000 + 1000);
              server.send(JSON.stringify({ type: 'game-start', room, opponent: opp.username, color: 'black' }));
              try { opp.ws.send(JSON.stringify({ type: 'game-start', room, opponent: m.username, color: 'white' })); } catch {}
            }
          }
          if (m.type === 'move') {
            server.send(JSON.stringify({ type: 'move-ack', move: m.move }));
          }
        } catch {}
      });
      return new Response(null, { status: 101, webSocket: client });
    }
    if (url.pathname === '/api/tournaments' && request.method === 'GET') {
      return json({ tournaments });
    }
    if (url.pathname === '/api/register' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      if (!b.username || !b.password) return json({ error: 'Username + password required' }, 400);
      if (users[b.username]) return json({ error: 'Username taken' }, 400);
      users[b.username] = { name: b.name || b.username, username: b.username, password: b.password, phone: b.phone || '' };
      if (balances[b.username] === undefined) balances[b.username] = 0;
      return json({ ok: true, user: { name: users[b.username].name, username: b.username }, balance: balances[b.username] });
    }
    if (url.pathname === '/api/login' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      const u = users[b.username];
      if (!u || u.password !== b.password) return json({ error: 'Wrong username or password' }, 401);
      return json({ ok: true, user: { name: u.name, username: u.username }, balance: balances[b.username] || 0 });
    }
    if (url.pathname === '/api/verify' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      if (String(b.code) === '123456') return json({ ok: true, msg: 'Verified' });
      return json({ error: 'Wrong code. Demo code is 123456' }, 400);
    }
    if (url.pathname === '/api/balance' && request.method === 'GET') {
      const username = url.searchParams.get('username');
      return json({ balance: balances[username] || 0 });
    }
    if (url.pathname === '/api/pay/deposit' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      const amt = Number(b.amount) || 0;
      if (amt < 1) return json({ error: 'Min K1' }, 400);
      if (balances[b.username] === undefined) balances[b.username] = 0;
      balances[b.username] += amt;
      return json({ ok: true, balance: balances[b.username], msg: 'Deposited K' + amt });
    }
    if (url.pathname === '/api/pay/withdraw' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      const amt = Number(b.amount) || 0;
      if ((balances[b.username] || 0) < amt) return json({ error: 'Not enough balance' }, 400);
      balances[b.username] -= amt;
      return json({ ok: true, balance: balances[b.username], msg: 'Withdraw K' + amt + ' sent' });
    }
    if (url.pathname === '/api/pay/join-arena' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      const t = tournaments.find(x => x.id === b.tournamentId);
      if (!t) return json({ error: 'Arena not found' }, 404);
      const stake = Number(b.stake ?? t.stake) || 0;
      if ((balances[b.username] || 0) < stake) return json({ error: 'Not enough balance. Deposit first.' }, 400);
      balances[b.username] -= stake;
      t.playerCount += 1;
      const p = calcPayout(stake, Math.max(t.playerCount, 3));
      return json({ ok: true, balance: balances[b.username], pot: stake * t.playerCount, winner: p.winner, second: p.second, tournament: t });
    }
    if (url.pathname === '/api/pay/refund' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      const stake = Number(b.stake) || 0;
      if (balances[b.username] === undefined) balances[b.username] = 0;
      balances[b.username] += stake;
      const t = tournaments.find(x => x.id === b.tournamentId);
      if (t && t.playerCount > 0) t.playerCount -= 1;
      return json({ ok: true, balance: balances[b.username], msg: 'Refunded K' + stake });
    }
    if (url.pathname === '/api/game-result' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      let pts = 0;
      if (b.result === 'win') pts = 2;
      if (b.result === 'draw') pts = 1;
      if (b.result === 'win' && b.streak >= 3) pts = 4;
      let entry = leaderboard.find(x => x.username === b.username);
      if (!entry) { entry = { name: b.name || b.username, username: b.username, points: 0, wins: 0, games: 0 }; leaderboard.push(entry); }
      entry.points += pts;
      entry.games += 1;
      if (b.result === 'win') entry.wins += 1;
      leaderboard.sort((a, c) => c.points - a.points);
      return json({ ok: true, points: entry.points, leaderboard: leaderboard.slice(0, 20) });
    }
    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
      return json({ leaderboard: leaderboard.slice(0, 20) });
    }
    return json({ error: 'Not found: ' + url.pathname }, 404);
  }
};


