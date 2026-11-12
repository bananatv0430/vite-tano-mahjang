
import { useEffect, useMemo, useRef, useState } from "react";
import { useLoadResultsByYear } from "../hooks/useLoadResultsByYear";
import ResultsPreviewModal from "../components/ResultsPreviewModal";
import ResultsPreviewStyles from "../components/ResultsPreviewStyles";
import { calculateTotalStandings, formatDisplayDate } from "../utils/gameUtils";
import { getRankingPlayerIconSrc } from "../utils/playerIcons";
import { normalizePlayMode, normalizeResultParticipants, normalizeResultRounds, PLAY_MODE_FILTERS } from "../utils/resultDisplayUtils";
import { useRoundPagination } from "../hooks/useRoundPagination";
import { usePreviewViewport } from "../hooks/usePreviewViewport";
import { useActivateMain } from "../hooks/useActivateMain";
import "../previewAnimations.css";

const normalizeMatchData = (dates = []) => dates.map((dateEntry) => {
	// 共通関数で半荘・参加者を整え、日付別画面に必要な点数項目を指定する。
	const normalizedPlayMode = normalizePlayMode(dateEntry.playMode ?? dateEntry.games?.[0]?.playMode);
	const rounds = normalizeResultRounds(dateEntry, { includeFinalScore: true, includeIconMetadata: true });
	const participants = normalizeResultParticipants(dateEntry, rounds, { includeIconVersion: true });

  return {
    id: dateEntry.date,
    rawDate: dateEntry.date,
    date: formatDisplayDate(dateEntry.date),
    day: dateEntry.day || "",
    playMode: normalizedPlayMode,
    participants,
    rounds,
  };
});

export default function ResultsByDate() {
  const mainRef = useRef(null);
  // カスタムフックで年ごとの対戦履歴データ取得
  const {
    selectedYear,
    setSelectedYear,
    yearOptions,
    isLoading,
    loadError,
    displayedMatches,
  } = useLoadResultsByYear(normalizeMatchData);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedPlayModeFilter, setSelectedPlayModeFilter] = useState("all");
  const [roundPageStart, setRoundPageStart] = useState(0);
  const [slideDirection, setSlideDirection] = useState("next");
  const isMobileView = usePreviewViewport(selectedMatch, setSelectedMatch);
  const [isSwitchingResults, setIsSwitchingResults] = useState(false);

  useActivateMain(mainRef);

  // 年度切替時は選択中の試合・ページをリセット
  useEffect(() => {
    setSelectedMatch(null);
    setRoundPageStart(0);
  }, [selectedYear]);

  // 表示用データはカスタムフックのdisplayedMatchesをそのまま利用

  const matches = useMemo(() => (
    selectedPlayModeFilter === "all"
      ? displayedMatches
      : displayedMatches.filter((match) => match.playMode === selectedPlayModeFilter)
  ), [displayedMatches, selectedPlayModeFilter]);
  const [stableMatches, setStableMatches] = useState([]);

  useEffect(() => {
    if (isSwitchingResults && !isLoading) {
      setIsSwitchingResults(false);
    }
  }, [isSwitchingResults, isLoading, matches.length]);

  useEffect(() => {
    if (isSwitchingResults && matches.length === 0) {
      return;
    }
    setStableMatches(matches);
  }, [isSwitchingResults, matches]);

  const visibleMatches = isSwitchingResults && matches.length === 0 ? stableMatches : matches;
  const resultsAreaMinHeight = isMobileView ? "460px" : "560px";
  const {
    roundsPerPage,
    pageCount,
    showTotalPage,
    visibleRounds,
    hasRoundPager,
    handleRoundPageChange,
  } = useRoundPagination({ selectedMatch, isMobileView, roundPageStart, setRoundPageStart, setSlideDirection });

  // 対局プレビューの順位点を共通の集計関数で算出する。
  const totalStandings = selectedMatch ? calculateTotalStandings(selectedMatch.rounds) : [];

  return (
    <main ref={mainRef} className="l-main u-next-fill-gray p-loadAnimation" role="main">
      <ResultsPreviewStyles />
      <style>{`
        @media (max-width: 767px) {
          .p-gamesSchedule2__tab {
            margin: 0 !important;
            padding: 0 !important;
          }
          .p-gamesSchedule2__tab-list {
            padding-top: 0 !important;
            margin: 0 !important;
          }
          .p-gamesSchedule2__tab-item:nth-child(n+4) {
            margin-top: 0 !important;
          }
        }
      `}</style>
      <section className="p-gamesSchedule">
        <div className="p-gamesSchedule__inner p-loadAnimation__target">
          <h1 className="p-gamesSchedule__title" lang="en">
            Result
          </h1>
          <p className="p-gamesSchedule__desc">対戦履歴</p>
          <ol className="c-schedule"></ol>
        </div>
      </section>

      <section className="p-gamesSchedule2" id="schedule">
        <div className="p-gamesSchedule2__inner">
          <div style={isMobileView ? { display: "flex", flexDirection: "column", gap: "8px", paddingTop: "20px" } : {}}>
          <nav
            className="p-gamesSchedule2__tab"
            style={{
              marginBottom: isMobileView ? "0" : "-40px",
              paddingBottom: "0",
              paddingTop: "0",
            }}
          >
            <ul
              className="p-gamesSchedule2__tab-list"
              style={{
                justifyContent: "center",
                gap: isMobileView ? "8px" : "12px",
                flexWrap: isMobileView ? "nowrap" : "wrap",
                display: isMobileView ? "grid" : "flex",
                gridTemplateColumns: isMobileView ? "repeat(3, minmax(0, 1fr))" : undefined,
                width: "100%",
                maxWidth: isMobileView ? "420px" : undefined,
                margin: "0 auto",
              }}
            >
              {yearOptions.map((year) => (
                <li
                  key={year}
                  className="p-gamesSchedule2__tab-item"
                  style={{ width: isMobileView ? "100%" : "auto", margin: 0 }}
                >
                  <a
                    href="#schedule"
                    aria-current={selectedYear === year ? "true" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      if (selectedYear !== year) {
                        setIsSwitchingResults(true);
                      }
                      setSelectedYear(year);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      minWidth: isMobileView ? 0 : "88px",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {year}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav
            className="p-gamesSchedule2__tab"
            style={{
              marginTop: isMobileView ? "0" : "-10px",
              paddingTop: "0",
              paddingBottom: "0",
              marginBottom: "0",
            }}
          >
            <ul
              className="p-gamesSchedule2__tab-list"
              style={{
                justifyContent: "center",
                gap: isMobileView ? "8px" : "8px",
                flexWrap: isMobileView ? "nowrap" : "wrap",
                display: isMobileView ? "grid" : "flex",
                gridTemplateColumns: isMobileView ? "repeat(3, minmax(0, 1fr))" : undefined,
                width: "100%",
                maxWidth: isMobileView ? "420px" : undefined,
                margin: "0 auto",
              }}
            >
              {PLAY_MODE_FILTERS.map((mode) => {
                const isActive = selectedPlayModeFilter === mode.key;

                return (
                  <li
                    key={mode.key}
                    className="p-gamesSchedule2__tab-item"
                    style={{ width: isMobileView ? "100%" : "auto", margin: 0 }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedPlayModeFilter !== mode.key) {
                          setIsSwitchingResults(true);
                        }
                        setSelectedPlayModeFilter(mode.key);
                      }}
                      style={{
                        width: "100%",
                        minWidth: isMobileView ? 0 : "96px",
                        height: "36px",
                        borderRadius: "999px",
                        border: `1.5px solid ${isActive ? mode.style.activeBorderColor : mode.style.borderColor}`,
                        cursor: "pointer",
                        fontWeight: 700,
                        opacity: isActive ? 1 : 0.55,
                        boxShadow: isActive ? `inset 0 0 0 1px ${mode.style.activeBorderColor}` : "none",
                        ...mode.style,
                      }}
                    >
                      {mode.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          </div>

          <div style={{ minHeight: resultsAreaMinHeight }}>
            {loadError ? (
              <p style={{ marginTop: "24px", textAlign: "center", color: "#c62828", fontWeight: 700 }}>
                {loadError}
              </p>
            ) : isLoading && visibleMatches.length === 0 ? null : visibleMatches.length === 0 ? (
              <p style={{ marginTop: "24px", textAlign: "center", color: "#666" }}>表示できる対戦履歴はありません。</p>
            ) : (
              <ul
                aria-current="true"
                className="p-gamesSchedule2__lists p-gamesSchedule2__lists--mt"
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobileView ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
                  gap: isMobileView ? "18px 12px" : "28px 16px",
                  margin: isMobileView ? "12px 0 0" : "28px 0 0",
                  padding: 0,
                }}
              >
                {visibleMatches.map((match) => {
                const [month, day] = match.date.split("/");
                const winningPlayerId = match.participants[0]?.playerId;
                const tilePlayers = [...match.participants]
                  .sort((a, b) => Number(a.playerId ?? 0) - Number(b.playerId ?? 0))
                  .slice(0, 4);

                return (
                  <li
                    key={match.id}
                    className="p-gamesSchedule2__list"
                    style={{
                      width: "100%",
                      paddingTop: 0,
                      paddingBottom: 0,
                      background: "transparent",
                      margin: 0,
                    }}
                  >
                    <a
                      href="#schedule"
                      onClick={(event) => {
                        event.preventDefault();
                        setRoundPageStart(0);
                        setSelectedMatch(match);
                      }}
                      style={{
                        color: "#000",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        minHeight: isMobileView ? "210px" : "238px",
                        padding: isMobileView ? "16px 12px" : "16px 12px",
                        borderRadius: "14px",
                        background: "#fff",
                        boxShadow: "inset 0 0 0 1.5px #e3e3e3",
                        cursor: "pointer",
                        gap: isMobileView ? "12px" : "14px",
                      }}
                    >
                      <p
                        className="p-gamesSchedule2__data"
                        style={{
                          marginBottom: isMobileView ? "14px" : "18px",
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "center",
                          gap: "2px",
                          flexWrap: "nowrap",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {month}
                        <span className="p-gamesSchedule2__slash">/</span>
                        {day}
                        <span className="p-gamesSchedule2__dayWeek">（{match.day}）</span>
                      </p>
                      <p
                        style={{
                          margin: isMobileView ? "-8px 0 8px" : "-12px 0 10px",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          background: match.playMode === "online" ? "#eaf8ee" : "#ffefef",
                          color: match.playMode === "online" ? "#166534" : "#b42318",
                          border: match.playMode === "online" ? "1.5px solid #2f8f57" : "1.5px solid #d92d20",
                        }}
                      >
                        {match.playMode === "online" ? "オンライン" : "オフライン"}
                      </p>
                      <ul
                        className="p-gamesSchedule2__logos"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          gap: isMobileView ? "8px 10px" : "10px 12px",
                          width: "100%",
                          maxWidth: isMobileView ? "124px" : "140px",
                          margin: "0 auto",
                          alignItems: "center",
                          justifyItems: "center",
                        }}
                      >
                        {tilePlayers.map((player) => {
                          const isWinner = player.playerId === winningPlayerId;

                          return (
                            <li key={`${match.id}-${player.playerId}`} style={{ display: "flex", justifyContent: "center" }}>
                              <img
                                alt={player.name}
                                src={getRankingPlayerIconSrc(player.iconPath, player.iconVersion, player.name)}
                                style={{
                                  width: isMobileView ? "52px" : "60px",
                                  height: isMobileView ? "52px" : "60px",
                                  objectFit: "cover",
                                  borderRadius: "50%",
                                  border: isWinner ? "2px solid #f08300" : "2px solid transparent",
                                  filter: isWinner ? "none" : "grayscale(100%)",
                                  opacity: isWinner ? 1 : 0.3,
                                  transition: "filter 0.2s ease, opacity 0.2s ease, border-color 0.2s ease",
                                }}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </a>
                  </li>
                );
                })}
              </ul>
            )}
          </div>
        </div>

        <ResultsPreviewModal
          selectedMatch={selectedMatch}
          roundsPerPage={roundsPerPage}
          visibleRounds={visibleRounds}
          totalStandings={totalStandings}
          showTotalPage={showTotalPage}
          roundPageStart={roundPageStart}
          pageCount={pageCount}
          slideDirection={slideDirection}
          wrapperClassName="resultsModal__contents"
          onClose={() => setSelectedMatch(null)}
          onPageChange={handleRoundPageChange}
        />
      </section>
    </main>
  );
}
