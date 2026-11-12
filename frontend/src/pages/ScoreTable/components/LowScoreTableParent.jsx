import React from "react";
import styles from "../ScoreTable.module.css";
import { calcScoreFromFuHan } from "../../../utils/calcScore";
import { fuList } from "../../../utils/constants";

const mobileHanList = [1, 2, 3, 4];

// 親側モバイル用（20-70符 × 1-4翻）
export default function LowScoreTableParent() {
  return (
    <div className={styles.mobileSplitTable}>
      <div className={styles.mobileSplitTitle}>親</div>
      <div className={styles.mobileSplitRow}>
        <div className={styles.mobileSplitHead}>符</div>
        {mobileHanList.map((h) => (
          <div key={`p-${h}`} className={styles.mobileSplitHead}>{h}翻</div>
        ))}
      </div>
      {fuList.map((fu) => (
        <div key={fu} className={styles.mobileSplitRow}>
          <div className={styles.mobileSplitFu}>{fu}符</div>
          {mobileHanList.map((han) => {
            const { tsumo, ron, isMangan } = calcScoreFromFuHan(fu, han, true);
            return (
              <div key={`parent-${fu}-${han}`} className={styles.mobileSplitCell}>
                {ron !== 0 && (isMangan ? (
                  <div className={styles.mobileSplitMangan}>満貫</div>
                ) : (
                  <div className={styles.mobileSplitScoreWrap}>
                    <div className={styles.mobileSplitRon}>{ron}</div>
                    <div className={styles.mobileSplitTsumo}>({tsumo}ALL)</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
