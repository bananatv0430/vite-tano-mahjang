import { countTiles, shanten, tileIndex } from "./replayHand.js";

const roundEnds = new Set(["Hule", "NoTile", "LiuJu"]);
const knownRecords = new Set(["NewRound", "DealTile", "DiscardTile", "ChiPengGang", "AnGangAddGang", "BaBei", ...roundEnds]);
const seatOf = record => record.seat ?? 0;

function requireReplay(condition, message) {
  if (!condition) throw new Error(message);
}

export function readReplay(replay) {
  const head = replay?.head;
  const details = replay?.data?.data;
  const final = head?.result?.players;
  const id = head?.uuid || replay?.replay_id;
  requireReplay(replay?.schema_version === 1 && /^[a-z0-9-]{1,128}$/i.test(id ?? ""), "牌譜JSONの形式が不正です");
  requireReplay(Number.isInteger(head?.start_time) && head.start_time > 0, "対局日時がありません");
  requireReplay([3, 4].includes(final?.length) && head.config, "対局結果またはルールがありません");
  const date = new Date((head.start_time + 9 * 3600) * 1000).toISOString().slice(0, 10);
  const count = final.length;
  const accounts = new Map((head.accounts ?? []).map(account => [seatOf(account), account]));
  const robots = new Set((head.robots ?? []).map(seatOf));
  const players = final.map((result, index) => {
    const seat = seatOf(result);
    const account = accounts.get(seat);
    requireReplay(Number.isInteger(seat) && seat >= 0 && seat < count && (account?.nickname || robots.has(seat)), "対局者情報が不足しています");
    return { seat, name: account?.nickname || "CPUプレイヤー", cpu: !account, accountId: account?.account_id ?? null,
      score: result.part_point_1 ?? 0, rank: index + 1, replayPoint: (result.total_point ?? 0) / 1000 };
  });
  requireReplay(new Set(players.map(player => player.seat)).size === count, "対局者の座席が重複しています");
  const records = details?.version === 0 ? details.records :
    details?.version === 210715 ? details.actions?.filter(action => action.type === 1).map(action => action.result) : null;
  requireReplay(Array.isArray(records) && records.length, "対応する局データがありません");
  return { id, date, count, players, records, rules: head.config };
}

function startRound(data, count, number) {
  requireReplay(data.scores?.length === count && data.scores.every(Number.isInteger), "局開始時の点数が不足しています");
  const dealer = data.ju ?? 0;
  return {
    number, dealer, wind: data.chang ?? 0, honba: data.ben ?? 0,
    deposits: data.liqibang ?? 0, startingDeposits: data.liqibang ?? 0,
    startScores: data.scores, scores: [...data.scores], visible: Array(34).fill(0), indicators: [],
    ronSource: null,
    seats: data.scores.map((_, seat) => {
      const hand = countTiles(data["tiles" + seat] ?? []);
      const size = hand.reduce((sum, value) => sum + value, 0);
      requireReplay(size === 13 || size === 14, "配牌の枚数が不正です");
      return { seat, hand, initialShanten: Math.max(0, shanten(hand)), riichi: false, open: false,
        wait: null, won: false, dealtIn: false, tsumoWin: false, receivedTsumo: false, ronWin: false, winPoints: 0,
        depositPoints: 0, honbaPoints: 0, dora: null };
    }),
  };
}

function reveal(round, tile) {
  round.visible[tileIndex(tile)]++;
}

function trackPlay(round, type, data) {
  if (data.doras?.length > round.indicators.length) {
    for (const tile of data.doras.slice(round.indicators.length)) reveal(round, tile);
    round.indicators = data.doras;
  }
  if (data.liqi && !data.liqi.failed) {
    round.scores[seatOf(data.liqi)] = data.liqi.score ?? 0;
    round.deposits = data.liqi.liqibang ?? round.deposits + 1;
  }
  const seat = seatOf(data);
  const player = round.seats[seat];
  if (type === "DealTile") {
    player.hand[tileIndex(data.tile)]++;
  } else if (type === "DiscardTile") {
    player.hand[tileIndex(data.tile)]--;
    reveal(round, data.tile);
    round.ronSource = seat;
    if (data.is_liqi || data.is_wliqi) {
      player.riichi = true;
      const types = [...new Set((data.tingpais ?? []).map(wait => tileIndex(wait.tile)))];
      player.wait = types.length ? {
        types: types.length,
        copies: types.reduce((sum, index) => sum + Math.max(0, 4 - player.hand[index]), 0),
        visibleCopies: types.reduce((sum, index) => sum + Math.max(0, 4 - player.hand[index] - round.visible[index]), 0),
      } : null;
    }
  } else if (type === "ChiPengGang") {
    player.open = true;
    for (const [index, tile] of data.tiles.entries()) {
      if ((data.froms[index] ?? 0) !== seat) continue;
      player.hand[tileIndex(tile)]--;
      reveal(round, tile);
    }
  } else if (type === "AnGangAddGang") {
    const tile = tileIndex(data.tiles);
    const consumed = player.hand[tile];
    player.hand[tile] = 0;
    round.visible[tile] += consumed;
    round.ronSource = seat;
  } else if (type === "BaBei") {
    player.hand[tileIndex("4z")]--;
    reveal(round, "4z");
    round.ronSource = seat;
  }
}

function finishRound(round, type, data) {
  const scoreDeltas = Array(round.seats.length).fill(0);
  let endScores = round.scores;
  if (type === "Hule") {
    requireReplay(data.hules?.length && data.scores?.length === round.seats.length, "和了時の点数が不足しています");
    endScores = data.scores;
    for (const [index, win] of data.hules.entries()) {
      const seat = seatOf(win);
      const player = round.seats[seat];
      player.won = true;
      player.tsumoWin = Boolean(win.zimo);
      player.ronWin = !win.zimo;
      player.winPoints = win.dadian ?? win.point_sum ?? win.point_rong ?? 0;
      if (!index) player.depositPoints = round.deposits * 1000;
      player.honbaPoints = round.honba * (win.zimo ? (round.seats.length - 1) * 100 : 300);
      const fan = id => (win.fans ?? []).filter(item => item.id === id).reduce((sum, item) => sum + (item.val ?? 0), 0);
      player.dora = { visible: fan(31), red: fan(32), hidden: fan(30), north: fan(33) };
      if (win.zimo) {
        for (const other of round.seats) if (other.seat !== seat) other.receivedTsumo = true;
      } else {
        requireReplay(round.ronSource !== null && round.ronSource !== seat, "放銃者を特定できません");
        round.seats[round.ronSource].dealtIn = true;
      }
    }
  } else if (type === "NoTile") {
    for (const result of data.scores ?? []) {
      for (const [seat, delta] of (result.delta_scores ?? []).entries()) scoreDeltas[seat] += delta;
    }
    endScores = round.scores.map((score, seat) => score + scoreDeltas[seat]);
  }
  return round.seats.map(player => {
    const { hand, ...detail } = player;
    const seat = player.seat;
    return {
      ...detail, startScore: round.startScores[seat], dealer: round.dealer, wind: round.wind, handNumber: round.dealer + 1,
      honba: round.honba, startingDeposits: round.startingDeposits, deposits: round.deposits,
      drawn: type !== "Hule", exhaustive: type === "NoTile",
      tenpaiAtDraw: type === "NoTile" ? Boolean(data.players?.[seat]?.tingpai) : null,
      tenpaiPayment: type === "NoTile" && !data.liujumanguan ? scoreDeltas[seat] : 0,
      sideways: type === "Hule" && !player.won && !player.dealtIn && !player.receivedTsumo,
      silentWin: player.won && !player.riichi && !player.open,
      scoreChange: endScores[seat] - round.startScores[seat],
      dealerTsumoLoss: seat === round.dealer && player.receivedTsumo,
      manganDealerTsumoLoss: seat === round.dealer && player.receivedTsumo && data.hules.some(win => win.yiman || (win.dadian ?? win.point_sum ?? 0) >= 8000),
      dealerContinues: null,
    };
  });
}

export function analyzeRounds(replay) {
  const rounds = [];
  let round;
  for (const record of replay.records) {
    const type = record?.name?.replace(/^\.lq\.(?:Record|Action)/, "");
    requireReplay(record?.data && knownRecords.has(type), "未対応の局イベントがあります");
    const data = record.data;
    if (type === "NewRound") {
      requireReplay(!round, "前局の終了記録がありません");
      const previous = rounds.at(-1);
      if (previous) previous.players[previous.players[0].dealer].dealerContinues =
        previous.players[0].dealer === (data.ju ?? 0) && previous.players[0].wind === (data.chang ?? 0);
      round = startRound(data, replay.count, rounds.length + 1);
      const indicators = data.doras?.length ? data.doras : data.dora ? [data.dora] : [];
      for (const tile of indicators) reveal(round, tile);
      round.indicators = indicators;
      continue;
    }
    requireReplay(round, "局の開始記録がありません");
    trackPlay(round, type, data);
    if (roundEnds.has(type)) {
      rounds.push({ number: round.number, players: finishRound(round, type, data) });
      round = null;
    }
  }
  requireReplay(!round && rounds.length, "牌譜に終了していない局があります");
  return rounds;
}
