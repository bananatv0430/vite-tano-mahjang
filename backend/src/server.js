// ...existing code...
import express from "express";
import Database from "better-sqlite3";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../db/mahjong.db");
const uploadsDir = path.join(__dirname, "../uploads");
const playerUploadsDir = path.join(uploadsDir, "players");
fs.mkdirSync(playerUploadsDir, { recursive: true });

const db = new Database(dbPath);
const app = express();
const PORT = process.env.PORT || 3001;

const getJapaneseWeekday = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00`);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return Number.isNaN(date.getTime()) ? "" : weekdays[date.getDay()];
};

const getAvailableResultYears = () => db.prepare(`
  SELECT substr(date, 1, 4) AS year, COUNT(*) AS gameCount
  FROM games
  GROUP BY substr(date, 1, 4)
  ORDER BY year DESC
`).all();

const getAvailableGameDates = () => db.prepare(`
  SELECT DISTINCT date
  FROM games
  ORDER BY date DESC
`).all().map((row) => String(row.date ?? "").trim()).filter(Boolean);

const groupResultRowsByDate = (rows) => {
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

  return Array.from(dateMap.values());
};

const resultSelectSql = `
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
`;

const getResultsByYear = (year) => {
  const rows = db.prepare(`
    ${resultSelectSql}
    WHERE substr(g.date, 1, 4) = ?
    ORDER BY g.date DESC, g.match_number ASC, gr.rank ASC
  `).all(String(year));

  return groupResultRowsByDate(rows);
};

const getRecentResults = (limit = 5) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 20);
  const rows = db.prepare(`
    WITH recent_dates AS (
      SELECT date
      FROM games
      GROUP BY date
      ORDER BY date DESC
      LIMIT ?
    )
    ${resultSelectSql}
    JOIN recent_dates rd ON rd.date = g.date
    ORDER BY g.date DESC, g.match_number ASC, gr.rank ASC
  `).all(safeLimit);

  return groupResultRowsByDate(rows);
};

const getGamesByDate = (date) => {
  const rows = db.prepare(`
    ${resultSelectSql}
    WHERE g.date = ?
    ORDER BY g.match_number ASC, gr.rank ASC
  `).all(String(date));

  return groupResultRowsByDate(rows)[0] ?? null;
};

const getMainRankingStats = () => {
  const rows = db.prepare(`
    SELECT
      p.id AS playerId,
      p.name,
      p.icon_path AS iconPath,
      COUNT(gr.id) AS gameCount,
      ROUND(COALESCE(SUM(gr.final_point), 0), 1) AS totalPoint,
      MAX(gr.final_score) AS highScore,
      SUM(CASE WHEN gr.rank = 1 THEN 1 ELSE 0 END) AS topCount,
      ROUND(
        CASE
          WHEN COUNT(gr.id) = 0 THEN 0
          ELSE SUM(CASE WHEN gr.rank <> 4 THEN 1.0 ELSE 0 END) / COUNT(gr.id)
        END,
        4
      ) AS avoidFourthRate
    FROM players p
    LEFT JOIN game_results gr ON gr.player_id = p.id
    GROUP BY p.id, p.name, p.icon_path
    HAVING COUNT(gr.id) > 0
  `).all();

  const createRanking = (selector) => rows
    .map((row) => ({
      playerId: row.playerId,
      name: row.name,
      iconPath: row.iconPath,
      value: selector(row),
    }))
    .sort((a, b) => {
      if (b.value !== a.value) {
        return b.value - a.value;
      }
      return a.playerId - b.playerId;
    })
    .slice(0, 6);

  return {
    personalScore: createRanking((row) => Number(row.totalPoint ?? 0)),
    highScore: createRanking((row) => Number(row.highScore ?? 0)),
    avoidFourthRate: createRanking((row) => Number(row.avoidFourthRate ?? 0)),
    topCount: createRanking((row) => Number(row.topCount ?? 0)),
  };
};

const getRuleOptions = () => db.prepare(`
  SELECT
    id,
    name,
    oka,
    uma1,
    uma2,
    start_score AS startScore
  FROM uma_oka_rules
  ORDER BY id ASC
`).all().map((rule) => ({
  id: rule.id,
  name: rule.name,
  oka: Number(rule.oka ?? 0),
  uma1: Number(rule.uma1 ?? 0),
  uma2: Number(rule.uma2 ?? 0),
  startScore: Number(rule.startScore ?? 0),
}));

const getRuleRankPoints = (rule) => {
  const uma1 = Number(rule.uma1 ?? 0);
  const uma2 = Number(rule.uma2 ?? 0);
  const oka = Number(rule.oka ?? 0);
  const startScore = Number(rule.startScore ?? 0);
  const bonus = ((oka - startScore) * 4) / 1000;

  return [
    Number((bonus + uma1).toFixed(1)),
    Number(uma2.toFixed(1)),
    Number((-uma2).toFixed(1)),
    Number((-uma1).toFixed(1)),
  ];
};

const calculateFinalPoint = (score, rank, rule) => {
  const rankPoints = getRuleRankPoints(rule);
  const rankIndex = Math.max(0, Math.min(3, Number(rank) - 1));
  const basePoint = (Number(score) - Number(rule.oka ?? 30000)) / 1000;

  return Number((basePoint + Number(rankPoints[rankIndex] ?? 0)).toFixed(1));
};

const normalizeGamesPayload = ({ date, ruleId, rounds }) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("日付の形式が不正です");
  }

  if (!Number.isInteger(ruleId) || ruleId <= 0) {
    throw new Error("基準ルールを選択してください");
  }

  if (!Array.isArray(rounds) || rounds.length === 0) {
    throw new Error("登録する試合がありません");
  }

  const rule = getRuleOptions().find((item) => Number(item.id) === ruleId);
  if (!rule) {
    throw new Error("基準ルールが見つかりません");
  }

  const validPlayerIds = new Set(
    db.prepare("SELECT id FROM players ORDER BY id").all().map((player) => Number(player.id))
  );
  const expectedTotal = Number(rule.startScore ?? 0) * 4;

  const normalizedRounds = rounds.map((round, roundIndex) => {
    const players = Array.isArray(round?.players) ? round.players : [];

    if (players.length !== 4) {
      throw new Error(`第${roundIndex + 1}回戦のプレイヤー数が不正です`);
    }

    const normalizedPlayers = players.map((player, playerIndex) => ({
      playerId: Number(player.playerId),
      score: Number(player.score),
      rank: Number(player.rank ?? playerIndex + 1),
    }));

    normalizedPlayers.forEach((player) => {
      if (!validPlayerIds.has(player.playerId)) {
        throw new Error(`第${roundIndex + 1}回戦のプレイヤー選択が不正です`);
      }

      if (!Number.isFinite(player.score)) {
        throw new Error(`第${roundIndex + 1}回戦の点数入力が不正です`);
      }

      if (!Number.isInteger(player.rank) || player.rank < 1 || player.rank > 4) {
        throw new Error(`第${roundIndex + 1}回戦の順位入力が不正です`);
      }
    });

    if (new Set(normalizedPlayers.map((player) => player.playerId)).size !== 4) {
      throw new Error(`第${roundIndex + 1}回戦で同じプレイヤーが重複しています`);
    }

    if (new Set(normalizedPlayers.map((player) => player.rank)).size !== 4) {
      throw new Error(`第${roundIndex + 1}回戦の順位が重複しています`);
    }

    const total = normalizedPlayers.reduce((sum, player) => sum + player.score, 0);
    if (total !== expectedTotal) {
      throw new Error(`第${roundIndex + 1}回戦の点数合計が持ち点×4と一致していません`);
    }

    return {
      players: normalizedPlayers,
    };
  });

  return { date, rule, normalizedRounds };
};

const insertGame = db.prepare("INSERT INTO games (date, match_number, umaoka_rule_id) VALUES (?, ?, ?)");
const insertGameResult = db.prepare(`
  INSERT INTO game_results (game_id, player_id, final_score, rank, final_point)
  VALUES (?, ?, ?, ?, ?)
`);
const deleteGameResultsByDate = db.prepare(`
  DELETE FROM game_results
  WHERE game_id IN (SELECT id FROM games WHERE date = ?)
`);
const deleteGamesByDate = db.prepare("DELETE FROM games WHERE date = ?");

const insertRoundsForDate = ({ date, rule, rounds, startMatchNumber = 0 }) => {
  const createdGames = [];

  rounds.forEach((round, roundIndex) => {
    const matchNumber = startMatchNumber + roundIndex + 1;
    const gameInsert = insertGame.run(date, matchNumber, rule.id);
    const gameId = Number(gameInsert.lastInsertRowid);

    round.players.forEach((player) => {
      insertGameResult.run(
        gameId,
        player.playerId,
        player.score,
        player.rank,
        calculateFinalPoint(player.score, player.rank, rule)
      );
    });

    createdGames.push({ gameId, matchNumber });
  });

  return createdGames;
};

const registerGames = db.transaction(({ date, rule, rounds }) => {
  const currentMax = db.prepare("SELECT COALESCE(MAX(match_number), 0) AS maxMatchNumber FROM games WHERE date = ?").get(date);
  const startMatchNumber = Number(currentMax?.maxMatchNumber ?? 0);

  return insertRoundsForDate({ date, rule, rounds, startMatchNumber });
});

const replaceGamesForDate = db.transaction(({ date, rule, rounds }) => {
  deleteGameResultsByDate.run(date);
  deleteGamesByDate.run(date);

  return insertRoundsForDate({ date, rule, rounds, startMatchNumber: 0 });
});

const deleteGamesForDate = db.transaction((date) => {
  const existingGames = db.prepare("SELECT COUNT(*) AS count FROM games WHERE date = ?").get(date);
  deleteGameResultsByDate.run(date);
  deleteGamesByDate.run(date);
  return Number(existingGames?.count ?? 0);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

// アクセスログ出力ミドルウェア
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, playerUploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
      cb(null, `player_${req.params.id}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("画像ファイルのみアップロードできます"));
  },
});

app.get("/api/results/years", (_req, res) => {
  try {
    const years = getAvailableResultYears();
    res.json(years);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/results/recent", (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 5);
    const dates = getRecentResults(limit);
    res.json({ limit: Math.min(Math.max(limit || 5, 1), 20), dates });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/results", (req, res) => {
  try {
    const years = getAvailableResultYears();

    if (years.length === 0) {
      res.json({ year: null, availableYears: [], dates: [] });
      return;
    }

    const requestedYear = String(req.query.year ?? years[0].year).trim();

    if (!/^\d{4}$/.test(requestedYear)) {
      res.status(400).json({ error: "year は4桁の西暦で指定してください" });
      return;
    }

    const dates = getResultsByYear(requestedYear);
    res.json({ year: requestedYear, availableYears: years, dates });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/rankings/summary", (_req, res) => {
  try {
    const rankings = getMainRankingStats();
    res.json(rankings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/rules", (_req, res) => {
  try {
    const rules = getRuleOptions();
    res.json(rules);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/games/dates", (_req, res) => {
  try {
    const dates = getAvailableGameDates();
    res.json({ dates });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/games", (req, res) => {
  try {
    const date = String(req.query.date ?? "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "date は YYYY-MM-DD 形式で指定してください" });
      return;
    }

    const dateEntry = getGamesByDate(date);
    if (!dateEntry) {
      res.json({ date, day: getJapaneseWeekday(date), ruleId: null, participants: [], games: [] });
      return;
    }

    const primaryRule = dateEntry.games[0]?.rule ?? null;

    res.json({
      date: dateEntry.date,
      day: dateEntry.day,
      ruleId: primaryRule?.id ?? null,
      rule: primaryRule,
      participants: dateEntry.participants,
      games: dateEntry.games,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/games", (req, res) => {
  try {
    const payload = normalizeGamesPayload({
      date: String(req.body.date ?? "").trim(),
      ruleId: Number(req.body.ruleId),
      rounds: Array.isArray(req.body.rounds) ? req.body.rounds : [],
    });
    const games = registerGames({ date: payload.date, rule: payload.rule, rounds: payload.normalizedRounds });
    const msg = `${payload.date.replace(/-/g, "年").replace(/(\d{4})年(\d{2})年(\d{2})/, "$1年$2月$3日")}の試合データの登録が完了しました。`;
    insertLog(msg);
    res.status(201).json({
      message: `${payload.normalizedRounds.length}回戦を一括登録しました`,
      games,
    });
  } catch (e) {
    const payloadDate = req.body?.date ? String(req.body.date).trim() : "";
    const msg = `${payloadDate.replace(/-/g, "年").replace(/(\d{4})年(\d{2})年(\d{2})/, "$1年$2月$3日")}の試合データの登録に失敗しました。`;
    insertLog(msg);
    const message = e.message || "登録に失敗しました";
    const statusCode = /不正|見つかりません|一致|重複|ありません/.test(message) ? 400 : 500;
    res.status(statusCode).json({ error: message });
  }
});

app.put("/api/games", (req, res) => {
  try {
    const payload = normalizeGamesPayload({
      date: String(req.body.date ?? "").trim(),
      ruleId: Number(req.body.ruleId),
      rounds: Array.isArray(req.body.rounds) ? req.body.rounds : [],
    });
    const games = replaceGamesForDate({ date: payload.date, rule: payload.rule, rounds: payload.normalizedRounds });
    const msg = `${payload.date.replace(/-/g, "年").replace(/(\d{4})年(\d{2})年(\d{2})/, "$1年$2月$3日")}の試合データの編集が完了しました。`;
    insertLog(msg);
    res.json({
      message: `${payload.normalizedRounds.length}回戦を更新しました`,
      games,
    });
  } catch (e) {
    const payloadDate = req.body?.date ? String(req.body.date).trim() : "";
    const msg = `${payloadDate.replace(/-/g, "年").replace(/(\d{4})年(\d{2})年(\d{2})/, "$1年$2月$3日")}の試合データの編集に失敗しました。`;
    insertLog(msg);
    const message = e.message || "更新に失敗しました";
    const statusCode = /不正|見つかりません|一致|重複|ありません/.test(message) ? 400 : 500;
    res.status(statusCode).json({ error: message });
  }
});

app.delete("/api/games", (req, res) => {
  try {
    const date = String(req.query.date ?? req.body.date ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "date は YYYY-MM-DD 形式で指定してください" });
      return;
    }
    const deletedCount = deleteGamesForDate(date);
    let msg;
    if (deletedCount === 0) {
      msg = `${date.replace(/-/g, "年").replace(/(\d{4})年(\d{2})年(\d{2})/, "$1年$2月$3日")}の試合データの削除に失敗しました。`;
      insertLog(msg);
      res.status(404).json({ error: "削除対象の対局データが見つかりません" });
      return;
    }
    msg = `${date.replace(/-/g, "年").replace(/(\d{4})年(\d{2})年(\d{2})/, "$1年$2月$3日")}の試合データの削除が完了しました。`;
    insertLog(msg);
    res.json({
      message: "対局データを削除しました",
      deletedCount,
    });
  } catch (e) {
    const date = req.query?.date || req.body?.date || "";
    const msg = `${String(date).replace(/-/g, "年").replace(/(\d{4})年(\d{2})年(\d{2})/, "$1年$2月$3日")}の試合データの削除に失敗しました。`;
    insertLog(msg);
    const message = e.message || "削除に失敗しました";
    const statusCode = /不正|見つかりません|一致|重複|ありません/.test(message) ? 400 : 500;
    res.status(statusCode).json({ error: message });
  }
});

app.get("/api/players", (_req, res) => {
  try {
    const players = db.prepare("SELECT * FROM players ORDER BY id").all();
    res.json(players);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/players/:id", upload.single("icon"), (req, res) => {
  try {
    const id = Number(req.params.id);
    const name = String(req.body.name ?? "").trim();

    if (!id) {
      res.status(400).json({ error: "不正なプレイヤーIDです" });
      return;
    }

    if (!name) {
      res.status(400).json({ error: "名前を入力してください" });
      return;
    }

    const currentPlayer = db.prepare("SELECT * FROM players WHERE id = ?").get(id);
    if (!currentPlayer) {
      res.status(404).json({ error: "プレイヤーが見つかりません" });
      return;
    }

    const iconPath = req.file
      ? `/uploads/players/${req.file.filename}`
      : (req.body.icon_path || currentPlayer.icon_path || null);

    db.prepare("UPDATE players SET name = ?, icon_path = ? WHERE id = ?").run(name, iconPath, id);

    const updatedPlayer = db.prepare("SELECT * FROM players WHERE id = ?").get(id);
    res.json(updatedPlayer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || "アップロードに失敗しました" });
});

app.listen(PORT, () => {
  console.log(`Backend API server listening on port ${PORT}`);
  console.log('DB path:', dbPath);
});

// ログ一覧取得API
app.get("/api/logs", (req, res) => {
  try {
    const logs = db.prepare("SELECT id, message, operated_at FROM logs ORDER BY operated_at DESC, id DESC LIMIT 100").all();
    res.json({ logs });
  } catch (e) {
    res.status(500).json({ error: "ログ取得に失敗しました" });
  }
});

// ログ登録用関数
function insertLog(message) {
  try {
    db.prepare("INSERT INTO logs (message, operated_at) VALUES (?, datetime('now', 'localtime'))").run(message);
  } catch (e) {
    console.error('ログ登録失敗:', e);
  }
}

// プレイヤーごとの合計・年別成績を返すAPI
app.get("/api/player-stats/:playerId", (req, res) => {
  try {
    const playerId = Number(req.params.playerId);
    if (!playerId) {
      res.status(400).json({ error: "不正なプレイヤーIDです" });
      return;
    }
    // 年別成績
    const yearly = db.prepare(`
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
      GROUP BY year
      ORDER BY year DESC
    `).all(playerId);

    // 合計成績
    const total = db.prepare(`
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
      WHERE gr.player_id = ?
    `).get(playerId);

    res.json({ total, yearly });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});