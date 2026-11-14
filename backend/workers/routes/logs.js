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
        `
          SELECT MAX(id) AS id,
            CASE WHEN replay_date IS NULL THEN message
              ELSE replay_date || ? || COUNT(*) || ? END AS message,
            MAX(operated_at) AS operated_at
          FROM (
            SELECT id, message, operated_at,
              CASE WHEN substr(message, 11) = ?
                AND substr(message, 1, 10) = strftime('%Y-%m-%d', substr(message, 1, 10))
                THEN substr(message, 1, 10)
              END AS replay_date
            FROM logs
          )
          GROUP BY replay_date, CASE WHEN replay_date IS NULL THEN id END
          ORDER BY operated_at DESC, id DESC
          LIMIT 100
        `,
        [" の牌譜成績を ", " 件登録しました。", " の牌譜成績を登録しました。"]
      );
      return new Response(JSON.stringify({ logs }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
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