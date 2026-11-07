// ZED GAMBIT - P0 Baseline Worker
// Serves static site + /health. No real-money, no auth, no game logic yet.
// OnlineChess.jsx is currently local demo only, so this Worker does NOT change game behaviour.

export class ChessRoom {
  constructor(state) {
    this.state = state;
  }
  async fetch(request) {
    return new Response(JSON.stringify({ ok: true, message: "ChessRoom exists - real multiplayer not wired yet (P0 baseline)" }), {
      headers: { "content-type": "application/json" }
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, service: "zed-gambit", time: new Date().toISOString() }), {
        headers: { "content-type": "application/json" }
      });
    }

    // Serve static site from Workers Assets, SPA fallback to index.html
    if (env.ASSETS) {
      try {
        let res = await env.ASSETS.fetch(request);
        if (res.status === 404 && !url.pathname.includes(".")) {
          const indexReq = new Request(new URL("/index.html", url.origin), request);
          res = await env.ASSETS.fetch(indexReq);
        }
        return res;
      } catch (e) {
        // fall through to message below
      }
    }

    return new Response("ZED GAMBIT Worker is running. Deploy with Workers Static Assets.", {
      headers: { "content-type": "text/plain" }
    });
  }
};


2. Create wrangler.toml — NEW FILE at repo root

Add file → Create new file → Name it wrangler.toml → Paste this:

toml
name = "zed-gambit"
main = "worker.js"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "./dist"
binding = "ASSETS"

[[durable_objects.bindings]]
name = "CHESS_ROOM"
class_name = "ChessRoom"

[[migrations]]
new_sqlite_classes = ["ChessRoom"]
tag = "v1"


