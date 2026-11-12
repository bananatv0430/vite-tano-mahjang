import { useState } from "react";
import styles from "./RuleScoreMobile.module.css";
import { calcScoreFromFuHan } from "../utils/calcScore";
import { formatTsumo } from "../utils/formatters";
import { fuList, highScoreRows } from "../utils/constants";
import FuGuide from "./ScoreTable/components/FuGuide";

const hanList = [1, 2, 3, 4];

function MobileLowTable({ title, isParent }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>

      <div className={styles.lowGridRow}>
        <div className={styles.lowHeadCell}>符</div>
        {hanList.map((han) => (
          <div key={`${title}-head-${han}`} className={styles.lowHeadCell}>
            {han}翻
          </div>
        ))}
      </div>

      {fuList.map((fu) => (
        <div key={`${title}-${fu}`} className={styles.lowGridRow}>
          <div className={styles.lowFuCell}>{fu}符</div>
          {hanList.map((han) => {
            const score = calcScoreFromFuHan(fu, han, isParent);
            if (score.ron === 0) {
              return <div key={`${title}-${fu}-${han}`} className={styles.lowValueCell} />;
            }
            if (score.isMangan) {
              return (
                <div key={`${title}-${fu}-${han}`} className={styles.lowValueCell}>
                  <div className={styles.mangan}>満貫</div>
                </div>
              );
            }
            return (
              <div key={`${title}-${fu}-${han}`} className={styles.lowValueCell}>
                <div className={styles.scoreMain}>{score.ron}</div>
                <div className={styles.scoreSub}>
                  {isParent ? `(${score.tsumo}ALL)` : `(${formatTsumo(score.tsumo)})`}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}

function MobileHighTable() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>満貫以上</h2>
      <table className={styles.highTable}>
        <thead>
          <tr>
            <th className={styles.highRole} />
            {highScoreRows.map((row) => (
              <th key={row.han} className={styles.highRankHeader}>
                <div>{row.hanlabel}</div>
                <div>{row.rankLabel}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className={styles.highRole}>親</th>
            {highScoreRows.map((row) => {
              const score = calcScoreFromFuHan(40, row.han, true);
              return (
                <td key={`parent-${row.han}`}>
                  <div className={styles.highMain}>{score.ron}</div>
                  <div className={styles.highSub}>{row.rankLabel === "満貫" ? "満貫" : `${score.tsumo}ALL`}</div>
                </td>
              );
            })}
          </tr>
          <tr>
            <th className={styles.highRole}>子</th>
            {highScoreRows.map((row) => {
              const score = calcScoreFromFuHan(40, row.han, false);
              return (
                <td key={`child-${row.han}`}>
                  <div className={styles.highMain}>{score.ron}</div>
                  <div className={styles.highSub}>{row.rankLabel === "満貫" ? "満貫" : formatTsumo(score.tsumo)}</div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export default function RuleScoreMobile() {
  const [tab, setTab] = useState("score");
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle} lang="en">
            Score Guide
          </h1>
          <p className={styles.heroDesc}>点数早見表・符計算早見表</p>
        </div>
      </section>

      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.toggleRow}>
            <button
              type="button"
              className={`c-button -primary -medium${tab === "score" ? " " + styles.toggleBtnDisabled : ""}`}
              onClick={tab !== "score" ? () => setTab("score") : undefined}
              disabled={tab === "score"}
            >
              点数早見表
            </button>
            <button
              type="button"
              className={`c-button -primary -medium${tab === "fu" ? " " + styles.toggleBtnDisabled : ""}`}
              onClick={tab !== "fu" ? () => setTab("fu") : undefined}
              disabled={tab === "fu"}
            >
              符計算早見表
            </button>
          </div>

          {tab === "score" ? (
            <>
              <MobileLowTable title="親" isParent={true} />
              <MobileLowTable title="子" isParent={false} />
              <MobileHighTable />
            </>
          ) : (
            <FuGuide />
          )}
        </div>
      </main>
    </>
  );
}
