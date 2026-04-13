// アイコン画像のURLを生成する共通関数
// 他のコンポーネントでもimportして利用可能

const API_BASE = "http://127.0.0.1:8787";

export function getIconSrc(iconPath, fallbackIcon) {
  if (!iconPath) return fallbackIcon;
  let path = iconPath;
  // 古い/uploads/パスをR2パスに変換
  if (path.startsWith("/uploads/players/")) {
    const fileName = path.split("/").pop();
    path = `/r2/players/${fileName}`;
  }
  return `${API_BASE}${path}`;
}
