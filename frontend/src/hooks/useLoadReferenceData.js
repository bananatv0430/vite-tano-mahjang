import { useEffect, useState } from "react";
import { fetchJson } from "../utils/apiFetch";
import { FALLBACK_PLAYERS, FALLBACK_RULES, normalizePlayer, normalizeRule } from "../utils/gameUtils";

/** APIの配列形式と { data: 配列 } 形式から一覧を取り出す。 */
function getList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

/** プレイヤーとルールをAPIから取得し、画面用の形に整える。 */
export function useLoadReferenceData() {
  const [playerOptions, setPlayerOptions] = useState(FALLBACK_PLAYERS);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [ruleOptions, setRuleOptions] = useState(FALLBACK_RULES);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [rulesError, setRulesError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlayers() {
      try {
        const players = getList(await fetchJson(
          "/api/players",
          { signal: controller.signal },
          "プレイヤー情報の取得に失敗しました"
        ))
          .map(normalizePlayer)
          .filter((player) => player.id);
        setPlayerOptions(players.length ? players : FALLBACK_PLAYERS);
      } catch (error) {
        if (error.name !== "AbortError") setPlayerOptions(FALLBACK_PLAYERS);
      } finally {
        if (!controller.signal.aborted) setIsLoadingPlayers(false);
      }
    }

    async function loadRules() {
      setRulesError("");
      try {
        const rules = getList(await fetchJson(
          "/api/rules",
          { signal: controller.signal },
          "基準ルールの取得に失敗しました"
        ))
          .map(normalizeRule)
          .filter((rule) => rule.id);
        if (!rules.length) throw new Error("基準ルールが登録されていません");
        setRuleOptions(rules);
      } catch (error) {
        if (error.name !== "AbortError") {
          setRulesError(error.message || "基準ルールの取得に失敗しました");
          setRuleOptions(FALLBACK_RULES);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingRules(false);
      }
    }

    loadPlayers();
    loadRules();
    return () => controller.abort();
  }, []);

  return { playerOptions, isLoadingPlayers, ruleOptions, isLoadingRules, rulesError };
}
