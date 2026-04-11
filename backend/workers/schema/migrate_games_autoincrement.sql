-- gamesテーブルのidをAUTOINCREMENT付きに修正するDDL
-- 既存テーブルをリネームし、新テーブルを作成してデータを移行します

-- 1. 既存テーブルをリネーム
ALTER TABLE games RENAME TO games_old;

-- 2. 新テーブル作成（AUTOINCREMENT付き）
CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  match_number INTEGER NOT NULL,
  umaoka_rule_id INTEGER NOT NULL
);

-- 3. データ移行
INSERT INTO games (date, match_number, umaoka_rule_id)
SELECT date, match_number, umaoka_rule_id FROM games_old;

-- 4. 旧テーブル削除
DROP TABLE games_old;