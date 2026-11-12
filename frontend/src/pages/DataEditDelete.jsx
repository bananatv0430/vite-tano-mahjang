import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEntryFormModel } from "../hooks/useEntryFormModel";
import { useRoundPagination } from "../hooks/useRoundPagination";
import { useRoundInteractions } from "../hooks/useRoundInteractions";
import { usePreviewViewport } from "../hooks/usePreviewViewport";
import { useActivateMain } from "../hooks/useActivateMain";
import { useLoadGameMasterData } from "../hooks/useLoadGameMasterData";
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
  createAvatar,
  createRound,
  formatDisplayDate,
  getJapaneseWeekday,
} from "../utils/gameUtils";
import { apiFetch, readJsonOrEmpty, requestJson } from "../utils/apiFetch";
import { buildGamePayload } from "../utils/gamePayload";
import { getEntryValidationError } from "../utils/entryValidation";
import "../previewAnimations.css";

export default function DataEditDelete() {
  const mainRef = useRef(null);
  const scoreInputRefs = useRef(new Map());
  const pendingFocusRef = useRef(null);
  const entryRowsRef = useRef([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPlayMode, setSelectedPlayMode] = useState("offline");
  const [selectedRuleId, setSelectedRuleId] = useState(FALLBACK_RULES[0].id);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(() => FALLBACK_PLAYERS.slice(0, 4).map((player) => player.id));
  const [isLoadingDateData, setIsLoadingDateData] = useState(false);

  // カスタムフックでマスターデータ取得
  const {
    availableDates,
    isLoadingDates,
    dateOptionsError,
    playerOptions,
    isLoadingPlayers,
    ruleOptions,
    isLoadingRules,
    rulesError,
  } = useLoadGameMasterData();
  const [entryRows, setEntryRows] = useState(() => [createRound(1, FALLBACK_PLAYERS, FALLBACK_RULES[0].startPoint)]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [roundPageStart, setRoundPageStart] = useState(0);
  const [slideDirection, setSlideDirection] = useState("next");
  const isMobileView = usePreviewViewport(selectedMatch, setSelectedMatch);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedRegistration, setCompletedRegistration] = useState(null);
  const [pendingRoundDelete, setPendingRoundDelete] = useState(null);
  const [isDateDeleteConfirmOpen, setIsDateDeleteConfirmOpen] = useState(false);
  const navigate = useNavigate();

  useActivateMain(mainRef);

  // 選択中の日付がマスターデータから消えた場合はリセット
  useEffect(() => {
    if (!availableDates.includes(selectedDate)) {
      setSelectedDate("");
    }
  }, [availableDates, selectedDate]);

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
  });
  const isDateSelected = Boolean(selectedDate);
  const isEditorDisabled = !isDateSelected || isLoadingDateData;
  const isRegisterDisabled = isSubmitting || isEditorDisabled || hasInvalidRoundTotal || !hasAllPlayersSelected || hasDuplicateSelectedPlayers || !!rulesError || isLoadingRules;

  const selectedPlayers = useMemo(
    () => selectedPlayerIds.map((playerId, index) => {
      const player = playerOptions.find((item) => item.id === playerId);
      return player ?? {
        id: `temp-${index}`,
        name: `プレイヤー${index + 1}`,
        avatar: createAvatar(String(index + 1)),
      };
    }),
    [playerOptions, selectedPlayerIds]
  );

  // 日付データ取得ロジックを関数化
  const loadDateGames = useCallback(async (date) => {
    if (!date) {
      setSelectedPlayMode("offline");
      setSelectedMatch(null);
      setRoundPageStart(0);
      setSlideDirection("next");
      setStatusMessage("");
      return;
    }
    const controller = new AbortController();
    setIsLoadingDateData(true);
    setStatusMessage("");
    try {
      const response = await apiFetch(`/api/games/by-date?date=${encodeURIComponent(date)}`, { signal: controller.signal });
      if (!response.ok) {
        const errorData = await readJsonOrEmpty(response);
        throw new Error(errorData.error || "対象日の対局データ取得に失敗しました");
      }
      const data = await response.json();
      const nextParticipantIds = (Array.isArray(data.participants) ? data.participants : [])
        .map((player) => String(player.playerId ?? player.id ?? "").trim())
        .filter(Boolean)
        .sort((a, b) => Number(a) - Number(b))
        .slice(0, 4);
      const fallbackPlayerIds = playerOptions.slice(0, 4).map((player) => player.id);
      const resolvedPlayerIds = nextParticipantIds.length === 4 ? nextParticipantIds : fallbackPlayerIds;
      const resolvedRuleId = String(data.ruleId ?? FALLBACK_RULES[0].id);
      const resolvedPlayMode = String(data.playMode ?? "offline").toLowerCase() === "online" ? "online" : "offline";
      const resolvedRule = ruleOptions.find((rule) => rule.id === resolvedRuleId) ?? FALLBACK_RULES[0];
      const nextGames = Array.isArray(data.games) ? data.games : [];
      const nextEntryRows = nextGames.length > 0
        ? nextGames.map((game, index) => {
            const playerMap = new Map(
              (Array.isArray(game.players) ? game.players : []).map((player) => [String(player.playerId), player])
            );
            return {
              id: `game-${game.gameId ?? date}-${index}`,
              gameId: game.gameId ?? null,
              matchNumber: Number(game.matchNumber ?? index + 1),
              players: resolvedPlayerIds.map((playerId, playerIndex) => {
                const targetPlayer = playerMap.get(String(playerId));
                return {
                  playerId: String(playerId),
                  score: String(targetPlayer?.finalScore ?? resolvedRule.startPoint ?? 0),
                  rank: String(targetPlayer?.rank ?? playerIndex + 1),
                };
              }),
            };
          })
        : [createRound(1, playerOptions, resolvedRule.startPoint)];
      setSelectedRuleId(resolvedRuleId);
      setSelectedPlayMode(resolvedPlayMode);
      setSelectedPlayerIds(resolvedPlayerIds);
      setEntryRows(nextEntryRows);
      setSelectedMatch(null);
      setRoundPageStart(0);
      setSlideDirection("next");
    } catch (error) {
      if (error.name !== "AbortError") {
        setStatusTone("error");
        setStatusMessage(error.message || "対象日の対局データ取得に失敗しました");
      }
    } finally {
      if (!controller.signal.aborted) setIsLoadingDateData(false);
    }
    return () => controller.abort();
  }, [playerOptions, ruleOptions]);

  // 日付・プレイヤー・ルールが揃ったらデータ取得
  useEffect(() => {
    loadDateGames(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerOptions, ruleOptions, selectedDate]);

  const displayRule = isDateSelected
    ? selectedRule
    : {
        umaLabel: "--",
        returnPoint: "--",
        startPoint: "--",
        rankPoints: ["--", "--", "--", "--"],
      };

  const displaySelectedPlayerIds = isDateSelected ? selectedPlayerIds : Array.from({ length: 4 }, () => "");

  const displaySelectedPlayers = isDateSelected
    ? selectedPlayers
    : Array.from({ length: 4 }, (_, index) => ({
        id: `placeholder-${index}`,
        name: "未選択",
        avatar: createAvatar("?"),
      }));

  const displayEntryRows = isDateSelected
    ? entryRows
    : [
        {
          id: "placeholder-round",
          players: Array.from({ length: 4 }, () => ({
            playerId: "",
            score: "",
            rank: "",
          })),
        },
      ];

  const buildPreviewMatch = useCallback(() => ({
    id: selectedDate,
    date: formatDisplayDate(selectedDate),
    day: getJapaneseWeekday(selectedDate),
    playMode: selectedPlayMode,
    rounds: entryRows.map((round, roundIndex) => ({
      id: round.id,
      roundNumber: roundIndex + 1,
      ruleName: selectedRule.name,
      players: [...round.players]
        .map((player, playerIndex) => {
          const selectedPlayer = selectedPlayers[playerIndex];
          const playerName = selectedPlayer?.name || `プレイヤー${playerIndex + 1}`;
          const rank = Number(player.rank || playerIndex + 1);

          return {
            playerId: selectedPlayer?.id ?? `temp-${round.id}-${playerIndex}`,
            name: playerName,
            avatar: selectedPlayer?.avatar ?? createAvatar(playerName),
            rank,
            point: calculatePreviewPoint(player.score, rank, selectedRule),
          };
        })
        .sort((a, b) => a.rank - b.rank),
    })),
  }), [entryRows, selectedDate, selectedPlayMode, selectedPlayers, selectedRule]);

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

  const addRound = useCallback((options = {}) => {
    const { focusFirstScore = false } = options;
    const roundToAppend = buildEntryRound(entryRows.length + 1, playerOptions, selectedRule.startPoint, selectedPlayerIds);

    if (focusFirstScore) {
      pendingFocusRef.current = { roundId: roundToAppend.id, playerIndex: 0 };
    }

    setEntryRows((current) => [...current, roundToAppend]);
    setStatusMessage("");
  }, [entryRows.length, playerOptions, selectedPlayerIds, selectedRule.startPoint]);

  const removeRound = useCallback((roundId) => {
    setEntryRows((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((round) => round.id !== roundId);
    });
    setSelectedMatch(null);
    setRoundPageStart(0);
    setSlideDirection("next");
    setStatusMessage("");
  }, []);

  const {
    updateSelectedPlayer,
    updateRoundPlayer,
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
    autoRankScores: true,
  });

  const requestRoundDelete = useCallback((roundId, roundIndex) => {
    if (entryRowsRef.current.length === 1) {
      return;
    }

    setPendingRoundDelete({
      roundId,
      roundLabel: `第${Number(roundIndex) + 1}回戦`,
    });
  }, []);

  const cancelRoundDelete = useCallback(() => {
    setPendingRoundDelete(null);
  }, []);

  const confirmRoundDelete = useCallback(() => {
    if (!pendingRoundDelete?.roundId) {
      return;
    }

    removeRound(pendingRoundDelete.roundId);
    setPendingRoundDelete(null);
  }, [pendingRoundDelete, removeRound]);

  const openPreviewMatch = useCallback(() => {
    setRoundPageStart(0);
    setSlideDirection("next");
    setSelectedMatch(buildPreviewMatch());
  }, [buildPreviewMatch]);

  const resetEntryForm = useCallback(() => {
    setEntryRows([createRound(1, playerOptions, selectedRule.startPoint)]);
    setSelectedMatch(null);
    setRoundPageStart(0);
    setSlideDirection("next");
  }, [playerOptions, selectedRule.startPoint]);

  const closeCompletedRegistration = useCallback(() => {
    setCompletedRegistration(null);
    setSelectedDate(""); // 対局日を未選択に
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    }
  }, []);

  const moveToResultsPage = useCallback(() => {
    setCompletedRegistration(null);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    }
    navigate("/results/date");
  }, [navigate]);

  const openDateDeleteConfirm = useCallback(() => {
    if (!selectedDate) {
      return;
    }

    setIsDateDeleteConfirmOpen(true);
  }, [selectedDate]);

  const closeDateDeleteConfirm = useCallback(() => {
    setIsDateDeleteConfirmOpen(false);
  }, []);

  const handleDeleteDate = useCallback(async () => {
    if (!selectedDate) {
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      await requestJson(`/api/games?date=${encodeURIComponent(selectedDate)}`, {
        method: "DELETE",
      }, "削除に失敗しました。");

      setSelectedDate("");
      setSelectedPlayMode("offline");
      setSelectedRuleId(ruleOptions[0]?.id ?? FALLBACK_RULES[0].id);
      setSelectedPlayerIds(playerOptions.slice(0, 4).map((player) => player.id));
      setEntryRows([createRound(1, playerOptions, FALLBACK_RULES[0].startPoint)]);
      setSelectedMatch(null);
      setRoundPageStart(0);
      setSlideDirection("next");
      setStatusTone("success");
      setStatusMessage("");
      setCompletedRegistration({
        title: "削除完了",
        message: "対局データを削除しました。",
      });
    } catch (error) {
      setCompletedRegistration(null);
      setStatusTone("error");
      setStatusMessage(error.message || "削除に失敗しました。");
    } finally {
      setIsSubmitting(false);
      setIsDateDeleteConfirmOpen(false);
    }
  }, [playerOptions, ruleOptions, selectedDate]);

  const handleUpdate = useCallback(async () => {
    const validationError = getEntryValidationError({
      selectedDate,
      hasAllPlayersSelected,
      hasDuplicateSelectedPlayers,
      hasInvalidRoundTotal,
      actionLabel: "更新",
      requireDate: true,
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
      });

      // 日付単位の一括更新APIを呼び出す
      const data = await requestJson("/api/games", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }, "更新に失敗しました。");

      const updatedGames = Array.isArray(data.games) ? data.games : [];
      setEntryRows((current) => current.map((round, index) => ({
        ...round,
        gameId: updatedGames[index]?.gameId ?? round.gameId ?? null,
        matchNumber: updatedGames[index]?.matchNumber ?? index + 1,
      })));
      setSelectedMatch(null);
      setRoundPageStart(0);
      setSlideDirection("next");
      setStatusTone("success");
      setStatusMessage("");
      setCompletedRegistration({
        title: "更新完了",
        message: "対局データを更新しました。",
      });
    } catch (error) {
      setCompletedRegistration(null);
      setStatusTone("error");
      setStatusMessage(error.message || "更新に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  }, [entryRows, hasAllPlayersSelected, hasDuplicateSelectedPlayers, hasInvalidRoundTotal, selectedDate, selectedPlayMode, selectedRule]);


  return (
    <main ref={mainRef} className="l-main u-next-fill-gray p-loadAnimation" role="main">
      <EntrySharedStyles />
      <ResultsPreviewStyles />
      <style>{`



        .dataEntry__controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .dataEntry__controls--single {
          grid-template-columns: minmax(0, 1fr);
        }

        .dataEntry__field {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dataEntry__field--wide {
          width: 100%;
        }

        .dataEntry__field.is-disabled label {
          color: #b7b7b7;
        }

        .dataEntry__input:disabled,
        .dataEntry__select:disabled,
        .dataEntry__smallInput:disabled,
        .dataEntry__smallSelect:disabled {
          color: #b7b7b7;
          background: #f7f7f7;
          border-color: #ececec;
        }

        .dataEntry__editorArea {
          position: relative;
          margin-top: 18px;
        }

        .dataEntry__editorContent {
          transition: opacity 0.2s ease, filter 0.2s ease;
        }

        .dataEntry__editorArea.is-disabled .dataEntry__editorContent {
          opacity: 0.42;
          filter: grayscale(0.5);
          pointer-events: none;
          user-select: none;
        }

        .dataEntry__editorArea.is-disabled .dataEntry__subTitle,
        .dataEntry__editorArea.is-disabled .dataEntry__chip,
        .dataEntry__editorArea.is-disabled .dataEntry__chip strong,
        .dataEntry__editorArea.is-disabled .dataEntry__playerName,
        .dataEntry__editorArea.is-disabled .dataEntry__roundTitle,
        .dataEntry__editorArea.is-disabled .dataEntry__slotLabel {
          color: #b7b7b7 !important;
        }

        .dataEntry__disabledOverlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 2;
          pointer-events: none;
        }

        .dataEntry__disabledOverlay span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #d7ded8;
          color: #3d4b41;
          font-size: 1.15rem;
          font-weight: 700;
          text-align: center;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
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

        .dataEntry__actionButton--delete {
          background: #d66a00;
          border-color: #c85f00;
        }

        .dataEntry__actionButton--delete:hover {
          background: #e67500;
          border-color: #bb5800;
        }

        .dataEntry__actionButton:hover {
          background: #ff930f;
          border-color: #dc6803;
        }

        .dataEntry__actionButton:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(240, 131, 0, 0.22);
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

        .dataEntry__actions .c-button.-primary.dataEntry__actionButton.dataEntry__actionButton--delete {
          background: #d66a00;
          border-color: #c85f00;
        }

        .dataEntry__actions .c-button.-primary.dataEntry__actionButton.dataEntry__actionButton--delete:hover {
          background: #e67500;
          border-color: #bb5800;
        }

        .dataEntry__actions .c-button.-primary.dataEntry__actionButton:disabled,
        .dataEntry__actions .c-button.-primary.dataEntry__actionButton.dataEntry__actionButton--delete:disabled {
          background: #f4a74f;
          border-color: #e89231;
          color: #fff;
          opacity: 0.72;
        }

        .dataEntry__completeButton--delete {
          background: transparent;
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
            gap: 8px;
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
            Edit
          </h1>
          <p className="p-gamesSchedule__desc">データ編集・削除</p>
        </div>
      </section>

      <section className="p-gamesSchedule2">
        <div className="dataEntry__inner p-loadAnimation__target">
          <div className="dataEntry__panel">

            <div className="dataEntry__controls dataEntry__controls--single">
              <div className="dataEntry__field dataEntry__field--wide">
                <label htmlFor="data-edit-date">対局日</label>
                <select
                  id="data-edit-date"
                  className="dataEntry__select"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  disabled={isLoadingDates || availableDates.length === 0}
                >
                  <option value="">
                    {isLoadingDates
                      ? "読み込み中..."
                      : availableDates.length === 0
                        ? "登録済み日付がありません"
                        : "日付を選択してください"}
                  </option>
                  {availableDates.map((dateOption) => (
                    <option key={dateOption} value={dateOption}>
                      {`${dateOption}（${getJapaneseWeekday(dateOption)}）`}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`dataEntry__field dataEntry__field--wide${!isDateSelected ? " is-disabled" : ""}`}>
                <label htmlFor="data-edit-rule">ルール</label>
                <select
                  id="data-edit-rule"
                  className="dataEntry__select"
                  value={selectedRuleId}
                  onChange={(event) => setSelectedRuleId(event.target.value)}
                  disabled={!isDateSelected || (isLoadingRules && ruleOptions.length === 0)}
                >
                  {ruleOptions.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`dataEntry__field dataEntry__field--wide${!isDateSelected ? " is-disabled" : ""}`}>
                <label htmlFor="data-edit-play-mode">対局種別</label>
                <select
                  id="data-edit-play-mode"
                  className="dataEntry__select"
                  value={selectedPlayMode}
                  onChange={(event) => setSelectedPlayMode(event.target.value === "online" ? "online" : "offline")}
                  disabled={!isDateSelected}
                >
                  <option value="offline">オフライン</option>
                  <option value="online">オンライン</option>
                </select>
              </div>
            </div>

            {dateOptionsError ? (
              <p style={{ marginTop: "12px", color: "#c62828", fontSize: "1.2rem", fontWeight: 700 }}>
                {dateOptionsError}
              </p>
            ) : null}

            <div className={`dataEntry__editorArea${isEditorDisabled ? " is-disabled" : ""}`}>

              <div className="dataEntry__editorContent">
                {rulesError ? (
                  <p style={{ marginTop: "12px", color: "#c62828", fontSize: "1.2rem", fontWeight: 700 }}>
                    {rulesError}
                  </p>
                ) : null}

                <EntryRuleSummary rule={displayRule} />

                <EntryPlayerSelectors
                  selectedPlayerIds={displaySelectedPlayerIds}
                  playerOptions={playerOptions}
                  onPlayerChange={updateSelectedPlayer}
                />

                <EntryRoundList
                  rounds={displayEntryRows}
                  roundValidations={roundValidations}
                  selectedPlayers={displaySelectedPlayers}
                  isMobileView={isMobileView}
                  isDeleteDisabled={entryRows.length === 1}
                  isDragEnabled={!isMobileView && !isEditorDisabled && displayEntryRows.length > 1}
                  draggedRoundId={draggedRoundId}
                  dragOverRoundId={dragOverRoundId}
                  onRemoveRound={requestRoundDelete}
                  onUpdateRoundPlayer={updateRoundPlayer}
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
                    className="c-button -primary -medium dataEntry__actionButton dataEntry__actionButton--accent"
                    type="button"
                    disabled={isEditorDisabled || isSubmitting}
                    onClick={handleUpdate}
                  >
                    {isSubmitting ? "更新中..." : "更新"}
                  </button>
                  <button
                    className="c-button -primary -medium dataEntry__actionButton dataEntry__actionButton--delete"
                    type="button"
                    disabled={isEditorDisabled || isSubmitting}
                    onClick={openDateDeleteConfirm}
                  >
                    削除
                  </button>
                </div>

                {statusMessage ? <p className={`dataEntry__status dataEntry__status--${statusTone}`}>{statusMessage}</p> : null}
              </div>
            </div>
          </div>
        </div>

        <DataEntryMessageModal
          isOpen={Boolean(pendingRoundDelete)}
          title="削除確認"
          message={pendingRoundDelete ? `${pendingRoundDelete.roundLabel}を削除しますか？` : ""}
          ariaLabel="試合削除確認"
          onClose={cancelRoundDelete}
          buttons={[
            {
              label: "削除する",
              onClick: confirmRoundDelete,
              className: "c-button -primary -medium dataEntry__completeButton dataEntry__completeButton--delete",
            },
            {
              label: "キャンセル",
              onClick: cancelRoundDelete,
              className: "c-button -primary -medium dataEntry__completeButton",
            },
          ]}
        />

        <DataEntryMessageModal
          isOpen={isDateDeleteConfirmOpen}
          title="削除確認"
          message={selectedDate ? `${selectedDate} の対局データを削除しますか？` : ""}
          ariaLabel="対局日削除確認"
          onClose={closeDateDeleteConfirm}
          buttons={[
            {
              label: "削除する",
              onClick: handleDeleteDate,
              className: "c-button -primary -medium dataEntry__completeButton dataEntry__completeButton--delete",
            },
            {
              label: "キャンセル",
              onClick: closeDateDeleteConfirm,
              className: "c-button -primary -medium dataEntry__completeButton",
            },
          ]}
        />

        <DataEntryMessageModal
          isOpen={Boolean(completedRegistration)}
          title={completedRegistration?.title || "完了"}
          message={completedRegistration?.message}
          ariaLabel={completedRegistration?.title || "完了"}
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
