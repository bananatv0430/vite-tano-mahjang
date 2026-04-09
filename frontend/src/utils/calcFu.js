// 符計算ユーティリティ
import { isTerminalOrHonor, isWind, isDragon } from "./yakuJudge";

/**
 * 符を計算する
 * @param {string[]} hand
 * @param {string[]} melds
 * @param {boolean} isTsumo
 * @param {boolean} isParent
 * @param {string} [winTile]
 * @returns {number}
 */
export function calculateFu(hand, melds, isTsumo, isParent, winTile) {
  const allTiles = [...hand, ...melds];
  if (allTiles.length === 0) return 30;
  let fu = 20; // 副底

  // 門前ロン加符
  if (melds.length === 0 && !isTsumo) {
    fu += 10;
  }
  // ツモ加符
  if (isTsumo) {
    fu += 2;
  }
  // 面子の符を加算（簡易計算）
  const uniqueTiles = Array.from(new Set(allTiles));
  const tileCounts = new Map();
  allTiles.forEach(tile => {
    tileCounts.set(tile, (tileCounts.get(tile) || 0) + 1);
  });
  // 刻子・槓子の符
  tileCounts.forEach((count, tile) => {
    if (count >= 3) {
      const isYaochu = isTerminalOrHonor(tile);
      const isMeld = melds.includes(tile);
      if (count === 4) {
        // 槓子
        fu += isMeld ? (isYaochu ? 16 : 8) : (isYaochu ? 32 : 16);
      } else if (count === 3) {
        // 刻子
        fu += isMeld ? (isYaochu ? 4 : 2) : (isYaochu ? 8 : 4);
      }
    }
  });
  // 雀頭の符（役牌）
  tileCounts.forEach((count, tile) => {
    if (count === 2 && (isWind(tile) || isDragon(tile))) {
      fu += 2;
    }
  });
  // 10符単位に切り上げ
  fu = Math.ceil(fu / 10) * 10;
  // 最低30符（平和ツモは20符だが、ここでは簡易的に30符とする）
  if (fu < 30) fu = 30;
  return fu;
}
