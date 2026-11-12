import { format } from "./format.js";

/** JOINで取得した対局・成績行を、日付→半荘→参加者の表示データにまとめる。 */
export function groupResultRows(rows) {
  const dateMap = new Map();

  for (const row of rows) {
    if (!dateMap.has(row.date)) {
      dateMap.set(row.date, {
        data: {
          date: row.date,
          day: format.weekday(row.date),
          games: [],
          participants: [],
        },
        gamesById: new Map(),
        participantIds: new Set(),
      });
    }

    const dateGroup = dateMap.get(row.date);
    const dateEntry = dateGroup.data;
    let game = dateGroup.gamesById.get(row.game_id);
    if (!game) {
      game = {
        gameId: row.game_id,
        matchNumber: row.match_number,
        playMode: format.playMode(row.play_mode),
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
      dateEntry.games.push(game);
      dateGroup.gamesById.set(row.game_id, game);
    }

    const player = {
      playerId: row.player_id,
      name: row.player_name ?? row.name,
      iconPath: row.icon_path,
      rank: row.rank,
      finalScore: row.final_score,
      finalPoint: row.final_point,
    };
    game.players.push(player);

    if (!dateGroup.participantIds.has(player.playerId)) {
      dateGroup.participantIds.add(player.playerId);
      dateEntry.participants.push({
        playerId: player.playerId,
        name: player.name,
        iconPath: player.iconPath,
      });
    }
  }

  return Array.from(dateMap.values())
    .map(({ data: entry }) => {
      const games = entry.games.sort((a, b) => a.matchNumber - b.matchNumber);
      const day = entry.day;
      return {
        ...entry,
        dayText: day,
        playMode: format.playMode(games[0]?.playMode ?? "offline"),
        games,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
