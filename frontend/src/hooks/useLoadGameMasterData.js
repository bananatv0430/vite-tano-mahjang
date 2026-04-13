import { useEffect, useState } from "react";
import { FALLBACK_PLAYERS, FALLBACK_RULES, normalizePlayer, normalizeRule } from "../utils/gameUtils";

/**
 * ゲームマスターデータ（日付・プレイヤー・ルール）をまとめて取得するカスタムフック
 */
export function useLoadGameMasterData() {
  const [availableDates, setAvailableDates] = useState([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);
  const [dateOptionsError, setDateOptionsError] = useState("");

  const [playerOptions, setPlayerOptions] = useState(FALLBACK_PLAYERS);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  const [ruleOptions, setRuleOptions] = useState(FALLBACK_RULES);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [rulesError, setRulesError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadAvailableDates = async () => {
      setIsLoadingDates(true);
      setDateOptionsError("");
      try {
        const response = await fetch("/api/games/dates", { signal: controller.signal });
        if (!response.ok) throw new Error("対局日の取得に失敗しました");
        const data = await response.json();
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

    const loadPlayers = async () => {
      setIsLoadingPlayers(true);
      try {
        const response = await fetch("/api/players", { signal: controller.signal });
        if (!response.ok) throw new Error("プレイヤー情報の取得に失敗しました");
        const data = await response.json();
        const normalizedPlayers = (Array.isArray(data) ? data : []).map(normalizePlayer).filter((player) => player.id);
        setPlayerOptions(normalizedPlayers.length > 0 ? normalizedPlayers : FALLBACK_PLAYERS);
      } catch (error) {
        if (error.name !== "AbortError") setPlayerOptions(FALLBACK_PLAYERS);
      } finally {
        if (!controller.signal.aborted) setIsLoadingPlayers(false);
      }
    };

    const loadRules = async () => {
      setIsLoadingRules(true);
      setRulesError("");
      try {
        const response = await fetch("/api/rules", { signal: controller.signal });
        if (!response.ok) throw new Error("基準ルールの取得に失敗しました");
        const data = await response.json();
        const rules = data.data;
        const normalizedRules = (Array.isArray(rules) ? rules : []).map(normalizeRule).filter((rule) => rule.id);
        if (normalizedRules.length === 0) throw new Error("基準ルールが登録されていません");
        setRuleOptions(normalizedRules);
      } catch (error) {
        if (error.name !== "AbortError") {
          setRulesError(error.message || "基準ルールの取得に失敗しました");
          setRuleOptions(FALLBACK_RULES);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingRules(false);
      }
    };

    loadAvailableDates();
    loadPlayers();
    loadRules();
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
