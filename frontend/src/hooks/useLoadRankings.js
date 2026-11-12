import { useEffect, useState } from "react";
import { fetchJson } from "../utils/apiFetch";

/** 対局モードを指定してトップ画面のランキングを取得する。 */
export function useLoadRankings(playMode = "all") {
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
        const suffix = playMode === "online" || playMode === "offline" ? `?play_mode=${playMode}` : "";
        const data = await fetchJson(
          `/api/rankings/summary${suffix}`,
          { signal: controller.signal },
          "ランキングデータの取得に失敗しました"
        );
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
  }, [playMode]);

  return { rankings, isLoadingRankings, rankingError };
}
