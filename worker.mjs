
// ZED GAMBIT v2 - Full Worker + Computer + Courses + Arena
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
  { id: "MEGA1", name: "🌍 Mega K5 Arena", stake: 5, playerCount: 12, max: 200, prize: "K70", status: "LIVE", details: "Winner takes K70. 10% fee + 16% tax on fee. Top 2 paid: 70% / 30%.", rules: "10 min rapid, 2 points for win, 1 for draw, 4 for 3-win streak." },
  { id: "PRO10", name: "🔥 Pro K10 Arena", stake: 10, playerCount: 8, max: 100, prize: "K140", status: "LIVE", details: "Winner takes K140. Pro level only.", rules: "10 min rapid." },
  { id: "VIP50", name: "👑 VIP K50 Arena", stake: 50, playerCount: 3, max: 50, prize: "K700", status: "LIVE", details: "Winner takes K700. VIP high stakes.", rules: "15 min rapid." },
  { id: "FREE1", name: "🎁 Free Practice", stake: 0, playerCount: 25, max: 200, prize: "K0", status: "LIVE", details: "Free. Practice vs computer or players.", rules: "No prize, just points." },
];
let courses = [
  { id: "C1", title: "Beginner: How Pieces Move", level: "Beginner", lessons: 8, time: "45 min", desc: "Pawn, Knight, Bishop, Rook, Queen, King + Castling + En Passant. Perfect for new players.", video: "Learn in 8 short lessons" },
  { id: "C2", title: "Openings Every Zambian Must Know", level: "Beginner", lessons: 10, time: "1 hr", desc: "Italian Game, Sicilian, London System, Caro-Kann. What to play as White and Black.", video: "10 lessons" },
  { id: "C3", title: "Tactics: Forks, Pins & Skewers", level: "Intermediate", lessons: 12, time: "1.5 hr", desc: "Win material in 2 moves. 100 puzzles to train your eye.", video: "12 lessons + puzzles" },
  { id: "C4", title: "Endgames That Win Money", level: "Intermediate", lessons: 9, time: "1 hr", desc: "King + Queen vs King, Rook endgames, Opposition, Pawn promotion.", video: "9 lessons" },
  { id: "C5", title: "Pro: Calculation & Strategy", level: "Advanced", lessons: 15, time: "2 hr", desc: "Pawn structures, weak squares, prophylaxis, how GMs think 5 moves ahead.", video: "15 lessons" },
  { id: "C6", title: "Blitz & Arena Psychology", level: "Advanced", lessons: 6, time: "40 min", desc: "How to win K5/K10 arenas: time management, tilt control, streak strategy.", video: "6 lessons" },
];
let leaderboard = [];
let waiting = null;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" } });
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
    if (request.method === 'OPTIONS') return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" } });
    if (url.pathname === '/ws') {
      const upgrade = request.headers.get('Upgrade');
      if (upgrade !== 'websocket') return new Response('Expected websocket', { status: 426 });
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      server.addEventListener('message', (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m.type === 'find-game') {
            if (!waiting) { waiting = { ws: server, username: m.username }; server.send(JSON.stringify({ type: 'waiting' })); }
            else { const opp = waiting; waiting = null; const room = 'ROOM-' + Math.floor(Math.random()*9000+1000); server.send(JSON.stringify({ type: 'game-start', room, opponent: opp.username, color: 'black' })); try { opp.ws.send(JSON.stringify({ type: 'game-start', room, opponent: m.username, color: 'white' })); } catch {} }
          }
          if (m.type === 'move') server.send(JSON.stringify({ type: 'move-ack', move: m.move }));
        } catch {}
      });
      return new Response(null, { status: 101, webSocket: client });
    }

    // COURSES
    if (url.pathname === '/api/courses' && request.method === 'GET') return json({ courses });
    if (url.pathname.startsWith('/api/courses/') && request.method === 'GET') {
      const id = url.pathname.split('/').pop();
      const c = courses.find(x => x.id === id);
      if (!c) return json({ error: 'Course not found' }, 404);
      return json({ course: c });
    }

    // ARENA DETAILS - After payment, frontend calls this
    if (url.pathname.startsWith('/api/arena/') && request.method === 'GET') {
      const id = url.pathname.split('/').pop();
      const t = tournaments.find(x => x.id === id);
      if (!t) return json({ error: 'Arena not found' }, 404);
      const pot = t.stake * t.playerCount;
      const net = pot - (pot*0.10) - (pot*0.10*0.16);
      return json({ arena: t, pot, winnerPrize: Math.round(net*0.70), secondPrize: Math.round(net*0.30), players: t.playerCount, max: t.max, canEnter: true, nextGame: "Join now - game starts when 2 players ready" });
    }
    if (url.pathname === '/api/tournaments' && request.method === 'GET') return json({ tournaments });

    // COMPUTER GAME - Frontend sends your move, computer replies
    if (url.pathname === '/api/play/computer' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      const moves = ["e5", "c5", "e6", "c6", "Nf6", "d5", "Nc6", "d6", "g6", "b6"];
      const compMove = moves[Math.floor(Math.random()*moves.length)];
      return json({ ok: true, computerMove: compMove, yourMove: b.move || "", msg: "Computer played " + compMove, difficulty: b.difficulty || "easy" });
    }

    // AUTH
    if ((url.pathname === '/api/register' || url.pathname === '/api/auth/register') && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      const username = b.username || b.email || b.name;
      if (!username || !b.password) return json({ error: 'Username + password required' }, 400);
      if (users[username]) return json({ error: 'Username taken' }, 400);
      users[username] = { name: b.name || username, username, email: b.email || '', password: b.password };
      if (balances[username] === undefined) balances[username] = 0;
      return json({ ok: true, user: { name: users[username].name, username, email: users[username].email }, balance: 0, msg: 'Account created. Code: 123456' });
    }
    if ((url.pathname === '/api/login' || url.pathname === '/api/auth/login') && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      const username = b.username || b.email;
      const u = users[username];
      if (!u || u.password !== b.password) return json({ error: 'Wrong username or password' }, 401);
      return json({ ok: true, user: { name: u.name, username: u.username, email: u.email }, balance: balances[username] || 0 });
    }
    if ((url.pathname === '/api/verify' || url.pathname === '/api/auth/verify' || url.pathname === '/api/auth/verify-code') && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      if (String(b.code) === '123456' || String(b.verificationCode) === '123456') return json({ ok: true, msg: 'Verified' });
      return json({ error: 'Wrong code. Demo code is 123456' }, 400);
    }
    if (url.pathname === '/api/balance' && request.method === 'GET') return json({ balance: balances[url.searchParams.get('username')] || 0 });
    if (url.pathname === '/api/pay/deposit' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      const amt = Number(b.amount) || 0;
      if (balances[b.username] === undefined) balances[b.username] = 0;
      balances[b.username] += amt;
      return json({ ok: true, balance: balances[b.username] });
    }
    if (url.pathname === '/api/pay/withdraw' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      const amt = Number(b.amount) || 0;
      if ((balances[b.username] || 0) < amt) return json({ error: 'Not enough balance' }, 400);
      balances[b.username] -= amt;
      return json({ ok: true, balance: balances[b.username] });
    }
    if (url.pathname === '/api/pay/join-arena' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      const t = tournaments.find(x => x.id === b.tournamentId);
      if (!t) return json({ error: 'Arena not found' }, 404);
      const stake = Number(b.stake ?? t.stake) || 0;
      if ((balances[b.username] || 0) < stake) return json({ error: 'Not enough balance. Deposit first.' }, 400);
      balances[b.username] -= stake;
      t.playerCount += 1;
      const pot = stake * t.playerCount;
      const net = pot - (pot*0.10) - (pot*0.10*0.16);
      // IMPORTANT: return arena details so frontend can ENTER arena
      return json({ ok: true, balance: balances[b.username], pot, winner: Math.round(net*0.70), second: Math.round(net*0.30), tournament: t, arena: t, enterUrl: "/arena/" + t.id, msg: "Paid! Entering " + t.name });
    }
    if (url.pathname === '/api/pay/refund' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      const stake = Number(b.stake) || 0;
      if (balances[b.username] === undefined) balances[b.username] = 0;
      balances[b.username] += stake;
      return json({ ok: true, balance: balances[b.username] });
    }
    if (url.pathname === '/api/game-result' && request.method === 'POST') {
      const b = await request.json().catch(() => ({}));
      let pts = b.result === 'win' ? 2 : b.result === 'draw' ? 1 : 0;
      if (b.result === 'win' && b.streak >= 3) pts = 4;
      let entry = leaderboard.find(x => x.username === b.username);
      if (!entry) { entry = { name: b.name || b.username, username: b.username, points: 0, wins: 0, games: 0 }; leaderboard.push(entry); }
      entry.points += pts; entry.games += 1;
      if (b.result === 'win') entry.wins += 1;
      leaderboard.sort((a, c) => c.points - a.points);
      return json({ ok: true, points: entry.points, leaderboard: leaderboard.slice(0, 20) });
    }
    if (url.pathname === '/api/leaderboard' && request.method === 'GET') return json({ leaderboard: leaderboard.slice(0, 20) });
    return json({ error: 'Not found: ' + url.pathname }, 404);
  }
};


