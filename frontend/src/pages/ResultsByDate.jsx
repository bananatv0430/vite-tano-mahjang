
import { useEffect, useRef, useState } from "react";
import { useLoadResultsByYear } from "../hooks/useLoadResultsByYear";
import ResultsPreviewModal from "../components/ResultsPreviewModal";
import { formatDisplayDate } from "../utils/gameUtils";
import { getIconSrc } from "../utils/getIconSrc";


// fallbackアイコン生成
const createFallbackIcon = (name) => {
  const firstChar = String(name ?? "?").slice(0, 1);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="60" fill="#f4f4f4"/>
      <circle cx="60" cy="45" r="22" fill="#f08300" opacity="0.92"/>
      <path d="M24 104c6-22 20-33 36-33s30 11 36 33" fill="#f08300" opacity="0.86"/>
      <text x="60" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">${firstChar}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

// 共通getIconSrcラッパー
const getMainIconSrc = (iconPath, iconVersion, name, playerId) => {
  if (playerId && [1,2,3,4,5].includes(Number(playerId))) {
    return `/assets/media/players/player_${playerId}.png`;
  }
  return getIconSrc(iconPath, iconVersion, createFallbackIcon(name));
};

const normalizeMatchData = (dates = []) => dates.map((dateEntry) => {
  const rounds = (dateEntry.games ?? []).map((game, index) => ({
    id: game.gameId,
    roundNumber: Number(game.matchNumber ?? index + 1),
    ruleName: game.rule?.name || "未設定",
    players: [...(game.players ?? [])]
      .map((player) => ({
        playerId: player.playerId,
        name: player.name,
        point: Number(player.finalPoint ?? 0),
        finalScore: Number(player.finalScore ?? 0),
        rank: Number(player.rank ?? 0),
        avatar: getMainIconSrc(player.iconPath, player.iconVersion, player.name, player.playerId),
      }))
      .sort((a, b) => a.rank - b.rank),
  }));

  const totalMap = rounds.flatMap((round) => round.players).reduce((totals, player) => {
    const key = String(player.playerId ?? player.name);

    if (!totals[key]) {
      totals[key] = {
        ...player,
        totalPoint: 0,
      };
    }

    totals[key].totalPoint += player.point;
    return totals;
  }, {});

  const participants = (dateEntry.participants ?? [])
    .map((player) => ({
      playerId: player.playerId,
      name: player.name,
      avatar: getMainIconSrc(player.iconPath, player.iconVersion, player.name, player.playerId),
      totalPoint: totalMap[String(player.playerId ?? player.name)]?.totalPoint ?? 0,
    }))
    .sort((a, b) => b.totalPoint - a.totalPoint);

  return {
    id: dateEntry.date,
    rawDate: dateEntry.date,
    date: formatDisplayDate(dateEntry.date),
    day: dateEntry.day || "",
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
    resultsByYear,
    displayedMatches,
    isLoading,
    loadError,
  } = useLoadResultsByYear(normalizeMatchData);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [roundPageStart, setRoundPageStart] = useState(0);
  const [slideDirection, setSlideDirection] = useState("next");
  const [isMobileView, setIsMobileView] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 767 : false));

  useEffect(() => {
    const main = mainRef.current;
    if (main) {
      main.classList.add("-active");
    }
  }, []);

  // 年度切替時は選択中の試合・ページをリセット
  useEffect(() => {
    setSelectedMatch(null);
    setRoundPageStart(0);
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedMatch) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedMatch(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedMatch]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 767);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadInitialResults = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/results", { signal: controller.signal });

        if (!response.ok) {
          throw new Error("対戦履歴の取得に失敗しました");
        }

        const data = await response.json();
        const years = (data.availableYears ?? []).map((item) => String(item.year));
        const activeYear = String(data.year ?? years[0] ?? "");

        setYearOptions(years);
        if (activeYear) {
          setResultsByYear((current) => ({
            ...current,
            [activeYear]: normalizeMatchData(data.dates ?? []),
          }));
          setSelectedYear((current) => current || activeYear);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setLoadError(error.message || "対戦履歴の取得に失敗しました");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialResults();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!selectedYear || resultsByYear[selectedYear]) {
      return undefined;
    }

    const controller = new AbortController();

    const loadYearResults = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch(`/api/results?year=${selectedYear}`, { signal: controller.signal });

        if (!response.ok) {
          throw new Error("対戦履歴の取得に失敗しました");
        }

        const data = await response.json();
        setYearOptions((data.availableYears ?? []).map((item) => String(item.year)));
        setResultsByYear((current) => ({
          ...current,
          [selectedYear]: normalizeMatchData(data.dates ?? []),
        }));
      } catch (error) {
        if (error.name !== "AbortError") {
          setLoadError(error.message || "対戦履歴の取得に失敗しました");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadYearResults();

    return () => {
      controller.abort();
    };
  }, [selectedYear, resultsByYear]);

  // 表示用データはカスタムフックのdisplayedMatchesをそのまま利用

  const matches = displayedMatches;
  const roundsPerPage = isMobileView ? 1 : 2;
  const pageCount = selectedMatch ? 1 + Math.ceil(selectedMatch.rounds.length / roundsPerPage) : 1;
  const showTotalPage = roundPageStart === 0;
  const roundSliceStart = showTotalPage ? 0 : (roundPageStart - 1) * roundsPerPage;
  const visibleRounds = selectedMatch ? selectedMatch.rounds.slice(roundSliceStart, roundSliceStart + roundsPerPage) : [];
  const hasRoundPager = pageCount > 1;

  useEffect(() => {
    setRoundPageStart((current) => Math.min(current, Math.max(pageCount - 1, 0)));
  }, [pageCount]);

  const totalStandings = selectedMatch
    ? Object.values(
        selectedMatch.rounds.flatMap((round) => round.players).reduce((totals, player) => {
          const key = String(player.playerId ?? player.name);

          if (!totals[key]) {
            totals[key] = {
              ...player,
              totalPoint: 0,
            };
          }

          totals[key].totalPoint += player.point;
          return totals;
        }, {})
      )
        .sort((a, b) => b.totalPoint - a.totalPoint)
        .map((player, index) => ({
          ...player,
          totalRank: index + 1,
        }))
    : [];

  const handleRoundPageChange = (direction) => {
    setSlideDirection(direction);
    setRoundPageStart((current) => {
      if (!selectedMatch) {
        return current;
      }

      if (direction === "prev") {
        return Math.max(0, current - 1);
      }

      return Math.min(current + 1, pageCount - 1);
    });
  };

  return (
    <main ref={mainRef} className="l-main u-next-fill-gray p-loadAnimation" role="main">
      <style>{`
        @keyframes resultSlideNext {
          0% {
            opacity: 0.88;
            transform: translate3d(56px, 0, 0);
          }
          70% {
            opacity: 1;
            transform: translate3d(-4px, 0, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        .resultsModal__contents {
          position: fixed;
          top: 54%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(84vw, 700px);
        }

        @media (max-width: 767px) {
          .c-modal2__contents .p-gamesResult {
            height: auto !important;
            overflow: visible !important;
            padding: 16px 12px 24px !important;
          }

          .c-modal2__contents .p-gamesResult__date {
            font-size: 2.8rem;
            margin-bottom: 16px;
          }

          .c-modal2__contents .p-gamesResult__dotw {
            font-size: 1.6rem;
          }

          .c-modal2__contents .p-gamesResult__number {
            margin-bottom: 12px;
            font-size: 1.3rem;
          }

          .c-modal2__contents .p-gamesResult__rank-list > li:not(:last-child) {
            margin-bottom: 12px;
          }

          .c-modal2__contents .p-gamesResult__thumbnail {
            width: 72px;
            height: 72px;
          }

          .c-modal2__contents .p-gamesResult__thumbnail-wrap {
            margin-left: 10px;
          }

          .c-modal2__contents .p-gamesResult__button-wrap {
            padding-top: 12px;
            margin-bottom: 0;
          }
        }

        @keyframes resultSlidePrev {
          0% {
            opacity: 0.88;
            transform: translate3d(-56px, 0, 0);
          }
          70% {
            opacity: 1;
            transform: translate3d(4px, 0, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
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
          <nav className="p-gamesSchedule2__tab">
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

          {loadError ? (
            <p style={{ marginTop: "24px", textAlign: "center", color: "#c62828", fontWeight: 700 }}>
              {loadError}
            </p>
          ) : isLoading && matches.length === 0 ? (
            <p style={{ marginTop: "24px", textAlign: "center", color: "#666" }}>対戦履歴を読み込み中です...</p>
          ) : matches.length === 0 ? (
            <p style={{ marginTop: "24px", textAlign: "center", color: "#666" }}>表示できる対戦履歴はありません。</p>
          ) : (
            <ul
              aria-current="true"
              className="p-gamesSchedule2__lists p-gamesSchedule2__lists--mt"
              style={{
                display: "grid",
                gridTemplateColumns: isMobileView ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
                gap: isMobileView ? "18px 12px" : "28px 16px",
                margin: isMobileView ? "32px 0 0" : "70px 0 0",
                padding: 0,
              }}
            >
              {matches.map((match) => {
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
                                src={player.avatar}
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
