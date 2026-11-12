import { db } from "../utils/db.js";
import { format } from "../utils/format.js";
import { rules } from "../utils/rules.js";
import { groupResultRows } from "../utils/resultGroups.js";
// GET /api/results/recent (Express互換)

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

  // 現在の game_results を取得（素点 / player_id）
  const rows = await db.queryAll(
    env,
    `
    SELECT id, player_id, final_score, rank, final_point
    FROM game_results
    WHERE game_id = ?
    ORDER BY id ASC
    `,
    [gameId]
  );

  if (rows.length === 0) return;

  const scores = rows.map((r) => Number(r.final_score));

  // UMA/OKA 情報はゲームの rule より取得したと仮定
  const umaList = game.uma ? JSON.parse(game.uma) : [20, 10, -10, -20];
  const okaPoints = game.oka ?? 0;

  const calc = rules.calculate(scores, {
    uma: umaList,
    oka: okaPoints,
  });

  // game_results 更新
  for (let i = 0; i < rows.length; i++) {
    const r = calc[i];
    await db.execute(
      env,
      `
      UPDATE game_results
      SET rank = ?, final_point = ?, final_score = ?
      WHERE id = ?
      `,
      [r.rank, r.point, r.score, rows[i].id]
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


// /api/results GET (Express互換: 年ごとグループ化)
routes.push({
  method: "GET",
  path: "/",
  handler: async ({ env, query }) => {
    try {
      // 年リスト取得
      const years = await db.queryAll(env, `SELECT substr(date, 1, 4) AS year, COUNT(*) AS gameCount FROM games GROUP BY substr(date, 1, 4) ORDER BY year DESC`);
      if (!years || years.length === 0) {
        return format.response(true, { year: null, availableYears: [], dates: [] });
      }
      const requestedYear = String(query?.get?.("year") ?? years[0].year).trim();
      if (!/^\d{4}$/.test(requestedYear)) {
        return format.response(false, null, "year は4桁の西暦で指定してください");
      }
      // 指定年の全対局データを取得し、dateごとにグループ化
      const rows = await db.queryAll(env, `
        SELECT
          g.id AS game_id,
          g.date,
          g.match_number,
          g.play_mode,
          u.id AS rule_id,
          u.name AS rule_name,
          u.oka,
          u.uma1,
          u.uma2,
          u.start_score,
          p.id AS player_id,
          p.name AS player_name,
          p.icon_path,
          gr.rank,
          gr.final_score,
          gr.final_point
        FROM games g
        JOIN game_results gr ON gr.game_id = g.id
        JOIN players p ON p.id = gr.player_id
        LEFT JOIN uma_oka_rules u ON u.id = g.umaoka_rule_id
        WHERE substr(g.date, 1, 4) = ?
        ORDER BY g.date DESC, g.match_number ASC, gr.rank ASC
      `, [requestedYear]);

      // 取得行を日付・半荘単位にまとめ、一覧表示用の形に整える。
      const dates = groupResultRows(rows);

      // レスポンスをdata直下に展開する（data.dataの二重構造をやめる）
      return new Response(
        JSON.stringify({
          ok: true,
          year: requestedYear,
          availableYears: years,
          dates,
          message: ""
        }),
        { headers: { "Content-Type": "application/json" } }
      );
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
  path: "/recent",
  handler: async ({ env }) => {
    try {
      // まず直近5日分の日付リストを取得
      const dateRows = await db.queryAll(
        env,
        `SELECT DISTINCT g.date FROM games g ORDER BY g.date DESC LIMIT 5`
      );
      const recentDates = dateRows.map(row => row.date);
      if (recentDates.length === 0) {
        return format.response(true, []);
      }
      // その日付に該当する全game_resultsを取得
      const rows = await db.queryAll(
        env,
        `
        SELECT r.*, g.date, g.match_number, g.play_mode, p.name, p.icon_path, u.id as rule_id, u.name as rule_name, u.oka, u.uma1, u.uma2, u.start_score
        FROM game_results r
        JOIN games g ON g.id = r.game_id
        JOIN players p ON p.id = r.player_id
        LEFT JOIN uma_oka_rules u ON u.id = g.umaoka_rule_id
        WHERE g.date IN (${recentDates.map(() => '?').join(',')})
        ORDER BY g.date DESC, g.match_number ASC, r.rank ASC
        `,
        recentDates
      );

      // 取得行を共通形式に変換し、直近5日分だけ返す。
      const dates = groupResultRows(rows).slice(0, 5);

      return format.response(true, dates);
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
        SELECT r.*, g.date, g.umaoka_rule_id
        FROM game_results r
        JOIN games g ON g.id = r.game_id
        WHERE r.player_id = ?
        ORDER BY g.date DESC
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
        INSERT INTO game_results (game_id, player_id, final_score, rank, final_point)
        VALUES (?, ?, ?, ?, ?)
        `,
        [game_id, player_id, body.final_score, body.rank, body.final_point]
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
        `SELECT * FROM game_results WHERE id = ?`,
        [params.id]
      );
      if (!row) return format.notFound("Result not found");

      await db.execute(
        env,
        `
        UPDATE game_results SET final_score = ?, rank = ?, final_point = ?
        WHERE id = ?
        `,
        [body.final_score, body.rank, body.final_point, params.id]
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
        `SELECT * FROM game_results WHERE id = ?`,
        [params.id]
      );
      if (!row) return format.notFound("Result not found");

      await db.execute(env,
        `DELETE FROM game_results WHERE id = ?`,
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
