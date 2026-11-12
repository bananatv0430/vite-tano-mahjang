/** 登録・編集APIへ送る対局データをフォーム値から組み立てる。 */
export function buildGamePayload({ date, ruleId, playMode, rounds, calculatePoint }) {
  return {
    date,
    ruleId: Number(ruleId),
    playMode,
    rounds: rounds.map((round) => ({
      players: round.players.map((player) => {
        const score = Number(player.score ?? 0);
        const rank = Number(player.rank ?? 0);
        const result = {
          playerId: Number(player.playerId),
          score,
          rank,
        };
        if (calculatePoint) result.point = calculatePoint(score, rank);
        return result;
      }),
    })),
  };
}
