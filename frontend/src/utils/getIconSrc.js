// アイコン画像のURLを生成する共通関数
// 他のコンポーネントでもimportして利用可能

const API_BASE = "https://tanomahjang-backend.edu-shijimi.workers.dev";

export function getIconSrc(iconPath, iconVersion, fallbackIcon) {
  if (!iconPath) {
    console.log("getIconSrc: fallback", { iconPath, iconVersion, fallbackIcon });
    return fallbackIcon;
  }
  let path = iconPath;
  // 古い/uploads/パスをR2パスに変換
  if (path.startsWith("/uploads/players/")) {
    const fileName = path.split("/").pop();
    path = `/r2/players/${fileName}`;
  }
  let url = `${API_BASE}${path}`;
  if (iconVersion) {
    url += (url.includes('?') ? '&' : '?') + `v=${iconVersion}`;
  }
  console.log("getIconSrc", { iconPath, iconVersion, fallbackIcon, url });
  return url;
}
