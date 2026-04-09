// 役判定ユーティリティ

/**
 * 牌の種類を判定
 */
export function getTileType(tile) {
  if (tile.endsWith("m")) return "manzu";
  if (tile.endsWith("p")) return "pinzu";
  if (tile.endsWith("s")) return "souzu";
  return "jihai";
}

/**
 * 数牌かどうか
 */
export function isNumber(tile) {
  return tile.endsWith("m") || tile.endsWith("p") || tile.endsWith("s");
}

/**
 * 字牌かどうか
 */
export function isHonor(tile) {
  return !isNumber(tile);
}

/**
 * 幺九牌（ヤオチュー牌）かどうか
 */
export function isTerminalOrHonor(tile) {
  if (isHonor(tile)) return true;
  return tile.startsWith("1") || tile.startsWith("9");
}

/**
 * 中張牌（チュンチャン牌）かどうか
 */
export function isSimple(tile) {
  if (isHonor(tile)) return false;
  const num = parseInt(tile[0]);
  return num >= 2 && num <= 8;
}

/**
 * 風牌かどうか
 */
export function isWind(tile) {
  return ["東", "南", "西", "北"].includes(tile);
}

/**
 * 三元牌かどうか
 */
export function isDragon(tile) {
  return ["白", "発", "中"].includes(tile);
}

/**
 * 役を判定する
 * @param hand 手牌（鳴いていない牌）
 * @param melds 鳴き牌
 * @param isTsumo ツモかどうか
 * @param isParent 親かどうか
 * @param bakaze 場風
 * @param jikaze 自風
 * @returns 役のリスト
 */
export function judgeYaku(hand, melds, isTsumo, isParent, bakaze, jikaze) {
  const yakuList = [];
  const allTiles = [...hand, ...melds];
  if (allTiles.length === 0) return yakuList;
  const isMenzen = melds.length === 0; // 門前

  // 断么九（タンヤオ）
  if (allTiles.every(tile => isSimple(tile))) {
    yakuList.push({ name: "断么九", han: 1 });
  }

  // 平和（ピンフ）- 門前のみ、簡易判定
  if (isMenzen && allTiles.every(tile => isNumber(tile))) {
    yakuList.push({ name: "平和", han: 1 });
  }

  // 門前清自摸和（メンゼンツモ）
  if (isMenzen && isTsumo) {
    yakuList.push({ name: "門前清自摸和", han: 1 });
  }

  // 役牌（場風）
  const bakazeCount = allTiles.filter(t => t === bakaze).length;
  if (bakazeCount >= 3) {
    yakuList.push({ name: `役牌 場風${bakaze}`, han: 1 });
  }

  // 役牌（自風）
  const jikazeCount = allTiles.filter(t => t === jikaze).length;
  if (jikazeCount >= 3 && jikaze !== bakaze) {
    yakuList.push({ name: `役牌 自風${jikaze}`, han: 1 });
  }

  // 役牌（三元牌）
  ["白", "発", "中"].forEach(dragon => {
    const count = allTiles.filter(t => t === dragon).length;
    if (count >= 3) {
      yakuList.push({ name: `役牌 ${dragon}`, han: 1 });
    }
  });

  return yakuList;
}
