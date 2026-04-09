import React from "react";
import styles from "../ScoreTable.module.css";
import { calcScoreFromFuHan } from "../../../utils/calcScore";
import { fuList, parentHanList, childHanList } from "../../../utils/constants";
import { formatTsumo } from "../../../utils/formatters.js";

export default function LowScoreTable() {
  return (
    <table className={styles.scoreTableLow}>

      <thead>
        <tr className={styles.scoreTableHeaderBorder}>
          <th colSpan={parentHanList.length} className={styles.scoreTableLowTh}>
            親
          </th>
          <th rowSpan={2} className={styles.scoreTableLowTh}>
            符
          </th>
          <th colSpan={childHanList.length} className={styles.scoreTableLowTh}>
            子
          </th>
        </tr>
        <tr className={styles.scoreTableHeaderBorder}>
          {parentHanList.map((h) => (
            <th key={`p-${h}`} className={styles.scoreTableLowTh}>
              {h}翻
            </th>
          ))}
          {childHanList.map((h) => (
            <th key={`c-${h}`} className={styles.scoreTableLowTh}>
              {h}翻
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {fuList.map((fu) => (
          <tr key={fu}>
            {parentHanList.map((han) => {
              const { tsumo, ron, isMangan } =
                calcScoreFromFuHan(fu, han, true);

              return (
                <td key={`parent-${fu}-${han}`} className={styles.scoreTableLowTd}>
                  {ron !== 0 &&
                    (isMangan ? (
                      <div className={styles.manganText}>満貫</div>
                    ) : (
                      <div className={styles.scoreOnly}>
                        <div className={styles.ronScore}>{ron}</div>
                        <div className={styles.tsumoScore}>
                          ({tsumo}ALL)
                        </div>
                      </div>
                    ))}
                </td>
              );
            })}

            <td className={`${styles.scoreTableLowTd} ${styles.fuColumn}`}>
              {fu}符
            </td>

            {childHanList.map((han) => {
              const { tsumo, ron, isMangan } =
                calcScoreFromFuHan(fu, han, false);

              return (
                <td key={`child-${fu}-${han}`} className={styles.scoreTableLowTd}>
                  {ron !== 0 &&
                    (isMangan ? (
                      <div className={styles.manganText}>満貫</div>
                    ) : (
                      <div className={styles.scoreOnly}>
                        <div className={styles.ronScore}>{ron}</div>
                        <div className={styles.tsumoScore}>
                          {formatTsumo(tsumo)}
                        </div>
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