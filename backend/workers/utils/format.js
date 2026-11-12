/** Worker APIで共有する値の整形とJSONレスポンス生成処理。 */
export const format = {
  /**
   * 日付文字列から日本語の曜日を取得
   */
  weekday(value) {
    const date = new Date(String(value ?? "") + "T00:00:00");
    if (Number.isNaN(date.getTime())) return "";
    return ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  },

  /**
   * 対局モードを正規化
   */
  playMode(value) {
    return String(value ?? "").toLowerCase() === "online" ? "online" : "offline";
  },

  /** 対局日として使うYYYY-MM-DD形式かを確認する。 */
  isDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
  },

  /**
   * 日付（YYYY-MM-DD）へ変換
   * 不正な値は null
   */
  toDate(value) {
    if (!value) return null;
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return null;
    }
  },

  /**
   * 日時（YYYY-MM-DD HH:mm:ss）
   */
  toDateTime(value) {
    if (!value) return null;
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");

      return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
    } catch {
      return null;
    }
  },

  /**
   * 数値化（NaN → 0）
   */
  toNumber(value) {
    if (value === null || value === undefined) return 0;
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  },

  /**
   * 小数を丸める
   */
  round(value, digits = 2) {
    const n = Number(value);
    if (isNaN(n)) return 0;
    return Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits);
  },

  /**
   * 配列 or 値に対して null を除外して返す
   */
  removeNull(v) {
    if (Array.isArray(v)) {
      return v.filter((x) => x !== null && x !== undefined);
    }
    return v === null || v === undefined ? undefined : v;
  },

  /**
   * API レスポンス共通形式
   */
  response(ok, data = null, message = "") {
    return new Response(
      JSON.stringify({
        ok,
        data,
        message,
      }),
      { status: ok ? 200 : 400, headers: { "Content-Type": "application/json" } }
    );
  },

  /**
   * 404 専用レスポンス
   */
  notFound(message = "Not Found") {
    return new Response(
      JSON.stringify({
        ok: false,
        data: null,
        message,
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  },

  /**
   * サーバーエラー（500）
   */
  error(e) {
    return new Response(
      JSON.stringify({
        ok: false,
        data: null,
        message: e?.message ?? "Internal Server Error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  },
};
