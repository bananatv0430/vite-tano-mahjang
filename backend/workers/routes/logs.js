import { db } from "../utils/db.js";
import { format } from "../utils/format.js";
import { rules } from "../utils/rules.js";

const routes = [];

/* ------------------------------
 * Helpers
 * ------------------------------ */

/**
 * 指定ゲームの結果を再計算し results と games を更新
 */
async function recalcGame(env, gameId) {
  // ゲーム設定（rule / oka / uma など）取得
  const game = await db.queryOne(
    env,
    `SELECT * FROM games WHERE id = ?`,
    [gameId]
  );
  if (!game) return;

  // 現在の results を取得（素点 / player_id）
  const rows = await db.queryAll(
    env,
    `
    SELECT id, player_id, score_raw
    FROM results
    WHERE game_id = ?
    ORDER BY id ASC
    `,
    [gameId]
  );

  if (rows.length === 0) return;

  const scores = rows.map((r) => Number(r.score_raw));

  // UMA/OKA 情報はゲームの rule より取得したと仮定
  const umaList = game.uma ? JSON.parse(game.uma) : [20, 10, -10, -20];
  const okaPoints = game.oka ?? 0;

  const calc = rules.calculate(scores, {
    uma: umaList,
    oka: okaPoints,
  });

  // results 更新
  for (let i = 0; i < rows.length; i++) {
    const r = calc[i];
    await db.execute(
      env,
      `
      UPDATE results
      SET rank = ?, uma = ?, score_total = ?
      WHERE id = ?
      `,
      [r.rank, r.uma, r.total, rows[i].id]
    );
  }

  // games テーブルに合計値を格納する（必要なら）
  const total = calc.reduce((sum, r) => sum + r.total, 0);

  await db.execute(
    env,
    `UPDATE games SET total_score = ? WHERE id = ?`,
    [total, gameId]
  );
}

/* ------------------------------
 * GET /api/results
 * ------------------------------ */

routes.push({
  method: "GET",
  path: "/",
  handler: async ({ env }) => {
    try {
      const rows = await db.queryAll(env, `SELECT * FROM results ORDER BY id DESC`);
      return format.response(true, rows);
    } catch (e) {
      return format.error(e);
    }
  },
});

/* ------------------------------
 * GET /api/results/recent
 * ------------------------------ */

routes.push({
  method: "GET",
  path: "/recent/list",
  handler: async ({ env }) => {
    try {
      const rows = await db.queryAll(
        env,
        `
        SELECT r.*, g.start_time, p.name
        FROM results r
        JOIN games g ON g.id = r.game_id
        JOIN players p ON p.id = r.player_id
        ORDER BY g.start_time DESC
        LIMIT 10
        `
      );
      return format.response(true, rows);
    } catch (e) {
      return format.error(e);
    }
  },
});

/* ------------------------------
 * GET /api/results/by-player/:playerId
 * ------------------------------ */

routes.push({
  method: "GET",
  path: "/by-player/:playerId",
  handler: async ({ env, params }) => {
    try {
      const rows = await db.queryAll(
        env,
        `
        SELECT r.*, g.start_time, g.rule
        FROM results r
        JOIN games g ON g.id = r.game_id
        WHERE r.player_id = ?
        ORDER BY g.start_time DESC
        `,
        [params.playerId]
      );
      return format.response(true, rows);
    } catch (e) {
      return format.error(e);
    }
  },
});

/* ------------------------------
 * POST /api/results
 * ------------------------------ */

routes.push({
  method: "POST",
  path: "/",
  handler: async ({ env, body }) => {
    try {
      const {
        game_id,
        player_id,
        score_raw,
      } = body || {};

      if (!game_id || !player_id) {
        return format.response(false, null, "game_id and player_id required");
      }

      const result = await db.execute(
        env,
        `
        INSERT INTO results (game_id, player_id, score_raw)
        VALUES (?, ?, ?)
        `,
        [game_id, player_id, score_raw]
      );

      // ゲームを再計算
      await recalcGame(env, game_id);

      return format.response(true, { id: result.lastInsertId });
    } catch (e) {
      return format.error(e);
    }
  },
});

/* ------------------------------
 * PUT /api/results/:id
 * ------------------------------ */

routes.push({
  method: "PUT",
  path: "/:id",
  handler: async ({ env, params, body }) => {
    try {
      const { score_raw } = body || {};

      const row = await db.queryOne(
        env,
        `SELECT * FROM results WHERE id = ?`,
        [params.id]
      );
      if (!row) return format.notFound("Result not found");

      await db.execute(
        env,
        `
        UPDATE results SET score_raw = ?
        WHERE id = ?
        `,
        [score_raw, params.id]
      );

      await recalcGame(env, row.game_id);

      return format.response(true, { id: params.id });
    } catch (e) {
      return format.error(e);
    }
  },
});

/* ------------------------------
 * DELETE /api/results/:id
 * ------------------------------ */

routes.push({
  method: "DELETE",
  path: "/:id",
  handler: async ({ env, params }) => {
    try {
      const row = await db.queryOne(
        env,
        `SELECT * FROM results WHERE id = ?`,
        [params.id]
      );
      if (!row) return format.notFound("Result not found");

      await db.execute(env,
        `DELETE FROM results WHERE id = ?`,
        [params.id]
      );

      await recalcGame(env, row.game_id);

      return format.response(true, { id: params.id });
    } catch (e) {
      return format.error(e);
    }
  },
});

export default { routes };