import { useEffect, useState } from "react";
import { fetchJson } from "../utils/apiFetch";

/** 直近5日分の対局履歴を取得し、画面用データへ整形する。 */
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
        const data = await fetchJson(
          "/api/results/recent?limit=5",
          { signal: controller.signal },
          "直近の対戦履歴の取得に失敗しました"
        );
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
