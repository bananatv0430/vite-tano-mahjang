// 点数早見表の定数定義

/** 符のリスト */
export const fuList = [20, 25, 30, 40, 50, 60, 70];

/** 親側の翻数リスト（右から左へ） */
export const parentHanList = [4, 3, 2, 1];

/** 子側の翻数リスト（左から右へ） */
export const childHanList = [1, 2, 3, 4];

/** 高得点行の定義 */
export const highScoreRows = [
  { hanlabel: "4～5翻", rankLabel: "満貫", han: 5 },
  { hanlabel: "6～7翻", rankLabel: "跳満", han: 6 },
  { hanlabel: "8～10翻", rankLabel: "倍満", han: 8 },
  { hanlabel: "11～12翻", rankLabel: "三倍満", han: 11 },
  { hanlabel: "13翻～", rankLabel: "役満", han: 13 },
];
