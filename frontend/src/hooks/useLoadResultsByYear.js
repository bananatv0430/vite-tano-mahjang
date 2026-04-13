import { useEffect, useState } from "react";

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
        const response = await fetch("/api/results", { signal: controller.signal });
        if (!response.ok) throw new Error("対戦履歴の取得に失敗しました");
        const data = await response.json();
        const years = (data.availableYears ?? []).map((item) => String(item.year));
        const activeYear = String(data.year ?? years[0] ?? "");
        setYearOptions(years);
        if (activeYear) {
          setResultsByYear((current) => ({
            ...current,
            [activeYear]: normalizeMatchData(data.dates ?? []),
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
        const response = await fetch(`/api/results?year=${selectedYear}`, { signal: controller.signal });
        if (!response.ok) throw new Error("対戦履歴の取得に失敗しました");
        const data = await response.json();
        setYearOptions((data.availableYears ?? []).map((item) => String(item.year)));
        setResultsByYear((current) => ({
          ...current,
          [selectedYear]: normalizeMatchData(data.dates ?? []),
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
  const displayedMatches = selectedYear && resultsByYear[selectedYear] ? resultsByYear[selectedYear] : [];

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
