import { useCallback, useEffect } from "react";

/** 対局結果プレビューのページ分割と前後移動を管理する。 */
export function useRoundPagination({
  selectedMatch,
  isMobileView,
  roundPageStart,
  setRoundPageStart,
  setSlideDirection,
}) {
  const roundsPerPage = isMobileView ? 1 : 2;
  const pageCount = selectedMatch ? 1 + Math.ceil(selectedMatch.rounds.length / roundsPerPage) : 1;
  const showTotalPage = roundPageStart === 0;
  const roundSliceStart = showTotalPage ? 0 : (roundPageStart - 1) * roundsPerPage;
  const visibleRounds = selectedMatch
    ? selectedMatch.rounds.slice(roundSliceStart, roundSliceStart + roundsPerPage)
    : [];
  const hasRoundPager = pageCount > 1;

  useEffect(() => {
    setRoundPageStart((current) => Math.min(current, Math.max(pageCount - 1, 0)));
  }, [pageCount, setRoundPageStart]);

  const handleRoundPageChange = useCallback((direction) => {
    setSlideDirection(direction);
    setRoundPageStart((current) => {
      if (!selectedMatch) return current;
      if (direction === "prev") return Math.max(0, current - 1);
      return Math.min(current + 1, pageCount - 1);
    });
  }, [pageCount, selectedMatch, setRoundPageStart, setSlideDirection]);

  return {
    roundsPerPage,
    pageCount,
    showTotalPage,
    visibleRounds,
    hasRoundPager,
    handleRoundPageChange,
  };
}
