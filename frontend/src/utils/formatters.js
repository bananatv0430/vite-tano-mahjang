// 点数早見表のフォーマット関数

/**
 * ツモ点を文字列にフォーマット
 * @param {number|[number,number]} tsumo
 * @returns {string}
 */
export function formatTsumo(tsumo) {
  if (Array.isArray(tsumo)) {
    return `(${tsumo[0]}/${tsumo[1]})`;
  }
  return `(${tsumo})`;
}
