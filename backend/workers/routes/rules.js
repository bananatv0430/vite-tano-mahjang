import { db } from "../utils/db.js";
import { format } from "../utils/format.js";

const routes = [];

// GET /api/rules
routes.push({
  method: "GET",
  path: "/",
  handler: async ({ env }) => {
    try {
      const rules = await db.queryAll(env, `SELECT id, name, oka, uma1, uma2, start_score FROM uma_oka_rules ORDER BY id ASC`);
      return format.response(true, rules);
    } catch (e) {
      return format.error(e);
    }
  },
});

export default { routes };
