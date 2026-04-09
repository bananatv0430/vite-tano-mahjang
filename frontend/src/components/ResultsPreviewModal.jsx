import { formatPoint } from "../utils/gameUtils";

import { useRef } from "react";

export default function ResultsPreviewModal({
  selectedMatch,
  roundsPerPage,
  visibleRounds,
  totalStandings,
  showTotalPage,
  roundPageStart,
  pageCount,
  slideDirection,
  wrapperClassName = "resultsModal__contents",
  dayText,
  onClose,
  onPageChange,
}) {

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  if (!selectedMatch) {
    return null;
  }

  const hasRoundPager = pageCount > 1;

  return (
    <div className="c-modal2" tabIndex="0">
      <div className="c-modal2__overlay js-close" onClick={onClose} />
      <div
        className={`c-modal2__contents ${wrapperClassName}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${selectedMatch.date}の対戦結果`}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            touchStartX.current = e.touches[0].clientX;
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 1) {
            touchEndX.current = e.touches[0].clientX;
          }
        }}
        onTouchEnd={() => {
          if (touchStartX.current !== null && touchEndX.current !== null) {
            const dx = touchEndX.current - touchStartX.current;
            if (Math.abs(dx) > 50) {
              if (dx < 0 && roundPageStart < pageCount - 1) {
                onPageChange("next");
              } else if (dx > 0 && roundPageStart > 0) {
                onPageChange("prev");
              }
            }
          }
          touchStartX.current = null;
          touchEndX.current = null;
        }}
      >
        <div className="p-gamesResult" style={{ display: "flex", flexDirection: "column", padding: "20px 16px 50px" }}>
          <div className="p-gamesResult__date">
            {selectedMatch.date}
            <span className="p-gamesResult__dotw">（{dayText ?? selectedMatch.day}）</span>
          </div>
          <div style={{ position: "relative", overflow: "hidden" }}>
            <div aria-hidden="true" style={{ visibility: "hidden", pointerEvents: "none" }}>
              <div className="p-gamesResult__columns" style={{ width: "100%", justifyContent: "center" }}>
                {selectedMatch.rounds.slice(0, roundsPerPage).map((round, roundIndex) => {
                  const roundNumber = round.roundNumber ?? roundIndex + 1;

                  return (
                    <div key={`${selectedMatch.id}-sizer-round-${roundNumber}`} className="p-gamesResult__column">
                      <div className="p-gamesResult__number">第{roundNumber}回戦</div>
                      <div
                        style={{
                          margin: "-8px 0 14px",
                          textAlign: "center",
                          color: "#666",
                          fontSize: "1.2rem",
                          fontWeight: 700,
                        }}
                      >
                        ルール：{round.ruleName}
                      </div>
                      <ol className="p-gamesResult__rank-list">
                        {round.players.map((player) => (
                          <li key={`${selectedMatch.id}-sizer-${roundNumber}-${player.playerId}`}>
                            <div className="p-gamesResult__rank-item">
                              <div className={`p-gamesResult__rank-badge is-${player.rank}`}>{player.rank}</div>
                              <div className="p-gamesResult__thumbnail-wrap">
                                <div className="p-gamesResult__thumbnail">
                                  <img alt="" src={player.avatar} />
                                </div>
                              </div>
                              <div className="p-gamesResult__name-wrap">
                                <div className="p-gamesResult__name">{player.name}</div>
                                <div className="p-gamesResult__point">{formatPoint(player.point)}</div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {showTotalPage ? (
                <div
                  key={`${selectedMatch.id}-total-page`}
                  className="p-gamesResult__columns"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    animation: `${slideDirection === "next" ? "resultSlideNext" : "resultSlidePrev"} 320ms cubic-bezier(0.22, 1, 0.36, 1) both`,
                  }}
                >
                  <div
                    className="p-gamesResult__column"
                    style={{
                      width: "100%",
                      maxWidth: "420px",
                      willChange: "transform, opacity",
                    }}
                  >
                    <div className="p-gamesResult__number">Total</div>
                    <ol className="p-gamesResult__rank-list">
                      {totalStandings.map((player) => (
                        <li key={`${selectedMatch.id}-total-${player.name}`}>
                          <div className="p-gamesResult__rank-item">
                            <div className={`p-gamesResult__rank-badge is-${player.totalRank}`}>{player.totalRank}</div>
                            <div className="p-gamesResult__thumbnail-wrap">
                              <div className="p-gamesResult__thumbnail">
                                <img alt={player.name} src={player.avatar} />
                              </div>
                            </div>
                            <div className="p-gamesResult__name-wrap">
                              <div className="p-gamesResult__name">{player.name}</div>
                              <div className="p-gamesResult__point">{formatPoint(player.totalPoint)}</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ) : (
                <div
                  key={`${selectedMatch.id}-${roundPageStart}`}
                  className="p-gamesResult__columns"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    animation: `${slideDirection === "next" ? "resultSlideNext" : "resultSlidePrev"} 320ms cubic-bezier(0.22, 1, 0.36, 1) both`,
                  }}
                >
                  {visibleRounds.map((round, roundIndex) => {
                    const roundNumber = round.roundNumber ?? (showTotalPage ? 0 : (roundPageStart - 1) * roundsPerPage) + roundIndex + 1;

                    return (
                      <div
                        key={`${selectedMatch.id}-round-${roundNumber}`}
                        className="p-gamesResult__column"
                        style={{ willChange: "transform, opacity" }}
                      >
                        <div className="p-gamesResult__number">第{roundNumber}回戦</div>
                        <div
                          style={{
                            margin: "-8px 0 14px",
                            textAlign: "center",
                            color: "#666",
                            fontSize: "1.2rem",
                            fontWeight: 700,
                          }}
                        >
                          ルール：{round.ruleName}
                        </div>
                        <ol className="p-gamesResult__rank-list">
                          {round.players.map((player) => (
                            <li key={`${selectedMatch.id}-${roundNumber}-${player.playerId}`}>
                              <div className="p-gamesResult__rank-item">
                                <div className={`p-gamesResult__rank-badge is-${player.rank}`}>{player.rank}</div>
                                <div className="p-gamesResult__thumbnail-wrap">
                                  <div className="p-gamesResult__thumbnail">
                                    <img alt={player.name} src={player.avatar} />
                                  </div>
                                </div>
                                <div className="p-gamesResult__name-wrap">
                                  <div className="p-gamesResult__name">{player.name}</div>
                                  <div className="p-gamesResult__point">{formatPoint(player.point)}</div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {hasRoundPager && (
            <div
              className="p-gamesResult__button-wrap"
              style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "18px", flexWrap: "wrap", marginTop: "12px" }}
            >
              <button
                type="button"
                aria-label="Previous"
                onClick={() => onPageChange("prev")}
                disabled={roundPageStart === 0}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: roundPageStart === 0 ? "default" : "pointer",
                  opacity: roundPageStart === 0 ? 0.35 : 1,
                }}
              >
                <img src="/assets/media/img/common/arrow-left.svg" alt="Previous" style={{ width: "42px", height: "42px" }} />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={() => onPageChange("next")}
                disabled={roundPageStart >= pageCount - 1}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: roundPageStart >= pageCount - 1 ? "default" : "pointer",
                  opacity: roundPageStart >= pageCount - 1 ? 0.35 : 1,
                }}
              >
                <img src="/assets/media/img/common/arrow-right.svg" alt="Next" style={{ width: "42px", height: "42px" }} />
              </button>
            </div>
          )}
        </div>
        <button className="c-modal2__close js-close" type="button" onClick={onClose}>
          <span className="c-modal2__close-inner" />
        </button>
      </div>
    </div>
  );
}
