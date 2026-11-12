import { useEffect } from "react";

/** 初回表示時にmain要素へ画面表示アニメーション用クラスを付ける。 */
export function useActivateMain(mainRef) {
  useEffect(() => {
    mainRef.current?.classList.add("-active");
  }, [mainRef]);
}
