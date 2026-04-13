import { useEffect, useState } from "react";
import { FALLBACK_PLAYERS, FALLBACK_RULES, normalizePlayer, normalizeRule } from "../utils/gameUtils";

/**
 * プレイヤー・ルールの取得をまとめるカスタムフック
 */
export function useLoadPlayersAndRules() {
  const [playerOptions, setPlayerOptions] = useState(FALLBACK_PLAYERS);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  const [ruleOptions, setRuleOptions] = useState(FALLBACK_RULES);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [rulesError, setRulesError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

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

    loadPlayers();
    loadRules();
    return () => controller.abort();
  }, []);

  return {
    playerOptions,
    isLoadingPlayers,
    ruleOptions,
    isLoadingRules,
    rulesError,
  };
}
