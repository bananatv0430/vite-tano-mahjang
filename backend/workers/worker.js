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

    console.log("TOKEN:", env.IMAGES_API_TOKEN);

    return new Response("ok");

    // ======== ① アイコンアップロード ========
    if (url.pathname === "/api/icon" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("file");

        // バリデーション
        if (!file || !file.type.startsWith("image/")) {
          return new Response("Invalid file", { status: 400 });
        }

        if (file.size > 1024 * 1024) {
          return new Response("File too large", { status: 400 });
        }

        // Images APIへ送信
        const imageForm = new FormData();
        imageForm.append("file", file);

        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/images/v1`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.IMAGES_API_TOKEN}`,
            },
            body: imageForm,
          }
        );

        const data = await res.json();

        if (!data.success) {
          console.error("Images API Error:", data);
          return new Response("Upload failed", { status: 500 });
        }

        const imageUrl = data.result.variants[0];

        // 仮：playerId（あとでログイン連携に変更）
        const playerId = 1;

        // DB更新
        await env.mahjang_db.prepare(`
          UPDATE players
          SET icon_url = ?
          WHERE id = ?
        `).bind(imageUrl, playerId).run();

        return Response.json({ url: imageUrl });

      } catch (err) {
        console.error("Upload error:", err);
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    // ======== ② 既存のローカル画像配信（そのままでOK） ========
    if (url.pathname.startsWith("/uploads/")) {
      let filePath = null;
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const cwd = process.cwd();
        filePath = path.resolve(cwd, "backend", url.pathname.slice(1));
        console.log("[STATIC]", filePath);
        const data = await fs.readFile(filePath);

        const ext = filePath.split('.').pop().toLowerCase();
        let type = "application/octet-stream";
        if (ext === "png") type = "image/png";
        else if (ext === "jpg" || ext === "jpeg") type = "image/jpeg";
        else if (ext === "gif") type = "image/gif";
        else if (ext === "webp") type = "image/webp";

        return new Response(data, { headers: { "Content-Type": type } });

      } catch (e) {
        console.error("[STATIC 404]", filePath, e);
        return new Response("Not Found", { status: 404 });
      }
    }

    // ======== ③ 既存API ========
    return router.handle(request, env, ctx);
  }
};