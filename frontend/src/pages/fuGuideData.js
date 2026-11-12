// Flowchart and display configuration for the fu guide.
// フローチャートの設問・回答先と、符計算ページの表示設定を保持する。

export const FU_TABS = [
  { key: "flowchart", label: "フローチャート" },
  { key: "tileInput", label: "牌入力" },
  { key: "tileRecognition", label: "牌画像認識" },
];



export const FLOW_NODES = {
  start: { type: "question", text: "鳴きが含まれる？", answers: [{ label: "YES", next: "tsumo" }, { label: "NO", next: "chitoitsuCheck" }] },
  chitoitsuCheck: { type: "question", text: "七対子？", answers: [{ label: "YES", next: "resultFixed25" }, { label: "NO", next: "tsumoClosedBranch" }] },
  tsumoClosedBranch: { type: "question", text: "ツモ和了り？", answers: [{ label: "YES(平和)", next: "result20" }, { label: "YES(平和以外)", next: "openWaitType" }, { label: "NO", next: "openWaitType" }] },
  tsumo: { type: "question", text: "ツモ和了り？", answers: [{ label: "YES", next: "pinfuCheck" }, { label: "NO", next: "waitType" }] },
  openWaitType: { type: "question", text: "待ちは両面またはシャンポン待ち？", answers: [{ label: "YES", next: "pairHeadYakuhai" }, { label: "NO", next: "pairHeadYakuhai" }] },
  pairHeadYakuhai: { type: "question", text: "雀頭は役牌？", answers: [{ label: "YES(雀魂)", next: "tripletCount" }, { label: "YES(雀魂以外)", next: "tripletCount" }, { label: "NO", next: "tripletCount" }] },
  tripletCount: { type: "question", text: "刻子は何個？", answers: [{ label: "0個", next: "yaochuTripletCount" }, { label: "1個", next: "yaochuTripletCount" }, { label: "2個", next: "yaochuTripletCount" }, { label: "3個", next: "yaochuTripletCount" }, { label: "4個", next: "yaochuTripletCount" }] },
  yaochuTripletCount: { type: "question", text: "その中でヤオ九は何個？", answers: [] },
  ankoTripletCount: { type: "question", text: "その中で暗刻は何個？", answers: [] },
  kanCount: { type: "question", text: "槓子は何個？", answers: [] },
  yaochuKanCount: { type: "question", text: "その中でヤオ九は何個？", answers: [] },
  ankanCount: { type: "question", text: "その中で暗槓は何個？", answers: [] },
  pinfuCheck: { type: "question", text: "平和形（ピンフ）ですか？", answers: [{ label: "YES", next: "result20" }, { label: "NO", next: "waitType" }] },
  waitType: { type: "question", text: "待ちが単騎・辺張・嵌張のいずれかですか？", answers: [{ label: "YES", next: "result40" }, { label: "NO", next: "result30" }] },
  openMeld: { type: "question", text: "副露した面子に么九牌（1,9,字牌）がありますか？", answers: [{ label: "YES", next: "resultOpen30" }, { label: "NO", next: "resultOpen20" }] },
  resultFixed30: { type: "result", text: "30符" },
  resultFixed25: { type: "result", text: "25符" },
  resultTripletFollowup: { type: "result", text: "次の分岐を実装中" },
  result20: { type: "result", text: "この仮フローでは 20符 です。" },
  result30: { type: "result", text: "この仮フローでは 30符 です。" },
  result40: { type: "result", text: "この仮フローでは 40符 です。" },
  resultOpen20: { type: "result", text: "この仮フローでは 20符（副露）です。" },
  resultOpen30: { type: "result", text: "この仮フローでは 30符（副露）です。" },
};

export const RESULT_MAIN_FONT_SIZE = "5rem";
export const RESULT_SUB_FONT_SIZE = "2rem";

export const RESULT_DISPLAY = {
  result20: {
    fu: "20符",
    yaku: "平和",
  },
  resultFixed25: {
    fu: "25符",
    yaku: "七対子",
  },
};

export const SPECIAL_RESULT_IDS = new Set(["result20", "resultFixed25"]);
export const HAN_LIST = [1, 2, 3, 4];
