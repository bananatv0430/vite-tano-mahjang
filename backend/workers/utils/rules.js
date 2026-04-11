export const rules = {
  /**
   * 順位を計算（点数が高い順）
   * 例：[25000, 30000, 18000, 27000] → [3,1,4,2]
   */
  rank(scores) {
    const indexed = scores.map((score, index) => ({ score, index }));
    indexed.sort((a, b) => b.score - a.score);

    const ranks = Array(scores.length);
    let currentRank = 1;

    for (let i = 0; i < indexed.length; i++) {
      if (i > 0 && indexed[i].score < indexed[i - 1].score) {
        currentRank = i + 1;
      }
      ranks[indexed[i].index] = currentRank;
    }
    return ranks;
  },

  /**
   * UMA 配列を順位順に割り当てる
   * 順位 → UMA
   */
  umaForRank(rank, umaList) {
    return umaList[rank - 1] ?? 0;
  },

  /**
   * OKA（トップへの加点）計算
   * totalOka = Oka * 1000
   */
  oka(totalPlayers, okaPoints) {
    return okaPoints * 1000; // server.js と同じ仕様に合わせる
  },

  /**
   * 最終スコア計算
   * scores: 素点 [25000, 30000, 18000, 27000]
   * options:
   *   uma: [20,10,-10,-20] (例)
   *   oka: 10 (トップに +10000)
   */
  calculate(scores, options) {
    const players = scores.length;
    if (players !== 4 && players !== 3) {
      throw new Error("Only 3 or 4 players supported");
    }

    const umaList = options.uma || (players === 4 ? [20, 10, -10, -20] : [20, -20]);
    const okaValue = options.oka || 0;

    // 順位計算
    const ranks = this.rank(scores);

    // トップの index
    const topIndex = ranks.indexOf(1);
    const okaBonus = this.oka(players, okaValue);

    const finalScores = scores.map((rawScore, i) => {
      const uma = this.umaForRank(ranks[i], umaList);

      let total = rawScore + uma * 100;
      if (i === topIndex && okaBonus > 0) {
        total += okaBonus;
      }
      return {
        raw: rawScore,
        rank: ranks[i],
        uma,
        total,
      };
    });

    return finalScores;
  },
};