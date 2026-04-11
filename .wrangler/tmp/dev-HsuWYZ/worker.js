var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-jwmN3z/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// backend/workers/utils/router.js
var Router = class {
  static {
    __name(this, "Router");
  }
  constructor() {
    this.routes = [];
  }
  /**
   * プレフィックスをつけて別ルーターを登録する
   */
  mount(prefix, routeModule) {
    for (const route of routeModule.routes) {
      this.routes.push({
        method: route.method,
        path: prefix + route.path,
        handler: route.handler
      });
    }
  }
  /**
   * リクエストを処理する
   */
  async handle(request, env, ctx) {
    try {
      console.log(`[Router] ${request.method} ${request.url}`);
      const url = new URL(request.url);
      const pathname = url.pathname;
      const method = request.method.toUpperCase();
      for (const route of this.routes) {
        if (method !== route.method) continue;
        const match = this.matchPath(route.path, pathname);
        if (match) {
          const params = match.params;
          const body = await this.parseBody(request);
          return route.handler({
            request,
            env,
            ctx,
            params,
            query: url.searchParams,
            body
          });
        }
      }
      return new Response(
        JSON.stringify({ error: "Not Found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("[Router][ERROR]", e);
      return new Response(
        JSON.stringify({ error: e.message, stack: e.stack }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
  /**
   * ルートパスと実パスのマッチング
   */
  matchPath(routePath, requestPath) {
    const routeParts = routePath.split("/").filter(Boolean);
    const reqParts = requestPath.split("/").filter(Boolean);
    if (routeParts.length !== reqParts.length) return null;
    const params = {};
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        const key = routeParts[i].slice(1);
        params[key] = reqParts[i];
      } else if (routeParts[i] !== reqParts[i]) {
        return null;
      }
    }
    return { params };
  }
  /**
   * JSON / multipart / text を自動パース
   */
  async parseBody(request) {
    const method = request.method.toUpperCase();
    if (method === "GET") return null;
    const type = request.headers.get("content-type") || "";
    if (type.includes("application/json")) {
      try {
        return await request.json();
      } catch {
        return null;
      }
    }
    if (type.includes("multipart/form-data")) {
      return await request.formData();
    }
    try {
      return await request.text();
    } catch {
      return null;
    }
  }
};

// backend/workers/utils/db.js
var db = {
  /**
   * SELECT 複数件
   */
  async queryAll(env, sql, params = []) {
    try {
      const result = await env.mahjang_db.prepare(sql).bind(...params).all();
      return result.results || [];
    } catch (e) {
      console.error("[D1 queryAll error]", e);
      throw new Error("Database query failed");
    }
  },
  /**
   * SELECT 1件
   */
  async queryOne(env, sql, params = []) {
    try {
      const result = await env.mahjang_db.prepare(sql).bind(...params).first();
      return result || null;
    } catch (e) {
      console.error("[D1 queryOne error]", e);
      throw new Error("Database query failed");
    }
  },
  /**
   * INSERT / UPDATE / DELETE
   */
  async execute(env, sql, params = []) {
    try {
      const result = await env.mahjang_db.prepare(sql).bind(...params).run();
      return {
        success: true,
        changes: result.changes || 0,
        lastInsertId: result.lastRowId || null
      };
    } catch (e) {
      console.error("[D1 execute error]", e);
      throw new Error("Database execute failed");
    }
  },
  /**
   * SQL ファイルを読み込んで複数ステートメント実行する用途などに利用可能
   * D1 は TRANSACTION が制限されるため、1文ずつ実行する。
   */
  async executeMany(env, sqlText) {
    const statements = sqlText.split(";").map((s) => s.trim()).filter((s) => s.length);
    for (const stmt of statements) {
      try {
        await env.mahjang_db.prepare(stmt).run();
      } catch (e) {
        console.error("[D1 executeMany error]", e, "SQL:", stmt);
        throw e;
      }
    }
    return { success: true };
  }
};

// backend/workers/utils/format.js
var format = {
  /**
   * 日付（YYYY-MM-DD）へ変換
   * 不正な値は null
   */
  toDate(value) {
    if (!value) return null;
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return null;
    }
  },
  /**
   * 日時（YYYY-MM-DD HH:mm:ss）
   */
  toDateTime(value) {
    if (!value) return null;
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
    } catch {
      return null;
    }
  },
  /**
   * 数値化（NaN → 0）
   */
  toNumber(value) {
    if (value === null || value === void 0) return 0;
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  },
  /**
   * 小数を丸める
   */
  round(value, digits = 2) {
    const n = Number(value);
    if (isNaN(n)) return 0;
    return Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits);
  },
  /**
   * 配列 or 値に対して null を除外して返す
   */
  removeNull(v) {
    if (Array.isArray(v)) {
      return v.filter((x) => x !== null && x !== void 0);
    }
    return v === null || v === void 0 ? void 0 : v;
  },
  /**
   * API レスポンス共通形式
   */
  response(ok, data = null, message = "") {
    return new Response(
      JSON.stringify({
        ok,
        data,
        message
      }),
      { status: ok ? 200 : 400, headers: { "Content-Type": "application/json" } }
    );
  },
  /**
   * 404 専用レスポンス
   */
  notFound(message = "Not Found") {
    return new Response(
      JSON.stringify({
        ok: false,
        data: null,
        message
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  },
  /**
   * サーバーエラー（500）
   */
  error(e) {
    return new Response(
      JSON.stringify({
        ok: false,
        data: null,
        message: e?.message ?? "Internal Server Error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// backend/workers/routes/players.js
var routes = [];
routes.push({
  method: "GET",
  path: "/",
  handler: /* @__PURE__ */ __name(async ({ env }) => {
    try {
      const players = await db.queryAll(
        env,
        `SELECT * FROM players ORDER BY id ASC`
      );
      return format.response(true, players);
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes.push({
  method: "GET",
  path: "/:id",
  handler: /* @__PURE__ */ __name(async ({ env, params }) => {
    try {
      const player = await db.queryOne(
        env,
        `SELECT * FROM players WHERE id = ?`,
        [params.id]
      );
      if (!player) return format.notFound("Player not found");
      return format.response(true, player);
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes.push({
  method: "GET",
  path: "/active/list",
  handler: /* @__PURE__ */ __name(async ({ env }) => {
    try {
      const players = await db.queryAll(
        env,
        `SELECT * FROM players WHERE is_active = 1 ORDER BY id ASC`
      );
      return format.response(true, players);
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes.push({
  method: "GET",
  path: "/search",
  handler: /* @__PURE__ */ __name(async ({ env, query }) => {
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
  }, "handler")
});
routes.push({
  method: "POST",
  path: "/",
  handler: /* @__PURE__ */ __name(async ({ env, body }) => {
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
        name
      });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes.push({
  method: "PUT",
  path: "/:id",
  handler: /* @__PURE__ */ __name(async ({ env, body, params }) => {
    try {
      let name, icon_path;
      let file = null;
      const id = params.id;
      if (body && typeof body.get === "function") {
        name = body.get("name");
        file = body.get("icon");
      } else {
        name = body?.name;
      }
      const exists = await db.queryOne(
        env,
        `SELECT id FROM players WHERE id = ?`,
        [id]
      );
      if (!exists) return format.notFound("Player not found");
      if (file && typeof file.arrayBuffer === "function") {
        const ext = file.name.split(".").pop();
        const fileName = `player_${id}.${ext}`;
        const uploadPath = `/uploads/players/${fileName}`;
        if (env.__STATIC_CONTENT) {
        } else {
          try {
            const fs = await import("fs/promises");
            await fs.writeFile(`./uploads/players/${fileName}`, Buffer.from(await file.arrayBuffer()));
            icon_path = uploadPath;
          } catch (e) {
            icon_path = null;
          }
        }
      }
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
        icon_path: icon_path || exists.icon_path
      });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes.push({
  method: "DELETE",
  path: "/:id",
  handler: /* @__PURE__ */ __name(async ({ env, params }) => {
    try {
      await db.execute(
        env,
        `DELETE FROM players WHERE id = ?`,
        [params.id]
      );
      return format.response(true, { id: params.id });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
var players_default = { routes };

// backend/workers/routes/games.js
var routes2 = [];
routes2.push({
  method: "GET",
  path: "/",
  handler: /* @__PURE__ */ __name(async ({ env }) => {
    try {
      const games = await db.queryAll(
        env,
        `SELECT * FROM games ORDER BY id DESC`
      );
      return format.response(true, games);
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes2.push({
  method: "GET",
  path: "/:id",
  handler: /* @__PURE__ */ __name(async ({ env, params }) => {
    try {
      const id = params.id;
      const game = await db.queryOne(
        env,
        `SELECT * FROM games WHERE id = ?`,
        [id]
      );
      if (!game) return format.notFound("Game not found");
      const players = await db.queryAll(
        env,
        `
        SELECT gp.player_id, p.name
        FROM game_players gp
        JOIN players p ON p.id = gp.player_id
        WHERE gp.game_id = ?
        ORDER BY gp.seat
        `,
        [id]
      );
      const results = await db.queryAll(
        env,
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
        results
      });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes2.push({
  method: "GET",
  path: "/recent/list",
  handler: /* @__PURE__ */ __name(async ({ env }) => {
    try {
      const rows = await db.queryAll(
        env,
        `SELECT * FROM games ORDER BY start_time DESC LIMIT 10`
      );
      return format.response(true, rows);
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes2.push({
  method: "GET",
  path: "/by-player/:playerId",
  handler: /* @__PURE__ */ __name(async ({ env, params }) => {
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
  }, "handler")
});
routes2.push({
  method: "POST",
  path: "/",
  handler: /* @__PURE__ */ __name(async ({ env, body }) => {
    try {
      const {
        date,
        // YYYY-MM-DD
        ruleId,
        // ルールID
        rounds = []
        // 各半荘の配列
      } = body || {};
      const gameIds = [];
      for (let i = 0; i < rounds.length; i++) {
        const result = await db.execute(
          env,
          `INSERT INTO games (date, match_number, umaoka_rule_id) VALUES (?, ?, ?)`,
          [date, i + 1, ruleId]
        );
        let gameId = result.lastInsertId;
        if (!gameId) {
          const lastGame = await db.queryOne(env, "SELECT MAX(id) as maxId FROM games");
          gameId = lastGame?.maxId;
        }
        if (!gameId) throw new Error("gameId\u304C\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
        gameIds.push(gameId);
        if (rounds[i].players) {
          for (let j = 0; j < rounds[i].players.length; j++) {
            const player = rounds[i].players[j];
            await db.execute(
              env,
              `INSERT INTO game_results (game_id, player_id, final_score, rank, final_point) VALUES (?, ?, ?, ?, ?)`,
              [gameId, player.playerId, player.score, player.rank, player.point ?? 0]
            );
          }
        }
      }
      return format.response(true, { ids: gameIds });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes2.push({
  method: "PUT",
  path: "/:id",
  handler: /* @__PURE__ */ __name(async ({ env, params, body }) => {
    try {
      const {
        rule,
        start_time,
        end_time,
        note,
        player_ids = []
      } = body || {};
      const exists = await db.queryOne(
        env,
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
      await db.execute(
        env,
        `DELETE FROM game_players WHERE game_id = ?`,
        [params.id]
      );
      for (let i = 0; i < player_ids.length; i++) {
        await db.execute(
          env,
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
  }, "handler")
});
routes2.push({
  method: "DELETE",
  path: "/:id",
  handler: /* @__PURE__ */ __name(async ({ env, params }) => {
    try {
      await db.execute(
        env,
        `DELETE FROM games WHERE id = ?`,
        [params.id]
      );
      return format.response(true, { id: params.id });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
var games_default = { routes: routes2 };

// backend/workers/utils/rules.js
var rules = {
  /**
   * 順位を計算（点数が高い順）
   * 例：[25000, 30000, 18000, 27000] → [3,1,4,2]
   */
  rank(scores) {
    const indexed = scores.map((score, index) => ({ score, index }));
    indexed.sort((a, b) => b.score - a.score);
    const ranks = Array(scores.length);
    let currentRank = 1;
    for (let i = 0; i < indexed.length; i++) {
      if (i > 0 && indexed[i].score < indexed[i - 1].score) {
        currentRank = i + 1;
      }
      ranks[indexed[i].index] = currentRank;
    }
    return ranks;
  },
  /**
   * UMA 配列を順位順に割り当てる
   * 順位 → UMA
   */
  umaForRank(rank, umaList) {
    return umaList[rank - 1] ?? 0;
  },
  /**
   * OKA（トップへの加点）計算
   * totalOka = Oka * 1000
   */
  oka(totalPlayers, okaPoints) {
    return okaPoints * 1e3;
  },
  /**
   * 最終スコア計算
   * scores: 素点 [25000, 30000, 18000, 27000]
   * options:
   *   uma: [20,10,-10,-20] (例)
   *   oka: 10 (トップに +10000)
   */
  calculate(scores, options) {
    const players = scores.length;
    if (players !== 4 && players !== 3) {
      throw new Error("Only 3 or 4 players supported");
    }
    const umaList = options.uma || (players === 4 ? [20, 10, -10, -20] : [20, -20]);
    const okaValue = options.oka || 0;
    const ranks = this.rank(scores);
    const topIndex = ranks.indexOf(1);
    const okaBonus = this.oka(players, okaValue);
    const finalScores = scores.map((rawScore, i) => {
      const uma = this.umaForRank(ranks[i], umaList);
      let total = rawScore + uma * 100;
      if (i === topIndex && okaBonus > 0) {
        total += okaBonus;
      }
      return {
        raw: rawScore,
        rank: ranks[i],
        uma,
        total
      };
    });
    return finalScores;
  }
};

// backend/workers/routes/results.js
var routes3 = [];
async function recalcGame(env, gameId) {
  const game = await db.queryOne(
    env,
    `SELECT * FROM games WHERE id = ?`,
    [gameId]
  );
  if (!game) return;
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
  const umaList = game.uma ? JSON.parse(game.uma) : [20, 10, -10, -20];
  const okaPoints = game.oka ?? 0;
  const calc = rules.calculate(scores, {
    uma: umaList,
    oka: okaPoints
  });
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
  const total = calc.reduce((sum, r) => sum + r.total, 0);
  await db.execute(
    env,
    `UPDATE games SET total_score = ? WHERE id = ?`,
    [total, gameId]
  );
}
__name(recalcGame, "recalcGame");
routes3.push({
  method: "GET",
  path: "/",
  handler: /* @__PURE__ */ __name(async ({ env, query }) => {
    try {
      const years = await db.queryAll(env, `SELECT substr(date, 1, 4) AS year, COUNT(*) AS gameCount FROM games GROUP BY substr(date, 1, 4) ORDER BY year DESC`);
      if (!years || years.length === 0) {
        return format.response(true, { year: null, availableYears: [], dates: [] });
      }
      const requestedYear = String(query?.get?.("year") ?? years[0].year).trim();
      if (!/^\d{4}$/.test(requestedYear)) {
        return format.response(false, null, "year \u306F4\u6841\u306E\u897F\u66A6\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044");
      }
      const rows = await db.queryAll(env, `
        SELECT
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
        WHERE substr(g.date, 1, 4) = ?
        ORDER BY g.date DESC, g.match_number ASC, gr.rank ASC
      `, [requestedYear]);
      const dateMap = {};
      for (const row of rows) {
        if (!dateMap[row.date]) dateMap[row.date] = {};
        const dateEntry = dateMap[row.date];
        if (!dateEntry.games) dateEntry.games = {};
        if (!dateEntry.games[row.game_id]) {
          dateEntry.games[row.game_id] = {
            gameId: row.game_id,
            matchNumber: row.match_number,
            rule: {
              id: row.rule_id,
              name: row.rule_name,
              oka: row.oka,
              uma1: row.uma1,
              uma2: row.uma2,
              startScore: row.start_score
            },
            players: []
          };
        }
        dateEntry.games[row.game_id].players.push({
          playerId: row.player_id,
          name: row.player_name,
          iconPath: row.icon_path,
          rank: row.rank,
          finalScore: row.final_score,
          finalPoint: row.final_point
        });
      }
      const dates = Object.entries(dateMap).map(([date, entry]) => {
        const playerMap = {};
        Object.values(entry.games).forEach((game) => {
          game.players.forEach((player) => {
            if (!playerMap[player.playerId]) {
              playerMap[player.playerId] = {
                playerId: player.playerId,
                name: player.name,
                iconPath: player.iconPath
              };
            }
          });
        });
        const day = ["\u65E5", "\u6708", "\u706B", "\u6C34", "\u6728", "\u91D1", "\u571F"][(/* @__PURE__ */ new Date(date + "T00:00:00")).getDay()];
        return {
          date,
          dayText: day,
          day,
          games: Object.values(entry.games).sort((a, b) => a.matchNumber - b.matchNumber),
          participants: Object.values(playerMap)
        };
      }).sort((a, b) => b.date.localeCompare(a.date));
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
  }, "handler")
});
routes3.push({
  method: "GET",
  path: "/recent",
  handler: /* @__PURE__ */ __name(async ({ env }) => {
    try {
      const dateRows = await db.queryAll(
        env,
        `SELECT DISTINCT g.date FROM games g ORDER BY g.date DESC LIMIT 5`
      );
      const recentDates = dateRows.map((row) => row.date);
      if (recentDates.length === 0) {
        return format.response(true, []);
      }
      const rows = await db.queryAll(
        env,
        `
        SELECT r.*, g.date, g.match_number, p.name, p.icon_path, u.id as rule_id, u.name as rule_name, u.oka, u.uma1, u.uma2, u.start_score
        FROM game_results r
        JOIN games g ON g.id = r.game_id
        JOIN players p ON p.id = r.player_id
        LEFT JOIN uma_oka_rules u ON u.id = g.umaoka_rule_id
        WHERE g.date IN (${recentDates.map(() => "?").join(",")})
        ORDER BY g.date DESC, g.match_number ASC, r.rank ASC
        `,
        recentDates
      );
      const dateMap = /* @__PURE__ */ new Map();
      for (const row of rows) {
        if (!dateMap.has(row.date)) {
          dateMap.set(row.date, {
            date: row.date,
            day: ["\u65E5", "\u6708", "\u706B", "\u6C34", "\u6728", "\u91D1", "\u571F"][(/* @__PURE__ */ new Date(row.date + "T00:00:00")).getDay()],
            games: [],
            participants: []
          });
        }
        const dateEntry = dateMap.get(row.date);
        let gameEntry = dateEntry.games.find((g) => g.gameId === row.game_id);
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
              startScore: row.start_score
            },
            players: []
          };
          dateEntry.games.push(gameEntry);
        }
        const playerEntry = {
          playerId: row.player_id,
          name: row.name,
          iconPath: row.icon_path,
          rank: row.rank,
          finalScore: row.final_score,
          finalPoint: row.final_point
        };
        gameEntry.players.push(playerEntry);
        if (!dateEntry.participants.some((p) => p.playerId === row.player_id)) {
          dateEntry.participants.push({
            playerId: row.player_id,
            name: row.name,
            iconPath: row.icon_path
          });
        }
      }
      const dates = Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((entry) => ({
        date: entry.date,
        dayText: entry.day,
        // 互換用
        day: entry.day,
        // normalizeMatchDataでmatch.dayとして参照されるため
        participants: entry.participants,
        games: entry.games
      }));
      return format.response(true, dates);
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes3.push({
  method: "GET",
  path: "/by-player/:playerId",
  handler: /* @__PURE__ */ __name(async ({ env, params }) => {
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
  }, "handler")
});
routes3.push({
  method: "POST",
  path: "/",
  handler: /* @__PURE__ */ __name(async ({ env, body }) => {
    try {
      const {
        game_id,
        player_id,
        score_raw
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
      await recalcGame(env, game_id);
      return format.response(true, { id: result.lastInsertId });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes3.push({
  method: "PUT",
  path: "/:id",
  handler: /* @__PURE__ */ __name(async ({ env, params, body }) => {
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
  }, "handler")
});
routes3.push({
  method: "DELETE",
  path: "/:id",
  handler: /* @__PURE__ */ __name(async ({ env, params }) => {
    try {
      const row = await db.queryOne(
        env,
        `SELECT * FROM game_results WHERE id = ?`,
        [params.id]
      );
      if (!row) return format.notFound("Result not found");
      await db.execute(
        env,
        `DELETE FROM game_results WHERE id = ?`,
        [params.id]
      );
      await recalcGame(env, row.game_id);
      return format.response(true, { id: params.id });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
var results_default = { routes: routes3 };

// backend/workers/routes/rankings.js
var routes4 = [];
async function recalcGame2(env, gameId) {
  const game = await db.queryOne(
    env,
    `SELECT * FROM games WHERE id = ?`,
    [gameId]
  );
  if (!game) return;
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
  const umaList = game.uma ? JSON.parse(game.uma) : [20, 10, -10, -20];
  const okaPoints = game.oka ?? 0;
  const calc = rules.calculate(scores, {
    uma: umaList,
    oka: okaPoints
  });
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
  const total = calc.reduce((sum, r) => sum + r.total, 0);
  await db.execute(
    env,
    `UPDATE games SET total_score = ? WHERE id = ?`,
    [total, gameId]
  );
}
__name(recalcGame2, "recalcGame");
routes4.push({
  method: "GET",
  path: "/",
  handler: /* @__PURE__ */ __name(async ({ env }) => {
    try {
      const rows = await db.queryAll(env, `SELECT * FROM results ORDER BY id DESC`);
      return format.response(true, rows);
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes4.push({
  method: "GET",
  path: "/recent/list",
  handler: /* @__PURE__ */ __name(async ({ env }) => {
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
  }, "handler")
});
routes4.push({
  method: "GET",
  path: "/by-player/:playerId",
  handler: /* @__PURE__ */ __name(async ({ env, params }) => {
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
  }, "handler")
});
routes4.push({
  method: "POST",
  path: "/",
  handler: /* @__PURE__ */ __name(async ({ env, body }) => {
    try {
      const {
        game_id,
        player_id,
        score_raw
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
      await recalcGame2(env, game_id);
      return format.response(true, { id: result.lastInsertId });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes4.push({
  method: "PUT",
  path: "/:id",
  handler: /* @__PURE__ */ __name(async ({ env, params, body }) => {
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
      await recalcGame2(env, row.game_id);
      return format.response(true, { id: params.id });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes4.push({
  method: "DELETE",
  path: "/:id",
  handler: /* @__PURE__ */ __name(async ({ env, params }) => {
    try {
      const row = await db.queryOne(
        env,
        `SELECT * FROM results WHERE id = ?`,
        [params.id]
      );
      if (!row) return format.notFound("Result not found");
      await db.execute(
        env,
        `DELETE FROM results WHERE id = ?`,
        [params.id]
      );
      await recalcGame2(env, row.game_id);
      return format.response(true, { id: params.id });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes4.push({
  method: "GET",
  path: "/summary",
  handler: /* @__PURE__ */ __name(async ({ env }) => {
    try {
      const rows = await db.queryAll(env, `
        SELECT
          p.id AS playerId,
          p.name,
          p.icon_path AS iconPath,
          COUNT(gr.id) AS gameCount,
          ROUND(COALESCE(SUM(gr.final_point), 0), 1) AS totalPoint,
          MAX(gr.final_score) AS highScore,
          SUM(CASE WHEN gr.rank = 1 THEN 1 ELSE 0 END) AS topCount,
          ROUND(CASE WHEN COUNT(gr.id) = 0 THEN 0 ELSE SUM(CASE WHEN gr.rank <> 4 THEN 1.0 ELSE 0 END) / COUNT(gr.id) END, 4) AS avoidFourthRate
        FROM players p
        LEFT JOIN game_results gr ON gr.player_id = p.id
        GROUP BY p.id, p.name, p.icon_path
        HAVING COUNT(gr.id) > 0
      `);
      const createRanking = /* @__PURE__ */ __name((selector) => rows.map((row) => ({
        playerId: row.playerId,
        name: row.name,
        iconPath: row.iconPath,
        value: selector(row)
      })).sort((a, b) => b.value - a.value || a.playerId - b.playerId).slice(0, 6), "createRanking");
      const rankings = {
        personalScore: createRanking((row) => Number(row.totalPoint ?? 0)),
        highScore: createRanking((row) => Number(row.highScore ?? 0)),
        avoidFourthRate: createRanking((row) => Number(row.avoidFourthRate ?? 0)),
        topCount: createRanking((row) => Number(row.topCount ?? 0))
      };
      return format.response(true, rankings);
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
var rankings_default = { routes: routes4 };

// backend/workers/routes/logs.js
var routes5 = [];
async function recalcGame3(env, gameId) {
  const game = await db.queryOne(
    env,
    `SELECT * FROM games WHERE id = ?`,
    [gameId]
  );
  if (!game) return;
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
  const umaList = game.uma ? JSON.parse(game.uma) : [20, 10, -10, -20];
  const okaPoints = game.oka ?? 0;
  const calc = rules.calculate(scores, {
    uma: umaList,
    oka: okaPoints
  });
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
  const total = calc.reduce((sum, r) => sum + r.total, 0);
  await db.execute(
    env,
    `UPDATE games SET total_score = ? WHERE id = ?`,
    [total, gameId]
  );
}
__name(recalcGame3, "recalcGame");
routes5.push({
  method: "GET",
  path: "/",
  handler: /* @__PURE__ */ __name(async ({ env }) => {
    try {
      const rows = await db.queryAll(env, `SELECT * FROM results ORDER BY id DESC`);
      return format.response(true, rows);
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes5.push({
  method: "GET",
  path: "/recent/list",
  handler: /* @__PURE__ */ __name(async ({ env }) => {
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
  }, "handler")
});
routes5.push({
  method: "GET",
  path: "/by-player/:playerId",
  handler: /* @__PURE__ */ __name(async ({ env, params }) => {
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
  }, "handler")
});
routes5.push({
  method: "POST",
  path: "/",
  handler: /* @__PURE__ */ __name(async ({ env, body }) => {
    try {
      const {
        game_id,
        player_id,
        score_raw
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
      await recalcGame3(env, game_id);
      return format.response(true, { id: result.lastInsertId });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes5.push({
  method: "PUT",
  path: "/:id",
  handler: /* @__PURE__ */ __name(async ({ env, params, body }) => {
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
      await recalcGame3(env, row.game_id);
      return format.response(true, { id: params.id });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
routes5.push({
  method: "DELETE",
  path: "/:id",
  handler: /* @__PURE__ */ __name(async ({ env, params }) => {
    try {
      const row = await db.queryOne(
        env,
        `SELECT * FROM results WHERE id = ?`,
        [params.id]
      );
      if (!row) return format.notFound("Result not found");
      await db.execute(
        env,
        `DELETE FROM results WHERE id = ?`,
        [params.id]
      );
      await recalcGame3(env, row.game_id);
      return format.response(true, { id: params.id });
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
var logs_default = { routes: routes5 };

// backend/workers/routes/rules.js
var routes6 = [];
routes6.push({
  method: "GET",
  path: "/",
  handler: /* @__PURE__ */ __name(async ({ env }) => {
    try {
      const rules2 = await db.queryAll(env, `SELECT id, name, oka, uma1, uma2, start_score FROM uma_oka_rules ORDER BY id ASC`);
      return format.response(true, rules2);
    } catch (e) {
      return format.error(e);
    }
  }, "handler")
});
var rules_default = { routes: routes6 };

// backend/workers/worker.js
var router = new Router();
router.mount("/api/players", players_default);
router.mount("/api/games", games_default);
router.mount("/api/results", results_default);
router.mount("/api/rankings", rankings_default);
router.mount("/api/logs", logs_default);
router.mount("/api/rules", rules_default);
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    console.log("TOKEN:", env.IMAGES_API_TOKEN);
    return new Response("ok");
    if (url.pathname === "/api/icon" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || !file.type.startsWith("image/")) {
          return new Response("Invalid file", { status: 400 });
        }
        if (file.size > 1024 * 1024) {
          return new Response("File too large", { status: 400 });
        }
        const imageForm = new FormData();
        imageForm.append("file", file);
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/images/v1`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.IMAGES_API_TOKEN}`
            },
            body: imageForm
          }
        );
        const data = await res.json();
        if (!data.success) {
          console.error("Images API Error:", data);
          return new Response("Upload failed", { status: 500 });
        }
        const imageUrl = data.result.variants[0];
        const playerId = 1;
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
    if (url.pathname.startsWith("/uploads/")) {
      let filePath = null;
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const cwd = process.cwd();
        filePath = path.resolve(cwd, "backend", url.pathname.slice(1));
        console.log("[STATIC]", filePath);
        const data = await fs.readFile(filePath);
        const ext = filePath.split(".").pop().toLowerCase();
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
    return router.handle(request, env, ctx);
  }
};

// C:/Users/banan/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-jwmN3z/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = worker_default;

// C:/Users/banan/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-jwmN3z/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
