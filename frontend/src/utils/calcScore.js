// 点数早見表用の基本点数計算関数

/**
 * 基本点を計算
 */
function calcBasicPoint(fu, han, isParent) {
  let basicPoint = fu * Math.pow(2, 2 + han);
  basicPoint *= isParent ? 6 : 4;
  return basicPoint;
}

/**
 * 満貫以上かを判定し、該当する場合は点数を返す
 */
function getManganScore(han, isParent) {
  if (han >= 13) return isParent ? 48000 : 32000; // 役満
  if (han >= 11) return isParent ? 36000 : 24000; // 三倍満
  if (han >= 8) return isParent ? 24000 : 16000;  // 倍満
  if (han >= 6) return isParent ? 18000 : 12000;  // 跳満
  if (han >= 5) return isParent ? 12000 : 8000;   // 満貫
  return null;
}

/**
 * ツモ時の支払いを計算
 */
function calcTsumoPayment(totalScore, isParent) {
  if (isParent) {
    // 親ツモ：他家3人から均等
    return Math.ceil(totalScore / 3 / 100) * 100;
  } else {
    // 子ツモ：子1人分 / 親1人分
    const fromChild = Math.ceil(totalScore / 4 / 100) * 100;
    const fromParent = Math.ceil(totalScore / 2 / 100) * 100;
    return [fromChild, fromParent];
  }
}

/**
 * 点数早見表用：符・翻・親子から点数を計算
 */
export function calcScoreFromFuHan(fu, han, isParent) {
  // 存在しない組み合わせは 0 を返す
  if (
    han === 0 ||
    (fu <= 25 && han === 1)
  ) {
    return { tsumo: 0, ron: 0, isMangan: false };
  }

  // 満貫以上の判定
  const manganScore = getManganScore(han, isParent);
  if (manganScore) {
    const tsumo = calcTsumoPayment(manganScore, isParent);
    return {
      tsumo,
      ron: manganScore,
      isMangan: true,
    };
  }

  // 基本点計算
  const basicPoint = calcBasicPoint(fu, han, isParent);
  let ron = Math.ceil(basicPoint / 100) * 100;

  // 満貫判定（点数が満貫に達している場合）
  const manganThreshold = isParent ? 12000 : 8000;
  if (ron >= manganThreshold) {
    ron = manganThreshold;
    const tsumo = calcTsumoPayment(ron, isParent);
    return {
      tsumo,
      ron,
      isMangan: true,
    };
  }

  const tsumo = calcTsumoPayment(ron, isParent);
  return {
    tsumo,
    ron,
    isMangan: false,
  };
}
