import { db } from "../utils/db.js";

const routes = [];

// GET /api/logs
routes.push({
  method: "GET",
  path: "/",
  handler: async ({ env }) => {
    try {
      const logs = await db.queryAll(
        env,
        "SELECT id, message, operated_at FROM logs ORDER BY operated_at DESC, id DESC LIMIT 100"
      );
      return new Response(JSON.stringify({ logs }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "ログ取得に失敗しました" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});

// ログ登録用関数（Cloudflare Workers用: env, messageを引数に取る）
export async function insertLog(env, message) {
  try {
    await db.execute(
      env,
      "INSERT INTO logs (message, operated_at) VALUES (?, datetime('now', 'localtime'))",
      [message]
    );
  } catch (e) {
    console.error('ログ登録失敗:', e);
  }
}

export default { routes };