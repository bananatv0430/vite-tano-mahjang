import React, { useRef, useState } from "react";
import {
  GROUPS,
  GROUP_URLS,
  RULES,
  RULE_VALUES,
} from "./ruleOrgData.js";
import { useActivateMain } from "../hooks/useActivateMain";
import { useMediaQuery } from "../hooks/useMediaQuery";
import styles from "./RuleOrg.module.css";

function getRuleValue(ruleKey, groupKey) {
  return RULE_VALUES[ruleKey]?.[groupKey] ?? "‐";
}

function renderRuleValue(ruleKey, groupKey) {
  const value = getRuleValue(ruleKey, groupKey);

  if (typeof value !== "string") {
    return value;
  }

  const lines = value.split("\n");
  return (
    <>
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}
          {line.split(/(?<!^)(?=[（(])|(?<=。)(?!$)/u).map((segment, segmentIndex) => (
            <span className={styles.ruleSegment} key={segmentIndex}>
              {segment.split(/(※.)/u).map((part, partIndex) => (
                partIndex % 2 === 1
                  ? <span className={styles.ruleMarker} key={partIndex}>{part}</span>
                  : part
              ))}
            </span>
          ))}
        </React.Fragment>
      ))}
    </>
  );
}

export default function RuleOrg() {
  const mainRef = useRef(null);
  const rightBodyRef = useRef(null);
  const dragStateRef = useRef({
    active: false,
    pointerId: null,
    startY: 0,
    startScrollTop: 0,
  });
  const [selected, setSelected] = useState(GROUPS[0].key);
  const isMobile = useMediaQuery("(max-width: 600px)");
  const [isDraggingPcTable, setIsDraggingPcTable] = useState(false);

  useActivateMain(mainRef);

  const handlePcPanStart = (e) => {
    if (e.button !== 0 || e.target === e.currentTarget || !rightBodyRef.current) {
      return;
    }

    const pane = rightBodyRef.current;
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
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
    const dy = e.clientY - dragStateRef.current.startY;
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

      <div className={styles.ruleContent}>
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
                  <table className={styles.mobileComparison} style={{ width: "100%", borderCollapse: "collapse", tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{
                      padding: '6px 4px',




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
                    <tr key={rule.key}>
                      <td style={{
                        padding: '6px 4px',




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
          <div
            ref={rightBodyRef}
            className={styles.scrollPane}
            role="region"
            aria-label="団体別ルール比較表"
            tabIndex={0}
            onPointerDown={handlePcPanStart}
            onPointerMove={handlePcPanMove}
            onPointerUp={handlePcPanEnd}
            onPointerCancel={handlePcPanEnd}
            style={{ cursor: isDraggingPcTable ? "grabbing" : "grab" }}
          >
            <table className={styles.comparison}>
              <thead>
                <tr>
                  <th scope="col">ルール項目</th>
                  {GROUPS.map(group => (
                    <th key={group.key} scope="col" title={group.full}>{group.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RULES.map(rule => (
                  <tr key={rule.key}>
                    <th scope="row">{rule.label}</th>
                    {GROUPS.map(group => (
                      <td key={group.key}>{renderRuleValue(rule.key, group.key)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <section
          className={styles.groupLinks}
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
