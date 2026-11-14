import React, { useEffect, useRef, useState } from "react";
import {
  GROUPS,
  GROUP_URLS,
  RULES,
  RULE_VALUES,
} from "./ruleOrgData.js";
import { useActivateMain } from "../hooks/useActivateMain";
import { useMediaQuery } from "../hooks/useMediaQuery";

function getRuleValue(ruleKey, groupKey) {
  return RULE_VALUES[ruleKey]?.[groupKey] ?? "-";
}

function renderRuleValue(ruleKey, groupKey) {
  const value = getRuleValue(ruleKey, groupKey);

  if (typeof value !== "string") {
    return value;
  }

  // ※付きの記号を検出する正規表現
  const markerPattern = /※./;

  if (!markerPattern.test(value)) {
    return value;
  }

  // ※と文字で分割
  const parts = value.split(/(※.)/);  return (
    <>
      {parts.map((part, idx) => {
        if (/※./.test(part)) {
          return (
            <span key={idx} style={{ color: "#d32f2f", fontWeight: "bold" }}>
              {part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
}

export default function RuleOrg() {
  const mainRef = useRef(null);
  const leftBodyRef = useRef(null);
  const rightBodyRef = useRef(null);
  const rightHeaderRef = useRef(null);
  const dragStateRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });
  const [selected, setSelected] = useState(GROUPS[0].key);
  const isMobile = useMediaQuery("(max-width: 600px)");
  const [isDraggingPcTable, setIsDraggingPcTable] = useState(false);
  const [pcBodyScrollbarWidth, setPcBodyScrollbarWidth] = useState(0);
  const [pcBodyScrollbarHeight, setPcBodyScrollbarHeight] = useState(0);

  useActivateMain(mainRef);

  useEffect(() => {
    if (isMobile) return;

    const updateScrollbarWidth = () => {
      if (!rightBodyRef.current) {
        return;
      }
      const width = rightBodyRef.current.offsetWidth - rightBodyRef.current.clientWidth;
      const height = rightBodyRef.current.offsetHeight - rightBodyRef.current.clientHeight;
      setPcBodyScrollbarWidth(width > 0 ? width : 0);
      setPcBodyScrollbarHeight(height > 0 ? height : 0);
    };

    updateScrollbarWidth();
    window.addEventListener("resize", updateScrollbarWidth);
    return () => window.removeEventListener("resize", updateScrollbarWidth);
  }, [isMobile]);

  const handlePcBodyScroll = (e) => {
    const target = e.currentTarget;
    if (leftBodyRef.current) {
      leftBodyRef.current.scrollTop = target.scrollTop;
    }
    if (rightHeaderRef.current) {
      rightHeaderRef.current.scrollLeft = target.scrollLeft;
    }
  };

  const handlePcPanStart = (e) => {
    if (e.button !== 0 || !rightBodyRef.current) {
      return;
    }

    const pane = rightBodyRef.current;
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: pane.scrollLeft,
      startScrollTop: pane.scrollTop,
    };
    setIsDraggingPcTable(true);
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
  };

  const handlePcPanMove = (e) => {
    if (!dragStateRef.current.active || !rightBodyRef.current) {
      return;
    }

    const pane = rightBodyRef.current;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    pane.scrollLeft = dragStateRef.current.startScrollLeft - dx;
    pane.scrollTop = dragStateRef.current.startScrollTop - dy;
  };

  const handlePcPanEnd = (e) => {
    if (!dragStateRef.current.active) {
      return;
    }

    dragStateRef.current.active = false;
    setIsDraggingPcTable(false);
    if (e.currentTarget.releasePointerCapture && dragStateRef.current.pointerId !== null) {
      e.currentTarget.releasePointerCapture(dragStateRef.current.pointerId);
    }
    dragStateRef.current.pointerId = null;
  };

  return (
    <main ref={mainRef} className="l-main p-loadAnimation" role="main">
      <section className="p-gamesSchedule">
        <div className="p-gamesSchedule__inner p-loadAnimation__target">
          <h1 className="p-gamesSchedule__title" lang="en">
            Rule Guide
          </h1>
          <p className="p-gamesSchedule__desc">団体別ルール</p>
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        {isMobile ? (
          <>
            <nav className="p-gamesSchedule2__tab" style={{ margin: "0 0 16px", paddingTop: 0, paddingBottom: 0 }}>
              <ul
                className="p-gamesSchedule2__tab-list"
                style={{
                  justifyContent: "center",
                  gap: "8px",
                  flexWrap: "nowrap",
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  width: "100%",
                  maxWidth: "420px",
                  margin: "0 auto",
                }}
              >
                {GROUPS.map((g) => (
                  <li key={g.key} className="p-gamesSchedule2__tab-item" style={{ width: "100%", margin: 0 }}>
                    <a
                      href="#rule-guide"
                      aria-current={selected === g.key ? "true" : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        if (selected !== g.key) {
                          setSelected(g.key);
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
                        fontSize: "12px",
                        lineHeight: 1.15,
                        height: "auto",
                        minHeight: "38px",
                        padding: "4px 2px",
                      }}
                      title={g.full}
                    >
                      {g.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div style={{ border: "none", borderRadius: 0, padding: 0, minHeight: 200, overflowX: "auto", marginTop: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{
                      padding: '6px 4px',
                      borderBottom: '2px solid #f08300',
                      borderRight: '2px solid #f08300',
                      borderTop: 'none',
                      borderLeft: 'none',
                          width: '50%',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      background: '#fff',
                      color: '#f08300',
                      fontWeight: 'bold',
                      fontSize: 14
                    }}>ルール項目</th>
                    <th style={{
                      padding: '6px 4px',
                      borderBottom: '2px solid #f08300',
                      borderRight: 'none',
                      borderTop: 'none',
                      borderLeft: 'none',
                      background: '#fff',
                      color: '#f08300',
                      fontWeight: 'bold',
                      fontSize: 14,
                          width: '50%',
                      whiteSpace: 'nowrap'
                    }}>{GROUPS.find(g => g.key === selected)?.label}</th>
                  </tr>
                </thead>
                <tbody>
                  {RULES.map(rule => (
                    <tr key={rule.key} style={{ borderBottom: '2px solid transparent' }}>
                      <td style={{
                        padding: '6px 4px',
                        borderRight: '2px solid #f08300',
                        borderBottom: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                            width: '50%',
                        textAlign: 'center',
                        whiteSpace: 'pre-line',
                        wordBreak: 'keep-all',
                        overflowWrap: 'break-word',
                        background: '#fff',
                        fontWeight: 'bold',
                        fontSize: 13
                      }}>{rule.label}</td>
                      <td style={{
                        padding: '6px 4px',
                        border: 'none',
                        textAlign: 'center',
                        background: '#fff',
                        whiteSpace: 'pre-line',
                        fontSize: 13
                      }}>{renderRuleValue(rule.key, selected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ maxWidth: '100%', border: 'none', borderRadius: 8, padding: 0, minHeight: 200, height: 560 }}>
            <div style={{ display: 'flex', width: '100%' }}>
              <div
                style={{
                  width: 260,
                  minWidth: 260,
                  padding: 8,
                  borderBottom: '2px solid #f08300',
                  borderRight: '2px solid #f08300',
                  background: '#fff',
                  color: '#f08300',
                  fontWeight: 'bold',
                  fontSize: 16,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                ルール項目
              </div>

              <div
                ref={rightHeaderRef}
                style={{
                  flex: 1,
                  overflowX: 'hidden',
                  overflowY: 'hidden',
                  paddingRight: pcBodyScrollbarWidth,
                  boxSizing: 'border-box',
                }}
              >
                <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 180 * GROUPS.length }}>
                  <thead>
                    <tr>
                      {GROUPS.map((g) => (
                        <th
                          key={g.key}
                          style={{
                            padding: 8,
                            borderBottom: '2px solid #f08300',
                            borderRight: 'none',
                            borderTop: 'none',
                            borderLeft: 'none',
                            background: '#fff',
                            color: '#f08300',
                            fontWeight: 'bold',
                            fontSize: 16,
                            width: 180,
                            whiteSpace: 'nowrap',
                          }}
                          title={g.full}
                        >
                          {g.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', width: '100%', height: 'calc(100% - 42px)' }}>
              <div
                ref={leftBodyRef}
                style={{
                  width: 260,
                  minWidth: 260,
                  overflow: 'hidden',
                  borderRight: '2px solid #f08300',
                  height: pcBodyScrollbarHeight > 0 ? `calc(100% - ${pcBodyScrollbarHeight}px)` : '100%',
                }}
              >
                <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: 260 }}>
                  <tbody>
                    {RULES.map((rule) => (
                      <tr key={rule.key} style={{ borderBottom: '2px solid transparent' }}>
                        <td
                          style={{
                            padding: 8,
                            borderRight: 'none',
                            borderBottom: 'none',
                            borderTop: 'none',
                            borderLeft: 'none',
                            width: 260,
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            background: '#fff',
                            fontWeight: 'bold',
                          }}
                        >
                          {rule.label}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                ref={rightBodyRef}
                onScroll={handlePcBodyScroll}
                onPointerDown={handlePcPanStart}
                onPointerMove={handlePcPanMove}
                onPointerUp={handlePcPanEnd}
                onPointerCancel={handlePcPanEnd}
                style={{
                  flex: 1,
                  overflow: 'auto',
                  cursor: isDraggingPcTable ? 'grabbing' : 'grab',
                  userSelect: isDraggingPcTable ? 'none' : 'auto',
                  touchAction: 'none',
                }}
              >
                <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 180 * GROUPS.length }}>
                  <tbody>
                    {RULES.map((rule) => (
                      <tr key={rule.key} style={{ borderBottom: '2px solid transparent' }}>
                        {GROUPS.map((g) => (
                          <td
                            key={g.key}
                            style={{
                              padding: 8,
                              border: 'none',
                              textAlign: 'center',
                              background: '#fff',
                              width: 180,
                              whiteSpace: 'pre-line',
                            }}
                          >
                            {renderRuleValue(rule.key, g.key)}
                        </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <section
          style={{
            marginTop: 28,
            padding: "20px 16px",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          <h2
            style={{
              margin: "0 0 12px 0",
              paddingBottom: 10,
              borderBottom: "2px solid #d9d9d9",
              color: "#f08300",
              fontSize: 20,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            各団体ホームページ
          </h2>

          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
            {GROUPS.map((group) => (
              <li key={`link-${group.key}`} style={{ textAlign: "center" }}>
                <a
                  href={GROUP_URLS[group.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#1565c0",
                    fontSize: 15,
                    lineHeight: 1.6,
                    wordBreak: "break-all",
                  }}
                >
                  {group.full}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
