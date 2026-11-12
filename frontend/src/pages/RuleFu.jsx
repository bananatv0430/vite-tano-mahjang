import { useRef, useState } from "react";
import { useActivateMain } from "../hooks/useActivateMain";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { getDynamicAnswersByNodeId, getFlowMetrics, resolveAutoZeroPath } from "./fuFlowLogic.js";
import {
  calculateHanFuScoreText,
  calculateTileInputAccurateFu,
  calculateTileInputHan,
  calculateTileInputYaku,
  isPairGroup,
  parseTileDraft,
  placeHeadGroupAtLeft,
} from "./fuCalculation.js";
import {
  FU_TABS,
  FLOW_NODES,
  RESULT_MAIN_FONT_SIZE,
  RESULT_SUB_FONT_SIZE,
  RESULT_DISPLAY,
  SPECIAL_RESULT_IDS,
  HAN_LIST,
} from "./fuGuideData.js";

const getTileImageSrc = (tileCode) => `/assets/media/img/cards/${tileCode}.png`;

// 入力牌と副露牌の見た目に使う固定スタイル。
const tilePlateStyle = {
  width: 28,
  height: 36,
  objectFit: "contain",
  display: "block",
};

const tileGroupStyle = {
  display: "flex",
  alignItems: "center",
  gap: 0,
  marginRight: 4,
};

const meldFirstTileStyle = {
  width: 36,
  height: 28,
  objectFit: "contain",
  display: "block",
};

export default function RuleFu() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const mainRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState(FU_TABS[0].key);
  const [flowHistory, setFlowHistory] = useState(["start"]);
  const [flowAnswered, setFlowAnswered] = useState([]);

  // 牌入力用の state
  const [handTiles, setHandTiles] = useState([]);
  const [meldTiles, setMeldTiles] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [dragOverZone, setDragOverZone] = useState(null);
  const [tileWinType, setTileWinType] = useState("ron");
  const [tileWaitType, setTileWaitType] = useState("ryanmen");
  const [tileSeatWind, setTileSeatWind] = useState("east");
  const [tileRoundWind, setTileRoundWind] = useState("east");

  const draftedResult = parseTileDraft(inputValue);
  const draftedTiles = draftedResult?.tiles ?? [];
  const draftedKind = draftedResult?.kind ?? null;
  const hasDraftedTiles = draftedTiles.length > 0;
  const hasHeadDraftedTiles = draftedKind === "pair";
  const hasHandOrMeldDraftedTiles = hasDraftedTiles && draftedKind !== "pair";

  const allPlacedGroups = [...handTiles, ...meldTiles];
  const pairGroupCount = allPlacedGroups.filter(isPairGroup).length;
  const meldGroupCount = allPlacedGroups.filter((group) => !isPairGroup(group)).length;
  const isTileInputStructureComplete = pairGroupCount === 1 && meldGroupCount === 4;
  const canCommitHeadGroup = hasHeadDraftedTiles && meldGroupCount <= 4;
  const canCommitMeldGroup = hasHandOrMeldDraftedTiles && meldGroupCount < 4 && !isTileInputStructureComplete;
  const tileInputAccurateFu = calculateTileInputAccurateFu({ handTiles, meldTiles, isTileInputStructureComplete, tileWinType, tileWaitType, tileSeatWind, tileRoundWind });
  const tileInputYakuList = calculateTileInputYaku({ handTiles, meldTiles, isTileInputStructureComplete, tileWinType, tileWaitType, tileSeatWind, tileRoundWind });
  const tileInputHan = calculateTileInputHan(tileInputYakuList);
  const tileInputYakuText = tileInputYakuList
    .map((yaku) => `${yaku.name}(${yaku.han}翻)`)
    .join(" / ");
  const winTypeButtons = [
    { label: "ロン", value: "ron" },
    { label: "ツモ", value: "tsumo" },
  ];
  const waitTypeButtons = [
    { label: "両面", value: "ryanmen" },
    { label: "辺張", value: "penchan" },
    { label: "単騎", value: "tanki" },
    { label: "双碰", value: "shanpon" },
    { label: "嵌張", value: "kanchan" },
  ];
  const windButtons = [
    { label: "東", value: "east" },
    { label: "南", value: "south" },
    { label: "西", value: "west" },
    { label: "北", value: "north" },
  ];

  const currentFlowId = flowHistory[flowHistory.length - 1];
  const currentFlowNode = FLOW_NODES[currentFlowId];

  const currentQuestionAnswers =
    currentFlowNode?.type === "question"
      ? getDynamicAnswersByNodeId(currentFlowId, flowAnswered) ?? currentFlowNode.answers
      : [];
  const displayAnswered = flowAnswered.filter((item) => !item.isAuto);

  const getLatestAnswerByNodeId = (nodeId) =>
    [...flowAnswered].reverse().find((item) => item.nodeId === nodeId)?.answer ?? null;

  const isResultNode = currentFlowNode?.type === "result";
  const shouldShowBreakdown = isResultNode && !SPECIAL_RESULT_IDS.has(currentFlowId);
  const flowMetrics = getFlowMetrics(flowAnswered);

  const nakiAnswer = getLatestAnswerByNodeId("start");
  const menzen = nakiAnswer === "NO";

  const tsumoAnswer = getLatestAnswerByNodeId("tsumoClosedBranch") ?? getLatestAnswerByNodeId("tsumo");
  const isTsumo = typeof tsumoAnswer === "string" && tsumoAnswer.startsWith("YES");

  const waitAnswer = getLatestAnswerByNodeId("openWaitType") ?? getLatestAnswerByNodeId("waitType");
  const hasWaitFu = waitAnswer === "NO";

  const pairHeadAnswer = getLatestAnswerByNodeId("pairHeadYakuhai");
  const pairHeadFu =
    pairHeadAnswer === "YES(雀魂)"
      ? "+4符"
      : pairHeadAnswer === "YES(雀魂以外)"
        ? "+2符"
        : null;

  const menzenOrTsumoRow = menzen && !isTsumo
    ? { label: "面前ロン", value: "+10符" }
    : isTsumo
      ? { label: "ツモ", value: "+2符" }
      : null;

  const detailedFuRows = [
    {
      label: "中張牌の明刻",
      count: Math.max(0, flowMetrics.tripletTotal - flowMetrics.yaochuTriplet),
      perFu: 2,
    },
    {
      label: "中張牌の暗刻",
      count: 0,
      perFu: 4,
    },
    {
      label: "中張牌の明槓",
      count: Math.max(0, flowMetrics.kanTotal - flowMetrics.yaochuKan),
      perFu: 8,
    },
    {
      label: "中張牌の暗槓",
      count: 0,
      perFu: 16,
    },
    {
      label: "么九牌の明刻",
      count: Math.max(0, flowMetrics.yaochuTriplet - flowMetrics.ankoTriplet),
      perFu: 4,
    },
    {
      label: "么九牌の暗刻",
      count: Math.max(0, flowMetrics.ankoTriplet),
      perFu: 8,
    },
    {
      label: "么九牌の明槓",
      count: Math.max(0, flowMetrics.yaochuKan - flowMetrics.ankan),
      perFu: 16,
    },
    {
      label: "么九牌の暗槓",
      count: Math.max(0, flowMetrics.ankan),
      perFu: 32,
    },
  ].filter((row) => row.count > 0);

  const basicFu = 20;
  const menzenOrTsumoFuValue = menzen && !isTsumo ? 10 : isTsumo ? 2 : 0;
  const waitFuValue = hasWaitFu ? 2 : 0;
  const pairHeadFuValue =
    pairHeadAnswer === "YES(雀魂)"
      ? 4
      : pairHeadAnswer === "YES(雀魂以外)"
        ? 2
        : 0;
  const detailedFuTotal = detailedFuRows.reduce((sum, row) => sum + row.count * row.perFu, 0);
  const totalFuBeforeRound = basicFu + menzenOrTsumoFuValue + waitFuValue + pairHeadFuValue + detailedFuTotal;
  const roundedFinalFu = Math.ceil(Math.max(0, totalFuBeforeRound) / 10) * 10;
  const fixedFuFromResult = RESULT_DISPLAY[currentFlowId]
    ? Number.parseInt(RESULT_DISPLAY[currentFlowId].fu, 10)
    : null;
  const scoreReferenceFu = Number.isInteger(fixedFuFromResult) ? fixedFuFromResult : roundedFinalFu;
  const scoreReferenceRows = [
    {
      role: "親",
      isDealer: true,
      values: HAN_LIST.map((han) =>
        calculateHanFuScoreText({
          fu: scoreReferenceFu,
          han,
          isDealer: true,
          isTsumo,
        })
      ),
    },
    {
      role: "子",
      isDealer: false,
      values: HAN_LIST.map((han) =>
        calculateHanFuScoreText({
          fu: scoreReferenceFu,
          han,
          isDealer: false,
          isTsumo,
        })
      ),
    },
  ];

  const handleFlowAnswer = (answer) => {
    if (currentFlowNode.type !== "question") {
      return;
    }

    const shouldUseOpenWaitType =
      currentFlowId === "tsumo" && flowAnswered[0]?.answer === "YES";
    let nextNodeId = shouldUseOpenWaitType ? "openWaitType" : answer.next;

    const selectedAnswer = {
      nodeId: currentFlowId,
      question: currentFlowNode.text,
      answer: answer.label,
      isAuto: false,
    };
    const answeredWithSelected = [...flowAnswered, selectedAnswer];
    const { nextNodeId: resolvedNextNodeId, autoAnswered } = resolveAutoZeroPath(nextNodeId, answeredWithSelected);

    setFlowAnswered((prev) => [
      ...prev,
      selectedAnswer,
      ...autoAnswered,
    ]);
    setFlowHistory((prev) => [...prev, resolvedNextNodeId]);
  };

  const handleFlowBack = () => {
    setFlowHistory((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.slice(0, -1);
    });
    setFlowAnswered((prev) => {
      if (prev.length <= 0) {
        return prev;
      }
      return prev.slice(0, -1);
    });
  };

  const handleFlowReset = () => {
    setFlowHistory(["start"]);
    setFlowAnswered([]);
  };

  const handleTileInput = (token) => {
    setInputValue((prev) => `${prev}${token}`);
  };

  const handleHonorTileInput = (honorChar) => {
    setInputValue((prev) => {
      const honorMatch = /^([東南西北白發発中])\1*$/.exec(prev);
      if (honorMatch && honorMatch[1] === honorChar && prev.length < 4) {
        return `${prev}${honorChar}`;
      }
      if (!prev) {
        return honorChar;
      }
      return honorChar;
    });
  };

  const handleTileCommitHand = () => {
    if (!canCommitMeldGroup) {
      return;
    }

    setHandTiles((prev) => [...prev, draftedTiles]);
    setInputValue("");
  };

  const handleTileCommitMeld = () => {
    if (!canCommitMeldGroup) {
      return;
    }

    setMeldTiles((prev) => [...prev, draftedTiles]);
    setInputValue("");
  };

  const handleTileCommitHead = () => {
    if (!canCommitHeadGroup) {
      return;
    }

    setHandTiles((prev) => placeHeadGroupAtLeft(prev, draftedTiles));
    setInputValue("");
  };

  const handleTileUndo = () => {
    if (inputValue) {
      setInputValue((prev) => prev.slice(0, -1));
      return;
    }

    if (handTiles.length > 0) {
      setHandTiles((prev) => prev.slice(0, -1));
    }
  };

  const handleTileDragStart = (event, payload) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
    event.dataTransfer.setData("text/plain", JSON.stringify(payload));
  };

  const parseDraggedPayload = (event) => {
    const rawPayload =
      event.dataTransfer.getData("application/json") ||
      event.dataTransfer.getData("text/plain");
    if (!rawPayload) {
      return null;
    }
    try {
      const parsed = JSON.parse(rawPayload);
      if (!parsed || (parsed.sourceZone !== "hand" && parsed.sourceZone !== "meld" && parsed.sourceZone !== "draft")) {
        return null;
      }
      if ((parsed.sourceZone === "hand" || parsed.sourceZone === "meld") && !Number.isInteger(parsed.groupIndex)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const removeGroupFromGroups = (groups, groupIndex) => {
    if (!Array.isArray(groups[groupIndex])) {
      return { nextGroups: groups, removedGroup: null };
    }

    const removedGroup = groups[groupIndex];
    const nextGroups = groups
      .map((group, currentGroupIndex) => {
        if (currentGroupIndex !== groupIndex) {
          return group;
        }
        return [];
      })
      .filter((group) => group.length > 0);

    return { nextGroups, removedGroup };
  };

  const handleZoneDragOver = (event, zone) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverZone(zone);
  };

  const handleZoneDragLeave = (zone) => {
    setDragOverZone((prev) => (prev === zone ? null : prev));
  };

  const handleZoneDrop = (event, targetZone) => {
    event.preventDefault();
    const payload = parseDraggedPayload(event);
    setDragOverZone(null);
    if (!payload) {
      return;
    }

    if (payload.sourceZone === "draft") {
      if (!hasDraftedTiles) {
        return;
      }
      if (hasHeadDraftedTiles) {
        if (targetZone !== "hand") {
          return;
        }
        setHandTiles((prev) => placeHeadGroupAtLeft(prev, draftedTiles));
        setInputValue("");
        return;
      }
      if (!canCommitMeldGroup) {
        return;
      }
      if (targetZone === "hand") {
        setHandTiles((prev) => [...prev, draftedTiles]);
        setInputValue("");
        return;
      }
      if (targetZone === "meld") {
        setMeldTiles((prev) => [...prev, draftedTiles]);
        setInputValue("");
      }
      return;
    }

    if (payload.sourceZone === targetZone) {
      return;
    }

    const sourceGroups = payload.sourceZone === "hand" ? handTiles : meldTiles;
    const sourceGroup = sourceGroups[payload.groupIndex];
    const isPairMovedGroup = isPairGroup(sourceGroup);

    if (isPairMovedGroup && targetZone !== "hand") {
      return;
    }

    const { nextGroups: sourceAfterRemove, removedGroup } = removeGroupFromGroups(
      sourceGroups,
      payload.groupIndex,
    );

    if (!removedGroup) {
      return;
    }

    if (payload.sourceZone === "hand") {
      setHandTiles(sourceAfterRemove);
      setMeldTiles((prev) => [...prev, removedGroup]);
      return;
    }

    setMeldTiles(sourceAfterRemove);
    setHandTiles((prev) => (isPairMovedGroup ? placeHeadGroupAtLeft(prev, removedGroup) : [...prev, removedGroup]));
  };

  const handleTrashDrop = (event) => {
    event.preventDefault();
    const payload = parseDraggedPayload(event);
    setDragOverZone(null);
    if (!payload) {
      return;
    }

    if (payload.sourceZone === "draft") {
      setInputValue("");
      return;
    }

    if (payload.sourceZone === "hand") {
      const { nextGroups } = removeGroupFromGroups(handTiles, payload.groupIndex);
      setHandTiles(nextGroups);
      return;
    }

    const { nextGroups } = removeGroupFromGroups(meldTiles, payload.groupIndex);
    setMeldTiles(nextGroups);
  };

  const handleDragEnd = () => {
    setDragOverZone(null);
  };

  const isConcealedKanGroup = (group) =>
    Array.isArray(group) &&
    group.length === 4 &&
    group.every((tile) => tile === group[0]);

  const handTileCount = handTiles.reduce((sum, group) => sum + group.length, 0);
  const meldTileCount = meldTiles.reduce((sum, group) => sum + group.length, 0);
  const handZoneWeight = Math.max(1, handTileCount + handTiles.length * 0.5);
  const meldZoneWeight = Math.max(1, meldTileCount + meldTiles.length * 0.5);
  const totalZoneWeight = handZoneWeight + meldZoneWeight;
  const rawHandZoneRatio = totalZoneWeight > 0 ? handZoneWeight / totalZoneWeight : 0.5;
  const handZoneRatio = Math.min(0.65, Math.max(0.35, rawHandZoneRatio));

  useActivateMain(mainRef);

  return (
    <main ref={mainRef} className="l-main p-loadAnimation" role="main">
      <section className="p-gamesSchedule">
        <div className="p-gamesSchedule__inner p-loadAnimation__target">
          <h1 className="p-gamesSchedule__title" lang="en">
            Fu Calculator
          </h1>
          <p className="p-gamesSchedule__desc">符計算アプリ</p>
        </div>
      </section>

      <section style={{ padding: "0 16px 48px" }}>
        <nav
          className="p-gamesSchedule2__tab"
          style={{
            marginTop: 0,
            paddingTop: 0,
            paddingBottom: 0,
          }}
        >
          <ul
            className="p-gamesSchedule2__tab-list"
            style={{
              justifyContent: "center",
              gap: "8px",
              flexWrap: "nowrap",
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              width: "100%",
              maxWidth: "420px",
              margin: "0 auto",
            }}
          >
            {FU_TABS.map((tab) => (
              <li key={tab.key} className="p-gamesSchedule2__tab-item" style={{ width: "100%", margin: 0 }}>
                <a
                  href="#fu-app"
                  aria-current={selectedTab === tab.key ? "true" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    if (selectedTab !== tab.key) {
                      setSelectedTab(tab.key);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minWidth: 0,
                    textAlign: "center",
                    whiteSpace: "normal",
                    wordBreak: "keep-all",
                    overflowWrap: "anywhere",
                    fontSize: "13px",
                    lineHeight: 1.15,
                    height: "auto",
                    minHeight: "38px",
                    padding: "4px 3px",
                  }}
                >
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div
          id="fu-app"
          style={{
            maxWidth: 900,
            margin: "20px auto 0",
            background: "#fff",
            borderRadius: 12,
            border: "none",
            padding: "24px 16px",
            textAlign: "center",
          }}
        >
          {selectedTab === "flowchart" ? (
            <>
              <h2 style={{ margin: "0 0 10px", fontSize: "2rem", fontWeight: 700 }}>
                符計算フローチャート
              </h2>
              <div
                style={{
                  maxWidth: 640,
                  margin: "0 auto 12px",
                  borderBottom: "2px solid #d9d9d9",
                }}
              />

              <div
                style={{
                  maxWidth: 640,
                  margin: "0 auto",
                  padding: "16px 12px",
                  background: "transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    gap: 8,
                    marginBottom: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleFlowReset}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      border: "1px solid #c9c9c9",
                      background: "#fff",
                      color: "#333",
                      borderRadius: 8,
                      minHeight: 34,
                      padding: "0 10px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <img src="/assets/media/icons/restart.svg" alt="restart" style={{ width: 14, height: 14 }} />
                    最初から
                  </button>

                  <button
                    type="button"
                    onClick={handleFlowBack}
                    disabled={flowHistory.length <= 1}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      border: "1px solid #c9c9c9",
                      background: flowHistory.length <= 1 ? "#f3f3f3" : "#fff",
                      color: flowHistory.length <= 1 ? "#aaa" : "#333",
                      borderRadius: 8,
                      minHeight: 34,
                      padding: "0 10px",
                      fontWeight: 700,
                      cursor: flowHistory.length <= 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    <img src="/assets/media/icons/back.svg" alt="back" style={{ width: 14, height: 14 }} />
                    戻る
                  </button>
                </div>

                {currentFlowNode.type === "question" ? (
                  <div style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.4, marginBottom: 14 }}>
                    {currentFlowNode.text}
                  </div>
                ) : null}

                {currentFlowNode.type === "question" ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        (
                          currentFlowId === "tripletCount" ||
                          currentFlowId === "yaochuTripletCount" ||
                          currentFlowId === "ankoTripletCount" ||
                          currentFlowId === "kanCount" ||
                          currentFlowId === "yaochuKanCount" ||
                          currentFlowId === "ankanCount"
                        ) &&
                        currentQuestionAnswers.length > 0
                          ? `repeat(${currentQuestionAnswers.length}, minmax(0, 1fr))`
                          : "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {currentQuestionAnswers.map((answer) => (
                      <button
                        key={`${currentFlowId}-${answer.label}`}
                        type="button"
                        onClick={() => handleFlowAnswer(answer)}
                        style={{
                          border: "2px solid #f08300",
                          background: "#fff",
                          color: "#f08300",
                          borderRadius: 9999,
                          height: 40,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {answer.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: 640,
                      margin: "0 auto",
                      minHeight: 32,
                      padding: "2px 6px",
                      background: "transparent",
                      color: "#333",
                      fontWeight: 700,
                    }}
                  >
                    {RESULT_DISPLAY[currentFlowId] ? (
                      <>
                        <div
                          style={{
                            fontSize: RESULT_MAIN_FONT_SIZE,
                            lineHeight: 1.2,
                            color: "#f08300",
                          }}
                        >
                          {RESULT_DISPLAY[currentFlowId].fu}
                        </div>
                        <div style={{ fontSize: RESULT_SUB_FONT_SIZE, marginTop: 4, color: "#333" }}>
                          {RESULT_DISPLAY[currentFlowId].yaku}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: RESULT_MAIN_FONT_SIZE, lineHeight: 1.2, color: "#f08300" }}>
                          {roundedFinalFu}符
                        </div>

                        {shouldShowBreakdown ? (
                          <div
                            style={{
                              marginTop: 10,
                              textAlign: "center",
                              fontSize: "clamp(1.1rem, 4.2vw, 1.6rem)",
                              color: "#333",
                              lineHeight: 1.7,
                              fontWeight: 700,
                              overflowX: "auto",
                            }}
                          >
                            <div>
                              基本符 <span style={{ color: "#f08300" }}>+20符</span>
                            </div>
                            {menzenOrTsumoRow ? (
                              <div>
                                {menzenOrTsumoRow.label} <span style={{ color: "#f08300" }}>{menzenOrTsumoRow.value}</span>
                              </div>
                            ) : null}
                            {hasWaitFu ? (
                              <div>
                                待ち符 <span style={{ color: "#f08300" }}>+2符</span>
                              </div>
                            ) : null}
                            {pairHeadFu ? (
                              <div>
                                役牌の雀頭 <span style={{ color: "#f08300" }}>{pairHeadFu}</span>
                              </div>
                            ) : null}
                            {detailedFuRows.map((row) => {
                              const totalFu = row.count * row.perFu;
                              return (
                                <div key={row.label} style={{ whiteSpace: "nowrap" }}>
                                  {row.label} {row.count}個×{row.perFu}符 <span style={{ color: "#f08300" }}>+{totalFu}符</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        <div
                          style={{
                            marginTop: 16,
                            paddingTop: 14,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: "calc(100% + 16px)",
                              marginLeft: "-8px",
                              maxWidth: "100%",
                              padding: 0,
                              overflowX: "hidden",
                            }}
                          >
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "separate",
                                borderSpacing: 0,
                                tableLayout: "fixed",
                                background: "#fff",
                              }}
                            >
                              <thead>
                                <tr>
                                  <th
                                    style={{
                                      borderRight: "2px solid #f08300",
                                      borderBottom: "2px solid #f08300",
                                      background: "#fff",
                                      width: "13%",
                                      padding: "5px 2px",
                                      fontSize: "clamp(0.9rem, 2.7vw, 1.15rem)",
                                      color: "#333",
                                      whiteSpace: "nowrap",
                                      textAlign: "center",
                                    }}
                                  >

                                  </th>
                                  {HAN_LIST.map((han) => (
                                    <th
                                      key={`han-${han}`}
                                      style={{
                                        borderBottom: "2px solid #f08300",
                                        background: "#fff",
                                        width: "21.75%",
                                        padding: "5px 2px",
                                        fontSize: "clamp(0.9rem, 2.7vw, 1.15rem)",
                                        color: "#333",
                                        whiteSpace: "nowrap",
                                        textAlign: "center",
                                      }}
                                    >
                                      {han}翻
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {scoreReferenceRows.map((row) => (
                                  <tr key={row.role}>
                                    <th
                                      style={{
                                        borderRight: "2px solid #f08300",
                                        background: "#fff",
                                        width: "13%",
                                        padding: "5px 2px",
                                        fontSize: "clamp(0.9rem, 2.7vw, 1.15rem)",
                                        color: "#333",
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                        textAlign: "center",
                                      }}
                                    >
                                      {row.role}
                                    </th>
                                    {row.values.map((value, index) => (
                                      <td
                                        key={`${row.role}-${HAN_LIST[index]}`}
                                        style={{
                                          width: "21.75%",
                                          padding: "5px 2px",
                                          fontSize: "clamp(0.86rem, 2.5vw, 1.08rem)",
                                          color: "#f08300",
                                          fontWeight: 700,
                                          whiteSpace: "nowrap",
                                          lineHeight: 1.2,
                                          letterSpacing: "-0.01em",
                                          fontVariantNumeric: "tabular-nums",
                                          textAlign: "center",
                                          background: "#fff",
                                        }}
                                      >
                                        {value}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {displayAnswered.length > 0 ? (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 14,
                      borderTop: "1px solid #d9d9d9",
                      textAlign: "center",
                    }}
                  >
                    {displayAnswered.map((item, index) => (
                      <div
                        key={`${item.question}-${item.answer}-${index}`}
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: 700,
                          lineHeight: 1.65,
                          color: "#333",
                        }}
                      >
                        <span>{item.question} → </span>
                        <span
                          style={{
                            color: item.answer.startsWith("YES")
                              ? "#d92d20"
                              : item.answer.startsWith("NO")
                                ? "#1976d2"
                                : "#333",
                          }}
                        >
                          {item.answer}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : selectedTab === "tileInput" ? (
            isMobile ? (
              <div style={{ color: "#f08300", fontSize: "1.2rem", fontWeight: 700, margin: "32px 0" }}>
                スマホ版の牌入力機能は現在実装中です
              </div>
            ) : (
            <>
              <h2 style={{ margin: "0 0 16px", fontSize: "1.8rem", fontWeight: 700, borderBottom: "2px solid #d9d9d9", paddingBottom: "8px" }}>
                牌入力
              </h2>

              {/* 符・翻表示 */}
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "363px",
                    height: "40px",
                    background: "#fff",
                    borderRadius: 4,
                    gap: 20,
                  }}
                >
                  <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#f08300" }}>
                    {tileInputAccurateFu ? `${tileInputAccurateFu}符` : "-符"}
                  </div>
                  <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#f08300" }}>
                    {tileInputYakuList.length > 0 ? `${tileInputHan}翻` : "-翻"}
                  </div>
                </div>
              </div>

              {tileInputYakuList.length > 0 ? (
                <div
                  style={{
                    marginTop: -6,
                    marginBottom: 16,
                    fontSize: "1.6rem",
                    color: "#333",
                    fontWeight: 700,
                    lineHeight: 1.6,
                  }}
                >
                  {tileInputYakuText}
                </div>
              ) : null}

              {/* 手牌と鳴牌を横並び */}
              <div
                className="rulefu-tile-zones"
                style={{
                  display: "grid",
                  gridTemplateColumns: `${(handZoneRatio * 100).toFixed(2)}% ${(100 - handZoneRatio * 100).toFixed(2)}%`,
                  alignItems: "stretch",
                  gap: 12,
                  marginBottom: 16,
                  width: "100%",
                  transition: "grid-template-columns 0.2s ease",
                }}
              >
                {/* 手牌ゾーン - 寒色系 */}
                <div
                  style={{
                    width: "100%",
                    minWidth: 0,
                    padding: 12,
                    background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                    borderRadius: 8,
                    border: dragOverZone === "hand" ? "2px dashed #1e88e5" : "2px solid #64b5f6",
                  }}
                  onDragOver={(event) => handleZoneDragOver(event, "hand")}
                  onDrop={(event) => handleZoneDrop(event, "hand")}
                  onDragLeave={() => handleZoneDragLeave("hand")}
                >
                  <h3 style={{ margin: "0 0 8px", fontSize: "1.5rem", fontWeight: 700, color: "#1565c0" }}>
                    手牌
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "nowrap",
                      minHeight: 60,
                      alignItems: "center",
                      width: "fit-content",
                      minWidth: "100%",
                      padding: 8,
                      background: "#a8d8a8",
                      borderRadius: 4,
                    }}
                  >
                    {handTiles.length === 0 ? null : (
                      handTiles.map((tileGroup, idx) => (
                        <div
                          key={idx}
                          style={{
                            ...tileGroupStyle,
                            cursor: "grab",
                          }}
                          draggable
                          onDragStart={(event) =>
                            handleTileDragStart(event, {
                              sourceZone: "hand",
                              groupIndex: idx,
                            })
                          }
                          onDragEnd={handleDragEnd}
                        >
                          {tileGroup.map((tile, tileIndex) => (
                            <img
                              key={`${tile}-${idx}-${tileIndex}`}
                              src={
                                isConcealedKanGroup(tileGroup) && (tileIndex === 0 || tileIndex === 3)
                                  ? "/assets/media/img/cards/back.png"
                                  : getTileImageSrc(tile)
                              }
                              alt=""
                              aria-hidden="true"
                              style={tilePlateStyle}
                            />
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 鳴牌ゾーン - 暖色系 */}
                <div
                  style={{
                    width: "100%",
                    minWidth: 0,
                    padding: 12,
                    background: "linear-gradient(135deg, #ffe0b2 0%, #ffcc80 100%)",
                    borderRadius: 8,
                    border: dragOverZone === "meld" ? "2px dashed #ef6c00" : "2px solid #ffb74d",
                  }}
                  onDragOver={(event) => handleZoneDragOver(event, "meld")}
                  onDrop={(event) => handleZoneDrop(event, "meld")}
                  onDragLeave={() => handleZoneDragLeave("meld")}
                >
                  <h3 style={{ margin: "0 0 8px", fontSize: "1.5rem", fontWeight: 700, color: "#e65100" }}>
                    鳴牌
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "nowrap",
                      minHeight: 60,
                      alignItems: "flex-end",
                      width: "fit-content",
                      minWidth: "100%",
                      padding: 8,
                      background: "#a8d8a8",
                      borderRadius: 4,
                    }}
                  >
                    {meldTiles.length === 0 ? null : (
                      meldTiles.map((meld, index) => (
                        <div
                          key={`${meld.join("-")}-${index}`}
                          style={{
                            ...tileGroupStyle,
                            alignItems: "flex-end",
                            padding: "0 2px",
                            cursor: "grab",
                          }}
                          draggable
                          onDragStart={(event) =>
                            handleTileDragStart(event, {
                              sourceZone: "meld",
                              groupIndex: index,
                            })
                          }
                          onDragEnd={handleDragEnd}
                        >
                          {meld.map((tile, tileIndex) => (
                            <img
                              key={`${tile}-${tileIndex}`}
                              src={tileIndex === 0 ? `/assets/media/img/cards/${tile}-h.png` : getTileImageSrc(tile)}
                              alt=""
                              aria-hidden="true"
                              style={tileIndex === 0 ? meldFirstTileStyle : tilePlateStyle}
                            />
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 仮牌表示エリア */}
              <div
                style={{
                  marginBottom: 16,
                  position: "relative",
                  width: "100%",
                  maxWidth: 980,
                  minHeight: 56,
                  marginInline: "auto",
                }}
              >
                <div
                  draggable={hasDraftedTiles}
                  onDragStart={(event) => handleTileDragStart(event, { sourceZone: "draft" })}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "min(100%, 363px)",
                    margin: "0 auto",
                    minHeight: "56px",
                    background: "#a8d8a8",
                    borderRadius: 4,
                    gap: 0,
                    padding: "6px 8px",
                    cursor: hasDraftedTiles ? "grab" : "default",
                  }}
                >
                  {hasDraftedTiles
                    ? draftedTiles.map((tileCode, index) => (
                        <img
                          key={`${tileCode}-${index}`}
                          src={getTileImageSrc(tileCode)}
                          alt=""
                          aria-hidden="true"
                          draggable={false}
                          style={{ width: 36, height: 46, objectFit: "contain", display: "block", marginLeft: index === 0 ? 0 : -1 }}
                        />
                      ))
                    : null}
                </div>
                <div
                  onDragOver={(event) => handleZoneDragOver(event, "trash")}
                  onDrop={handleTrashDrop}
                  onDragLeave={() => handleZoneDragLeave("trash")}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "calc(50% + 190px)",
                    right: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "56px",
                    background: dragOverZone === "trash" ? "#ffcdd2" : "#ffe6e6",
                    border: dragOverZone === "trash" ? "2px dashed #d32f2f" : "2px solid #ef9a9a",
                    borderRadius: 4,
                    color: "#b71c1c",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    userSelect: "none",
                  }}
                >
                  ゴミ箱
                </div>
              </div>

              {/* 入力ゾーン */}
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "363px",
                    height: "50px",
                    background: "#fff",
                    borderRadius: 4,
                    border: "2px solid #ddd",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", color: inputValue ? "#111" : "#ccc", fontWeight: 600 }}>
                    {inputValue || "入力"}
                  </div>
                </div>
              </div>

              {/* キーボード */}
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  background: "#fff",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: "980px",
                    marginInline: "auto",
                    display: "grid",
                    gridTemplateColumns: "220px auto 220px",
                    gap: 12,
                    alignItems: "start",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 8,
                      marginTop: -150,
                      padding: 8,
                      border: "none",
                      borderRadius: 6,
                      background: "#fff",
                    }}
                  >
                    <div style={{ gridColumn: "1 / -1", fontSize: "1.5rem", fontWeight: 700, color: "#333" }}>和了</div>
                    {winTypeButtons.map((button) => (
                      <button
                        key={button.value}
                        type="button"
                        onClick={() => setTileWinType(button.value)}
                        style={{
                          height: 34,
                          borderRadius: 6,
                          border: tileWinType === button.value ? "2px solid #f08300" : "1px solid #bdbdbd",
                          background: tileWinType === button.value ? "#fff5e6" : "#fff",
                          color: "#333",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {button.label}
                      </button>
                    ))}

                    <div style={{ gridColumn: "1 / -1", marginTop: 2, fontSize: "1.5rem", fontWeight: 700, color: "#333" }}>待ち</div>
                    {waitTypeButtons.map((button) => (
                      <button
                        key={button.value}
                        type="button"
                        onClick={() => setTileWaitType(button.value)}
                        style={{
                          height: 34,
                          borderRadius: 6,
                          border: tileWaitType === button.value ? "2px solid #f08300" : "1px solid #bdbdbd",
                          background: tileWaitType === button.value ? "#fff5e6" : "#fff",
                          color: "#333",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {button.label}
                      </button>
                    ))}

                    <div style={{ gridColumn: "1 / -1", marginTop: 2, fontSize: "1.5rem", fontWeight: 700, color: "#333" }}>場風</div>
                    {windButtons.map((button) => (
                      <button
                        key={`round-${button.value}`}
                        type="button"
                        onClick={() => setTileRoundWind(button.value)}
                        style={{
                          height: 34,
                          borderRadius: 6,
                          border: tileRoundWind === button.value ? "2px solid #f08300" : "1px solid #bdbdbd",
                          background: tileRoundWind === button.value ? "#fff5e6" : "#fff",
                          color: "#333",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {button.label}
                      </button>
                    ))}

                    <div style={{ gridColumn: "1 / -1", marginTop: 2, fontSize: "1.5rem", fontWeight: 700, color: "#333" }}>自風</div>
                    {windButtons.map((button) => (
                      <button
                        key={`seat-${button.value}`}
                        type="button"
                        onClick={() => setTileSeatWind(button.value)}
                        style={{
                          height: 34,
                          borderRadius: 6,
                          border: tileSeatWind === button.value ? "2px solid #f08300" : "1px solid #bdbdbd",
                          background: tileSeatWind === button.value ? "#fff5e6" : "#fff",
                          color: "#333",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    {/* 最上段: 字牌 手牌 鳴牌 戻る */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 84px)",
                        gap: 9,
                        marginBottom: 9,
                      }}
                    >
                      {[
                        { label: "雀頭", onClick: handleTileCommitHead, disabled: !canCommitHeadGroup },
                        { label: "手牌", onClick: handleTileCommitHand, disabled: !canCommitMeldGroup },
                        { label: "鳴牌", onClick: handleTileCommitMeld, disabled: !canCommitMeldGroup },
                        { label: "戻る", onClick: handleTileUndo },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={btn.onClick}
                          disabled={btn.disabled}
                          style={{
                            width: "84px",
                            height: "60px",
                            background: btn.disabled ? "#e0e0e0" : "#fff",
                            color: btn.disabled ? "#9e9e9e" : "#111",
                            border: "2px solid #bdbdbd",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: btn.disabled ? "not-allowed" : "pointer",
                            fontSize: "1.125rem",
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    {/* 数字キー: 7 8 9 p */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 84px)",
                        gap: 9,
                        marginBottom: 9,
                      }}
                    >
                      {[
                        { label: "7", onClick: () => handleTileInput("7") },
                        { label: "8", onClick: () => handleTileInput("8") },
                        { label: "9", onClick: () => handleTileInput("9") },
                        { label: "p", onClick: () => handleTileInput("p") },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={btn.onClick}
                          style={{
                            width: "84px",
                            height: "84px",
                            background: "#fff",
                            color: "#111",
                            border: "2px solid #bdbdbd",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "1.65rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    {/* 4 5 6 m */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 84px)",
                        gap: 9,
                        marginBottom: 9,
                      }}
                    >
                      {[
                        { label: "4", onClick: () => handleTileInput("4") },
                        { label: "5", onClick: () => handleTileInput("5") },
                        { label: "6", onClick: () => handleTileInput("6") },
                        { label: "m", onClick: () => handleTileInput("m") },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={btn.onClick}
                          style={{
                            width: "84px",
                            height: "84px",
                            background: "#fff",
                            color: "#111",
                            border: "2px solid #bdbdbd",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "1.65rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    {/* 1 2 3 s */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 84px)",
                        gap: 9,
                        marginBottom: 9,
                      }}
                    >
                      {[
                        { label: "1", onClick: () => handleTileInput("1") },
                        { label: "2", onClick: () => handleTileInput("2") },
                        { label: "3", onClick: () => handleTileInput("3") },
                        { label: "s", onClick: () => handleTileInput("s") },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={btn.onClick}
                          style={{
                            width: "84px",
                            height: "84px",
                            background: "#fff",
                            color: "#111",
                            border: "2px solid #bdbdbd",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "1.65rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateRows: "repeat(3, 84px)",
                      gap: 9,
                      alignContent: "start",
                      marginTop: 69,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 84px)",
                        gap: 9,
                      }}
                    >
                      {[
                        { label: "東", value: "東" },
                        { label: "南", value: "南" },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={() => handleHonorTileInput(btn.value)}
                          style={{
                            width: "84px",
                            height: "84px",
                            background: "#fff",
                            color: "#111",
                            border: "2px solid #bdbdbd",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "1.65rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 84px)",
                        gap: 9,
                      }}
                    >
                      {[
                        { label: "西", value: "西" },
                        { label: "北", value: "北" },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={() => handleHonorTileInput(btn.value)}
                          style={{
                            width: "84px",
                            height: "84px",
                            background: "#fff",
                            color: "#111",
                            border: "2px solid #bdbdbd",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "1.65rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 84px)",
                        gap: 9,
                      }}
                    >
                      {[
                        { label: "白", value: "白" },
                        { label: "發", value: "發" },
                        { label: "中", value: "中" },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={() => handleHonorTileInput(btn.value)}
                          style={{
                            width: "84px",
                            height: "84px",
                            background: "#fff",
                            color: "#111",
                            border: "2px solid #bdbdbd",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "1.65rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  </div>
                </div>

              <style>
                {`
                  .rulefu-mobile-break {
                    display: none;
                  }
                  @media (max-width: 768px) {
                    .rulefu-mobile-break {
                      display: block;
                    }
                    .rulefu-tile-zones {
                      grid-template-columns: minmax(0, 1fr) !important;
                      gap: 10px !important;
                    }
                  }
                `}
              </style>

              <div
                style={{
                  maxWidth: "980px",
                  margin: "0 auto 16px",
                  textAlign: "center",
                  color: "#333",
                  fontSize: "1.5rem",
                  lineHeight: 1.7,
                  fontWeight: 600,
                  borderTop: "1px solid #d9d9d9",
                  paddingTop: 12,
                }}
              >
                <div>使い方</div>
                <div style={{ marginTop: 6 }}>① 雀頭、面子(順子、刻子、槓子)を入力し、牌姿を決定します。</div>
                <div style={{ marginTop: 6 }}>
                  ② 数牌は数字＋m/p/s、字牌は右側の字牌ボタンで入力します。
                  <br className="rulefu-mobile-break" />
                  例)111s、p1111、東東
                </div>
                <div style={{ marginTop: 6 }}>
                  ③ 雀頭、面子を入力すると牌画像が表示されます。雀頭または手牌・鳴牌ボタンをクリックし、それらの場所を確定させます。
                </div>
                <div style={{ marginTop: 6 }}>④ 牌画像はドラッグすることで、移動または削除ができます。</div>
                <div style={{ marginTop: 6 }}>⑤ 画面左で和了形を決定します。</div>
                <div style={{ marginTop: 6 }}>⑥ 偶然役(一発、ドラ、赤、海底等)は計算されません。</div>
              </div>
            </>
              )
          ) : null}
        </div>
      </section>
    </main>
  );
}
