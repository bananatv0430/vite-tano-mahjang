import { memo } from "react";
import { SCORE_PICKER_SET, SCORE_PICKER_VALUES, formatNumber } from "../utils/gameUtils";

const DataEntryRound = memo(function DataEntryRound({
  round,
  roundIndex,
  isRoundValid,
  selectedPlayers,
  isMobileView,
  isDeleteDisabled,
  isDragEnabled,
  isDragging,
  isDropTarget,
  onRemoveRound,
  onUpdateRoundPlayer,
  onScoreKeyDown,
  onScoreStep,
  onRankStep,
  onRoundDragStart,
  onRoundDragOver,
  onRoundDrop,
  onRoundDragEnd,
  registerScoreInputRef,
}) {
  return (
    <div
      className={`dataEntry__round${isDragging ? " is-dragging" : ""}${isDropTarget ? " is-dropTarget" : ""}`}
      onDragOver={isDragEnabled ? (event) => onRoundDragOver(event, round.id) : undefined}
      onDrop={isDragEnabled ? (event) => onRoundDrop(event, round.id) : undefined}
    >
      <div
        className={`dataEntry__roundHeader${isDragEnabled ? " dataEntry__roundHeader--draggable" : ""}`}
        draggable={isDragEnabled}
        onDragStart={isDragEnabled ? (event) => onRoundDragStart(event, round.id) : undefined}
        onDragEnd={isDragEnabled ? onRoundDragEnd : undefined}
        title={isDragEnabled ? "ドラッグして順番を変更" : undefined}
      >
        <div className="dataEntry__roundTitle">
          {isDragEnabled ? (
            <span className="dataEntry__dragHandle" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </span>
          ) : null}
          <span>第{roundIndex + 1}回戦</span>
        </div>
        <div className="dataEntry__roundHeaderActions">
          {!isRoundValid ? (
            <span className="dataEntry__warningMark" aria-label="点数不一致">
              <img src="/assets/media/icons/warning.png" alt="Warning" />
            </span>
          ) : null}
          <button
            className="dataEntry__deleteIconButton"
            type="button"
            onClick={() => onRemoveRound(round.id, roundIndex)}
            disabled={isDeleteDisabled}
            aria-label={`第${roundIndex + 1}回戦を削除`}
          >
            <span className="dataEntry__deleteCircle" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="dataEntry__roundGrid">
        {round.players.map((player, playerIndex) => (
          <div key={`${round.id}-${playerIndex}`} className="dataEntry__slot">
            <div className="dataEntry__playerName">{selectedPlayers[playerIndex]?.name ?? "未選択"}</div>

            <div className="dataEntry__slotRow">
              <label className="dataEntry__slotLabel" htmlFor={`${round.id}-score-${playerIndex}`}>
                点数
              </label>
              <div className="dataEntry__stepper">
                <input
                  id={`${round.id}-score-${playerIndex}`}
                  ref={(element) => registerScoreInputRef(round.id, playerIndex, element)}
                  className="dataEntry__smallInput"
                  type="number"
                  inputMode="numeric"
                  step="100"
                  value={player.score}
                  onChange={(event) => onUpdateRoundPlayer(round.id, playerIndex, "score", event.target.value)}
                  onKeyDown={(event) => onScoreKeyDown(event, round.id, playerIndex)}
                />
                {!isMobileView ? (
                  <div className="dataEntry__stepButtons">
                    <button
                      className="dataEntry__stepButton"
                      type="button"
                      tabIndex={-1}
                      aria-label="点数を100増やす"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        onScoreStep(round.id, playerIndex, "score", 100, { fallback: 0 });
                      }}
                    >
                      ▲
                    </button>
                    <button
                      className="dataEntry__stepButton"
                      type="button"
                      tabIndex={-1}
                      aria-label="点数を100減らす"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        onScoreStep(round.id, playerIndex, "score", -100, { fallback: 0 });
                      }}
                    >
                      ▼
                    </button>
                  </div>
                ) : (
                  <div className="dataEntry__mobileRollWrap">
                    <span className="dataEntry__mobileRollButton" aria-hidden="true">▼</span>
                    <select
                      className="dataEntry__mobileRollSelect"
                      aria-label="点数をロールで選択"
                      value={SCORE_PICKER_SET.has(Number(player.score)) ? String(Number(player.score)) : ""}
                      onChange={(event) => onUpdateRoundPlayer(round.id, playerIndex, "score", event.target.value)}
                    >
                      <option value="">選択</option>
                      {SCORE_PICKER_VALUES.map((scoreValue) => (
                        <option key={scoreValue} value={scoreValue}>
                          {formatNumber(scoreValue)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="dataEntry__slotRow">
              <label className="dataEntry__slotLabel" htmlFor={`${round.id}-rank-${playerIndex}`}>
                順位
              </label>
              <div className="dataEntry__stepper">
                <input
                  id={`${round.id}-rank-${playerIndex}`}
                  className="dataEntry__smallInput"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="4"
                  step="1"
                  value={player.rank}
                  onChange={(event) => onUpdateRoundPlayer(round.id, playerIndex, "rank", event.target.value)}
                />
                {!isMobileView ? (
                  <div className="dataEntry__stepButtons">
                    <button
                      className="dataEntry__stepButton"
                      type="button"
                      tabIndex={-1}
                      aria-label="順位を1つ上げる"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        onRankStep(round.id, playerIndex, "rank", -1, { min: 1, max: 4, fallback: 1 });
                      }}
                    >
                      ▲
                    </button>
                    <button
                      className="dataEntry__stepButton"
                      type="button"
                      tabIndex={-1}
                      aria-label="順位を1つ下げる"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        onRankStep(round.id, playerIndex, "rank", 1, { min: 1, max: 4, fallback: 1 });
                      }}
                    >
                      ▼
                    </button>
                  </div>
                ) : (
                  <div className="dataEntry__mobileRankButtons">
                    <button
                      className="dataEntry__stepButton"
                      type="button"
                      aria-label="順位を1つ上げる"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        onRankStep(round.id, playerIndex, "rank", -1, { min: 1, max: 4, fallback: 1 });
                      }}
                    >
                      ▲
                    </button>
                    <button
                      className="dataEntry__stepButton"
                      type="button"
                      aria-label="順位を1つ下げる"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        onRankStep(round.id, playerIndex, "rank", 1, { min: 1, max: 4, fallback: 1 });
                      }}
                    >
                      ▼
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default DataEntryRound;
