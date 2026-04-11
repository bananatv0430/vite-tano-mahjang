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

  if (iconVersion == null) {
    return iconPath;
  }

  const separator = String(iconPath).includes("?") ? "&" : "?";
  return `${iconPath}${separator}v=${iconVersion || 1}`;
};

export const formatPoint = (value) => `${value < 0 ? "▲" : ""}${Math.abs(Number(value) || 0).toFixed(1)}pt`;
export const formatRulePoint = (value) => `${value > 0 ? "+" : ""}${value}pt`;

export const formatDisplayDate = (dateValue) => {
  const [year, month, day] = String(dateValue ?? "").split("-");

  if (!year || !month || !day) {
    return String(dateValue ?? "");
  }

  return `${Number(month)}/${Number(day)}`;
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
  const iconPath = player.icon_path ?? player.iconPath ?? "";
  const iconVersion = Number(player.icon_version ?? player.iconVersion ?? 1);

  return {
    id,
    name,
    iconPath,
    iconVersion,
    avatar: getPlayerImageSrc(iconPath, name, iconVersion),
  };
};

export const FALLBACK_PLAYERS = [
  { id: "1", name: "池田 昂平" },
  { id: "2", name: "石戸 蓮" },
  { id: "3", name: "大平 健太郎" },
  { id: "4", name: "加藤 涼太" },
  { id: "5", name: "CPU" },
].map(normalizePlayer);

export const SCORE_PICKER_VALUES = Array.from({ length: 1601 }, (_, index) => 150000 - index * 100);
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

export const calculatePreviewPoint = (score, rank, rule) => {
  const numericScore = Number(score ?? 0);
  const rankIndex = Math.max(0, Number(rank || 1) - 1);
  const rankPoint = Number(rule.rankPoints?.[rankIndex] ?? 0);

  return (numericScore - Number(rule.returnPoint ?? 30000)) / 1000 + rankPoint;
};
