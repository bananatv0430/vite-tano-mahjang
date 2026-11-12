import { useEffect } from "react";
import { useMediaQuery } from "./useMediaQuery";

/** プレビュー利用画面のモバイル判定と、Escキーによる閉じる操作を管理する。 */
export function usePreviewViewport(selectedMatch, setSelectedMatch) {
  const isMobileView = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    if (!selectedMatch) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedMatch(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMatch, setSelectedMatch]);

  return isMobileView;
}
