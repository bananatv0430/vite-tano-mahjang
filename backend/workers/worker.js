import { Router } from './utils/router.js';

import playersRoutes from './routes/players.js';
import gamesRoutes from './routes/games.js';
import resultsRoutes from './routes/results.js';
import rankingsRoutes from './routes/rankings.js';
import logsRoutes from './routes/logs.js';
import rulesRoutes from './routes/rules.js';

const router = new Router();

// mount はすべてトップレベルでOK
router.mount('/api/players', playersRoutes);
router.mount('/api/games', gamesRoutes);
router.mount('/api/results', resultsRoutes);
router.mount('/api/rankings', rankingsRoutes);
router.mount('/api/logs', logsRoutes);
router.mount('/api/rules', rulesRoutes);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ======== R2画像配信（キャッシュ戦略） ========
    if (url.pathname.startsWith("/r2/")) {
      const key = url.pathname.replace("/r2/", "");

      const object = await env.R2_BUCKET.get(key);

      if (!object || !object.body) {
        return new Response("Not Found", { status: 404 });
      }

      return new Response(object.body, {
        headers: {
          "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }

    // ======== 既存API ========
    return router.handle(request, env, ctx);
  }
};