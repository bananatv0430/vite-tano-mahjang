import React from "react";
import styles from "../ScoreTable.module.css";
import { calcScoreFromFuHan } from "../../../utils/calcScore";
import { fuList, childHanList } from "../../../utils/constants";
import { formatTsumo } from "../../../utils/formatters.js";

// 子側モバイル用（20-70符 × 1-4翻）
export default function LowScoreTableChild() {
  return (
    <div className={styles.mobileSplitTable}>
      <div className={styles.mobileSplitTitle}>子</div>
      <div className={styles.mobileSplitRow}>
        <div className={styles.mobileSplitHead}>符</div>
        {childHanList.map((h) => (
          <div key={`c-${h}`} className={styles.mobileSplitHead}>{h}翻</div>
        ))}
      </div>
      {fuList.map((fu) => (
        <div key={fu} className={styles.mobileSplitRow}>
          <div className={styles.mobileSplitFu}>{fu}符</div>
          {childHanList.map((han) => {
            const { tsumo, ron, isMangan } = calcScoreFromFuHan(fu, han, false);
            return (
              <div key={`child-${fu}-${han}`} className={styles.mobileSplitCell}>
                {ron !== 0 && (isMangan ? (
                  <div className={styles.mobileSplitMangan}>満貫</div>
                ) : (
                  <div className={styles.mobileSplitScoreWrap}>
                    <div className={styles.mobileSplitRon}>{ron}</div>
                    <div className={styles.mobileSplitTsumo}>{formatTsumo(tsumo)}</div>
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
