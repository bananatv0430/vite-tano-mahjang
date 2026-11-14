import { Router } from './utils/router.js';

import playersRoutes from './routes/players.js';
import gamesRoutes from './routes/games.js';
import resultsRoutes from './routes/results.js';
import rankingsRoutes from './routes/rankings.js';
import logsRoutes from './routes/logs.js';
import rulesRoutes from './routes/rules.js';
import replayRoutes from './routes/replays.js';

const router = new Router();

// mount はすべてトップレベルでOK
router.mount('/api/players', playersRoutes);
router.mount('/api/games', gamesRoutes);
router.mount('/api/results', resultsRoutes);
router.mount('/api/rankings', rankingsRoutes);
router.mount('/api/logs', logsRoutes);
router.mount('/api/rules', rulesRoutes);
router.mount('/api/replays', replayRoutes);

// CORSヘッダー
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ======== CORS ========
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ======== R2画像 ========
    if (url.pathname.startsWith("/r2/")) {
      const key = url.pathname.replace("/r2/", "");
      const object = await env.R2_BUCKET.get(key);
      if (!object || !object.body) {
        return new Response("Not Found", { status: 404, headers: corsHeaders });
      }
      return new Response(object.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }

    // ======== API ========
    if (url.pathname.startsWith("/api/")) {
      const apiResponse = await router.handle(request, env, ctx);

      const newHeaders = new Headers(apiResponse.headers);
      Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));

      return new Response(apiResponse.body, {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        headers: newHeaders,
      });
    }

    // ======== SPA fallback（←これが重要） ========
    return env.ASSETS.fetch(
      new Request(new URL("/index.html", request.url))
    );
  }
};