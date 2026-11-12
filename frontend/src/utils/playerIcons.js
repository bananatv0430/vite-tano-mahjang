import { createFallbackIcon } from "./createFallbackIcon";
import { getIconSrc } from "./getIconSrc";

/** プレイヤー一覧や入力画面で使うアイコンURLを返す。 */
export function getPlayerIconSrc(iconPath, iconVersion, name) {
  return getIconSrc(iconPath, iconVersion, createFallbackIcon(name));
}

/** トップ・日付別履歴向けのオレンジ色の代替アイコンを作る。 */
export function createRankingFallbackIcon(name) {
  const firstChar = String(name ?? "?").slice(0, 1);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="60" fill="#f4f4f4"/>
      <circle cx="60" cy="45" r="22" fill="#f08300" opacity="0.92"/>
      <path d="M24 104c6-22 20-33 36-33s30 11 36 33" fill="#f08300" opacity="0.86"/>
      <text x="60" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">${firstChar}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** ランキング・履歴用のデザインを保ってアイコンURLを返す。 */
export function getRankingPlayerIconSrc(iconPath, iconVersion, name) {
  return getIconSrc(iconPath, iconVersion, createRankingFallbackIcon(name));
}
