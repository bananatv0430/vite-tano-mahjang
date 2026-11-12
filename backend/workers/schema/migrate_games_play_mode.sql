-- gamesテーブルに online/offline 区分を追加
ALTER TABLE games ADD COLUMN play_mode TEXT NOT NULL DEFAULT 'offline';

-- 既存値がNULLの場合に備えて補正
UPDATE games
SET play_mode = 'offline'
WHERE play_mode IS NULL OR play_mode = '';
