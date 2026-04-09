import React from "react";
import styles from "../ScoreTable.module.css";
import { calcScoreFromFuHan } from "../../../utils/calcScore";
import { fuList, parentHanList } from "../../../utils/constants";

// 親側（赤枠）だけの表（符列付き、翻数反転）
export default function LowScoreTableParentWithFu() {
  // 翻数を反転
  const reversedParentHanList = [...parentHanList].reverse();
  return (
    <>
      <div style={{ width: '100%', maxWidth: 400, margin: '16px auto 0', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>親</div>
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto 4px', borderTop: '2px solid #bbb' }} />
      <table className={styles.scoreTableLow}>
        <thead>
          <tr className={styles.scoreTableHeaderBorder}>
            <th className={styles.scoreTableLowTh}>符</th>
            {reversedParentHanList.map((h) => (
              <th key={`p-${h}`} className={styles.scoreTableLowTh}>{h}翻</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fuList.map((fu) => (
            <tr key={fu}>
              <td className={`${styles.scoreTableLowTd} ${styles.fuColumn}`}>{fu}符</td>
              {reversedParentHanList.map((han) => {
                const { tsumo, ron, isMangan } = calcScoreFromFuHan(fu, han, true);
                return (
                  <td key={`parent-${fu}-${han}`} className={styles.scoreTableLowTd}>
                    {ron !== 0 && (isMangan ? (
                      <div className={styles.manganText}>満貫</div>
                    ) : (
                      <div className={styles.scoreOnly}>
                        <div className={styles.ronScore}>{ron}</div>
                        <div className={styles.tsumoScore}>({tsumo}ALL)</div>
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
