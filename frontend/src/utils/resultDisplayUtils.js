import { aggregatePlayerPoints } from "./gameUtils";
import { getRankingPlayerIconSrc } from "./playerIcons";

/** 対局モード絞り込みに使う共通選択肢と配色。 */
export const PLAY_MODE_FILTERS = [
  { key: "all", label: "すべて", style: { background: "#f2f2f2", color: "#333", borderColor: "#8a8a8a", activeBorderColor: "#4d4d4d" } },
  { key: "offline", label: "オフライン", style: { background: "#ffefef", color: "#b42318", borderColor: "#f2a7a0", activeBorderColor: "#d92d20" } },
  { key: "online", label: "オンライン", style: { background: "#eaf8ee", color: "#166534", borderColor: "#7bc992", activeBorderColor: "#2f8f57" } },
];

/** API値を画面で使う online/offline 表記にそろえる。 */
export function normalizePlayMode(value) {
  return String(value ?? "offline").toLowerCase() === "online" ? "online" : "offline";
}

/** 日付データに含まれる半荘と参加者を、表示画面向けの形へ変換する。 */
export function normalizeResultRounds(dateEntry, { includeFinalScore = false, includeIconMetadata = false, fallbackRoundId = false } = {}) {
  const playMode = normalizePlayMode(dateEntry.playMode ?? dateEntry.games?.[0]?.playMode);

  return (dateEntry.games ?? []).map((game, index) => ({
    id: game.gameId ?? (fallbackRoundId ? `${dateEntry.date}-${index}` : undefined),
    roundNumber: Number(game.matchNumber ?? index + 1),
    playMode: normalizePlayMode(game.playMode ?? playMode),
    ruleName: game.rule?.name || "未設定",
    players: [...(game.players ?? [])]
      .map((player) => {
        const normalizedPlayer = {
          playerId: player.playerId,
          name: player.name,
          avatar: getRankingPlayerIconSrc(player.iconPath, player.iconVersion, player.name),
          point: Number(player.finalPoint ?? 0),
          rank: Number(player.rank ?? 0),
        };
        if (includeIconMetadata) {
          normalizedPlayer.iconPath = player.iconPath;
          normalizedPlayer.iconVersion = player.iconVersion;
        }
        if (includeFinalScore) normalizedPlayer.finalScore = Number(player.finalScore ?? 0);
        return normalizedPlayer;
      })
      .sort((a, b) => a.rank - b.rank),
  }));
}

/** 参加者一覧へ累計点とアイコンを加え、指定順で並べる。 */
export function normalizeResultParticipants(dateEntry, rounds, { order = "points", includeIconVersion = false } = {}) {
  const totals = aggregatePlayerPoints(rounds);
  const participants = (dateEntry.participants ?? []).map((player) => {
    const normalizedPlayer = {
      playerId: player.playerId,
      name: player.name,
      iconPath: player.iconPath,
      avatar: getRankingPlayerIconSrc(player.iconPath, player.iconVersion, player.name),
      totalPoint: totals[String(player.playerId ?? player.name)]?.totalPoint ?? 0,
    };
    if (includeIconVersion) normalizedPlayer.iconVersion = player.iconVersion;
    return normalizedPlayer;
  });

  if (order === "playerId") {
    return participants.sort((a, b) => Number(a.playerId ?? 0) - Number(b.playerId ?? 0));
  }
  return participants.sort((a, b) => b.totalPoint - a.totalPoint);
}
