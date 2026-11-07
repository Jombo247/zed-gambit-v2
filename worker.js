// ZED GAMBIT - P1 Real Multiplayer
// Durable Object ChessRoom: 2 players, WebSocket, turn enforcement, FEN relay.
// Demo stakes only. No real money, no payments.

export class ChessRoom {
  constructor(state) {
    this.state = state;
    this.sessions = new Set();
    this.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    this.players = {}; // color -> sessionId
    this.stake = 0;
  }

  async fetch(request) {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    const id = Math.random().toString(36).slice(2, 10);
    const session = { ws: server, id, color: null };
    this.sessions.add(session);

    // Assign color: first = white, second = black, rest = spectator
    if (!this.players.white) { this.players.white = id; session.color = "w"; }
    else if (!this.players.black) { this.players.black = id; session.color = "b"; }
    else { session.color = "spectator"; }

    server.send(JSON.stringify({ type: "assign", color: session.color, fen: this.fen, players: Object.keys(this.players).length }));

    server.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "move") {
          // Enforce turn: only player whose color matches FEN turn can move
          const turn = this.fen.split(" ")[1]; // "w" or "b"
          if (session.color !== turn) return;
          if (!msg.fen) return;
          this.fen = msg.fen;
          this.broadcast({ type: "move", fen: this.fen, from: msg.from, to: msg.to, by: session.color });
        }
        if (msg.type === "reset") {
          this.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
          this.broadcast({ type: "move", fen: this.fen, reset: true });
        }
        if (msg.type === "stake") {
          this.stake = msg.stake || 0;
          this.broadcast({ type: "stake", stake: this.stake });
        }
      } catch (e) {}
    });

    server.addEventListener("close", () => {
      this.sessions.delete(session);
      if (this.players.white === id) delete this.players.white;
      if (this.players.black === id) delete this.players.black;
      this.broadcast({ type: "player-left", players: Object.keys(this.players).length });
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(obj) {
    const data = JSON.stringify(obj);
    for (const s of this.sessions) {
      try { s.ws.send(data); } catch (e) {}
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, service: "zed-gambit", mode: "p1-multiplayer" }), {
        headers: { "content-type": "application/json" }
      });
    }

    if (url.pathname === "/ws") {
      const room = url.searchParams.get("room") || "LOBBY";
      const id = env.CHESS_ROOM.idFromName(room);
      const stub = env.CHESS_ROOM.get(id);
      return stub.fetch(request);
    }

    if (env.ASSETS) {
      try {
        let res = await env.ASSETS.fetch(request);
        if (res.status === 404 && !url.pathname.includes(".")) {
          res = await env.ASSETS.fetch(new Request(new URL("/index.html", url.origin), request));
        }
        return res;
      } catch (e) {}
    }

    return new Response("ZED GAMBIT Worker running", { headers: { "content-type": "text/plain" } });
  }
};

