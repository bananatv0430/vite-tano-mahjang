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
      } else {
        // JSON
        name = body?.name;
      }

      const exists = await db.queryOne(env,
        `SELECT id FROM players WHERE id = ?`,
        [id]
      );
      if (!exists) return format.notFound("Player not found");

      // 画像ファイルがあれば保存
      if (file && typeof file.arrayBuffer === "function") {
        // ファイル名生成
        const ext = file.name.split('.').pop();
        const fileName = `player_${id}.${ext}`;
        // 保存先パス
        const uploadPath = `/uploads/players/${fileName}`;
        // ファイル保存（wrangler dev --local時のみ対応、Cloudflare本番は別途）
        if (env.__STATIC_CONTENT) {
          // 本番Cloudflare環境では書き込み不可
        } else {
          // Node.js/Miniflare環境ならfs/promisesで保存可能
          try {
            const fs = await import('fs/promises');
            await fs.writeFile(`./uploads/players/${fileName}`, Buffer.from(await file.arrayBuffer()));
            icon_path = uploadPath;
          } catch (e) {
            // 保存失敗時はicon_path更新しない
            icon_path = null;
          }
        }
      }

      // DB更新
      let sql = `UPDATE players SET name = ?`;
      let paramsArr = [name];
      if (icon_path) {
        sql += `, icon_path = ?`;
        paramsArr.push(icon_path);
      }
      sql += ` WHERE id = ?`;
      paramsArr.push(id);

      await db.execute(env, sql, paramsArr);

      return format.response(true, {
        id,
        name,
        icon_path: icon_path || exists.icon_path,
      });
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