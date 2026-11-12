/** 対局登録・更新に必要な入力条件を、画面の表示文言で返す。 */
export function getEntryValidationError({
  selectedDate,
  hasAllPlayersSelected,
  hasDuplicateSelectedPlayers,
  hasInvalidRoundTotal,
  actionLabel,
  requireDate = false,
}) {
  if (requireDate && !selectedDate) return "対局日を選択してください。";
  if (!hasAllPlayersSelected) return "参加プレイヤーを4人選択してください。";
  if (hasDuplicateSelectedPlayers) return "同じプレイヤーは重複して登録できません。";
  if (hasInvalidRoundTotal) return `点数合計が持ち点×4と一致する試合のみ${actionLabel}できます。`;
  return "";
}
