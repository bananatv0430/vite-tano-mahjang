// Pure input parsing and score display calculations for the fu guide.

/** 牌のグループが雀頭（同じ牌2枚）か判定する。 */
export const isPairGroup = (group) => Array.isArray(group) && group.length === 2 && group[0] === group[1];
const isSequenceGroup = (group) => {
  if (!Array.isArray(group) || group.length !== 3) {
    return false;
  }
  const numbers = group
    .map((tile) => {
      const match = /^([mps])(\d)$/.exec(tile);
      return match ? { suit: match[1], num: Number.parseInt(match[2], 10) } : null;
    });
  if (numbers.some((entry) => !entry)) {
    return false;
  }
  return (
    numbers[0].suit === numbers[1].suit &&
    numbers[1].suit === numbers[2].suit &&
    numbers[0].num + 1 === numbers[1].num &&
    numbers[1].num + 1 === numbers[2].num
  );
};
const isTripletOrKanGroup = (group) =>
  Array.isArray(group) && (group.length === 3 || group.length === 4) && group.every((tile) => tile === group[0]);

/** 雀頭を先頭に置き、残りの面子順を保つ。 */
export const placeHeadGroupAtLeft = (groups, headGroup) => {
  const withoutExistingHeads = groups.filter((group) => !isPairGroup(group));
  return [headGroup, ...withoutExistingHeads];
};

const isYaochuTile = (tile) => {
  if (["east", "south", "west", "north", "white", "green", "red"].includes(tile)) {
    return true;
  }
  const parsed = /^([mps])(\d)$/.exec(tile);
  return Boolean(parsed && (parsed[2] === "1" || parsed[2] === "9"));
};

/** 手牌・副露・和了方法・待ち形から符を計算する。 */
export const calculateTileInputAccurateFu = ({ handTiles, meldTiles, isTileInputStructureComplete, tileWinType, tileWaitType, tileSeatWind, tileRoundWind }) => {
  if (!isTileInputStructureComplete) {
    return null;
  }

  const groupEntries = [
    ...handTiles.map((group) => ({ group, zone: "hand" })),
    ...meldTiles.map((group) => ({ group, zone: "meld" })),
  ];

  const pairEntries = groupEntries.filter((entry) => isPairGroup(entry.group));
  const meldEntries = groupEntries.filter((entry) => !isPairGroup(entry.group));

  if (pairEntries.length !== 1 || meldEntries.length !== 4) {
    return null;
  }

  if (meldEntries.some((entry) => !isSequenceGroup(entry.group) && !isTripletOrKanGroup(entry.group))) {
    return null;
  }

  const dragonTiles = new Set(["white", "green", "red"]);
  const windTiles = new Set(["east", "south", "west", "north"]);
  const hasOpenMeld = meldEntries.some((entry) => entry.zone === "meld");

  let totalFu = 20;
  const pairTile = pairEntries[0].group[0];
  let pairFu = 0;

  if (dragonTiles.has(pairTile)) {
    pairFu += 2;
  }
  if (windTiles.has(pairTile) && pairTile === tileSeatWind) {
    pairFu += 2;
  }
  if (windTiles.has(pairTile) && pairTile === tileRoundWind) {
    pairFu += 2;
  }

  totalFu += pairFu;

  const isPinfuShape =
    !hasOpenMeld &&
    meldEntries.every((entry) => isSequenceGroup(entry.group)) &&
    pairFu === 0 &&
    tileWaitType === "ryanmen";

  if (tileWinType === "ron" && !hasOpenMeld) {
    totalFu += 10;
  }

  if (tileWinType === "tsumo" && !isPinfuShape) {
    totalFu += 2;
  }

  if (tileWaitType === "kanchan" || tileWaitType === "penchan" || tileWaitType === "tanki") {
    totalFu += 2;
  }

  meldEntries.forEach((entry) => {
    if (isSequenceGroup(entry.group)) {
      return;
    }

    const isKan = entry.group.length === 4;
    const tile = entry.group[0];
    const isYaochu = isYaochuTile(tile);

    const isOpen = entry.zone === "meld";

    if (isKan) {
      totalFu += isOpen ? (isYaochu ? 16 : 8) : (isYaochu ? 32 : 16);
      return;
    }

    totalFu += isOpen ? (isYaochu ? 4 : 2) : (isYaochu ? 8 : 4);
  });

  if (isPinfuShape && tileWinType === "tsumo") {
    return 20;
  }

  return Math.ceil(totalFu / 10) * 10;
};

/** 入力された牌姿に成立する役と役満を抽出する。 */
export const calculateTileInputYaku = ({ handTiles, meldTiles, isTileInputStructureComplete, tileWinType, tileWaitType, tileSeatWind, tileRoundWind }) => {
  if (!isTileInputStructureComplete) {
    return [];
  }

  const groupEntries = [
    ...handTiles.map((group) => ({ group, zone: "hand" })),
    ...meldTiles.map((group) => ({ group, zone: "meld" })),
  ];

  const pairEntries = groupEntries.filter((entry) => isPairGroup(entry.group));
  const meldEntries = groupEntries.filter((entry) => !isPairGroup(entry.group));

  if (pairEntries.length !== 1 || meldEntries.length !== 4) {
    return [];
  }

  if (meldEntries.some((entry) => !isSequenceGroup(entry.group) && !isTripletOrKanGroup(entry.group))) {
    return [];
  }

  const yakuList = [];
  const yakumanList = [];
  const hasOpenMeld = meldEntries.some((entry) => entry.zone === "meld");
  const allTiles = groupEntries.flatMap((entry) => entry.group);
  const dragonTiles = new Set(["white", "green", "red"]);
  const windTiles = new Set(["east", "south", "west", "north"]);
  const honorTiles = new Set(["east", "south", "west", "north", "white", "green", "red"]);
  const windLabelMap = {
    east: "東",
    south: "南",
    west: "西",
    north: "北",
  };
  const dragonLabelMap = {
    white: "白",
    green: "發",
    red: "中",
  };

  const parseNumberTile = (tile) => {
    const match = /^([mps])(\d)$/.exec(tile);
    if (!match) {
      return null;
    }
    return {
      suit: match[1],
      num: Number.parseInt(match[2], 10),
    };
  };

  const isSimpleTile = (tile) => {
    const parsed = parseNumberTile(tile);
    if (!parsed) {
      return false;
    }
    return parsed.num >= 2 && parsed.num <= 8;
  };

  const isTerminalTile = (tile) => {
    const parsed = parseNumberTile(tile);
    if (!parsed) {
      return false;
    }
    return parsed.num === 1 || parsed.num === 9;
  };

  const isYaochuTileLocal = (tile) => honorTiles.has(tile) || isTerminalTile(tile);

  const isGroupYaochuCompatible = (group) => {
    if (isPairGroup(group) || isTripletOrKanGroup(group)) {
      return isYaochuTileLocal(group[0]);
    }
    if (isSequenceGroup(group)) {
      const first = parseNumberTile(group[0]);
      return Boolean(first && (first.num === 1 || first.num === 7));
    }
    return false;
  };

  const addYaku = (name, han) => {
    if (yakuList.some((item) => item.name === name)) {
      return;
    }
    yakuList.push({ name, han });
  };

  const addYakuman = (name, multiplier = 1) => {
    if (yakumanList.some((item) => item.name === name)) {
      return;
    }
    yakumanList.push({ name, han: 13 * multiplier });
  };

  const sequenceEntries = meldEntries.filter((entry) => isSequenceGroup(entry.group));
  const tripletOrKanEntries = meldEntries.filter((entry) => isTripletOrKanGroup(entry.group));
  const pairTile = pairEntries[0].group[0];
  const allSequences = sequenceEntries.length === 4;
  const allTripletLike = tripletOrKanEntries.length === 4;

  const tripletTileGroups = tripletOrKanEntries.map((entry) => entry.group[0]);
  const tripletTileGroupSet = new Set(tripletTileGroups);
  const concealedTripletLikeCount = tripletOrKanEntries.filter((entry) => entry.zone === "hand").length;
  const kanCount = tripletOrKanEntries.filter((entry) => entry.group.length === 4).length;

  const sequenceKeyCount = new Map();
  sequenceEntries.forEach((entry) => {
    const first = parseNumberTile(entry.group[0]);
    if (!first) {
      return;
    }
    const key = `${first.suit}${first.num}`;
    sequenceKeyCount.set(key, (sequenceKeyCount.get(key) ?? 0) + 1);
  });

  const sequenceKeySet = new Set(sequenceKeyCount.keys());
  const dragonTripletCount = ["white", "green", "red"].filter((tile) => tripletTileGroupSet.has(tile)).length;
  const windTripletCount = ["east", "south", "west", "north"].filter((tile) => tripletTileGroupSet.has(tile)).length;

  const suitedTiles = allTiles.map(parseNumberTile).filter((tile) => tile !== null);
  const suitedSet = new Set(suitedTiles.map((tile) => tile.suit));
  const hasHonors = allTiles.some((tile) => honorTiles.has(tile));

  const isAllHonors = allTiles.every((tile) => honorTiles.has(tile));
  const isAllTerminals = allTiles.every((tile) => isTerminalTile(tile));
  const isAllYaochu = allTiles.every((tile) => isYaochuTileLocal(tile));
  const isAllGreen = allTiles.every((tile) => tile === "green" || tile === "s2" || tile === "s3" || tile === "s4" || tile === "s6" || tile === "s8");

  if (!hasOpenMeld && suitedSet.size === 1 && !hasHonors) {
    const onlySuit = [...suitedSet][0];
    const suitCount = new Map(Array.from({ length: 10 }, (_, index) => [index, 0]));
    allTiles.forEach((tile) => {
      const parsed = parseNumberTile(tile);
      if (!parsed || parsed.suit !== onlySuit) {
        return;
      }
      suitCount.set(parsed.num, (suitCount.get(parsed.num) ?? 0) + 1);
    });
    const isChuurenBase =
      (suitCount.get(1) ?? 0) >= 3 &&
      (suitCount.get(9) ?? 0) >= 3 &&
      [2, 3, 4, 5, 6, 7, 8].every((num) => (suitCount.get(num) ?? 0) >= 1);
    if (isChuurenBase) {
      addYakuman("九蓮宝燈");
    }
  }

  if (dragonTripletCount === 3) {
    addYakuman("大三元");
  }
  if (windTripletCount === 4) {
    addYakuman("大四喜", 2);
  } else if (windTripletCount === 3 && windTiles.has(pairTile)) {
    addYakuman("小四喜");
  }
  if (isAllHonors) {
    addYakuman("字一色");
  }
  if (isAllTerminals) {
    addYakuman("清老頭");
  }
  if (isAllGreen) {
    addYakuman("緑一色");
  }
  if (concealedTripletLikeCount === 4) {
    addYakuman("四暗刻");
  }
  if (kanCount === 4) {
    addYakuman("四槓子");
  }

  if (yakumanList.length > 0) {
    return yakumanList;
  }

  if (allTiles.every((tile) => isSimpleTile(tile))) {
    addYaku("断么九", 1);
  }

  if (!hasOpenMeld && tileWinType === "tsumo") {
    addYaku("門前清自摸和", 1);
  }

  const pairIsYakuhai =
    dragonTiles.has(pairTile) ||
    (windTiles.has(pairTile) && (pairTile === tileSeatWind || pairTile === tileRoundWind));
  if (!hasOpenMeld && allSequences && !pairIsYakuhai && tileWaitType === "ryanmen") {
    addYaku("平和", 1);
  }

  if (allTripletLike) {
    addYaku("対々和", 2);
  }

  if (concealedTripletLikeCount >= 3) {
    addYaku("三暗刻", 2);
  }

  if (kanCount >= 3) {
    addYaku("三槓子", 2);
  }

  if (allTripletLike && isAllYaochu) {
    addYaku("混老頭", 2);
  }

  if (dragonTripletCount === 2 && dragonTiles.has(pairTile)) {
    addYaku("小三元", 2);
  }

  for (let num = 1; num <= 9; num += 1) {
    if (
      tripletTileGroupSet.has(`m${num}`) &&
      tripletTileGroupSet.has(`p${num}`) &&
      tripletTileGroupSet.has(`s${num}`)
    ) {
      addYaku("三色同刻", 2);
      break;
    }
  }

  for (let num = 1; num <= 7; num += 1) {
    if (
      sequenceKeySet.has(`m${num}`) &&
      sequenceKeySet.has(`p${num}`) &&
      sequenceKeySet.has(`s${num}`)
    ) {
      addYaku("三色同順", hasOpenMeld ? 1 : 2);
      break;
    }
  }

  ["m", "p", "s"].forEach((suit) => {
    if (
      sequenceKeySet.has(`${suit}1`) &&
      sequenceKeySet.has(`${suit}4`) &&
      sequenceKeySet.has(`${suit}7`)
    ) {
      addYaku("一気通貫", hasOpenMeld ? 1 : 2);
    }
  });

  if (!hasOpenMeld) {
    const duplicateSequenceKeyCount = Array.from(sequenceKeyCount.values()).filter((count) => count >= 2).length;
    if (duplicateSequenceKeyCount >= 2) {
      addYaku("二盃口", 3);
    } else if (duplicateSequenceKeyCount >= 1) {
      addYaku("一盃口", 1);
    }
  }

  const allGroups = [...meldEntries.map((entry) => entry.group), pairEntries[0].group];
  const hasSequenceGroup = sequenceEntries.length > 0;
  const isAllGroupsYaochuCompatible = allGroups.every((group) => isGroupYaochuCompatible(group));
  const hasHonorTile = allTiles.some((tile) => honorTiles.has(tile));

  if (isAllGroupsYaochuCompatible && hasSequenceGroup) {
    if (hasHonorTile) {
      addYaku("混全帯么九", hasOpenMeld ? 1 : 2);
    } else {
      addYaku("純全帯么九", hasOpenMeld ? 2 : 3);
    }
  }

  if (suitedSet.size === 1 && hasHonors) {
    addYaku("混一色", hasOpenMeld ? 2 : 3);
  }
  if (suitedSet.size === 1 && !hasHonors) {
    addYaku("清一色", hasOpenMeld ? 5 : 6);
  }

  tripletOrKanEntries.forEach((entry) => {
    const tile = entry.group[0];
    if (dragonTiles.has(tile)) {
      addYaku(`役牌 ${dragonLabelMap[tile]}`, 1);
    }
    if (windTiles.has(tile) && tile === tileRoundWind) {
      addYaku(`役牌 場風${windLabelMap[tile]}`, 1);
    }
    if (windTiles.has(tile) && tile === tileSeatWind) {
      addYaku(`役牌 自風${windLabelMap[tile]}`, 1);
    }
  });

  return yakuList;
};

/** 成立役の翻数を合計する。 */
export const calculateTileInputHan = (yakuList) =>
  yakuList.reduce((sum, yaku) => sum + yaku.han, 0);

const roundUpTo100 = (value) => Math.ceil(value / 100) * 100;

const formatScoreValue = (value) => value.toLocaleString("ja-JP");

/** 翻・符・親子・ロンツモから表示用の点数文字列を作る。 */
export const calculateHanFuScoreText = ({ fu, han, isDealer, isTsumo }) => {
  const basePoints = fu * (2 ** (han + 2));
  const isMangan = han >= 5 || basePoints >= 2000;

  if (isMangan) {
    if (isTsumo) {
      return isDealer ? "4,000オール" : "2,000/4,000";
    }
    return "満貫";
  }

  if (isTsumo) {
    if (isDealer) {
      const allPay = roundUpTo100(basePoints * 2);
      return `${formatScoreValue(allPay)}オール`;
    }
    const childPay = roundUpTo100(basePoints);
    const dealerPay = roundUpTo100(basePoints * 2);
    return `${formatScoreValue(childPay)}/${formatScoreValue(dealerPay)}`;
  }

  const ronPoint = isDealer
    ? roundUpTo100(basePoints * 6)
    : roundUpTo100(basePoints * 4);
  return formatScoreValue(ronPoint);
};

const TILE_SUIT_CODES = new Set(["m", "p", "s", "z"]);

const HONOR_TILE_CODES = {
  1: "east",
  2: "south",
  3: "west",
  4: "north",
  5: "white",
  6: "green",
  7: "red",
};

const HONOR_CHAR_TO_DIGIT = {
  東: "1",
  南: "2",
  西: "3",
  北: "4",
  白: "5",
  發: "6",
  発: "6",
  中: "7",
};

const normalizeTileDraft = (value) =>
  value
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[ｍ]/g, "m")
    .replace(/[ｐ]/g, "p")
    .replace(/[ｓ]/g, "s")
    .replace(/[ｚ]/g, "z")
    .toLowerCase();

const isSequentialDigits = (digits) =>
  digits.length === 3 && digits[1] === digits[0] + 1 && digits[2] === digits[1] + 1;

const isUniformDigits = (digits) => digits.every((digit) => digit === digits[0]);

/** 牌のテキスト入力を牌コードの配列に変換する。 */
export const parseTileDraft = (rawValue) => {
  const trimmed = rawValue.trim();
  const honorOnlyMatch = /^([東南西北白發発中])\1*$/.exec(trimmed);
  const honorExpandedValue = (() => {
    if (!honorOnlyMatch) {
      return trimmed;
    }
    const honorChar = honorOnlyMatch[1];
    const count = trimmed.length;
    const mappedDigit = HONOR_CHAR_TO_DIGIT[honorChar];
    if (!mappedDigit || count < 2 || count > 4) {
      return trimmed;
    }
    return `${mappedDigit.repeat(count)}z`;
  })();

  const value = normalizeTileDraft(honorExpandedValue);

  if (!value) {
    return null;
  }

  const firstChar = value[0];
  const lastChar = value[value.length - 1];
  const prefixSuit = TILE_SUIT_CODES.has(firstChar) ? firstChar : null;
  const suffixSuit = TILE_SUIT_CODES.has(lastChar) ? lastChar : null;

  if (prefixSuit && suffixSuit) {
    return null;
  }

  const suit = prefixSuit ?? suffixSuit;
  if (!suit) {
    return null;
  }

  const numberPart = prefixSuit ? value.slice(1) : value.slice(0, -1);
  if (!/^\d+$/.test(numberPart)) {
    return null;
  }

  const digits = numberPart.split("").map((digit) => Number.parseInt(digit, 10));
  const isSequence = isSequentialDigits(digits);
  const isPair = digits.length === 2 ? isUniformDigits(digits) : false;
  const isTripletOrKan = digits.length === 3 || digits.length === 4 ? isUniformDigits(digits) : false;

  if (!isSequence && !isPair && !isTripletOrKan) {
    return null;
  }

  if (suit === "z") {
    if (!isPair && !isTripletOrKan) {
      return null;
    }

    const honorCode = HONOR_TILE_CODES[digits[0]];
    if (!honorCode) {
      return null;
    }

    return {
      tiles: Array.from({ length: digits.length }, () => honorCode),
      kind: isPair ? "pair" : digits.length === 4 ? "darkKan" : "triplet",
    };
  }

  if (isSequence) {
    return {
      tiles: digits.map((digit) => `${suit}${digit}`),
      kind: "sequence",
    };
  }

  return {
    tiles: Array.from({ length: digits.length }, () => `${suit}${digits[0]}`),
    kind: isPair ? "pair" : digits.length === 4 ? "darkKan" : "triplet",
  };
};
