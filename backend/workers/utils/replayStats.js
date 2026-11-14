const percentage = (count, total) => total ? Math.round(count / total * 10000) / 100 : null;
const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] ?? 0), 0);
const average = (values) => {
  const known = values.filter(Number.isFinite);
  return known.length ? Math.round(known.reduce((total, value) => total + value, 0) / known.length * 100) / 100 : null;
};

export function summarizeReplayPlayers(imports, records) {
  const groups = new Map();
  for (const replay of imports) {
    for (const player of JSON.parse(replay.players_json)) {
      const playerId = player.cpu ? "CPU" : player.playerId;
      if (!groups.has(playerId)) groups.set(playerId, { playerId, games: [], rounds: [] });
      groups.get(playerId).games.push({ ...player, count: replay.player_count });
    }
  }
  for (const record of records) {
    groups.get(record.player_id)?.rounds.push(JSON.parse(record.detail_json));
  }
  return [...groups.values()].map(({ playerId, games, rounds }) => {
    const wins = rounds.filter(row => row.won);
    const riichi = rounds.filter(row => row.riichi);
    const dealers = rounds.filter(row => row.seat === row.dealer);
    const knownContinuations = dealers.filter(row => row.dealerContinues !== null);
    const draws = rounds.filter(row => row.exhaustive);
    const rate = (rows, key) => percentage(rows.filter(row => row[key]).length, rows.length);
    const points = (rows) => average(rows.map(row => row.winPoints));
    const fourPlayerGames = games.filter(row => row.count === 4);
    return { playerId, stats: {
      "総半荘数": games.length, "総局数": rounds.length, "累計ポイント": Math.round(games.reduce((total, row) => total + (row.point ?? row.replayPoint ?? 0), 0) * 1000) / 1000,
      "和了率": rate(rounds, "won"), "放銃率": rate(rounds, "dealtIn"), "被自摸率": rate(rounds, "receivedTsumo"),
      "横移動率": rate(rounds, "sideways"), "流局率": rate(rounds, "drawn"), "和了回数": wins.length,
      "和了時立直率": rate(wins, "riichi"), "和了時副露率": rate(wins, "open"), "黙聴率": rate(wins, "silentWin"), "自摸率": rate(wins, "tsumoWin"),
      "平均打点": points(wins), "平均荘家打点": points(wins.filter(row => row.seat === row.dealer)),
      "平均散家打点": points(wins.filter(row => row.seat !== row.dealer)), "総立直率": rate(rounds, "riichi"),
      "立直成功率": rate(riichi, "won"), "立直放銃率": rate(riichi, "dealtIn"),
      "平均待ち牌種数": average(riichi.map(row => row.wait?.types)), "平均待ち牌枚数": average(riichi.map(row => row.wait?.copies)),
      "平均見た目待ち枚数": average(riichi.map(row => row.wait?.visibleCopies)), "連荘率": rate(knownContinuations, "dealerContinues"),
      "親被り率": rate(dealers, "dealerTsumoLoss"), "満貫以上親被り率": rate(dealers, "manganDealerTsumoLoss"),
      "親番の平均収支": average(dealers.map(row => row.scoreChange)), "1局当たりの平均収支": average(rounds.map(row => row.scoreChange)),
      "平均放銃率": rate(rounds, "dealtIn"), "流局聴牌率": rate(draws, "tenpaiAtDraw"), "聴牌料収支": sum(rounds, "tenpaiPayment"), "総副露率": rate(rounds, "open"),
      "本場回収点": sum(wins, "honbaPoints"), "供託回収点": sum(wins, "depositPoints"),
      "平均全ドラ枚数": average(wins.map(row => row.dora.visible + row.dora.red + row.dora.hidden + row.dora.north)),
      "平均表ドラ枚数": average(wins.map(row => row.dora.visible)), "平均赤ドラ枚数": average(wins.map(row => row.dora.red)),
      "平均裏ドラ枚数": average(wins.map(row => row.dora.hidden)),
      "裏ドラ的中率": percentage(wins.filter(row => row.riichi && row.dora.hidden > 0).length, wins.filter(row => row.riichi).length),
      "平均着順": average(games.map(row => row.rank)),
      ...Object.fromEntries([1, 2, 3, 4].map(rank => {
        const eligible = rank === 4 && !fourPlayerGames.length ? [] : games;
        return [rank + "着率", percentage(eligible.filter(row => row.rank === rank).length, eligible.length)];
      })),
      "連対率": percentage(games.filter(row => row.rank <= 2).length, games.length),
      "4着回避率": percentage(fourPlayerGames.filter(row => row.rank < 4).length, fourPlayerGames.length),
      "配牌時平均向聴数": average(rounds.map(row => row.initialShanten)),
    } };
  });
}
