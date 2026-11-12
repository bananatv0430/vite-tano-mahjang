
import { useEffect, useState } from "react";
import { fetchJson } from "../utils/apiFetch";

const EMPTY_MATCHES = [];

/** 年度結果APIの年度一覧と試合データを画面用に整える。 */
function normalizeYearResults(data, normalizeMatchData) {
  return {
    availableYears: (data.availableYears ?? []).map((item) => String(item.year)),
    matches: normalizeMatchData(data.dates ?? []),
  };
}

/**
 * 年ごとの対戦履歴データ取得用カスタムフック
 */
export function useLoadResultsByYear(normalizeMatchData) {
  const [selectedYear, setSelectedYear] = useState("");
  const [yearOptions, setYearOptions] = useState([]);
  const [resultsByYear, setResultsByYear] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // 初期ロード
  useEffect(() => {
    const controller = new AbortController();
    const loadInitialResults = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await fetchJson(
          "/api/results",
          { signal: controller.signal },
          "対戦履歴の取得に失敗しました"
        );
        const normalized = normalizeYearResults(data, normalizeMatchData);
        const activeYear = String(data.year ?? normalized.availableYears[0] ?? "");
        setYearOptions(normalized.availableYears);
        if (activeYear) {
          setResultsByYear((current) => ({
            ...current,
            [activeYear]: normalized.matches,
          }));
          setSelectedYear((current) => current || activeYear);
        }
      } catch (error) {
        if (error.name !== "AbortError") setLoadError(error.message || "対戦履歴の取得に失敗しました");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    loadInitialResults();
    return () => controller.abort();
  }, [normalizeMatchData]);

  // 年度切替時ロード
  useEffect(() => {
    if (!selectedYear || resultsByYear[selectedYear]) return;
    const controller = new AbortController();
    const loadYearResults = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await fetchJson(
          `/api/results?year=${selectedYear}`,
          { signal: controller.signal },
          "対戦履歴の取得に失敗しました"
        );
        const normalized = normalizeYearResults(data, normalizeMatchData);
        setYearOptions(normalized.availableYears);
        setResultsByYear((current) => ({
          ...current,
          [selectedYear]: normalized.matches,
        }));
      } catch (error) {
        if (error.name !== "AbortError") setLoadError(error.message || "対戦履歴の取得に失敗しました");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    loadYearResults();
    return () => controller.abort();
  }, [selectedYear, resultsByYear, normalizeMatchData]);

  // 表示用データ
  const displayedMatches = selectedYear && resultsByYear[selectedYear]
    ? resultsByYear[selectedYear]
    : EMPTY_MATCHES;

  return {
    selectedYear,
    setSelectedYear,
    yearOptions,
    resultsByYear,
    displayedMatches,
    isLoading,
    loadError,
  };
}
