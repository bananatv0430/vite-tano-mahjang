import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEntryFormModel } from "../hooks/useEntryFormModel";
import { useRoundPagination } from "../hooks/useRoundPagination";
import { useRoundInteractions } from "../hooks/useRoundInteractions";
import { usePreviewViewport } from "../hooks/usePreviewViewport";
import { useActivateMain } from "../hooks/useActivateMain";
import { useLoadReferenceData } from "../hooks/useLoadReferenceData";
import { useNavigate } from "react-router-dom";
import DataEntryMessageModal from "../components/DataEntryMessageModal";
import EntryRoundList from "../components/EntryRoundList";
import EntryPlayerSelectors from "../components/EntryPlayerSelectors";
import EntryRuleSummary from "../components/EntryRuleSummary";
import ResultsPreviewModal from "../components/ResultsPreviewModal";
import ResultsPreviewStyles from "../components/ResultsPreviewStyles";
import EntrySharedStyles from "../components/EntrySharedStyles";
import EntryMobileStyles from "../components/EntryMobileStyles";
import {
  FALLBACK_PLAYERS,
  FALLBACK_RULES,
  buildEntryRound,
  calculatePreviewPoint,
  calculateTotalStandings,
  createRound,
  formatDisplayDate,
  getJapaneseWeekday,
} from "../utils/gameUtils";
import { getPlayerIconSrc } from "../utils/playerIcons";
import { requestJson } from "../utils/apiFetch";
import { buildGamePayload } from "../utils/gamePayload";
import { getEntryValidationError } from "../utils/entryValidation";
import "../previewAnimations.css";

export default function DataRegister() {
  const mainRef = useRef(null);
  const scoreInputRefs = useRef(new Map());
  const pendingFocusRef = useRef(null);
  const entryRowsRef = useRef([]);
  const previousDateRef = useRef("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedPlayMode, setSelectedPlayMode] = useState("offline");
  const [selectedRuleId, setSelectedRuleId] = useState(FALLBACK_RULES[0].id);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(() => FALLBACK_PLAYERS.slice(0, 4).map((player) => player.id));
  const [registeredRoundsForDate, setRegisteredRoundsForDate] = useState(0);
  const [startRoundNumber, setStartRoundNumber] = useState(1);

  // カスタムフックでプレイヤー・ルール取得
  const {
    playerOptions,
    ruleOptions,
    isLoadingRules,
    rulesError,
  } = useLoadReferenceData();
  const [entryRows, setEntryRows] = useState(() => [createRound(1, FALLBACK_PLAYERS, FALLBACK_RULES[0].startPoint)]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [roundPageStart, setRoundPageStart] = useState(0);
  const [slideDirection, setSlideDirection] = useState("next");
  const isMobileView = usePreviewViewport(selectedMatch, setSelectedMatch);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedRegistration, setCompletedRegistration] = useState(null);
  const navigate = useNavigate();

  useActivateMain(mainRef);

  // プレイヤー・ルールが切り替わった場合、選択状態を補正
  useEffect(() => {
    // プレイヤー
    if (playerOptions.length > 0) {
      setSelectedPlayerIds((current) => {
        const hasCurrentPlayers = current.length === 4 && current.every((id) => playerOptions.some((player) => player.id === String(id)));
        return hasCurrentPlayers ? current.map(String) : playerOptions.slice(0, 4).map((player) => player.id);
      });
    }
    // ルール
    if (ruleOptions.length > 0) {
      setSelectedRuleId((current) => (
        ruleOptions.some((rule) => rule.id === String(current)) ? String(current) : ruleOptions[0].id
      ));
    }
  }, [playerOptions, ruleOptions]);

  const {
    selectedRule,
    roundValidations,
    hasInvalidRoundTotal,
    hasAllPlayersSelected,
    hasDuplicateSelectedPlayers,
  } = useEntryFormModel({
    entryRows,
    ruleOptions,
    selectedRuleId,
    selectedPlayerIds,
    firstRoundNumber: startRoundNumber,
  });
  const isRegisterDisabled = isSubmitting || hasInvalidRoundTotal || !hasAllPlayersSelected || hasDuplicateSelectedPlayers || !!rulesError || isLoadingRules;

  const selectedPlayers = useMemo(
    () => selectedPlayerIds.map((playerId, index) => {
      const player = playerOptions.find((item) => String(item.id) === String(playerId));
      return player ?? {
        id: `temp-${index}`,
        name: `プレイヤー${index + 1}`,
        iconPath: "",
        iconVersion: "",
        avatar: getPlayerIconSrc("", "", `プレイヤー${index + 1}`),
      };
    }),
    // 依存配列を厳密に
    [playerOptions, selectedPlayerIds]
  );

  const buildPreviewMatch = useCallback(() => ({
    id: selectedDate,
    date: formatDisplayDate(selectedDate),
    day: getJapaneseWeekday(selectedDate),
    playMode: selectedPlayMode,
    rounds: entryRows.map((round, roundIndex) => ({
      id: round.id,
      roundNumber: startRoundNumber + roundIndex,
      ruleName: selectedRule.name,
      players: [...round.players]
        .map((player, playerIndex) => {
          const selectedPlayer = selectedPlayers[playerIndex];
          const playerName = selectedPlayer?.name || `プレイヤー${playerIndex + 1}`;
          const rank = Number(player.rank || playerIndex + 1);

          // プレイヤー情報からiconPath/iconVersionを優先的に取得し、なければselectedPlayerから取得（Player画面と同じくnull対策も追加）
          const iconPath = player?.iconPath ?? selectedPlayer?.iconPath ?? "";
          const iconVersion = player?.iconVersion ?? selectedPlayer?.iconVersion ?? "";
          const avatar = getPlayerIconSrc(iconPath, iconVersion, playerName);
          // デバッグ用ログ
          console.log('[buildPreviewMatch] player', {
            playerIndex,
            playerName,
            iconPath,
            avatar,
            selectedPlayer,
            player,
          });
          return {
            playerId: selectedPlayer?.id ?? `temp-${round.id}-${playerIndex}`,
            name: playerName,
            avatar,
            rank,
            point: calculatePreviewPoint(player.score, rank, selectedRule),
          };
        })
        .sort((a, b) => a.rank - b.rank),
    })),
  }), [entryRows, selectedDate, selectedPlayMode, selectedPlayers, selectedRule, startRoundNumber]);

  const { roundsPerPage, pageCount, showTotalPage, visibleRounds, handleRoundPageChange } = useRoundPagination({
    selectedMatch,
    isMobileView,
    roundPageStart,
    setRoundPageStart,
    setSlideDirection,
  });

  useEffect(() => {
    entryRowsRef.current = entryRows;
  }, [entryRows]);


  const totalStandings = selectedMatch ? calculateTotalStandings(selectedMatch.rounds) : [];

  const buildRoundWithSelectedPlayers = useCallback(
    (roundNumber) => buildEntryRound(roundNumber, playerOptions, selectedRule.startPoint, selectedPlayerIds),
    [playerOptions, selectedPlayerIds, selectedRule.startPoint]
  );

  const addRound = useCallback((options = {}) => {
    const { focusFirstScore = false } = options;
    const roundToAppend = buildRoundWithSelectedPlayers(startRoundNumber + entryRows.length);

    if (focusFirstScore) {
      pendingFocusRef.current = { roundId: roundToAppend.id, playerIndex: 0 };
    }

    setEntryRows((current) => [...current, roundToAppend]);
    setStatusMessage("");
  }, [buildRoundWithSelectedPlayers, entryRows.length, startRoundNumber]);

  const {
    updateSelectedPlayer,
    updateRoundPlayer,
    applyRoundAutoRanks,
    draggedRoundId,
    dragOverRoundId,
    registerScoreInputRef,
    stepRoundPlayerValue,
    handleScoreKeyDown,
    handleRoundDragStart,
    handleRoundDragOver,
    handleRoundDrop,
    handleRoundDragEnd,
  } = useRoundInteractions({
    entryRows,
    entryRowsRef,
    scoreInputRefs,
    pendingFocusRef,
    setSelectedPlayerIds,
    setEntryRows,
    setStatusMessage,
    isMobileView,
    addRound,
    autoRankScores: false,
  });

  const removeRound = useCallback((roundId) => {
    setEntryRows((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((round) => round.id !== roundId);
    });
    setStatusMessage("");
  }, []);

  const openPreviewMatch = useCallback(() => {
    console.log('[openPreviewMatch] called');
    setRoundPageStart(0);
    setSlideDirection("next");
    const preview = buildPreviewMatch();
    console.log('[openPreviewMatch] preview', preview);
    setSelectedMatch(preview);
  }, [buildPreviewMatch]);

  const resetEntryForm = useCallback((nextStartRoundNumber = 1) => {
    setStartRoundNumber(nextStartRoundNumber);
    setEntryRows([buildRoundWithSelectedPlayers(nextStartRoundNumber)]);
    setSelectedMatch(null);
    setRoundPageStart(0);
    setSlideDirection("next");
  }, [buildRoundWithSelectedPlayers]);

  useEffect(() => {
    if (previousDateRef.current === selectedDate) {
      previousDateRef.current = selectedDate;
      return;
    }

    previousDateRef.current = selectedDate;
    setSelectedPlayMode("offline");
    setRegisteredRoundsForDate(0);
    resetEntryForm(1);
  }, [selectedDate, resetEntryForm]);

  const closeCompletedRegistration = useCallback(() => {
    setCompletedRegistration(null);
  }, []);

  const moveToResultsPage = useCallback(() => {
    setCompletedRegistration(null);
    navigate("/results/date");
  }, [navigate]);

  const handleRegister = useCallback(async () => {
    const validationError = getEntryValidationError({
      hasAllPlayersSelected,
      hasDuplicateSelectedPlayers,
      hasInvalidRoundTotal,
      actionLabel: "登録",
    });
    if (validationError) {
      setStatusTone("error");
      setStatusMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const payload = buildGamePayload({
        date: selectedDate,
        ruleId: selectedRule.id,
        playMode: selectedPlayMode,
        rounds: entryRows,
        calculatePoint: (score, rank) => calculatePreviewPoint(score, rank, selectedRule),
      });

      await requestJson("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }, "登録に失敗しました。");

      const nextRegisteredRoundsForDate = registeredRoundsForDate + entryRows.length;
      setRegisteredRoundsForDate(nextRegisteredRoundsForDate);
      resetEntryForm(nextRegisteredRoundsForDate + 1);
      setStatusTone("success");
      setStatusMessage("");
      setCompletedRegistration({
        message: "対局結果を登録しました。",
      });
    } catch (error) {
      setCompletedRegistration(null);
      setStatusTone("error");
      setStatusMessage(error.message || "登録に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  }, [entryRows, hasAllPlayersSelected, hasDuplicateSelectedPlayers, hasInvalidRoundTotal, registeredRoundsForDate, resetEntryForm, selectedDate, selectedPlayMode, selectedRule]);


  return (
    <main ref={mainRef} className="l-main u-next-fill-gray p-loadAnimation" role="main">
      <EntrySharedStyles />
      <ResultsPreviewStyles />
      <style>{`



        .dataEntry__controls {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .dataEntry__field {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }


        .dataEntry__select,
        .dataEntry__smallSelect {
          width: 100%;
          border: 1px solid #d9d9d9;
          border-radius: 10px;
          background: #fff;
          color: #222;
        }

        .dataEntry__select:focus,
        .dataEntry__smallInput:focus,
        .dataEntry__smallSelect:focus,
        .dataEntry__mobileRollSelect:focus + .dataEntry__mobileRollButton,
        .dataEntry__mobileRollWrap:focus-within .dataEntry__mobileRollButton {
          outline: none;
          border-color: #f08300;
          box-shadow: 0 0 0 3px rgba(240, 131, 0, 0.18);
        }

        .dataEntry__select {
          height: 46px;
          padding: 0 14px;
          font-size: 1.4rem;
        }


































        .dataEntry__smallSelect {
          height: 40px;
          padding: 0 10px;
          font-size: 1.3rem;
        }









        .dataEntry__actionButton,
        .dataEntry__addButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          text-decoration: none;
        }

        .dataEntry__addWrap {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }

        .dataEntry__addButton {
          width: 42px;
          height: 42px;
          min-width: 42px;
          padding: 0;
          border-radius: 50%;
          background: transparent;
          color: #fff;
          font-size: 2.1rem;
          font-weight: 700;
          line-height: 1;
        }

        .dataEntry__actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 24px;
        }

        .dataEntry__actionButton {
          min-width: 110px;
          height: 44px;
          padding: 0 18px;
          border-radius: 10px;
          background: #f08300;
          border: 1px solid #e06d00;
          color: #fff;
          font-size: 1.35rem;
          font-weight: 700;
          box-shadow: 0 2px 0 rgba(0, 0, 0, 0.05);
        }

        .dataEntry__actionButton:hover {
          background: #ff930f;
          border-color: #dc6803;
        }

        .dataEntry__actionButton:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(240, 131, 0, 0.22);
        }

        .dataEntry__actionButton--accent {
          background: #d66a00;
          border-color: #c85f00;
        }

        .dataEntry__actionButton--accent:hover {
          background: #e67500;
          border-color: #bb5800;
        }

        .dataEntry__actions .c-button.-primary.dataEntry__actionButton {
          background: #f08300;
          border-color: #e06d00;
          color: #fff;
        }

        .dataEntry__actions .c-button.-primary.dataEntry__actionButton:hover {
          background: #ff930f;
          border-color: #dc6803;
        }

        .dataEntry__actions .c-button.-primary.dataEntry__actionButton.dataEntry__actionButton--accent {
          background: #d66a00;
          border-color: #c85f00;
        }

        .dataEntry__actions .c-button.-primary.dataEntry__actionButton.dataEntry__actionButton--accent:hover {
          background: #e67500;
          border-color: #bb5800;
        }

        .dataEntry__actions .c-button.-primary.dataEntry__actionButton:disabled,
        .dataEntry__actions .c-button.-primary.dataEntry__actionButton.dataEntry__actionButton--accent:disabled {
          background: #f4a74f;
          border-color: #e89231;
          color: #fff;
          opacity: 0.72;
        }


        .dataEntry__notice {
          margin-top: 14px;
          text-align: center;
          color: #666;
          font-size: 1.2rem;
        }

        .dataEntry__status {
          margin-top: 12px;
          text-align: center;
          color: #f08300;
          font-size: 1.2rem;
          font-weight: 700;
        }

        .dataEntry__popupContents {
          position: fixed;
          top: 54%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(84vw, 520px);
        }

        .dataEntry__popupContents--result {
          width: min(84vw, 700px);
        }

        .dataEntry__completeModal {
          padding: 28px 20px 24px;
          text-align: center;
          background: #fff;
          border: 2px solid #f08300;
          border-radius: 18px;
        }

        .dataEntry__completeTitle {
          margin: 0 0 10px;
          color: #f08300;
          font-size: 1.9rem;
          font-weight: 700;
        }

        .dataEntry__completeText {
          margin: 0;
          color: #444;
          font-size: 1.3rem;
          line-height: 1.7;
        }

        .dataEntry__completeActions {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          width: 100%;
          margin-top: 18px;
          text-align: center;
        }

        .dataEntry__completeButton {
          min-width: 124px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0;
        }

        .dataEntry__status--error {
          color: #c62828;
        }

        .dataEntry__status--success {
          color: #f08300;
        }

        .dataEntry__actionButton:disabled,
        .dataEntry__addButton:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          pointer-events: none;
        }

        @media (min-width: 768px) {
          .dataEntry__stepButtons {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .dataEntry__smallInput[type="number"] {
            -moz-appearance: textfield;
          }

          .dataEntry__smallInput::-webkit-outer-spin-button,
          .dataEntry__smallInput::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
        }

        @media (max-width: 991px) {
          .dataEntry__roundGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dataEntry__slot:nth-child(2n) {
            border-right: none;
          }

          .dataEntry__slot:nth-child(-n + 2) {
            border-bottom: 1px solid #ededed;
          }

        }

        @media (max-width: 767px) {




          .dataEntry__field {
            flex-direction: row;
            align-items: center;
            gap: 4px;
          }





















          .dataEntry__status {
            margin-top: 10px;
          }










        }
      `}</style>
      <EntryMobileStyles />

      <section className="p-gamesSchedule">
        <div className="p-gamesSchedule__inner p-loadAnimation__target">
          <h1 className="p-gamesSchedule__title" lang="en">
            Entry
          </h1>
          <p className="p-gamesSchedule__desc">データ登録</p>
        </div>
      </section>

      <section className="p-gamesSchedule2">
        <div className="dataEntry__inner p-loadAnimation__target">
          <div className="dataEntry__panel">

            <div className="dataEntry__controls">
              <div className="dataEntry__field">
                <label htmlFor="data-entry-date">日付</label>
                <input
                  id="data-entry-date"
                  className="dataEntry__input"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </div>

              <div className="dataEntry__field">
                <label htmlFor="data-entry-rule">基準ルール</label>
                <select
                  id="data-entry-rule"
                  className="dataEntry__select"
                  value={selectedRuleId}
                  onChange={(event) => setSelectedRuleId(event.target.value)}
                  disabled={isLoadingRules && ruleOptions.length === 0}
                >
                  {ruleOptions.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dataEntry__field">
                <label htmlFor="data-entry-play-mode">対局種別</label>
                <select
                  id="data-entry-play-mode"
                  className="dataEntry__select"
                  value={selectedPlayMode}
                  onChange={(event) => setSelectedPlayMode(event.target.value === "online" ? "online" : "offline")}
                >
                  <option value="offline">オフライン</option>
                  <option value="online">オンライン</option>
                </select>
              </div>
            </div>

            {rulesError ? (
              <p style={{ marginTop: "12px", color: "#c62828", fontSize: "1.2rem", fontWeight: 700 }}>
                {rulesError}
              </p>
            ) : null}

            <EntryRuleSummary rule={selectedRule} />

            <EntryPlayerSelectors
              selectedPlayerIds={selectedPlayerIds}
              playerOptions={playerOptions}
              onPlayerChange={updateSelectedPlayer}
            />

            <EntryRoundList
              rounds={entryRows}
              roundStartNumber={startRoundNumber}
              roundValidations={roundValidations}
              selectedPlayers={selectedPlayers}
              isMobileView={isMobileView}
              isDeleteDisabled={entryRows.length === 1}
              isDragEnabled={!isMobileView && entryRows.length > 1}
              draggedRoundId={draggedRoundId}
              dragOverRoundId={dragOverRoundId}
              onRemoveRound={removeRound}
              onUpdateRoundPlayer={updateRoundPlayer}
              onScoreCommit={applyRoundAutoRanks}
              onScoreKeyDown={handleScoreKeyDown}
              onScoreStep={stepRoundPlayerValue}
              onRankStep={stepRoundPlayerValue}
              onRoundDragStart={handleRoundDragStart}
              onRoundDragOver={handleRoundDragOver}
              onRoundDrop={handleRoundDrop}
              onRoundDragEnd={handleRoundDragEnd}
              registerScoreInputRef={registerScoreInputRef}
            />

            <div className="dataEntry__addWrap">
              <button className="c-button -primary dataEntry__addButton" type="button" aria-label="行を追加" onClick={addRound}>
                ＋
              </button>
            </div>

            <div className="dataEntry__actions">
              <button
                className="c-button -primary -medium dataEntry__actionButton"
                type="button"
                onClick={openPreviewMatch}
              >
                結果
              </button>
              <button
                className="c-button -primary -medium dataEntry__actionButton dataEntry__actionButton--accent"
                type="button"
                disabled={isRegisterDisabled}
                onClick={handleRegister}
              >
                {isSubmitting ? "登録中..." : "登録"}
              </button>
            </div>

            {statusMessage ? <p className={`dataEntry__status dataEntry__status--${statusTone}`}>{statusMessage}</p> : null}
          </div>
        </div>

        <DataEntryMessageModal
          isOpen={Boolean(completedRegistration)}
          title="登録完了"
          message={completedRegistration?.message}
          ariaLabel="登録完了"
          onClose={closeCompletedRegistration}
          buttons={[
            {
              label: "結果確認",
              onClick: moveToResultsPage,
              className: "c-button -primary -medium dataEntry__completeButton",
            },
            {
              label: "閉じる",
              onClick: closeCompletedRegistration,
              className: "c-button -primary -medium dataEntry__completeButton",
            },
          ]}
        />

        <ResultsPreviewModal
          selectedMatch={selectedMatch}
          roundsPerPage={roundsPerPage}
          visibleRounds={visibleRounds}
          totalStandings={totalStandings}
          showTotalPage={showTotalPage}
          roundPageStart={roundPageStart}
          pageCount={pageCount}
          slideDirection={slideDirection}
          wrapperClassName="dataEntry__popupContents dataEntry__popupContents--result"
          onClose={() => setSelectedMatch(null)}
          onPageChange={handleRoundPageChange}
        />
      </section>
    </main>
  );
}
