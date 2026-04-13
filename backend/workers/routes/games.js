
import { db } from "../utils/db.js";
import { format } from "../utils/format.js";
import { insertLog } from "./logs.js";

const routes = [];

function formatLogDate(date) {
  return String(date).replace(/-/g, "年").replace(/(\d{4})年(\d{2})年(\d{2})/, "$1年$2月$3日");
}

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

// --- 追加: 対局日一覧エンドポイント ---
routes.push({
  method: "GET",
  path: "/dates",
  handler: async ({ env }) => {
    try {
      const rows = await db.queryAll(
        env,
        `SELECT DISTINCT date FROM games ORDER BY date DESC`
      );
      const dates = rows.map(row => String(row.date ?? "").trim()).filter(Boolean);
      // 他APIと同じ返し方に統一
      return Response.json({
        ok: true,
        data: dates,
      });
    } catch (e) {
      return Response.json({
        ok: false,
        data: null,
        message: e.message,
      });
    }
  },
});

// 日付指定で1日分の詳細な試合データを返すエンドポイント
routes.push({
  method: "GET",
  path: "/by-date",
  handler: async ({ env, query }) => {
    try {
      const date = String(query?.get?.("date") ?? "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return Response.json({ ok: false, error: "date は YYYY-MM-DD 形式で指定してください" }, { status: 400 });
      }

      // SQL: 1日分の全ゲーム・全プレイヤー・ルール情報をJOINで取得
      const rows = await db.queryAll(
        env,
        `SELECT
          g.id AS game_id,
          g.date,
          g.match_number,
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
        WHERE g.date = ?
        ORDER BY g.match_number ASC, gr.rank ASC
        `,
        [date]
      );

      // groupResultRowsByDate相当の整形
      const getJapaneseWeekday = (dateValue) => {
        const d = new Date(`${dateValue}T00:00:00`);
        const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
        return Number.isNaN(d.getTime()) ? "" : weekdays[d.getDay()];
      };
      const dateMap = new Map();
      for (const row of rows) {
        if (!dateMap.has(row.date)) {
          dateMap.set(row.date, {
            date: row.date,
            day: getJapaneseWeekday(row.date),
            games: [],
            participants: [],
          });
        }
        const dateEntry = dateMap.get(row.date);
        let gameEntry = dateEntry.games.find((game) => game.gameId === row.game_id);
        if (!gameEntry) {
          gameEntry = {
            gameId: row.game_id,
            matchNumber: row.match_number,
            rule: {
              id: row.rule_id,
              name: row.rule_name,
              oka: row.oka,
              uma1: row.uma1,
              uma2: row.uma2,
              startScore: row.start_score,
            },
            players: [],
          };
          dateEntry.games.push(gameEntry);
        }
        const playerEntry = {
          playerId: row.player_id,
          name: row.player_name,
          iconPath: row.icon_path,
          rank: row.rank,
          finalScore: row.final_score,
          finalPoint: row.final_point,
        };
        gameEntry.players.push(playerEntry);
        if (!dateEntry.participants.some((player) => player.playerId === row.player_id)) {
          dateEntry.participants.push({
            playerId: row.player_id,
            name: row.player_name,
            iconPath: row.icon_path,
          });
        }
      }
      const dateEntry = Array.from(dateMap.values())[0];
      if (!dateEntry) {
        return Response.json({
          ok: true,
          date,
          day: getJapaneseWeekday(date),
          ruleId: null,
          participants: [],
          games: []
        });
      }
      const primaryRule = dateEntry.games[0]?.rule ?? null;
      return Response.json({
        ok: true,
        date: dateEntry.date,
        day: dateEntry.day,
        ruleId: primaryRule?.id ?? null,
        rule: primaryRule,
        participants: dateEntry.participants,
        games: dateEntry.games,
      });
    } catch (e) {
      return Response.json({ ok: false, error: e.message }, { status: 500 });
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
      const {
        date,        // YYYY-MM-DD
        ruleId,      // ルールID
        rounds = [], // 各半荘の配列
        message      // ログ用メッセージ（フロントエンドで生成）
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

      // ログ登録（メッセージはバックエンドで生成）
      const msg = `${formatLogDate(date)}の試合データの登録が完了しました。`;
      await insertLog(env, msg);

      return format.response(true, { ids: gameIds });
    } catch (e) {
      return format.error(e);
    }
  },
});

/**
 * PUT /api/games
 * 指定日付の全ゲーム（複数半荘）を一括で置き換え
 */
routes.push({
  method: "PUT",
  path: "/",
  handler: async ({ env, body }) => {
    try {
      const { date, ruleId, rounds = [], message } = body || {};
      if (!/^[\d]{4}-[\d]{2}-[\d]{2}$/.test(date)) {
        return format.error("日付の形式が不正です");
      }
      if (!Number.isInteger(ruleId) || ruleId <= 0) {
        return format.error("基準ルールを選択してください");
      }
      if (!Array.isArray(rounds) || rounds.length === 0) {
        return format.error("登録する試合がありません");
      }

      // 既存データ削除
      await db.execute(env, `DELETE FROM game_results WHERE game_id IN (SELECT id FROM games WHERE date = ?)` , [date]);
      await db.execute(env, `DELETE FROM games WHERE date = ?`, [date]);

      // ルール情報取得
      const ruleRow = await db.queryOne(env, `SELECT * FROM uma_oka_rules WHERE id = ?`, [ruleId]);
      if (!ruleRow) return format.error("基準ルールが見つかりません");
      const startPoint = Number(ruleRow.start_score ?? 0);
      const uma1 = Number(ruleRow.uma1 ?? 0);
      const uma2 = Number(ruleRow.uma2 ?? 0);
      const oka = Number(ruleRow.oka ?? 30000);

      // 各半荘を新規登録
      const gameIds = [];
      for (let i = 0; i < rounds.length; i++) {
        const result = await db.execute(env, `INSERT INTO games (date, match_number, umaoka_rule_id) VALUES (?, ?, ?)`, [date, i + 1, ruleId]);
        let gameId = result.lastInsertId;
        if (!gameId) {
          const lastGame = await db.queryOne(env, 'SELECT MAX(id) as maxId FROM games');
          gameId = lastGame?.maxId;
        }
        if (!gameId) throw new Error('gameIdが取得できませんでした');
        gameIds.push(gameId);

        if (rounds[i].players) {
          for (let j = 0; j < rounds[i].players.length; j++) {
            const player = rounds[i].players[j];
            // final_point計算
            const rank = Number(player.rank);
            const score = Number(player.score);
            // rank point計算
            const rankPoints = [uma1 + ((oka - startPoint) * 4) / 1000, uma2, -uma2, -uma1];
            const rankIndex = Math.max(0, Math.min(3, rank - 1));
            const basePoint = (score - oka) / 1000;
            const finalPoint = Number((basePoint + Number(rankPoints[rankIndex] ?? 0)).toFixed(1));
            await db.execute(
              env,
              `INSERT INTO game_results (game_id, player_id, final_score, rank, final_point) VALUES (?, ?, ?, ?, ?)` ,
              [gameId, player.playerId, score, rank, finalPoint]
            );
          }
        }
      }

      // ログ登録（メッセージはバックエンドで生成）
      const msg = `${formatLogDate(date)}の試合データの編集が完了しました。`;
      await insertLog(env, msg);

      return format.response(true, { ids: gameIds });
    } catch (e) {
      return format.error(e);
    }
  },
});

/**
 * DELETE /api/games
 * 指定日付の全ゲーム（複数半荘）を一括削除
 */
routes.push({
  method: "DELETE",
  path: "/",
  handler: async ({ env, query, body, request }) => {
    try {
      // クラウドフレアWorkersのDELETEはbodyが空になることがあるので、URLSearchParamsも見る
      let date = "";
      if (query?.date) {
        date = String(query.date).trim();
      } else if (body?.date) {
        date = String(body.date).trim();
      } else if (request) {
        // 万が一のためraw query stringからも取得
        const url = new URL(request.url);
        date = url.searchParams.get("date")?.trim() || "";
      }
      console.log("[DELETE /api/games] date=", date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.error("dateパラメータ不正:", date);
        return Response.json({ ok: false, error: "date は YYYY-MM-DD 形式で指定してください" }, { status: 400 });
      }
      // 削除前に件数取得
      const countRow = await db.queryOne(env, "SELECT COUNT(*) AS count FROM games WHERE date = ?", [date]);
      const deletedCount = Number(countRow?.count ?? 0);
      await db.execute(env, `DELETE FROM game_results WHERE game_id IN (SELECT id FROM games WHERE date = ?)` , [date]);
      await db.execute(env, `DELETE FROM games WHERE date = ?`, [date]);
      if (deletedCount === 0) {
        console.error("削除対象の対局データが見つかりません: ", date);
        return Response.json({ ok: false, error: "削除対象の対局データが見つかりません" }, { status: 404 });
      }
      // ログ登録（メッセージはバックエンドで生成）
      let msg;
      if (deletedCount === 0) {
        msg = `${formatLogDate(date)}の試合データの削除に失敗しました。`;
        await insertLog(env, msg);
        return Response.json({ ok: false, error: "削除対象の対局データが見つかりません" }, { status: 404 });
      }
      msg = `${formatLogDate(date)}の試合データの削除が完了しました。`;
      await insertLog(env, msg);
      return Response.json({ ok: true, message: "対局データを削除しました", deletedCount });
    } catch (e) {
      console.error("[DELETE /api/games]", e);
      return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
    }
  },
});


export default { routes };