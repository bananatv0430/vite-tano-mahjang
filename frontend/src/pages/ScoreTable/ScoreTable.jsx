import React from "react";
import styles from "./ScoreTable.module.css";
import { calcScoreFromFuHan } from "../../utils/calcScore";
import FuGuide from "./components/FuGuide";
import {
  fuList,
  parentHanList,
  childHanList,
  highScoreRows,
} from "../../utils/constants";
import { formatTsumo } from "../../utils/formatters.js";

/* =============================
   共通画像パス
============================= */
const IMG = "/images/cards/";

/* =============================
   低翻数テーブル
============================= */
function LowScoreTable() {
  return (
    <table className={styles.scoreTableLow}>
      <thead>
        <tr>
          <th colSpan={parentHanList.length} className={styles.scoreTableLowTh}>
            <div className={`${styles.headerOval} ${styles.headerOvalParentChild}`}>親</div>
          </th>
          <th rowSpan={2} className={styles.scoreTableLowTh}>
            <div className={`${styles.headerOval} ${styles.headerOvalFu}`}>符</div>
          </th>
          <th colSpan={childHanList.length} className={styles.scoreTableLowTh}>
            <div className={`${styles.headerOval} ${styles.headerOvalParentChild}`}>子</div>
          </th>
        </tr>
        <tr>
          {parentHanList.map((h) => (
            <th key={h} className={styles.scoreTableLowTh}>
              <div className={`${styles.headerOval} ${styles.headerOvalParentChild}`}>{h}翻</div>
            </th>
          ))}
          {childHanList.map((h) => (
            <th key={h} className={styles.scoreTableLowTh}>
              <div className={`${styles.headerOval} ${styles.headerOvalParentChild}`}>{h}翻</div>
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
                <td key={han} className={styles.scoreTableLowTd}>
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
                <td key={han} className={styles.scoreTableLowTd}>
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

/* =============================
   高翻数テーブル
============================= */
function HighScoreTable() {
  return (
    <table className={styles.scoreTableHigh}>
      <thead>
        <tr>
          <th className={styles.scoreTableHighTh}>翻数</th>
          <th className={styles.scoreTableHighTh}>親</th>
          <th className={styles.scoreTableHighTh}>子</th>
        </tr>
      </thead>

      <tbody>
        {highScoreRows.map(({ hanlabel, rankLabel, han }) => {
          const parent = calcScoreFromFuHan(40, han, true);
          const child = calcScoreFromFuHan(40, han, false);

          return (
            <tr key={han}>
              <td className={styles.hanRange}>
                <div className={styles.doubleLine}>
                  <span className={styles.hanLabel}>{hanlabel}</span>
                  <span className={styles.rankLabel}>{rankLabel}</span>
                </div>
              </td>

              <td className={styles.scoreTableHighTd}>
                <div className={styles.scoreOnly}>
                  <div className={styles.ronScore}>{parent.ron}</div>
                  <div className={styles.tsumoScore}>{parent.tsumo}ALL</div>
                </div>
              </td>

              <td className={styles.scoreTableHighTd}>
                <div className={styles.scoreOnly}>
                  <div className={styles.ronScore}>{child.ron}</div>
                  <div className={styles.tsumoScore}>
                    {formatTsumo(child.tsumo)}
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* =============================
   メイン
============================= */
export default function ScoreTablePage() {
  return (
    <div className={styles.tableContainer}>
      <div className={styles.scoreTableSection}>
        <h1 className={styles.title}>点数早見表</h1>

        <div className={styles.tableWrapper}>
          <LowScoreTable />
          <HighScoreTable />
        </div>

        <div className={styles.fuGuideNotes}>
          <p>
            ※ 競技ルールによっては、7700と11600は満貫扱いとなります。
          </p>
        </div>
      </div>

      {/* ▼ ここから符計算セクションを独立させる */}
      <div className={styles.fuSection}>
        <FuGuide />
      </div>
    </div>
  );
}