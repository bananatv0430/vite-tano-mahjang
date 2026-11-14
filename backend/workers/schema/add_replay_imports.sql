CREATE TABLE IF NOT EXISTS replay_imports (
  replay_id TEXT PRIMARY KEY,
  game_id INTEGER UNIQUE REFERENCES games(id) ON DELETE SET NULL,
  played_on TEXT NOT NULL,
  player_count INTEGER NOT NULL CHECK (player_count IN (3, 4)),
  rules_json TEXT NOT NULL,
  players_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS replay_round_players (
  replay_id TEXT NOT NULL REFERENCES replay_imports(replay_id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  seat INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  detail_json TEXT NOT NULL,
  PRIMARY KEY (replay_id, round_number, seat)
);
CREATE INDEX IF NOT EXISTS replay_round_players_player ON replay_round_players(player_id);

CREATE TABLE IF NOT EXISTS majsoul_player_accounts (
  account_id INTEGER PRIMARY KEY CHECK (account_id > 0),
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE
);
