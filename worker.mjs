
// Zed Gambit - Worker P3 Rated Tournaments + Elo - Lichess Style Arena Pairing
import { DurableObject } from "cloudflare:workers";
function calcElo(rA, rB, score, gamesPlayed) {
  const K = gamesPlayed < 30 ? 32 : 20
  const expected = 1 / (1 + Math.pow(10, (rB - rA) / 400))
  return Math.round(rA + K * (score - expected))
}
function seedTournaments() {
  return new Map([
    ['ARENA1', { id: 'ARENA1', name: '🔥 Open Arena - Blitz Rated', format: 'arena', timeControl: 'blitz', stake: 0, rated: true, max: 32, status: 'waiting', players: [], waiting: [], round: 1 }],
    ['RAPID1', { id: 'RAPID1', name: '⚡ Open Arena - Rapid Rated', format: 'arena', timeControl: 'rapid', stake: 0, rated: true, max: 32, status: 'waiting', players: [], waiting: [], round: 1 }],
    ['BULLET1', { id: 'BULLET1', name: '💎 Open Arena - Bullet Rated', format: 'arena', timeControl: 'bullet', stake: 0, rated: true, max: 32, status: 'waiting', players: [], waiting: [], round: 1 }],
    ['MEGA1', { id: 'MEGA1', name: '🌍 Mega Open Arena - Everyone Can Join', format: 'arena', timeControl: 'blitz', stake: 0, rated: true, max: 100, status: 'waiting', players: [], waiting: [], round: 1 }],
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
      if (m.type === 'move') {
        this.fen = m.fen;
        for (const s of this.sockets) { if (s !== server) { try { s.send(JSON.stringify({ type: 'move', fen: m.fen, from: m.from, to: m.to })) } catch {} } }
      }
      if (m.type === 'game-over' && m.rated) {
        const wScore = m.winner === 'draw' ? 0.5 : (m.winner === 'w' ? 1 : 0);
        const bScore = 1 - wScore;
        const newW = calcElo(m.whiteRating, m.blackRating, wScore, m.whiteGames || 0);
        const newB = calcElo(m.blackRating, m.whiteRating, bScore, m.blackGames || 0);
        for (const s of this.sockets) { try { s.send(JSON.stringify({ type: 'rating-update', whiteNew: newW, blackNew: newB, whiteDelta: newW - m.whiteRating, blackDelta: newB - m.blackRating })) } catch {} }
      }
    });
    server.addEventListener('close', () => { this.sockets.delete(server); this.players = this.players.filter(p => p !== server); for (const s of this.sockets) { try { s.send(JSON.stringify({ type: 'player-left' })) } catch {} } });
    return new Response(null, { status: 101, webSocket: client });
  }
}

export class Lobby extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.ctx = ctx; this.env = env; this.users = new Map(); this.tournaments = seedTournaments(); }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/api/tournaments') {
      const tournaments = [...this.tournaments.values()].map(t => ({ id: t.id, name: t.name, format: t.format, timeControl: t.timeControl, stake: t.stake, rated: t.rated, max: t.max, status: t.status, players: t.players.map(p => p.name), playerCount: t.players.length, waitingCount: (t.waiting || []).length, avgRating: t.players.length ? Math.round(t.players.reduce((a,p)=>a+p.rating,0)/t.players.length) : 1200 }));
      return new Response(JSON.stringify({ tournaments }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
    const pair = new WebSocketPair(); const [client, server] = Object.values(pair);
    server.accept();
    let myId = Math.random().toString(36).slice(2, 8).toUpperCase();
    server.send(JSON.stringify({ type: 'welcome', id: myId }));
    const broadcastLobby = () => {
      const users = [...this.users.values()].map(u => ({ id: u.id, name: u.name, rating: u.rating }));
      const tournaments = [...this.tournaments.values()].map(t => ({ id: t.id, name: t.name, format: t.format, timeControl: t.timeControl, stake: t.stake, rated: t.rated, max: t.max, status: t.status, players: t.players.map(p => p.name), playerCount: t.players.length, waitingCount: (t.waiting || []).length, avgRating: t.players.length ? Math.round(t.players.reduce((a,p)=>a+p.rating,0)/t.players.length) : 1200 }));
      for (const u of this.users.values()) { try { u.ws.send(JSON.stringify({ type: 'lobby', users, tournaments })) } catch {} }
    };
    setTimeout(() => {
      const tournaments = [...this.tournaments.values()].map(t => ({ id: t.id, name: t.name, format: t.format, timeControl: t.timeControl, stake: t.stake, rated: t.rated, max: t.max, status: t.status, players: t.players.map(p => p.name), playerCount: t.players.length, waitingCount: (t.waiting || []).length, avgRating: t.players.length ? Math.round(t.players.reduce((a,p)=>a+p.rating,0)/t.players.length) : 1200 }));
      try { server.send(JSON.stringify({ type: 'lobby', users: [...this.users.values()].map(u => ({ id: u.id, name: u.name, rating: u.rating })), tournaments })) } catch {}
    }, 100);
    server.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.type === 'join-lobby') { this.users.set(myId, { id: myId, name: m.name || 'Player', rating: m.rating || 1200, ws: server }); broadcastLobby(); }
      if (m.type === 'challenge') {
        const target = this.users.get(m.to); const me = this.users.get(myId);
        if (target) target.ws.send(JSON.stringify({ type: 'challenge-incoming', from: myId, fromName: me?.name || 'Player', stake: m.stake, room: m.room }));
      }
      if (m.type === 'challenge-accept') {
        const target = this.users.get(m.to);
        if (target) target.ws.send(JSON.stringify({ type: 'challenge-accepted', room: m.room }));
      }
      if (m.type === 'challenge-decline') {
        const target = this.users.get(m.to);
        if (target) target.ws.send(JSON.stringify({ type: 'challenge-declined' }));
      }
      if (m.type === 'create-tournament') {
        const id = Math.random().toString(36).slice(2, 6).toUpperCase();
        const me = this.users.get(myId);
        this.tournaments.set(id, { id, name: m.name, format: 'swiss', timeControl: 'blitz', stake: m.stake, rated: false, max: m.max || 8, status: 'waiting', players: me ? [{ id: myId, name: me.name, rating: me.rating }] : [], waiting: [] });
        broadcastLobby();
      }
      if (m.type === 'create-rated-tournament') {
        const id = Math.random().toString(36).slice(2, 6).toUpperCase();
        const me = this.users.get(myId);
        this.tournaments.set(id, { id, name: m.name, format: m.format || 'arena', timeControl: m.timeControl || 'blitz', stake: m.stake || 0, rated: m.rated !== false, max: m.max || 16, status: 'waiting', players: me ? [{ id: myId, name: me.name, rating: me.rating }] : [], waiting: [], round: 1 });
        broadcastLobby();
      }
      if (m.type === 'join-tournament') {
        const t = this.tournaments.get(m.tournamentId); const me = this.users.get(myId);
        if (t && me && !t.players.find(p => p.id === myId)) {
          t.players.push({ id: myId, name: me.name, rating: me.rating });
          if (!t.waiting) t.waiting = [];
          // LICHESS STYLE: instant pairing
          if (t.format === 'arena') {
            const waitingId = t.waiting.find(id => id !== myId && this.users.get(id));
            if (waitingId) {
              // Pair found! Start rated game instantly for both
              t.waiting = t.waiting.filter(id => id !== waitingId);
              const room = Math.random().toString(36).slice(2, 8).toUpperCase();
              const opponent = this.users.get(waitingId);
              const meUser = this.users.get(myId);
              if (opponent) opponent.ws.send(JSON.stringify({ type: 'game-start', tournamentId: t.id, room, format: t.format, timeControl: t.timeControl, rated: t.rated, opponent: me?.name, opponentRating: me?.rating, color: 'w', message: 'Opponent found! Your rated game is starting...' }));
              if (meUser) meUser.ws.send(JSON.stringify({ type: 'game-start', tournamentId: t.id, room, format: t.format, timeControl: t.timeControl, rated: t.rated, opponent: opponent?.name, opponentRating: opponent?.rating, color: 'b', message: 'Opponent found! Your rated game is starting...' }));
              // Also send old event for backwards compat
              for (const p of [waitingId, myId]) { const u = this.users.get(p); if (u) u.ws.send(JSON.stringify({ type: 'tournament-started', tournamentId: t.id, room, format: t.format })); }
            } else {
              // No one waiting - you are now waiting, like lichess queue
              t.waiting.push(myId);
              const meUser = this.users.get(myId);
              if (meUser) meUser.ws.send(JSON.stringify({ type: 'waiting-for-opponent', tournamentId: t.id, message: 'Searching for opponent... You will start automatically when someone joins.' }));
            }
          } else {
            // Swiss - old logic, needs 4
            if (t.players.length >= 4 && t.status === 'waiting') {
              t.status = 'started';
              const room = Math.random().toString(36).slice(2, 8).toUpperCase();
              for (const p of t.players) { const u = this.users.get(p.id); if (u) u.ws.send(JSON.stringify({ type: 'tournament-started', tournamentId: t.id, room, format: t.format })); }
            }
          }
          broadcastLobby();
        }
      }
      if (m.type === 'game-finished') {
        // Player finished a game - put them back in queue for next game in same arena (lichess arena loop)
        const t = this.tournaments.get(m.tournamentId);
        if (t && t.format === 'arena') {
          if (!t.waiting) t.waiting = [];
          if (!t.waiting.includes(myId)) t.waiting.push(myId);
          const meUser = this.users.get(myId);
          if (meUser) meUser.ws.send(JSON.stringify({ type: 'waiting-for-opponent', tournamentId: t.id, message: 'Game finished! Searching for your next opponent...' }));
          broadcastLobby();
        }
      }
    });
    server.addEventListener('close', () => {
      // Remove from waiting queues if disconnect
      for (const t of this.tournaments.values()) { if (t.waiting) t.waiting = t.waiting.filter(id => id !== myId); }
      this.users.delete(myId); broadcastLobby();
    });
    return new Response(null, { status: 101, webSocket: client });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/tournaments') {
      const id = env.LOBBY.idFromName('global-lobby');
      return env.LOBBY.get(id).fetch(request);
    }
    if (url.pathname === '/ws/lobby') {
      const id = env.LOBBY.idFromName('global-lobby');
      return env.LOBBY.get(id).fetch(request);
    }
    if (url.pathname === '/ws') {
      const room = url.searchParams.get('room') || 'default';
      const id = env.CHESS_ROOM.idFromName(room);
      return env.CHESS_ROOM.get(id).fetch(request);
    }
    return env.ASSETS.fetch(request);
  }
}


