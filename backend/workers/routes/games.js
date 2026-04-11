import { db } from "../utils/db.js";
import { format } from "../utils/format.js";

const routes = [];

/**
 * GET /api/games
 * 全ゲーム一覧
 */
routes.push({
  method: "GET",
  path: "/",
  handler: async ({ env }) => {
    try {
      const games = await db.queryAll(
        env,
        `SELECT * FROM games ORDER BY id DESC`
      );
      return format.response(true, games);
    } catch (e) {
      return format.error(e);
    }
  },
});

/**
 * GET /api/games/:id
 * 1ゲーム詳細（players と results を JOIN）
 */
routes.push({
  method: "GET",
  path: "/:id",
  handler: async ({ env, params }) => {
    try {
      const id = params.id;

      const game = await db.queryOne(env,
        `SELECT * FROM games WHERE id = ?`,
        [id]
      );
      if (!game) return format.notFound("Game not found");

      const players = await db.queryAll(env,
        `
        SELECT gp.player_id, p.name
        FROM game_players gp
        JOIN players p ON p.id = gp.player_id
        WHERE gp.game_id = ?
        ORDER BY gp.seat
        `,
        [id]
      );

      const results = await db.queryAll(env,
        `
        SELECT r.*, p.name
        FROM results r
        JOIN players p ON p.id = r.player_id
        WHERE r.game_id = ?
        ORDER BY r.rank ASC
        `,
        [id]
      );

      return format.response(true, {
        ...game,
        players,
        results,
      });
    } catch (e) {
      return format.error(e);
    }
  },
});

/**
 * GET /api/games/recent
 * 最新10件
 */
routes.push({
  method: "GET",
  path: "/recent/list",
  handler: async ({ env }) => {
    try {
      const rows = await db.queryAll(
        env,
        `SELECT * FROM games ORDER BY start_time DESC LIMIT 10`
      );
      return format.response(true, rows);
    } catch (e) {
      return format.error(e);
    }
  },
});

/**
 * GET /api/games/by-player/:playerId
 * 特定プレイヤーが参加したゲーム一覧
 */
routes.push({
  method: "GET",
  path: "/by-player/:playerId",
  handler: async ({ env, params }) => {
    try {
      const rows = await db.queryAll(
        env,
        `
        SELECT g.*
        FROM games g
        JOIN game_players gp ON gp.game_id = g.id
        WHERE gp.player_id = ?
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

/**
 * POST /api/games
 * 新規作成
 */
routes.push({
  method: "POST",
  path: "/",
  handler: async ({ env, body }) => {
    try {
      // フロントエンドから送られるデータを取得
      const {
        date,        // YYYY-MM-DD
        ruleId,      // ルールID
        rounds = [], // 各半荘の配列
      } = body || {};

      // roundsの数だけgamesテーブルにmatch_number=1,2,3...で登録
      const gameIds = [];
      for (let i = 0; i < rounds.length; i++) {
        // gamesテーブルに1件INSERTし、lastInsertIdを必ず取得
        const result = await db.execute(
          env,
          `INSERT INTO games (date, match_number, umaoka_rule_id) VALUES (?, ?, ?)` ,
          [date, i + 1, ruleId]
        );
        let gameId = result.lastInsertId;
        if (!gameId) {
          // フォールバック: 直近のidをSELECTで取得
          const lastGame = await db.queryOne(env, 'SELECT MAX(id) as maxId FROM games');
          gameId = lastGame?.maxId;
        }
        if (!gameId) throw new Error('gameIdが取得できませんでした');
        gameIds.push(gameId);

        // game_resultsのidもAUTOINCREMENTなのでid省略でOK
        if (rounds[i].players) {
          for (let j = 0; j < rounds[i].players.length; j++) {
            const player = rounds[i].players[j];
            await db.execute(
              env,
              `INSERT INTO game_results (game_id, player_id, final_score, rank, final_point) VALUES (?, ?, ?, ?, ?)` ,
              [gameId, player.playerId, player.score, player.rank, player.point ?? 0]
            );
          }
        }
      }

      return format.response(true, { ids: gameIds });
    } catch (e) {
      return format.error(e);
    }
  },
});

/**
 * PUT /api/games/:id
 * 更新
 */
routes.push({
  method: "PUT",
  path: "/:id",
  handler: async ({ env, params, body }) => {
    try {
      const {
        rule,
        start_time,
        end_time,
        note,
        player_ids = [],
      } = body || {};

      const exists = await db.queryOne(env,
        `SELECT id FROM games WHERE id = ?`,
        [params.id]
      );
      if (!exists) return format.notFound("Game not found");

      await db.execute(
        env,
        `
        UPDATE games
        SET rule = ?, start_time = ?, end_time = ?, note = ?
        WHERE id = ?
        `,
        [rule, start_time, end_time, note, params.id]
      );

      // プレイヤー構成を更新 → いったん削除して登録し直す
      await db.execute(env,
        `DELETE FROM game_players WHERE game_id = ?`,
        [params.id]
      );

      for (let i = 0; i < player_ids.length; i++) {
        await db.execute(env,
          `
          INSERT INTO game_players (game_id, player_id, seat)
          VALUES (?, ?, ?)
          `,
          [params.id, player_ids[i], i + 1]
        );
      }

      return format.response(true, { id: params.id });
    } catch (e) {
      return format.error(e);
    }
  },
});

/**
 * DELETE /api/games/:id
 */
routes.push({
  method: "DELETE",
  path: "/:id",
  handler: async ({ env, params }) => {
    try {
      await db.execute(env,
        `DELETE FROM games WHERE id = ?`,
        [params.id]
      );
      return format.response(true, { id: params.id });
    } catch (e) {
      return format.error(e);
    }
  },
});

export default { routes };