import { db } from "../utils/db.js";
import { format } from "../utils/format.js";
import { analyzeRounds, readReplay } from "../utils/replayImport.js";

import { summarizeReplayPlayers } from "../utils/replayStats.js";

const getImports = (env, id) => db.queryOne(env, "SELECT game_id, played_on, players_json FROM replay_imports WHERE replay_id = ?", [id]);

function scorePoints(score, rank, rule) {
  const bonus = (rule.oka - rule.start_score) * 4 / 1000;
  const ranks = [bonus + rule.uma1, rule.uma2, -rule.uma2, -rule.uma1];
  return (score - rule.oka) / 1000 + ranks[rank - 1];
}

async function findExisting(env, date, players) {
  const rows = await db.queryAll(env, `
    SELECT g.id, g.match_number, gr.player_id, gr.final_score, gr.rank, gr.final_point
    FROM games g JOIN game_results gr ON g.id = gr.game_id
    WHERE g.date = ? AND NOT EXISTS (SELECT 1 FROM replay_imports i WHERE i.game_id = g.id)
  `, [date]);
  const matches = [];
  for (const id of new Set(rows.map(row => row.id))) {
    const entries = rows.filter(row => row.id === id);
    if (entries.length === players.length && players.every(player => entries.some(entry =>
      entry.player_id === player.playerId && entry.final_score === player.score && entry.rank === player.rank))) {
      matches.push({ id, matchNumber: entries[0].match_number, entries });
    }
  }
  return matches;
}

async function lookupPlayerAccounts({ env, body }) {
  const ids = body?.accountIds;
  if (!Array.isArray(ids) || ids.some(id => !Number.isSafeInteger(id) || id <= 0)) {
    return format.response(false, null, "雀魂アカウントIDの形式が不正です");
  }
  const mappings = await db.queryAll(env,
    "SELECT m.account_id AS accountId, m.player_id AS playerId FROM majsoul_player_accounts m JOIN players p ON p.id = m.player_id WHERE m.account_id IN (SELECT value FROM json_each(?))",
    [JSON.stringify(ids)]);
  return format.response(true, mappings);
}

function isCalendarDate(value) {
  if (!format.isDate(value)) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

async function importReplay({ env, body }) {
  let replay;
  let rounds;
  try {
    replay = readReplay(body?.replay);
    rounds = analyzeRounds(replay);
  } catch (error) {
    return format.response(false, null, error.message);
  }

  const { id, count } = replay;
  try {
    const imported = await getImports(env, id);
    const date = body.date ?? imported?.played_on ?? replay.date;
    if (!isCalendarDate(date)) return format.response(false, null, "対局日を正しく指定してください");
    if (imported && date !== imported.played_on) {
      return format.response(false, null, "この牌譜は " + imported.played_on + " の対局として登録済みです。同じ日付を指定してください");
    }
    const hasDetails = imported && await db.queryOne(env, "SELECT 1 AS present FROM replay_round_players WHERE replay_id = ? LIMIT 1", [id]);

    const master = await db.queryAll(env, "SELECT id FROM players");
    const allowed = new Set(master.map(player => player.id));
    const players = replay.players.map(player => ({ ...player, playerId: Number(body.players?.[player.seat]) }));
    const humans = players.filter(player => !player.cpu).map(player => player.playerId);
    const cpuIds = new Set(players.filter(player => player.cpu).map(player => player.playerId));
    if (players.some(player => !allowed.has(player.playerId)) ||
        new Set(humans).size !== humans.length || humans.some(id => cpuIds.has(id))) {
      return format.response(false, null, "対局者に対応する登録選手を指定してください");
    }
    const mode = body.mode;
    if (!["register", "result", "detail", "preview"].includes(mode)) return format.response(false, null, "登録内容を選択してください");
    const wantsResult = mode !== "detail";
    const saveDetails = mode !== "result" && !hasDetails;
    if (imported && JSON.parse(imported.players_json).some(saved =>
      !players.some(player => player.seat === saved.seat && player.playerId === saved.playerId))) {
      return format.response(false, null, "保存済みの牌譜と選手の紐づけが一致しません");
    }
    const candidates = wantsResult && !imported?.game_id ? await findExisting(env, date, players) : [];
    if (mode === "preview") return format.response(true, { status: "preview", candidates, rounds: rounds.length });
    if (wantsResult && candidates.length > 1 && !imported?.game_id && !candidates.some(candidate => candidate.id === Number(body.gameId))) {
      return format.response(true, { status: "choose-game", candidates: candidates.map(({ id, matchNumber }) => ({ id, matchNumber })) });
    }
    const existing = candidates.find(candidate => candidate.id === (imported?.game_id ?? Number(body.gameId))) ??
      (candidates.length === 1 ? candidates[0] : null);
    const gameId = imported?.game_id ?? (wantsResult ? existing?.id : null) ?? null;
    const createGame = wantsResult && !gameId;
    if (imported && !saveDetails && !createGame && gameId === imported.game_id) {
      return format.response(true, { status: "duplicate", gameId });
    }
    if (existing && gameId === existing.id) {
      for (const player of players) player.point = existing.entries.find(row => row.rank === player.rank).final_point;
    }
    if (imported?.game_id) {
      const points = new Map(JSON.parse(imported.players_json).map(player => [player.seat, player.point]));
      for (const player of players) player.point = points.get(player.seat);
    }
    const rule = createGame ? await db.queryOne(env, "SELECT * FROM uma_oka_rules WHERE name = ?", ["雀魂"]) : null;
    if (createGame && !rule) return format.response(false, null, "雀魂の基準ルールが登録されていません");
    if (rule && count === 4 && (rounds[0].players.some(player => player.startScore !== rule.start_score) ||
        players.reduce((sum, player) => sum + player.score, 0) !== rule.start_score * count)) {
      return format.response(false, null, "雀魂の基準ルールの開始点と牌譜の点数が一致しません");
    }

    const d1 = env.mahjang_db;
    const sql = (statement, ...args) => d1.prepare(statement).bind(...args);
    const batch = [];
    if (createGame) {
      for (const player of players) player.point = count === 4 ? scorePoints(player.score, player.rank, rule) : player.replayPoint;
      batch.push(sql(`
        INSERT INTO games(date, match_number, umaoka_rule_id, play_mode)
        SELECT ?, COALESCE(MAX(match_number), 0) + 1, ?, 'online' FROM games WHERE date = ?
      `, date, rule.id, date));
    }
    const gameReference = createGame ? "last_insert_rowid()" : "?";
    const gameParams = createGame ? [] : [gameId];
    const metadata = [date, count, JSON.stringify(replay.rules), JSON.stringify(players)];
    if (imported) {
      // A competing save that changed the linked game must roll back this batch.
      batch.push(sql(`
        UPDATE replay_imports
        SET game_id = CASE WHEN game_id IS ? THEN ${gameReference} ELSE -1 END,
            played_on = ?, player_count = ?, rules_json = ?, players_json = ?
        WHERE replay_id = ?
      `, imported.game_id, ...gameParams, ...metadata, id));
    } else {
      batch.push(sql(`
        INSERT INTO replay_imports(game_id, played_on, player_count, rules_json, players_json, replay_id)
        VALUES (${gameReference}, ?, ?, ?, ?, ?)
      `, ...gameParams, ...metadata, id));
    }
    if (createGame) {
      batch.push(sql(`
        INSERT INTO game_results(game_id, player_id, final_score, rank, final_point)
        SELECT i.game_id, j.value ->> '$.playerId', j.value ->> '$.score', j.value ->> '$.rank', j.value ->> '$.point'
        FROM replay_imports i, json_each(i.players_json) j WHERE i.replay_id = ?
      `, id));
      batch.push(sql("INSERT INTO logs(message, operated_at) VALUES (?, datetime('now', 'localtime'))", date + " の牌譜成績を登録しました。"));
    }
    const bySeat = new Map(players.map(player => [player.seat, player.playerId]));
    const details = rounds.flatMap(round => round.players.map(player => ({
      number: round.number, seat: player.seat, playerId: bySeat.get(player.seat), detail: player,
    })));
    if (saveDetails) batch.push(sql(`
      INSERT INTO replay_round_players(replay_id, round_number, seat, player_id, detail_json)
      SELECT ?, value ->> '$.number', value ->> '$.seat', value ->> '$.playerId', value -> '$.detail' FROM json_each(?)
    `, id, JSON.stringify(details)));
    const accounts = players.filter(player => Number.isSafeInteger(player.accountId) && player.accountId > 0);
    for (const { accountId, playerId } of accounts) {
      batch.push(sql(
        "INSERT INTO majsoul_player_accounts(account_id, player_id) VALUES (?, ?) ON CONFLICT(account_id) DO UPDATE SET player_id = CASE WHEN player_id = excluded.player_id THEN player_id ELSE -1 END",
        accountId, playerId));
    }
    await d1.batch(batch);
    return format.response(true, { status: "saved", rounds: saveDetails ? rounds.length : 0, hasDetails: Boolean(hasDetails || saveDetails), hasResult: Boolean(gameId || createGame) });
  } catch (error) {
    console.error("[Replay import]", error);
    return format.error(new Error("牌譜の登録に失敗しました。データベース設定と登録内容を確認してください"));
  }
}

const hasReplayDetails = "EXISTS (SELECT 1 FROM replay_round_players r WHERE r.replay_id = i.replay_id)";

async function getStatsDates({ env }) {
  const rows = await db.queryAll(env, `
    SELECT DISTINCT i.played_on
    FROM replay_imports i
    WHERE ${hasReplayDetails}
    ORDER BY i.played_on DESC
  `);
  return format.response(true, rows.map(row => row.played_on));
}

async function getStats({ env, query }) {
  const date = query.get("date");
  const year = query.get("year");
  const count = query.get("count");
  if ((date && year) || (date && !isCalendarDate(date)) ||
      (year && !/^[1-9][0-9]{3}$/.test(year)) || (count && !["3", "4"].includes(count))) {
    return format.response(false, null, "集計期間または対局人数を正しく指定してください");
  }

  const conditions = [hasReplayDetails];
  const args = [];
  if (date) {
    conditions.push("i.played_on = ?");
    args.push(date);
  } else if (year) {
    conditions.push("i.played_on BETWEEN ? AND ?");
    args.push(year + "-01-01", year + "-12-31");
  }
  if (count) {
    conditions.push("i.player_count = ?");
    args.push(Number(count));
  }

  const where = conditions.join(" AND ");
  const d1 = env.mahjang_db;
  const [{ results: imports }, { results: records }, { results: players }] = await d1.batch([
    d1.prepare("SELECT i.* FROM replay_imports i WHERE " + where).bind(...args),
    d1.prepare(`
      SELECT CASE WHEN (p.value ->> '$.cpu') = 1 THEN 'CPU' ELSE r.player_id END AS player_id, r.detail_json
      FROM replay_round_players r JOIN replay_imports i ON i.replay_id = r.replay_id
      JOIN json_each(i.players_json) p ON (p.value ->> '$.seat') = r.seat
      WHERE ${where}
    `).bind(...args),
    d1.prepare("SELECT id, name FROM players"),
  ]);
  const names = new Map(players.map(player => [player.name.replace(/\s/g, ""), player]));
  const summaries = new Map(summarizeReplayPlayers(imports, records).map(row => [row.playerId, row.stats]));
  const rows = ["池田昂平", "大平健太郎", "石戸蓮", "加藤涼太"].map(name => {
    const player = names.get(name);
    return { name: player?.name ?? name, stats: summaries.get(player?.id) ?? null };
  });
  rows.push({ name: "CPU", stats: summaries.get("CPU") ?? null });
  return format.response(true, rows);
}

export default { routes: [
  { method: "POST", path: "/", handler: importReplay },
  { method: "POST", path: "/player-accounts", handler: lookupPlayerAccounts },
  { method: "GET", path: "/stats", handler: getStats },
  { method: "GET", path: "/stats/dates", handler: getStatsDates },
] };
