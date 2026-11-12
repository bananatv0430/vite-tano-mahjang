export const createAvatar = (name) => {
  const firstChar = String(name ?? "?").slice(0, 1);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="60" fill="#f4f4f4"/>
      <circle cx="60" cy="45" r="22" fill="#f08300" opacity="0.92"/>
      <path d="M24 104c6-22 20-33 36-33s30 11 36 33" fill="#f08300" opacity="0.86"/>
      <text x="60" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">${firstChar}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const getPlayerImageSrc = (iconPath, name, iconVersion) => {
  if (!iconPath) {
    return createAvatar(name);
  }
  return iconPath;
};

export const formatPoint = (value) => `${value < 0 ? "▲" : ""}${Math.abs(Number(value) || 0).toFixed(1)}pt`;
export const formatRulePoint = (value) => `${value > 0 ? "+" : ""}${value}pt`;

/** YYYY-MM-DD形式の日付を画面表示用の年月日に分解する。 */
export const getDisplayDateParts = (dateValue) => {
  const [year, month, day] = String(dateValue ?? "").split("-");

  if (!year || !month || !day) {
    return null;
  }

  return {
    year,
    month: String(Number(month)),
    day: String(Number(day)),
  };
};

export const formatDisplayDate = (dateValue) => {
  const parts = getDisplayDateParts(dateValue);
  return parts ? `${parts.month}/${parts.day}` : String(dateValue ?? "");
};

export const getJapaneseWeekday = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
};

export const formatNumber = (value) => Number(value || 0).toLocaleString("ja-JP");

export const getRankPointsFromRule = (rule) => {
  const uma1 = Number(rule.uma1 ?? 0);
  const uma2 = Number(rule.uma2 ?? 0);
  const returnPoint = Number(rule.oka ?? rule.returnPoint ?? 0);
  const startPoint = Number(rule.startScore ?? rule.startPoint ?? 0);
  const bonus = ((returnPoint - startPoint) * 4) / 1000;

  return [
    Number((bonus + uma1).toFixed(1)),
    Number(uma2.toFixed(1)),
    Number((-uma2).toFixed(1)),
    Number((-uma1).toFixed(1)),
  ];
};

export const normalizeRule = (rule) => {
  const uma1 = Number(rule.uma1 ?? 0);
  const uma2 = Number(rule.uma2 ?? 0);
  const returnPoint = Number(rule.oka ?? rule.returnPoint ?? 0);
  const startPoint = Number(rule.startScore ?? rule.start_score ?? rule.startPoint ?? 0);

  return {
    id: String(rule.id ?? ""),
    name: String(rule.name ?? "未設定"),
    uma1,
    uma2,
    umaLabel: `${uma1}-${uma2}`,
    returnPoint,
    startPoint,
    rankPoints: getRankPointsFromRule({ uma1, uma2, returnPoint, startPoint }),
  };
};

export const FALLBACK_RULES = [
  normalizeRule({ id: "default", name: "デフォルト", returnPoint: 30000, startPoint: 25000, uma1: 20, uma2: 10 }),
  normalizeRule({ id: "light", name: "ライト", returnPoint: 30000, startPoint: 25000, uma1: 15, uma2: 5 }),
];

export const normalizePlayer = (player) => {
  const id = String(player.id ?? "");
  const name = String(player.name ?? "未設定");
  // icon_path→iconPath変換を厳密に
  let iconPath = "";
  if (typeof player.icon_path === "string" && player.icon_path.length > 0) {
    iconPath = player.icon_path;
  } else if (typeof player.iconPath === "string" && player.iconPath.length > 0) {
    iconPath = player.iconPath;
  }

  return {
    id,
    name,
    iconPath,
    avatar: getPlayerImageSrc(iconPath, name),
  };
};

export const FALLBACK_PLAYERS = [
  { id: "1", name: "池田 昂平" },
  { id: "2", name: "石戸 蓮" },
  { id: "3", name: "大平 健太郎" },
  { id: "4", name: "加藤 涼太" },
  { id: "5", name: "CPU" },
].map(normalizePlayer);

export const SCORE_PICKER_VALUES = Array.from({ length: 1501 }, (_, index) => 120000 - index * 100);
export const SCORE_PICKER_SET = new Set(SCORE_PICKER_VALUES);

export const buildAutoRanks = (players) => {
  const sorted = [...players]
    .map((player, index) => ({
      index,
      score: Number(player.score ?? 0),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const rankMap = sorted.reduce((accumulator, player, index) => {
    accumulator[player.index] = String(index + 1);
    return accumulator;
  }, {});

  return players.map((player, index) => ({
    ...player,
    rank: rankMap[index] ?? player.rank ?? String(index + 1),
  }));
};

export const createRound = (roundNumber, players = FALLBACK_PLAYERS, startScore = 25000) => ({
  id: `round-${Date.now()}-${roundNumber}-${Math.random().toString(16).slice(2)}`,
  players: buildAutoRanks(
    Array.from({ length: 4 }, (_, index) => ({
      playerId: players[(roundNumber + index - 1) % players.length]?.id ?? "",
      score: String(startScore),
      rank: String(index + 1),
    }))
  ),
});

/** 対局開始時の4人を選択済み参加者で初期化した半荘データを作る。 */
export const buildEntryRound = (roundNumber, players, startScore, selectedPlayerIds) => {
  const round = createRound(roundNumber, players, startScore);
  return {
    ...round,
    players: round.players.map((player, index) => ({
      ...player,
      playerId: selectedPlayerIds[index] ?? player.playerId,
    })),
  };
};

export const calculatePreviewPoint = (score, rank, rule) => {
  const numericScore = Number(score ?? 0);
  const rankIndex = Math.max(0, Number(rank || 1) - 1);
  const rankPoint = Number(rule.rankPoints?.[rankIndex] ?? 0);

  return (numericScore - Number(rule.returnPoint ?? 30000)) / 1000 + rankPoint;
};

/** 全半荘の得点をプレイヤー単位で合算する。 */
export const aggregatePlayerPoints = (rounds) =>
  rounds.flatMap((round) => round.players ?? []).reduce((totals, player) => {
    const key = String(player.playerId ?? player.name);
    if (!totals[key]) totals[key] = { ...player, totalPoint: 0 };
    totals[key].totalPoint += Number(player.point ?? 0);
    return totals;
  }, {});

/** 合計得点順に並べ、対局全体の順位を付ける。 */
export const calculateTotalStandings = (rounds) =>
  Object.values(aggregatePlayerPoints(rounds))
    .sort((a, b) => b.totalPoint - a.totalPoint)
    .map((player, index) => ({ ...player, totalRank: index + 1 }));
