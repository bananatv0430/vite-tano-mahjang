import { formatNumber, formatRulePoint } from "../utils/gameUtils";

/** 選択したルールの持ち点・返し点・順位点を表示する。 */
export default function EntryRuleSummary({ rule }) {
  const rankPoints = Array.isArray(rule.rankPoints)
    ? rule.rankPoints.map((point) => (point === "--" ? "--" : formatRulePoint(point))).join(" / ")
    : "--";

  return (
    <div className="dataEntry__summary">
      <div className="dataEntry__chip">
        <span>ウマ</span>
        <strong>{rule.umaLabel}</strong>
      </div>
      <div className="dataEntry__chip">
        <span>返し点</span>
        <strong>{rule.returnPoint === "--" ? "--" : formatNumber(rule.returnPoint)}</strong>
      </div>
      <div className="dataEntry__chip">
        <span>持ち点</span>
        <strong>{rule.startPoint === "--" ? "--" : formatNumber(rule.startPoint)}</strong>
      </div>
      <div className="dataEntry__chip">
        <span>順位点</span>
        <strong>{rankPoints}</strong>
      </div>
    </div>
  );
}
