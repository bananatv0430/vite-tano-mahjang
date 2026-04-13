import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLoadPlayersAndRules } from "../hooks/useLoadPlayersAndRules";
import { useNavigate } from "react-router-dom";
import DataEntryMessageModal from "../components/DataEntryMessageModal";
import DataEntryRound from "../components/DataEntryRound";
import ResultsPreviewModal from "../components/ResultsPreviewModal";
import {
  FALLBACK_PLAYERS,
  FALLBACK_RULES,
  buildAutoRanks,
  calculatePreviewPoint,
  createRound,
  formatDisplayDate,
  formatNumber,
  formatRulePoint,
  getJapaneseWeekday,
  normalizePlayer,
  normalizeRule,
} from "../utils/gameUtils";
import { getIconSrc } from "../utils/getIconSrc";
import { createFallbackIcon } from "../utils/createFallbackIcon";

export default function DataRegister() {
  const mainRef = useRef(null);
  const scoreInputRefs = useRef(new Map());
  const pendingFocusRef = useRef(null);
  const entryRowsRef = useRef([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedRuleId, setSelectedRuleId] = useState(FALLBACK_RULES[0].id);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(() => FALLBACK_PLAYERS.slice(0, 4).map((player) => player.id));

  // カスタムフックでプレイヤー・ルール取得
  const {
    playerOptions,
    isLoadingPlayers,
    ruleOptions,
    isLoadingRules,
    rulesError,
  } = useLoadPlayersAndRules();
  const [entryRows, setEntryRows] = useState(() => [createRound(1, FALLBACK_PLAYERS, FALLBACK_RULES[0].startPoint)]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [roundPageStart, setRoundPageStart] = useState(0);
  const [slideDirection, setSlideDirection] = useState("next");
  const [isMobileView, setIsMobileView] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 767 : false));
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedRegistration, setCompletedRegistration] = useState(null);
  const [draggedRoundId, setDraggedRoundId] = useState(null);
  const [dragOverRoundId, setDragOverRoundId] = useState(null);
  const navigate = useNavigate();

  // 初回マウント時にメイン要素へクラス付与
  useEffect(() => {
    const main = mainRef.current;
    if (main) main.classList.add("-active");
  }, []);

  // ウィンドウリサイズ時にモバイル判定を更新
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 767);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 選択中の試合がある場合、Escキーで解除
  useEffect(() => {
    if (!selectedMatch) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedMatch(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMatch]);

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

  const selectedRule = useMemo(
    () => ruleOptions.find((rule) => rule.id === String(selectedRuleId)) ?? ruleOptions[0] ?? FALLBACK_RULES[0],
    [ruleOptions, selectedRuleId]
  );

  const expectedRoundTotal = Number(selectedRule.startPoint ?? 0) * 4;

  const roundValidations = useMemo(
    () => entryRows.map((round, roundIndex) => {
      const total = round.players.reduce((sum, player) => sum + Number(player.score ?? 0), 0);

      return {
        roundId: round.id,
        roundNumber: roundIndex + 1,
        total,
        expectedTotal: expectedRoundTotal,
        isValid: total === expectedRoundTotal,
      };
    }),
    [entryRows, expectedRoundTotal]
  );

  const hasInvalidRoundTotal = roundValidations.some((round) => !round.isValid);
  const normalizedSelectedPlayerIds = selectedPlayerIds.map((playerId) => String(playerId ?? "").trim()).filter(Boolean);
  const hasAllPlayersSelected = normalizedSelectedPlayerIds.length === 4;
  const hasDuplicateSelectedPlayers = new Set(normalizedSelectedPlayerIds).size !== normalizedSelectedPlayerIds.length;
  const isRegisterDisabled = isSubmitting || hasInvalidRoundTotal || !hasAllPlayersSelected || hasDuplicateSelectedPlayers || !!rulesError || isLoadingRules;

  // 共通getIconSrcラッパー
  const getPlayerIconSrc = (iconPath, name) => {
    return getIconSrc(iconPath, createFallbackIcon(name));
  };

  const selectedPlayers = useMemo(
    () => selectedPlayerIds.map((playerId, index) => {
      const player = playerOptions.find((item) => item.id === playerId);
      return player ?? {
        id: `temp-${index}`,
        name: `プレイヤー${index + 1}`,
        avatar: getPlayerIconSrc(undefined, String(index + 1)),
      };
    }),
    [playerOptions, selectedPlayerIds]
  );

  const buildPreviewMatch = useCallback(() => ({
    id: selectedDate,
    date: formatDisplayDate(selectedDate),
    day: getJapaneseWeekday(selectedDate),
    rounds: entryRows.map((round, roundIndex) => ({
      id: round.id,
      roundNumber: roundIndex + 1,
      ruleName: selectedRule.name,
      players: [...round.players]
        .map((player, playerIndex) => {
          const selectedPlayer = selectedPlayers[playerIndex];
          const playerName = selectedPlayer?.name || `プレイヤー${playerIndex + 1}`;
          const rank = Number(player.rank || playerIndex + 1);

          // プレイヤー情報からiconPath/iconVersionを優先的に取得し、なければselectedPlayerから取得
          const iconPath = player.iconPath !== undefined ? player.iconPath : selectedPlayer?.iconPath;
          const avatar = getPlayerIconSrc(iconPath, playerName);
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
  }), [entryRows, selectedDate, selectedPlayers, selectedRule]);

  const roundsPerPage = isMobileView ? 1 : 2;
  const pageCount = selectedMatch ? 1 + Math.ceil(selectedMatch.rounds.length / roundsPerPage) : 1;
  const showTotalPage = roundPageStart === 0;
  const roundSliceStart = showTotalPage ? 0 : (roundPageStart - 1) * roundsPerPage;
  const visibleRounds = selectedMatch ? selectedMatch.rounds.slice(roundSliceStart, roundSliceStart + roundsPerPage) : [];
  const hasRoundPager = pageCount > 1;

  useEffect(() => {
    entryRowsRef.current = entryRows;
  }, [entryRows]);

  useEffect(() => {
    setRoundPageStart((current) => Math.min(current, Math.max(pageCount - 1, 0)));
  }, [pageCount]);

  useLayoutEffect(() => {
    if (!pendingFocusRef.current || typeof window === "undefined") {
      return undefined;
    }

    const { roundId, playerIndex } = pendingFocusRef.current;
    const focusTarget = () => {
      const targetInput = scoreInputRefs.current.get(`${roundId}-${playerIndex}`);

      if (!targetInput) {
        return false;
      }

      targetInput.focus();
      targetInput.select?.();
      pendingFocusRef.current = null;
      return true;
    };

    if (focusTarget()) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      focusTarget();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [entryRows]);

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

  const updateSelectedPlayer = useCallback((playerIndex, value) => {
    setSelectedPlayerIds((current) => current.map((playerId, index) => (index === playerIndex ? value : playerId)));
    setEntryRows((current) => current.map((round) => ({
      ...round,
      players: round.players.map((player, index) => (index === playerIndex ? { ...player, playerId: value } : player)),
    })));
    setStatusMessage("");
  }, []);

  const updateRoundPlayer = useCallback((roundId, playerIndex, field, value) => {
    setEntryRows((current) => current.map((round) => {
      if (round.id !== roundId) {
        return round;
      }

      const updatedPlayers = round.players.map((player, index) => (
        index === playerIndex ? { ...player, [field]: value } : player
      ));

      return {
        ...round,
        players: field === "score" ? buildAutoRanks(updatedPlayers) : updatedPlayers,
      };
    }));
    setStatusMessage("");
  }, []);

  const registerScoreInputRef = useCallback((roundId, playerIndex, element) => {
    const key = `${roundId}-${playerIndex}`;

    if (element) {
      scoreInputRefs.current.set(key, element);
      return;
    }

    scoreInputRefs.current.delete(key);
  }, []);

  const focusScoreInput = useCallback((roundId, playerIndex) => {
    const targetInput = scoreInputRefs.current.get(`${roundId}-${playerIndex}`);

    if (targetInput) {
      targetInput.focus();
      targetInput.select?.();
      return true;
    }

    pendingFocusRef.current = { roundId, playerIndex };
    return false;
  }, []);

  const stepRoundPlayerValue = useCallback((roundId, playerIndex, field, delta, options = {}) => {
    const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, fallback = 0 } = options;

    setEntryRows((current) => current.map((round) => {
      if (round.id !== roundId) {
        return round;
      }

      const updatedPlayers = round.players.map((player, index) => {
        if (index !== playerIndex) {
          return player;
        }

        const currentValue = Number(player[field] ?? fallback);
        const safeCurrentValue = Number.isFinite(currentValue) ? currentValue : fallback;
        const nextValue = Math.min(max, Math.max(min, safeCurrentValue + delta));

        return {
          ...player,
          [field]: String(nextValue),
        };
      });

      return {
        ...round,
        players: field === "score" ? buildAutoRanks(updatedPlayers) : updatedPlayers,
      };
    }));

    setStatusMessage("");
  }, []);

  const addRound = useCallback((options = {}) => {
    const { focusFirstScore = false } = options;
    const nextRound = createRound(entryRows.length + 1, playerOptions, selectedRule.startPoint);
    const roundToAppend = {
      ...nextRound,
      players: nextRound.players.map((player, index) => ({
        ...player,
        playerId: selectedPlayerIds[index] ?? player.playerId,
      })),
    };

    if (focusFirstScore) {
      pendingFocusRef.current = { roundId: roundToAppend.id, playerIndex: 0 };
    }

    setEntryRows((current) => [...current, roundToAppend]);
    setStatusMessage("");
  }, [entryRows.length, playerOptions, selectedPlayerIds, selectedRule.startPoint]);

  const handleScoreKeyDown = useCallback((event, roundId, playerIndex) => {
    if (isMobileView || event.key !== "Tab" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (playerIndex < 3) {
      focusScoreInput(roundId, playerIndex + 1);
      return;
    }

    const rows = entryRowsRef.current;
    const currentRoundIndex = rows.findIndex((round) => round.id === roundId);
    const nextRound = rows[currentRoundIndex + 1];

    if (nextRound) {
      focusScoreInput(nextRound.id, 0);
      return;
    }

    addRound({ focusFirstScore: true });
  }, [addRound, focusScoreInput, isMobileView]);

  const removeRound = useCallback((roundId) => {
    setEntryRows((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((round) => round.id !== roundId);
    });
    setStatusMessage("");
  }, []);

  const moveRound = useCallback((sourceRoundId, targetRoundId) => {
    if (!sourceRoundId || !targetRoundId || sourceRoundId === targetRoundId) {
      return;
    }

    setEntryRows((current) => {
      const sourceIndex = current.findIndex((round) => round.id === sourceRoundId);
      const targetIndex = current.findIndex((round) => round.id === targetRoundId);

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return current;
      }

      const nextRounds = [...current];
      const [movedRound] = nextRounds.splice(sourceIndex, 1);
      nextRounds.splice(targetIndex, 0, movedRound);
      return nextRounds;
    });

    setStatusMessage("");
  }, []);

  const handleRoundDragStart = useCallback((event, roundId) => {
    if (isMobileView || entryRowsRef.current.length <= 1) {
      return;
    }

    setDraggedRoundId(roundId);
    setDragOverRoundId(roundId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", roundId);
  }, [isMobileView]);

  const handleRoundDragOver = useCallback((event, roundId) => {
    if (!draggedRoundId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (draggedRoundId !== roundId && dragOverRoundId !== roundId) {
      setDragOverRoundId(roundId);
    }
  }, [dragOverRoundId, draggedRoundId]);

  const handleRoundDrop = useCallback((event, roundId) => {
    event.preventDefault();

    const sourceRoundId = draggedRoundId || event.dataTransfer.getData("text/plain");
    if (sourceRoundId && sourceRoundId !== roundId) {
      moveRound(sourceRoundId, roundId);
    }

    setDraggedRoundId(null);
    setDragOverRoundId(null);
  }, [draggedRoundId, moveRound]);

  const handleRoundDragEnd = useCallback(() => {
    setDraggedRoundId(null);
    setDragOverRoundId(null);
  }, []);

  const openPreviewMatch = useCallback(() => {
    console.log('[openPreviewMatch] called');
    setRoundPageStart(0);
    setSlideDirection("next");
    const preview = buildPreviewMatch();
    console.log('[openPreviewMatch] preview', preview);
    setSelectedMatch(preview);
  }, [buildPreviewMatch]);

  const resetEntryForm = useCallback(() => {
    setEntryRows([createRound(1, playerOptions, selectedRule.startPoint)]);
    setSelectedMatch(null);
    setRoundPageStart(0);
    setSlideDirection("next");
  }, [playerOptions, selectedRule.startPoint]);

  const closeCompletedRegistration = useCallback(() => {
    setCompletedRegistration(null);
  }, []);

  const moveToResultsPage = useCallback(() => {
    setCompletedRegistration(null);
    navigate("/results/date");
  }, [navigate]);

  const handleRegister = useCallback(async () => {
    if (!hasAllPlayersSelected) {
      setStatusTone("error");
      setStatusMessage("参加プレイヤーを4人選択してください。");
      return;
    }

    if (hasDuplicateSelectedPlayers) {
      setStatusTone("error");
      setStatusMessage("同じプレイヤーは重複して登録できません。");
      return;
    }

    if (hasInvalidRoundTotal) {
      setStatusTone("error");
      setStatusMessage("点数合計が持ち点×4と一致する試合のみ登録できます。");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const payload = {
        date: selectedDate,
        ruleId: Number(selectedRule.id),
        rounds: entryRows.map((round) => ({
          players: round.players.map((player, idx) => {
            const score = Number(player.score ?? 0);
            const rank = Number(player.rank ?? 0);
            // final_pointを計算
            const point = calculatePreviewPoint(score, rank, selectedRule);
            return {
              playerId: Number(player.playerId),
              score,
              rank,
              point,
            };
          }),
        })),
      };

      const response = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "登録に失敗しました。");
      }

      resetEntryForm();
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
  }, [entryRows, hasAllPlayersSelected, hasDuplicateSelectedPlayers, hasInvalidRoundTotal, resetEntryForm, selectedDate, selectedRule]);

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

        .dataEntry__inner {
          width: min(920px, calc(100% - 32px));
          margin: 0 auto 0;
        }

        .dataEntry__panel {
          background: transparent;
          border-radius: 16px;
          box-shadow: none;
          padding: 24px;
        }

        .dataEntry__lead {
          margin: 0 0 18px;
          color: #666;
          font-size: 1.3rem;
          line-height: 1.7;
        }

        .dataEntry__controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .dataEntry__field {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dataEntry__field label {
          flex: 0 0 72px;
          margin-bottom: 0;
          color: #222;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .dataEntry__input,
        .dataEntry__select,
        .dataEntry__smallInput,
        .dataEntry__smallSelect {
          width: 100%;
          border: 1px solid #d9d9d9;
          border-radius: 10px;
          background: #fff;
          color: #222;
        }

        .dataEntry__input:focus,
        .dataEntry__select:focus,
        .dataEntry__smallInput:focus,
        .dataEntry__smallSelect:focus,
        .dataEntry__mobileRollSelect:focus + .dataEntry__mobileRollButton,
        .dataEntry__mobileRollWrap:focus-within .dataEntry__mobileRollButton {
          outline: none;
          border-color: #f08300;
          box-shadow: 0 0 0 3px rgba(240, 131, 0, 0.18);
        }

        .dataEntry__input,
        .dataEntry__select {
          height: 46px;
          padding: 0 14px;
          font-size: 1.4rem;
        }

        .dataEntry__summary {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .dataEntry__chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border-radius: 999px;
          background: #f5f6f7;
          font-size: 1.2rem;
          font-weight: 700;
          color: #222;
        }

        .dataEntry__chip strong {
          color: #f08300;
        }

        .dataEntry__subTitle {
          margin: 18px 0 12px;
          color: #f08300;
          font-size: 1.4rem;
          font-weight: 700;
        }

        .dataEntry__members {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .dataEntry__memberField {
          width: 100%;
        }

        .dataEntry__playerName {
          margin-bottom: 10px;
          color: #f08300;
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.4;
          text-align: center;
          word-break: break-word;
        }

        .dataEntry__roundList {
          margin-top: 20px;
          display: grid;
          gap: 16px;
        }

        .dataEntry__round {
          border: 1px solid #e7e7e7;
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease, transform 0.18s ease;
        }

        .dataEntry__round.is-dragging {
          opacity: 0.58;
          transform: scale(0.995);
        }

        .dataEntry__round.is-dropTarget {
          border-color: #f08300;
          box-shadow: 0 0 0 3px rgba(240, 131, 0, 0.18);
        }

        .dataEntry__roundHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #f08300;
          color: #fff;
        }

        .dataEntry__roundHeader--draggable {
          cursor: grab;
          user-select: none;
        }

        .dataEntry__roundHeader--draggable:active {
          cursor: grabbing;
        }

        .dataEntry__roundHeaderActions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          line-height: 0;
          margin-left: auto;
        }

        .dataEntry__warningMark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          flex: 0 0 auto;
          overflow: visible;
        }

        .dataEntry__warningMark img {
          display: block;
          width: 30px;
          height: 30px;
          object-fit: contain;
          transform: scale(1.45);
          transform-origin: center;
        }

        .dataEntry__deleteIconButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .dataEntry__deleteIconButton:hover {
          opacity: 0.88;
          transform: scale(1.04);
        }

        .dataEntry__deleteIconButton:disabled {
          opacity: 0.45;
          cursor: default;
          transform: none;
        }

        .dataEntry__deleteCircle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          position: relative;
          transform: rotate(45deg);
          border: 3px solid #f08300;
          border-radius: 50%;
          background: #fff;
          box-sizing: border-box;
        }

        .dataEntry__deleteCircle::before,
        .dataEntry__deleteCircle::after {
          content: "";
          position: absolute;
          width: 58%;
          height: 3px;
          border-radius: 999px;
          background: #f08300;
        }

        .dataEntry__deleteCircle::after {
          transform: rotate(90deg);
        }

        .dataEntry__roundTitle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .dataEntry__dragHandle {
          display: grid;
          grid-template-columns: repeat(2, 4px);
          gap: 3px 4px;
          opacity: 0.9;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        .dataEntry__roundHeader--draggable:hover .dataEntry__dragHandle {
          opacity: 1;
          transform: scale(1.05);
        }

        .dataEntry__dragHandle span {
          display: block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
        }

        .dataEntry__roundGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .dataEntry__slot {
          padding: 16px 14px 14px;
          border-right: 1px solid #ededed;
        }

        .dataEntry__slotRow + .dataEntry__slotRow {
          margin-top: 10px;
        }

        .dataEntry__slotRow {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dataEntry__slotLabel {
          flex: 0 0 42px;
          margin-bottom: 0;
          color: #555;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .dataEntry__stepper {
          display: flex;
          align-items: stretch;
          gap: 6px;
          flex: 1 1 auto;
          width: 100%;
        }

        .dataEntry__smallInput,
        .dataEntry__smallSelect {
          height: 40px;
          padding: 0 10px;
          font-size: 1.3rem;
        }

        .dataEntry__stepper .dataEntry__smallInput {
          flex: 1 1 auto;
        }

        .dataEntry__stepButtons {
          display: none;
        }

        .dataEntry__mobileRollWrap {
          display: none;
        }

        .dataEntry__mobileRankButtons {
          display: none;
        }

        .dataEntry__mobileRollButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 40px;
          padding: 0;
          border: 1px solid #d9d9d9;
          border-radius: 10px;
          background: #f5f6f7;
          color: #f08300;
          font-size: 1.1rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .dataEntry__mobileRollSelect {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .dataEntry__stepButton {
          width: 24px;
          height: 19px;
          padding: 0;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          background: #f5f6f7;
          color: #f08300;
          font-size: 1rem;
          font-weight: 700;
          line-height: 1;
          cursor: pointer;
          touch-action: manipulation;
          user-select: none;
        }

        .dataEntry__stepButton:hover {
          background: #fff3e0;
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
          background: transparent;
          color: #fff;
          font-size: 1.35rem;
          font-weight: 700;
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
          .dataEntry__inner {
            width: min(100%, calc(100% - 12px));
            margin-bottom: 0;
          }

          .dataEntry__panel {
            padding: 12px 10px;
          }

          .dataEntry__lead {
            margin-bottom: 12px;
            font-size: 1.15rem;
            line-height: 1.55;
          }

          .dataEntry__controls {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .dataEntry__field {
            flex-direction: row;
            align-items: center;
            gap: 8px;
          }

          .dataEntry__field label {
            flex: 0 0 60px;
            font-size: 1.15rem;
          }

          .dataEntry__summary {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
            margin-top: 10px;
          }

          .dataEntry__chip {
            min-width: 0;
            justify-content: center;
            padding: 8px 6px;
            gap: 4px;
            font-size: 1rem;
            text-align: center;
            line-height: 1.3;
          }

          .dataEntry__chip:nth-child(4) {
            grid-column: 1 / -1;
          }

          .dataEntry__subTitle {
            margin: 12px 0 8px;
            font-size: 1.25rem;
          }

          .dataEntry__members {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .dataEntry__roundList {
            margin-top: 12px;
            gap: 10px;
          }

          .dataEntry__roundHeader {
            flex-direction: row;
            align-items: center;
            padding: 10px 12px;
          }

          .dataEntry__roundTitle {
            font-size: 1.35rem;
          }

          .dataEntry__roundGrid {
            grid-template-columns: 1fr;
          }

          .dataEntry__slot {
            padding: 10px 10px 8px;
            border-right: none;
            border-bottom: 1px solid #ededed;
          }

          .dataEntry__playerName {
            margin-bottom: 6px;
            font-size: 1.15rem;
            line-height: 1.3;
          }

          .dataEntry__slotRow + .dataEntry__slotRow {
            margin-top: 8px;
          }

          .dataEntry__slotRow {
            display: flex;
            align-items: center;
          }

          .dataEntry__mobileRollWrap {
            position: relative;
            display: block;
            flex: 0 0 42px;
            width: 42px;
          }

          .dataEntry__mobileRankButtons {
            display: flex;
            flex-direction: row;
            gap: 4px;
            flex: 0 0 88px;
            width: 88px;
          }

          .dataEntry__mobileRankButtons .dataEntry__stepButton {
            width: 42px;
            height: 40px;
            border-radius: 10px;
            background: #f5f6f7;
            color: #f08300;
            border: 1px solid #d9d9d9;
            font-size: 1.1rem;
            font-weight: 700;
          }

          .dataEntry__slot:nth-child(-n + 2) {
            border-bottom: 1px solid #ededed;
          }

          .dataEntry__addWrap {
            margin-top: 12px;
          }

          .dataEntry__actions {
            margin-top: 16px;
            gap: 8px;
          }

          .dataEntry__notice,
          .dataEntry__status {
            margin-top: 10px;
          }

          .dataEntry__completeActions {
            flex-direction: column;
          }

          .dataEntry__completeButton {
            width: 100%;
          }

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
      `}</style>

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
            </div>

            {rulesError ? (
              <p style={{ marginTop: "12px", color: "#c62828", fontSize: "1.2rem", fontWeight: 700 }}>
                {rulesError}
              </p>
            ) : null}

            <div className="dataEntry__summary">
              <div className="dataEntry__chip">
                <span>ウマ</span>
                <strong>{selectedRule.umaLabel}</strong>
              </div>
              <div className="dataEntry__chip">
                <span>返し点</span>
                <strong>{formatNumber(selectedRule.returnPoint)}</strong>
              </div>
              <div className="dataEntry__chip">
                <span>持ち点</span>
                <strong>{formatNumber(selectedRule.startPoint)}</strong>
              </div>
              <div className="dataEntry__chip">
                <span>順位点</span>
                <strong>{selectedRule.rankPoints.map((point) => formatRulePoint(point)).join(" / ")}</strong>
              </div>
            </div>

            <p className="dataEntry__subTitle">参加プレイヤー</p>
            <div className="dataEntry__members">
              {selectedPlayerIds.map((playerId, playerIndex) => (
                <div key={`day-player-${playerIndex}`} className="dataEntry__memberField">
                  <select
                    id={`data-entry-player-${playerIndex}`}
                    className="dataEntry__select"
                    value={playerId}
                    aria-label={`参加プレイヤー${playerIndex + 1}`}
                    onChange={(event) => updateSelectedPlayer(playerIndex, event.target.value)}
                  >
                    <option value="">選択してください</option>
                    {playerOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="dataEntry__roundList">
              {entryRows.map((round, roundIndex) => (
                <DataEntryRound
                  key={round.id}
                  round={round}
                  roundIndex={roundIndex}
                  isRoundValid={roundValidations[roundIndex]?.isValid ?? true}
                  selectedPlayers={selectedPlayers}
                  isMobileView={isMobileView}
                  isDeleteDisabled={entryRows.length === 1}
                  isDragEnabled={!isMobileView && entryRows.length > 1}
                  isDragging={draggedRoundId === round.id}
                  isDropTarget={dragOverRoundId === round.id && draggedRoundId !== round.id}
                  onRemoveRound={removeRound}
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
              ))}
            </div>

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
