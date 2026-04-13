import { useEffect, useState } from "react";

/**
 * ランキングデータ取得用カスタムフック
 */
export function useLoadRankings() {
  const [rankings, setRankings] = useState({
    personalScore: [],
    highScore: [],
    avoidFourthRate: [],
    topCount: [],
  });
  const [isLoadingRankings, setIsLoadingRankings] = useState(true);
  const [rankingError, setRankingError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadRankings = async () => {
      setIsLoadingRankings(true);
      setRankingError("");
      try {
        const response = await fetch("/api/rankings/summary", { signal: controller.signal });
        if (!response.ok) throw new Error("ランキングデータの取得に失敗しました");
        const data = await response.json();
        setRankings({
          personalScore: data.data.personalScore ?? [],
          highScore: data.data.highScore ?? [],
          avoidFourthRate: data.data.avoidFourthRate ?? [],
          topCount: data.data.topCount ?? [],
        });
      } catch (error) {
        if (error.name !== "AbortError") setRankingError(error.message || "ランキングデータの取得に失敗しました");
      } finally {
        if (!controller.signal.aborted) setIsLoadingRankings(false);
      }
    };
    loadRankings();
    return () => controller.abort();
  }, []);

  return { rankings, isLoadingRankings, rankingError };
}

/**
 * 直近対戦履歴データ取得用カスタムフック
 */
export function useLoadRecentMatches(normalizeRecentMatches) {
  const [recentMatches, setRecentMatches] = useState([]);
  const [isLoadingRecentMatches, setIsLoadingRecentMatches] = useState(true);
  const [recentMatchesError, setRecentMatchesError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadRecentMatches = async () => {
      setIsLoadingRecentMatches(true);
      setRecentMatchesError("");
      try {
        const response = await fetch("/api/results/recent?limit=5", { signal: controller.signal });
        if (!response.ok) throw new Error("直近の対戦履歴の取得に失敗しました");
        const data = await response.json();
        setRecentMatches(normalizeRecentMatches(data.data ?? []));
      } catch (error) {
        if (error.name !== "AbortError") setRecentMatchesError(error.message || "直近の対戦履歴の取得に失敗しました");
      } finally {
        if (!controller.signal.aborted) setIsLoadingRecentMatches(false);
      }
    };
    loadRecentMatches();
    return () => controller.abort();
  }, [normalizeRecentMatches]);

  return { recentMatches, isLoadingRecentMatches, recentMatchesError };
}
