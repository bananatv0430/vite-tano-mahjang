// APIベースURLを環境変数から取得
const API_BASE = import.meta.env.VITE_API_BASE || "https://tanomahjang-backend.edu-shijimi.workers.dev";

/** APIの相対パスにベースURLを付けてfetchする。絶対URLはそのまま使う。 */
export function apiFetch(path, options) {
  // pathが絶対URLならそのままfetch
  if (/^https?:\/\//.test(path)) return fetch(path, options);
  // 先頭スラッシュを除去して結合
  const url = `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
  return fetch(url, options);
}

/** HTTPエラーを画面指定の文言で扱い、成功時にJSON本文を返す。 */
export async function fetchJson(path, options, errorMessage) {
  const response = await apiFetch(path, options);
  if (!response.ok) throw new Error(errorMessage);
  return response.json();
}

/** JSON本文が空または不正な場合、呼び出し側が扱える空オブジェクトを返す。 */
export function readJsonOrEmpty(response) {
  return response.json().catch(() => ({}));
}

/** JSONを送信し、応答本文のエラーまたは画面指定の既定文言を例外にする。 */
export async function requestJson(path, options, errorMessage) {
  const response = await apiFetch(path, options);
  const data = await readJsonOrEmpty(response);
  if (!response.ok) throw new Error(data.error || errorMessage);
  return data;
}
