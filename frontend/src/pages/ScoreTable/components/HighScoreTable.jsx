
import React from "react";
import styles from "../ScoreTable.module.css";
import { highScoreRows } from "../../../utils/constants";

// 定数で点数を直接定義
const highScoreTableData = {
  parent: [
    { ron: 12000, tsumo: "4000ALL" }, // 満貫
    { ron: 18000, tsumo: "6000ALL" }, // 跳満
    { ron: 24000, tsumo: "8000ALL" }, // 倍満
    { ron: 36000, tsumo: "12000ALL" }, // 三倍満
    { ron: 48000, tsumo: "16000ALL" }, // 役満
  ],
  child: [
    { ron: 8000, tsumo: "2000/4000" }, // 満貫
    { ron: 12000, tsumo: "3000/6000" }, // 跳満
    { ron: 16000, tsumo: "4000/8000" }, // 倍満
    { ron: 24000, tsumo: "6000/12000" }, // 三倍満
    { ron: 32000, tsumo: "8000/16000" }, // 役満
  ],
};

export default function HighScoreTable() {
  return (
    <table className={styles.scoreTableHigh}>
      <thead>
        <tr>
          <th className={styles.scoreTableHighTh}></th>
          {highScoreRows.map(({ hanlabel, rankLabel }, idx) => (
            <th key={idx} className={styles.scoreTableHighTh}>
              <div className={styles.doubleLine}>
                <span>{hanlabel}</span>
                <span>{rankLabel}</span>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <th className={styles.scoreTableHighTh}>親</th>
          {highScoreTableData.parent.map((score, idx) => (
            <td key={idx} className={styles.scoreTableHighTd}>
              <div className={styles.scoreOnly}>
                <div className={styles.ronScore}>{score.ron}</div>
                <div className={styles.tsumoScore}>{score.tsumo}</div>
              </div>
            </td>
          ))}
        </tr>
        <tr>
          <th className={styles.scoreTableHighTh}>子</th>
          {highScoreTableData.child.map((score, idx) => (
            <td key={idx} className={styles.scoreTableHighTd}>
              <div className={styles.scoreOnly}>
                <div className={styles.ronScore}>{score.ron}</div>
                <div className={styles.tsumoScore}>{score.tsumo}</div>
              </div>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}