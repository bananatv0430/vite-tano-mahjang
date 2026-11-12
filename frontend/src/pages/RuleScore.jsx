
import React, { useState, useRef } from "react";
import styles from "./ScoreTable/ScoreTable.module.css";
import LowScoreTable from "./ScoreTable/components/LowScoreTable";
import LowScoreTableParent from "./ScoreTable/components/LowScoreTableParent";
import LowScoreTableChild from "./ScoreTable/components/LowScoreTableChild";
import HighScoreTable from "./ScoreTable/components/HighScoreTable";
import FuGuide from "./ScoreTable/components/FuGuide";
import { useActivateMain } from "../hooks/useActivateMain";
import { useMediaQuery } from "../hooks/useMediaQuery";

export default function RuleScore() {
  const [showFuGuide, setShowFuGuide] = useState(false);
  const isMobile = useMediaQuery("(max-width: 600px)");
  const isWip = false; // ← falseで表、trueで全て「実装中」表示

    const mainRef = useRef(null);
    useActivateMain(mainRef);

  return (
    <main ref={mainRef} className="l-main p-loadAnimation" role="main" style={{ paddingBottom: 64 }}>
      <section className="p-gamesSchedule">
        <div className="p-gamesSchedule__inner p-loadAnimation__target">
          <h1 className="p-gamesSchedule__title" lang="en">
            Score Guide
          </h1>
          <p className="p-gamesSchedule__desc">点数早見表・符計算早見表</p>
        </div>
      </section>

      <div className={styles.tableContainer}>

        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 32, paddingBottom: 0, width: '100%', maxWidth: 620, margin: '0 auto 32px' }}>
          <button
            className={`c-button -primary -medium${!showFuGuide ? ' active' : ''} ${!showFuGuide ? styles.toggleButtonDisabled : ''}`}
            style={{ width: '100%', maxWidth: 300 }}
            onClick={!showFuGuide ? undefined : () => setShowFuGuide(false)}
            type="button"
            disabled={!showFuGuide}
          >
            点数早見表
          </button>
          <button
            className={`c-button -primary -medium${showFuGuide ? ' active' : ''} ${showFuGuide ? styles.toggleButtonDisabled : ''}`}
            style={{ width: '100%', maxWidth: 300 }}
            onClick={showFuGuide ? undefined : () => setShowFuGuide(true)}
            type="button"
            disabled={showFuGuide}
          >
            符計算早見表
          </button>
        </div>

        {!showFuGuide && (
          <div className={styles.scoreTableSection} style={{ marginTop: 0, paddingTop: 0 }}>
            <div className={styles.tableWrapper} style={{ marginTop: 0, paddingTop: 0 }}>
              {isWip ? (
                <div style={{textAlign: 'center', fontSize: 20, fontWeight: 'bold', margin: '32px 0'}}>実装中</div>
              ) : isMobile ? (
                <>
                  <LowScoreTableParent />
                  <div style={{ height: 16 }} />
                  <LowScoreTableChild />
                  <div style={{ height: 16 }} />
                  <HighScoreTable />
                </>
              ) : (
                <>
                  <div className={styles.desktopScoreTable}>
                    <LowScoreTable />
                    <div style={{ width: '100%', maxWidth: 900, margin: '24px auto', borderTop: '2px solid #bbb' }} />
                    <HighScoreTable />
                  </div>

                  <div className={styles.mobileScoreTables}>
                    <LowScoreTableParent />
                    <div style={{ height: 16 }} />
                    <LowScoreTableChild />
                    <div style={{ height: 16 }} />
                    <HighScoreTable />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showFuGuide && (
          <div className={styles.fuSection}>
            {/* FuGuide内のタイトルも不要ならFuGuide側で削除する必要あり */}
            <FuGuide />
          </div>
        )}
      </div>
    </main>
  );
}
