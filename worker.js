// ZED GAMBIT - P2 Live Lobby + Tournaments + Real-time Challenges
// Demo only. No real money.

export class Lobby {
  constructor(state) { this.state = state; this.users = new Map(); this.tournaments = new Map(); }
  async fetch(req) {
    if (req.headers.get("Upgrade") !== "websocket") return new Response("Expected WS", { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    const id = Math.random().toString(36).slice(2, 10);
    let me = { id, name: "Player", rating: 1200, status: "online" };
    this.users.set(id, { ws: server, ...me });
    const broadcast = (obj) => {
      const data = JSON.stringify(obj);
      for (const u of this.users.values()) { try { u.ws.send(data); } catch(e){} }
    };
    const sendList = () => {
      const list = [...this.users.values()].map(u => ({ id: u.id, name: u.name, rating: u.rating, status: u.status }));
      const tours = [...this.tournaments.values()];
      broadcast({ type: "lobby", users: list, tournaments: tours, count: list.length });
    };
    server.addEventListener("message", (e) => {
      try {
        const m = JSON.parse(e.data);
        if (m.type === "join-lobby") { me.name = (m.name || "Player").slice(0, 20); me.rating = m.rating || 1200; const u = this.users.get(id); if (u) { u.name = me.name; u.rating = me.rating; } sendList(); }
        if (m.type === "challenge") {
          const target = this.users.get(m.to);
          if (target) target.ws.send(JSON.stringify({ type: "challenge-incoming", from: id, fromName: me.name, stake: m.stake, room: m.room }));
        }
        if (m.type === "challenge-accept") {
          const target = this.users.get(m.to);
          if (target) target.ws.send(JSON.stringify({ type: "challenge-accepted", room: m.room, by: me.name }));
          server.send(JSON.stringify({ type: "challenge-accepted", room: m.room, by: me.name }));
        }
        if (m.type === "challenge-decline") {
          const target = this.users.get(m.to);
          if (target) target.ws.send(JSON.stringify({ type: "challenge-declined", by: me.name }));
        }
        if (m.type === "create-tournament") {
          const t = { id: Math.random().toString(36).slice(2, 8).toUpperCase(), name: m.name || "Zed Open", stake: m.stake || 20, max: m.max || 8, players: [me.name], status: "open", createdBy: me.name, createdAt: Date.now() };
          this.tournaments.set(t.id, t); sendList();
        }
        if (m.type === "join-tournament") {
          const t = this.tournaments.get(m.tournamentId);
          if (t && t.status === "open" && !t.players.includes(me.name)) {
            t.players.push(me.name);
            if (t.players.length >= t.max) t.status = "full";
            sendList();
          }
        }
      } catch(e){}
    });
    server.addEventListener("close", () => { this.users.delete(id); sendList(); });
    server.send(JSON.stringify({ type: "welcome", id }));
    return new Response(null, { status: 101, webSocket: client });
  }
}

export class ChessRoom {
  constructor(state) { this.state = state; this.sessions = new Set(); this.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"; this.players = {}; }
  async fetch(req) {
    if (req.headers.get("Upgrade") !== "websocket") return new Response("Expected WS", { status: 426 });
    const pair = new WebSocketPair(); const [client, server] = Object.values(pair); server.accept();
    const id = Math.random().toString(36).slice(2, 10);
    const session = { ws: server, id, color: null }; this.sessions.add(session);
    if (!this.players.white) { this.players.white = id; session.color = "w"; }
    else if (!this.players.black) { this.players.black = id; session.color = "b"; }
    else session.color = "spectator";
    server.send(JSON.stringify({ type: "assign", color: session.color, fen: this.fen, players: Object.keys(this.players).length }));
    server.addEventListener("message", (e) => {
      try { const msg = JSON.parse(e.data);
        if (msg.type === "move") { const turn = this.fen.split(" ")[1]; if (session.color !== turn) return; if (!msg.fen) return; this.fen = msg.fen; this.broadcast({ type: "move", fen: this.fen, from: msg.from, to: msg.to, by: session.color }); }
        if (msg.type === "reset") { this.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"; this.broadcast({ type: "move", fen: this.fen, reset: true }); }
      } catch(e){}
    });
    server.addEventListener("close", () => { this.sessions.delete(session); if (this.players.white === id) delete this.players.white; if (this.players.black === id) delete this.players.black; this.broadcast({ type: "player-left", players: Object.keys(this.players).length }); });
    return new Response(null, { status: 101, webSocket: client });
  }
  broadcast(o) { const d = JSON.stringify(o); for (const s of this.sessions) { try { s.ws.send(d); } catch(e){} } }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") return new Response(JSON.stringify({ ok: true, service: "zed-gambit", mode: "p2-lobby" }), { headers: { "content-type": "application/json" } });
    if (url.pathname === "/ws/lobby") {
      const id = env.LOBBY.idFromName("global-lobby");
      return env.LOBBY.get(id).fetch(request);
    }
    if (url.pathname === "/ws") {
      const room = url.searchParams.get("room") || "LOBBY";
      return env.CHESS_ROOM.get(env.CHESS_ROOM.idFromName(room)).fetch(request);
    }
    if (env.ASSETS) {
      try { let res = await env.ASSETS.fetch(request); if (res.status === 404 && !url.pathname.includes(".")) res = await env.ASSETS.fetch(new Request(new URL("/index.html", url.origin), request)); return res; } catch(e){}
    }
    return new Response("ZED GAMBIT Worker running", { headers: { "content-type": "text/plain" } });
  }
};
