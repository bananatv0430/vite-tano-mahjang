export const db = {
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
        lastInsertId: result.lastRowId || null,
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
    const statements = sqlText
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length);

    for (const stmt of statements) {
      try {
        await env.mahjang_db.prepare(stmt).run();
      } catch (e) {
        console.error("[D1 executeMany error]", e, "SQL:", stmt);
        throw e;
      }
    }

    return { success: true };
  },
};