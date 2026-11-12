import { FLOW_NODES } from "./fuGuideData.js";

// 符計算フローチャートの回答状態から分岐と表示値を決める処理。
const findAnsweredNumber = (answeredList, nodeId) => {
  const answered = [...answeredList]
    .reverse()
    .find((item) => item.nodeId === nodeId);
  if (!answered) {
    return null;
  }
  const parsed = Number.parseInt(answered.answer, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const createCountAnswers = (limit, next) =>
  Array.from({ length: Math.max(0, limit) + 1 }, (_, index) => ({
    label: `${index}個`,
    next,
  }));

/** 入力済み回答から刻子・槓子の個数を制約内で集計する。 */
export const getFlowMetrics = (answeredList) => {
  const tripletTotalAnswered = findAnsweredNumber(answeredList, "tripletCount");
  const yaochuTripletAnswered = findAnsweredNumber(answeredList, "yaochuTripletCount");
  const ankoTripletAnswered = findAnsweredNumber(answeredList, "ankoTripletCount");
  const kanTotalAnswered = findAnsweredNumber(answeredList, "kanCount");
  const yaochuKanAnswered = findAnsweredNumber(answeredList, "yaochuKanCount");

  const tripletTotalRaw = Number.isInteger(tripletTotalAnswered) ? tripletTotalAnswered : 0;
  const tripletTotal = Math.max(0, Math.min(4, tripletTotalRaw));
  const yaochuTripletRaw = Number.isInteger(yaochuTripletAnswered) ? yaochuTripletAnswered : 0;
  const yaochuTriplet = Math.max(0, Math.min(tripletTotal, yaochuTripletRaw));
  const ankoTripletRaw = Number.isInteger(ankoTripletAnswered) ? ankoTripletAnswered : 0;
  const ankoTriplet = Math.max(0, Math.min(yaochuTriplet, ankoTripletRaw));
  const kanTotalRaw = Number.isInteger(kanTotalAnswered) ? kanTotalAnswered : 0;
  const kanTotal = Math.max(0, kanTotalRaw);
  const yaochuKanRaw = Number.isInteger(yaochuKanAnswered) ? yaochuKanAnswered : 0;
  const remainingKanQuota = Math.max(0, 4 - tripletTotal);
  const kanTotalLimit = Math.min(3, remainingKanQuota);
  const kanTotalClamped = Math.min(kanTotal, kanTotalLimit);
  const yaochuKan = Math.max(0, Math.min(kanTotalClamped, yaochuKanRaw));
  const ankanRaw = findAnsweredNumber(answeredList, "ankanCount");
  const ankan = Number.isInteger(ankanRaw)
    ? Math.max(0, Math.min(yaochuKan, ankanRaw))
    : 0;

  return {
    tripletTotal,
    yaochuTriplet,
    ankoTriplet,
    kanTotal: kanTotalClamped,
    yaochuKan,
    ankan,
    kanTotalLimit,
    ankoTripletLimit: Math.max(0, yaochuTriplet),
    yaochuKanLimit: Math.max(0, kanTotalClamped),
    ankanLimit: Math.max(0, yaochuKan),
  };
};

/** 現在の回答内容に応じた動的な選択肢を返す。 */
export const getDynamicAnswersByNodeId = (nodeId, answeredList) => {
  const metrics = getFlowMetrics(answeredList);

  if (nodeId === "yaochuTripletCount") {
    return metrics.tripletTotal >= 1
      ? createCountAnswers(metrics.tripletTotal, "ankoTripletCount")
      : [{ label: "0個", next: "ankoTripletCount" }];
  }
  if (nodeId === "ankoTripletCount") {
    return createCountAnswers(metrics.ankoTripletLimit, "kanCount");
  }
  if (nodeId === "kanCount") {
    return createCountAnswers(metrics.kanTotalLimit, "yaochuKanCount");
  }
  if (nodeId === "yaochuKanCount") {
    return createCountAnswers(metrics.yaochuKanLimit, "ankanCount");
  }
  if (nodeId === "ankanCount") {
    return createCountAnswers(metrics.ankanLimit, "resultTripletFollowup");
  }

  return null;
};

/** 回答により自動で確定するゼロ符の分岐をたどる。 */
export const resolveAutoZeroPath = (startNodeId, answeredList) => {
  let nextNodeId = startNodeId;
  const autoAnswered = [];

  while (FLOW_NODES[nextNodeId]?.type === "question") {
    const dynamicAnswers = getDynamicAnswersByNodeId(nextNodeId, [...answeredList, ...autoAnswered]);
    const questionAnswers = dynamicAnswers ?? FLOW_NODES[nextNodeId].answers;

    if (questionAnswers.length === 1 && Number.parseInt(questionAnswers[0].label, 10) === 0) {
      autoAnswered.push({
        nodeId: nextNodeId,
        question: FLOW_NODES[nextNodeId].text,
        answer: "0個",
        isAuto: true,
      });
      nextNodeId = questionAnswers[0].next;
      continue;
    }
    break;
  }

  return { nextNodeId, autoAnswered };
};
