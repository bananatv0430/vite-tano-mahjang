import { useEffect, useState } from "react";
import { fetchJson } from "../utils/apiFetch";
import { useLoadReferenceData } from "./useLoadReferenceData";

/**
 * ゲームマスターデータ（日付・プレイヤー・ルール）をまとめて取得するカスタムフック
 */
export function useLoadGameMasterData() {
  const [availableDates, setAvailableDates] = useState([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);
  const [dateOptionsError, setDateOptionsError] = useState("");

  const { playerOptions, isLoadingPlayers, ruleOptions, isLoadingRules, rulesError } = useLoadReferenceData();

  useEffect(() => {
    const controller = new AbortController();

    const loadAvailableDates = async () => {
      setIsLoadingDates(true);
      setDateOptionsError("");
      try {
        const data = await fetchJson(
          "/api/games/dates",
          { signal: controller.signal },
          "対局日の取得に失敗しました"
        );
        const normalizedDates = Array.isArray(data?.data)
          ? data.data.map((date) => String(date ?? "").trim()).filter(Boolean)
          : [];
        setAvailableDates(normalizedDates);
      } catch (error) {
        if (error.name !== "AbortError") {
          setAvailableDates([]);
          setDateOptionsError(error.message || "対局日の取得に失敗しました");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingDates(false);
      }
    };

    loadAvailableDates();
    return () => controller.abort();
  }, []);

  return {
    availableDates,
    isLoadingDates,
    dateOptionsError,
    playerOptions,
    isLoadingPlayers,
    ruleOptions,
    isLoadingRules,
    rulesError,
  };
}
