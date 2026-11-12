import { useCallback, useLayoutEffect, useState } from "react";
import { buildAutoRanks } from "../utils/gameUtils";

/** 登録・編集フォームの参加者、得点、入力フォーカス、半荘並べ替えを扱う。 */
export function useRoundInteractions({
  entryRows,
  entryRowsRef,
  scoreInputRefs,
  pendingFocusRef,
  setSelectedPlayerIds,
  setEntryRows,
  setStatusMessage,
  isMobileView,
  addRound,
  autoRankScores = false,
}) {
  const [draggedRoundId, setDraggedRoundId] = useState(null);
  const [dragOverRoundId, setDragOverRoundId] = useState(null);

  // 対局追加後、描画された最初の点数欄へフォーカスを移す。
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
  }, [entryRows, pendingFocusRef, scoreInputRefs]);

  const updateSelectedPlayer = useCallback((playerIndex, value) => {
    setSelectedPlayerIds((current) => current.map((playerId, index) => (index === playerIndex ? value : playerId)));
    setEntryRows((current) => current.map((round) => ({
      ...round,
      players: round.players.map((player, index) => (index === playerIndex ? { ...player, playerId: value } : player)),
    })));
    setStatusMessage("");
  }, [setEntryRows, setSelectedPlayerIds, setStatusMessage]);

  const updateRoundPlayer = useCallback((roundId, playerIndex, field, value) => {
    setEntryRows((current) => current.map((round) => {
      if (round.id !== roundId) return round;
      const updatedPlayers = round.players.map((player, index) => (
        index === playerIndex ? { ...player, [field]: value } : player
      ));
      return {
        ...round,
        players: autoRankScores && field === "score" ? buildAutoRanks(updatedPlayers) : updatedPlayers,
      };
    }));
    setStatusMessage("");
  }, [autoRankScores, setEntryRows, setStatusMessage]);

  const applyRoundAutoRanks = useCallback((roundId) => {
    setEntryRows((current) => current.map((round) => (
      round.id === roundId ? { ...round, players: buildAutoRanks(round.players) } : round
    )));
  }, [setEntryRows]);

  const registerScoreInputRef = useCallback((roundId, playerIndex, element) => {
    const key = `${roundId}-${playerIndex}`;
    if (element) {
      scoreInputRefs.current.set(key, element);
      return;
    }
    scoreInputRefs.current.delete(key);
  }, [scoreInputRefs]);

  const focusScoreInput = useCallback((roundId, playerIndex) => {
    const targetInput = scoreInputRefs.current.get(`${roundId}-${playerIndex}`);
    if (targetInput) {
      targetInput.focus();
      targetInput.select?.();
      return true;
    }
    pendingFocusRef.current = { roundId, playerIndex };
    return false;
  }, [pendingFocusRef, scoreInputRefs]);

  const stepRoundPlayerValue = useCallback((roundId, playerIndex, field, delta, options = {}) => {
    const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, fallback = 0 } = options;
    setEntryRows((current) => current.map((round) => {
      if (round.id !== roundId) return round;
      const updatedPlayers = round.players.map((player, index) => {
        if (index !== playerIndex) return player;
        const currentValue = Number(player[field] ?? fallback);
        const safeCurrentValue = Number.isFinite(currentValue) ? currentValue : fallback;
        const nextValue = Math.min(max, Math.max(min, safeCurrentValue + delta));
        return { ...player, [field]: String(nextValue) };
      });
      return {
        ...round,
        players: autoRankScores && field === "score" ? buildAutoRanks(updatedPlayers) : updatedPlayers,
      };
    }));
    setStatusMessage("");
  }, [autoRankScores, setEntryRows, setStatusMessage]);

  const handleScoreKeyDown = useCallback((event, roundId, playerIndex) => {
    if (isMobileView || event.key !== "Tab" || event.shiftKey) return;
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
  }, [addRound, entryRowsRef, focusScoreInput, isMobileView]);

  const moveRound = useCallback((sourceRoundId, targetRoundId) => {
    if (!sourceRoundId || !targetRoundId || sourceRoundId === targetRoundId) return;
    setEntryRows((current) => {
      const sourceIndex = current.findIndex((round) => round.id === sourceRoundId);
      const targetIndex = current.findIndex((round) => round.id === targetRoundId);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return current;
      const nextRounds = [...current];
      const [movedRound] = nextRounds.splice(sourceIndex, 1);
      nextRounds.splice(targetIndex, 0, movedRound);
      return nextRounds;
    });
    setStatusMessage("");
  }, [setEntryRows, setStatusMessage]);

  const handleRoundDragStart = useCallback((event, roundId) => {
    if (isMobileView || entryRowsRef.current.length <= 1) return;
    setDraggedRoundId(roundId);
    setDragOverRoundId(roundId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", roundId);
  }, [entryRowsRef, isMobileView]);

  const handleRoundDragOver = useCallback((event, roundId) => {
    if (!draggedRoundId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (draggedRoundId !== roundId && dragOverRoundId !== roundId) setDragOverRoundId(roundId);
  }, [dragOverRoundId, draggedRoundId]);

  const handleRoundDrop = useCallback((event, roundId) => {
    event.preventDefault();
    const sourceRoundId = draggedRoundId || event.dataTransfer.getData("text/plain");
    if (sourceRoundId && sourceRoundId !== roundId) moveRound(sourceRoundId, roundId);
    setDraggedRoundId(null);
    setDragOverRoundId(null);
  }, [draggedRoundId, moveRound]);

  const handleRoundDragEnd = useCallback(() => {
    setDraggedRoundId(null);
    setDragOverRoundId(null);
  }, []);

  return {
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
  };
}
