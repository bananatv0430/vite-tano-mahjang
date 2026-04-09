import React from "react";
import styles from "../ScoreTable.module.css";
import { calcScoreFromFuHan } from "../../../utils/calcScore";
import { fuList, childHanList } from "../../../utils/constants";
import { formatTsumo } from "../../../utils/formatters.js";

// 子側（青枠）だけの表
export default function LowScoreTableChild() {
  const isWip = true; // ← falseで表、trueで「実装中」表示
  if (isWip) {
    return <div style={{textAlign: 'center', fontSize: 20, fontWeight: 'bold', margin: '32px 0'}}>実装中</div>;
  }
  return (
    <table className={styles.scoreTableLow}>
      <thead>
        <tr className={styles.scoreTableHeaderBorder}>
          <th className={styles.scoreTableLowTh}>符</th>
          {childHanList.map((h) => (
            <th key={`c-${h}`} className={styles.scoreTableLowTh}>{h}翻</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {fuList.map((fu) => (
          <tr key={fu}>
            <td className={`${styles.scoreTableLowTd} ${styles.fuColumn}`}>{fu}</td>
            {childHanList.map((han) => {
              const { tsumo, ron, isMangan } = calcScoreFromFuHan(fu, han, false);
              return (
                <td key={`child-${fu}-${han}`} className={styles.scoreTableLowTd}>
                  {ron !== 0 && (isMangan ? (
                    <div className={styles.manganText}>満貫</div>
                  ) : (
                    <div className={styles.scoreOnly}>
                      <div className={styles.ronScore}>{ron}</div>
                      <div className={styles.tsumoScore}>{formatTsumo(tsumo)}</div>
                    </div>
                  ))}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
