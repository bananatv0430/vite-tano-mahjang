import { useMemo } from "react";
import { FALLBACK_RULES } from "../utils/gameUtils";

/** 選択中ルール、4人選択、各半荘の持ち点合計をまとめて判定する。 */
export function useEntryFormModel({
  entryRows,
  ruleOptions,
  selectedRuleId,
  selectedPlayerIds,
  firstRoundNumber = 1,
}) {
  const selectedRule = useMemo(
    () => ruleOptions.find((rule) => rule.id === String(selectedRuleId)) ?? ruleOptions[0] ?? FALLBACK_RULES[0],
    [ruleOptions, selectedRuleId]
  );
  const expectedRoundTotal = Number(selectedRule.startPoint ?? 0) * 4;

  const roundValidations = useMemo(
    () => entryRows.map((round, roundIndex) => {
      const total = round.players.reduce((sum, player) => sum + Number(player.score ?? 0), 0);

      return {
        roundId: round.id,
        roundNumber: firstRoundNumber + roundIndex,
        total,
        expectedTotal: expectedRoundTotal,
        isValid: total === expectedRoundTotal,
      };
    }),
    [entryRows, expectedRoundTotal, firstRoundNumber]
  );

  const hasInvalidRoundTotal = roundValidations.some((round) => !round.isValid);
  const normalizedSelectedPlayerIds = useMemo(
    () => selectedPlayerIds.map((playerId) => String(playerId ?? "").trim()).filter(Boolean),
    [selectedPlayerIds]
  );
  const hasAllPlayersSelected = normalizedSelectedPlayerIds.length === 4;
  const hasDuplicateSelectedPlayers = new Set(normalizedSelectedPlayerIds).size !== normalizedSelectedPlayerIds.length;

  return {
    selectedRule,
    roundValidations,
    hasInvalidRoundTotal,
    hasAllPlayersSelected,
    hasDuplicateSelectedPlayers,
  };
}
