export function tileIndex(tile) {
  if (!/^[0-9][mpsz]$/.test(tile)) throw new Error("牌の形式を読み取れません");
  const suit = "mpsz".indexOf(tile[1]);
  const rank = Number(tile[0]) || 5;
  if (suit === 3 && rank > 7) throw new Error("字牌の形式を読み取れません");
  return suit * 9 + rank - 1;
}

export function countTiles(tiles) {
  const counts = Array(34).fill(0);
  for (const tile of tiles) counts[tileIndex(tile)]++;
  return counts;
}

export function shanten(counts) {
  let best = 8;
  function search(index, sets, pairs, blocks) {
    while (index < 34 && !counts[index]) index++;
    if (index === 34) {
      best = Math.min(best, 8 - 2 * sets - pairs - Math.min(blocks, 4 - sets));
      return;
    }
    const rank = index % 9;
    const numbered = index < 27;
    function take(second, third, nextSets, nextPairs, nextBlocks) {
      counts[index]--;
      if (second !== null) counts[second]--;
      if (third !== null) counts[third]--;
      search(index, nextSets, nextPairs, nextBlocks);
      if (third !== null) counts[third]++;
      if (second !== null) counts[second]++;
      counts[index]++;
    }
    if (counts[index] >= 3) take(index, index, sets + 1, pairs, blocks);
    if (numbered && rank < 7 && counts[index + 1] && counts[index + 2]) {
      take(index + 1, index + 2, sets + 1, pairs, blocks);
    }
    if (counts[index] >= 2) {
      if (!pairs) take(index, null, sets, 1, blocks);
      take(index, null, sets, pairs, blocks + 1);
    }
    if (numbered && rank < 8 && counts[index + 1]) take(index + 1, null, sets, pairs, blocks + 1);
    if (numbered && rank < 7 && counts[index + 2]) take(index + 2, null, sets, pairs, blocks + 1);
    take(null, null, sets, pairs, blocks);
  }
  const types = counts.filter(Boolean).length;
  const pairs = counts.filter(count => count >= 2).length;
  const terminals = counts.filter((count, index) => count && (index >= 27 || index % 9 === 0 || index % 9 === 8)).length;
  const terminalPair = counts.some((count, index) => count >= 2 && (index >= 27 || index % 9 === 0 || index % 9 === 8));
  search(0, 0, 0, 0);
  return Math.min(best, 6 - pairs + Math.max(0, 7 - types), 13 - terminals - Number(terminalPair));
}
