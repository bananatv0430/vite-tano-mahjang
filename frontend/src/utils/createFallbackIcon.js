// fallbackアイコン生成
export const createFallbackIcon = (name) => {
  const firstChar = String(name ?? "?").slice(0, 1);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="58" fill="#ffffff" stroke="#b5b5b5" stroke-width="2" />
      <text x="60" y="66" text-anchor="middle" font-size="12" fill="#888">NO IMAGE</text>
      <text x="60" y="100" text-anchor="middle" font-size="32" fill="#bbb">${firstChar}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
