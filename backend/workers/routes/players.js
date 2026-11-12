
import { db } from "../utils/db.js";
import { format } from "../utils/format.js";

const routes = [];

/**
 * GET /api/players
 */
routes.push({
  method: "GET",
  path: "/",
  handler: async ({ env }) => {
    try {
      const players = await db.queryAll(env,
        `SELECT * FROM players ORDER BY id ASC`
      );
      return format.response(true, players);
    } catch (e) {
      return format.error(e);
    }
  }
});

/**
 * GET /api/players/:id
 */
routes.push({
  method: "GET",
  path: "/:id",
  handler: async ({ env, params }) => {
    try {
      const player = await db.queryOne(env,
        `SELECT * FROM players WHERE id = ?`,
        [params.id]
      );
      if (!player) return format.notFound("Player not found");
      return format.response(true, player);
    } catch (e) {
      return format.error(e);
    }
  }
});

/**
 * GET /api/players/active
 */
routes.push({
  method: "GET",
  path: "/active/list",
  handler: async ({ env }) => {
    try {
      const players = await db.queryAll(env,
        `SELECT * FROM players WHERE is_active = 1 ORDER BY id ASC`
      );
      return format.response(true, players);
    } catch (e) {
      return format.error(e);
    }
  }
});

/**
 * GET /api/players/search?name=xxx
 */
routes.push({
  method: "GET",
  path: "/search",
  handler: async ({ env, query }) => {
    try {
      const name = query.get("name") ?? "";
      const players = await db.queryAll(
        env,
        `SELECT * FROM players WHERE name LIKE ? ORDER BY id ASC`,
        [`%${name}%`]
      );
      return format.response(true, players);
    } catch (e) {
      return format.error(e);
    }
  }
});

// プレイヤーごとの合計・年別成績を返すAPI (Cloudflare Workers形式)
routes.push({
  method: "GET",
  path: "/player-stats/:playerId",
  handler: async ({ env, params, query }) => {
    try {
      const playerId = Number(params.playerId);
      if (!playerId) {
        return new Response(JSON.stringify({ error: "不正なプレイヤーIDです" }), { status: 400 });
      }
      const playModeRaw = String(query?.get("play_mode") ?? "all").toLowerCase();
      const playMode = playModeRaw === "online" || playModeRaw === "offline" ? playModeRaw : "all";
      const modeFilterSql = `
        AND (
          ? = 'all'
          OR (
            ? = 'online'
            AND LOWER(COALESCE(g.play_mode, 'offline')) IN ('online', 'on', '1', 'true')
          )
          OR (
            ? = 'offline'
            AND LOWER(COALESCE(g.play_mode, 'offline')) NOT IN ('online', 'on', '1', 'true')
          )
        )
      `;
      const yearlyParams = [playerId, playMode, playMode, playMode];
      const totalParams = [playerId, playMode, playMode, playMode];

      // 年別成績
      const yearly = await db.queryAll(
        env,
        `
        SELECT
          substr(g.date, 1, 4) AS year,
          COUNT(gr.id) AS gameCount,
          ROUND(COALESCE(SUM(gr.final_point), 0), 1) AS totalPoint,
          MAX(gr.final_score) AS highScore,
          ROUND(
            CASE WHEN COUNT(gr.id) = 0 THEN 0
              ELSE SUM(CASE WHEN gr.rank <> 4 THEN 1.0 ELSE 0 END) / COUNT(gr.id)
            END, 4
          ) AS avoidFourthRate
        FROM game_results gr
        JOIN games g ON g.id = gr.game_id
        WHERE gr.player_id = ?
          ${modeFilterSql}
        GROUP BY year
        ORDER BY year DESC
        `,
        yearlyParams
      );
      // 合計成績
      const totalArr = await db.queryAll(
        env,
        `
        SELECT
          COUNT(gr.id) AS gameCount,
          ROUND(COALESCE(SUM(gr.final_point), 0), 1) AS totalPoint,
          MAX(gr.final_score) AS highScore,
          ROUND(
            CASE WHEN COUNT(gr.id) = 0 THEN 0
              ELSE SUM(CASE WHEN gr.rank <> 4 THEN 1.0 ELSE 0 END) / COUNT(gr.id)
            END, 4
          ) AS avoidFourthRate
        FROM game_results gr
        JOIN games g ON g.id = gr.game_id
        WHERE gr.player_id = ?
          ${modeFilterSql}
        `,
        totalParams
      );
      const total = totalArr && totalArr[0] ? totalArr[0] : null;
      return new Response(JSON.stringify({ total, yearly }), { headers: { "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }
});

/**
 * POST /api/players
 */
routes.push({
  method: "POST",
  path: "/",
  handler: async ({ env, body }) => {
    try {
      const { name } = body || {};

      if (!name) {
        return format.response(false, null, "name is required");
      }

      const result = await db.execute(
        env,
        `INSERT INTO players (name) VALUES (?)`,
        [name]
      );

      return format.response(true, {
        id: result.lastInsertId,
        name,
      });
    } catch (e) {
      return format.error(e);
    }
  }
});

/**
 * PUT /api/players/:id
 */
routes.push({
  method: "PUT",
  path: "/:id",
  handler: async ({ env, body, params }) => {
    try {
      let name, icon_path;
      let file = null;
      const id = params.id;

      // multipart/form-data対応
      if (body && typeof body.get === "function") {
        name = body.get("name");
        file = body.get("icon");
        icon_path = body.get("icon_path"); // 画像削除時の空指定用
      } else {
        // JSON
        name = body?.name;
        icon_path = body?.icon_path;
      }

      // 既存プレイヤー情報取得（icon_path取得のため）
      const player = await db.queryOne(env,
        `SELECT * FROM players WHERE id = ?`,
        [id]
      );
      if (!player) return format.notFound("Player not found");

      let new_icon_path = player.icon_path;
      let old_icon_path = player.icon_path;

      // 画像ファイルがあればR2にアップロード
      if (file && typeof file.arrayBuffer === "function") {
        const ext = file.name ? file.name.split('.').pop() : "png";
        const now = Date.now();
        const fileName = `players/user${id}_${now}.${ext}`;
        console.log("R2 upload target", fileName);
        try {
          const arrayBuffer = await file.arrayBuffer();
          await env.R2_BUCKET.put(fileName, arrayBuffer, {
            httpMetadata: {
              contentType: file.type || "image/png",
            },
          });
          console.log("R2 upload success", fileName);
          new_icon_path = `/r2/${fileName}`;
        } catch (e) {
          console.error("R2 upload error", e);
          throw e;
        }
      } else if (icon_path === "") {
        // 画像削除リクエスト（icon_pathを空に）
        new_icon_path = "";
      }

      // 古い画像の削除（新規アップロードまたは削除時）
      if (old_icon_path && old_icon_path.startsWith("/r2/")) {
        // 新しい画像がアップロードされた、または削除リクエスト
        if ((file && typeof file.arrayBuffer === "function") || icon_path === "") {
          const oldKey = old_icon_path.replace("/r2/", "");
          console.log("delete target", oldKey);
          try {
            await env.R2_BUCKET.delete(oldKey);
            console.log("R2 delete success", oldKey);
          } catch (e) {
            // R2に削除対象が存在しない場合はエラーを出さずスルー
            if (e && typeof e.message === "string" && e.message.includes("NoSuchKey")) {
              // 存在しない場合は何もしない
            } else {
              // それ以外のエラーのみ警告
              console.warn("R2 delete warning", e);
            }
          }
        }
      }

      // DB更新
      let sql = `UPDATE players SET name = ?`;
      let paramsArr = [name];
      sql += `, icon_path = ?`;
      paramsArr.push(new_icon_path);
      sql += ` WHERE id = ?`;
      paramsArr.push(id);

      await db.execute(env, sql, paramsArr);

      // 更新後の全情報を取得して返す（icon_pathを必ず含む）
      const updatedPlayer = await db.queryOne(env,
        `SELECT * FROM players WHERE id = ?`,
        [id]
      );
      return format.response(true, updatedPlayer);
    } catch (e) {
      return format.error(e);
    }
  }
});

/**
 * DELETE /api/players/:id
 */
routes.push({
  method: "DELETE",
  path: "/:id",
  handler: async ({ env, params }) => {
    try {
      await db.execute(env,
        `DELETE FROM players WHERE id = ?`,
        [params.id]
      );
      return format.response(true, { id: params.id });
    } catch (e) {
      return format.error(e);
    }
  }
});

export default { routes };