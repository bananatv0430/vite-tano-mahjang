

import { useEffect, useRef, useState } from "react";

import { getIconSrc } from "../utils/getIconSrc";

// fallbackアイコン生成
const createFallbackIcon = (name) => {
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

// 共通getIconSrcラッパー
const getPlayerIconSrc = (iconPath, iconVersion, name) => {
  return getIconSrc(iconPath, iconVersion, createFallbackIcon(name));
};

export default function Player() {
  const mainRef = useRef(null);

  const [players, setPlayers] = useState([]);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", icon_path: "" });
  const [selectedIconFile, setSelectedIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isMobileUploadUi, setIsMobileUploadUi] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  });

  const modalActionButtonStyle = {
    minWidth: "120px",
    height: "44px",
    padding: "0 18px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const openEditor = (player) => {
    setEditingPlayer(player);
    setSelectedIconFile(null);
    setSaveError("");
    setEditForm({
      name: player?.name ?? "",
      icon_path: player?.icon_path ?? "",
    });
    setIconPreview(getPlayerIconSrc(player?.icon_path, player?.icon_version, player?.name));
  };

  const closeEditor = () => {
    setEditingPlayer(null);
    setSelectedIconFile(null);
    setIsDragOver(false);
    setIsSaving(false);
    setSaveError("");
    setEditForm({ name: "", icon_path: "" });
    setIconPreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return "";
    });
  };

  const applyIconFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    setSelectedIconFile(file);
    setIconPreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(file);
    });
  };

  const handleIconChange = (e) => {
    const file = e.target.files?.[0];
    applyIconFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (isMobileUploadUi) {
      return;
    }

    const file = e.dataTransfer?.files?.[0];
    applyIconFile(file);
  };

  const handleSave = async () => {
    if (!editingPlayer || isSaving) return;

    const trimmedName = editForm.name.trim();
    if (!trimmedName) {
      setSaveError("名前を入力してください");
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const formData = new FormData();
      formData.append("name", trimmedName);
      formData.append("icon_path", editForm.icon_path || "");
      if (selectedIconFile) {
        formData.append("icon", selectedIconFile);
      }

      const response = await fetch(`/api/players/${editingPlayer.id}`, {
        method: "PUT",
        body: formData,
      });

      const responseText = await response.text();
      let data = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        throw new Error("サーバー応答が不正です。バックエンドを再起動してください");
      }

      if (!response.ok) {
        throw new Error(data?.error || `保存に失敗しました (${response.status})`);
      }

      if (!data || typeof data !== "object") {
        throw new Error("保存結果の取得に失敗しました");
      }

      setPlayers((prev) => prev.map((player) => (
        player.id === editingPlayer.id
          ? { ...(data.data || data), icon_version: Date.now() }
          : player
      )));
      closeEditor();
    } catch (error) {
      setSaveError(error.message || "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const main = mainRef.current;
    if (main) {
      main.classList.add("-active");
    }
    fetch("/api/players")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        const players = data.data;
        if (Array.isArray(players) && players.length > 0) {
          setPlayers(players.map((player) => ({
            ...player,
            icon_version: player.icon_path ? 1 : 0,
          })));
        } else {
          setPlayers([
            { id: 0, name: "(データなし)", icon_version: 0 }
          ]);
        }
      })
      .catch(() => {
        setPlayers([
          { id: 0, name: "(データ取得エラー)", age: "--"}
        ]);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const updateMobileUploadUi = (event) => {
      setIsMobileUploadUi(event.matches);
      setIsDragOver(false);
    };

    updateMobileUploadUi(mediaQuery);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateMobileUploadUi);
      return () => mediaQuery.removeEventListener("change", updateMobileUploadUi);
    }

    mediaQuery.addListener(updateMobileUploadUi);
    return () => mediaQuery.removeListener(updateMobileUploadUi);
  }, []);

  // 全プレイヤー分の成績データ
  const [playerStatsMap, setPlayerStatsMap] = useState({});

  useEffect(() => {
    if (players.length === 0) return;
    const controller = new AbortController();
    const fetchStats = async () => {
      const statsObj = {};
      await Promise.all(players.map(async (player) => {
        if (!player.id) return;
        try {
          const res = await fetch(`/api/players/player-stats/${player.id}`, { signal: controller.signal });
          if (res.ok) {
            const data = await res.json();
            if (data && data.total) statsObj[player.id] = data;
          }
        } catch {}
      }));
      setPlayerStatsMap(statsObj);
    };
    fetchStats();
    return () => controller.abort();
  }, [players]);

  return (
    <main ref={mainRef} className="l-main p-loadAnimation" role="main">
            <section className="p-team-detail -jets">
                <section className="p-gamesSchedule">
                    <div className="p-gamesSchedule__inner p-loadAnimation__target">
                    <h1 className="p-gamesSchedule__title" lang="en">
                        Players
                    </h1>
                          <p className="p-gamesSchedule__desc">プレイヤー一覧</p>
                    </div>
                </section>
              <div className="p-team-detail__body">
                <ul className="p-team-detail__player-list">
                  {players.map((player, idx) => (
                    <li key={player.id}>
                      <div className="c-player-profile">
                        <div className="c-player-profile__column01">
                          <div>
                            <img
                              alt=""
                              src={getPlayerIconSrc(player.icon_path, player.icon_version, player.name)}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = createFallbackIcon(player.name);
                              }}
                              style={{
                                width: '120px',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '50%',
                                border: '2px solid #888',
                                background: '#fff',
                                display: 'block',
                                margin: '0 auto'
                              }}
                            />
                          </div>
                        </div>
                        <div className="c-player-profile__column02 p-playerEdit__row">
                          <div className="p-playerEdit__nameWrap">
                            <div className="c-player-profile__name-row">
                              <div className="c-player-profile__name">{player.name}</div>
                            </div>
                            <div className="c-player-profile__description" />
                          </div>
                          <p className="p-playerEdit__btn">
                            <button
                              aria-label={`${player.name}を編集`}
                              className="c-button -primary -medium"
                              type="button"
                              onClick={() => openEditor(player)}
                            >
                              編集
                            </button>
                          </p>
                        </div>
                      </div>
                      <div className="c-score-table-scrollbox">
                        <table className="c-score-table">
                          <thead>
                            <tr>
                              <th>対戦成績</th>
                              <th scope="col">個人スコア</th>
                              <th scope="col">4着回避率</th>
                              <th scope="col">最高スコア</th>
                              <th scope="col">半荘数</th>
                            </tr>
                          </thead>
                          <tbody>
                            {playerStatsMap[player.id] && playerStatsMap[player.id].total ? (
                              <>
                                <tr>
                                  <th scope="row">合計</th>
                                  <td>{playerStatsMap[player.id].total.totalPoint > 0 ? `+${playerStatsMap[player.id].total.totalPoint}pt` : `${playerStatsMap[player.id].total.totalPoint}pt`}</td>
                                  <td>{playerStatsMap[player.id].total.avoidFourthRate?.toFixed(3)}</td>
                                  <td>{playerStatsMap[player.id].total.highScore}pt</td>
                                  <td>{playerStatsMap[player.id].total.gameCount}</td>
                                </tr>
                                {playerStatsMap[player.id].yearly.map((y) => (
                                  <tr key={y.year}>
                                    <th scope="row">{y.year}年</th>
                                    <td>{y.totalPoint > 0 ? `+${y.totalPoint}pt` : `${y.totalPoint}pt`}</td>
                                    <td>{y.avoidFourthRate?.toFixed(3)}</td>
                                    <td>{y.highScore}pt</td>
                                    <td>{y.gameCount}</td>
                                  </tr>
                                ))}
                              </>
                            ) : (
                              <tr>
                                <th scope="row">現在</th>
                                <td>--pt</td>
                                <td>--</td>
                                <td>--</td>
                                <td>--</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {editingPlayer && (
                <div
                  onClick={closeEditor}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px",
                    zIndex: 1000,
                  }}
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="player-edit-modal-title"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "100%",
                      maxWidth: "560px",
                      background: "#fff",
                      borderRadius: "16px",
                      boxShadow: "0 16px 40px rgba(0, 0, 0, 0.2)",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e5e5" }}>
                      <h2
                        id="player-edit-modal-title"
                        style={{ margin: 0, fontSize: "2.2rem", fontWeight: 700, color: "#111" }}
                      >
                        プレイヤー編集
                      </h2>
                    </div>

                    <div style={{ padding: "24px", display: "grid", gap: "20px" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "120px 1fr",
                          gap: "18px",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "grid", gap: "8px", justifyItems: "center" }}>
                          <img
                            alt=""
                            src={iconPreview || fallbackIcon}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = fallbackIcon;
                            }}
                            style={{
                              width: "96px",
                              height: "96px",
                              objectFit: "cover",
                              borderRadius: "50%",
                              border: "2px solid #b5b5b5",
                              background: "#fff",
                            }}
                          />
                        </div>

                        <label style={{ display: "grid", gap: "8px" }}>
                          <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#222" }}>名前</span>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "1px solid #cfcfcf",
                              borderRadius: "8px",
                              fontSize: "1.4rem",
                            }}
                          />
                        </label>
                      </div>

                      <div
                        onDragOver={(e) => {
                          if (isMobileUploadUi) {
                            return;
                          }

                          e.preventDefault();
                          setIsDragOver(true);
                        }}
                        onDragLeave={() => {
                          if (!isMobileUploadUi) {
                            setIsDragOver(false);
                          }
                        }}
                        onDrop={handleDrop}
                        style={{
                          border: isDragOver && !isMobileUploadUi ? "1px solid #007c89" : "1px solid #d8d8d8",
                          borderRadius: "8px",
                          background: isDragOver && !isMobileUploadUi ? "#eef9fb" : "#f8f8f8",
                          padding: isMobileUploadUi ? "16px 14px" : "10px 16px",
                          display: "grid",
                          gap: isMobileUploadUi ? "8px" : "4px",
                          justifyItems: "center",
                          textAlign: "center",
                          transition: "background 0.2s ease, border-color 0.2s ease",
                        }}
                      >
                        <img
                          src="/assets/media/icons/upload.svg"
                          alt="アップロード"
                          style={{ width: isMobileUploadUi ? "40px" : "48px", height: isMobileUploadUi ? "40px" : "48px", display: "block" }}
                        />

                        {isMobileUploadUi ? null : (
                          <>
                            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#333" }}>
                              ここにファイルをドロップ
                            </div>
                            <div style={{ fontSize: "1.2rem", color: "#666" }}>または</div>
                          </>
                        )}

                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: isMobileUploadUi ? "180px" : "160px",
                            minHeight: "42px",
                            padding: "10px 16px",
                            borderRadius: "4px",
                            background: "#007c89",
                            color: "#fff",
                            fontSize: "1.4rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {isMobileUploadUi ? "画像を選択する" : "ファイルを選択する"}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                            onChange={handleIconChange}
                            style={{ display: "none" }}
                          />
                        </label>

                        <div style={{ fontSize: "1.2rem", color: "#777", lineHeight: 1.5 }}>
                          ファイル形式: JPG, PNG, GIF, WEBP
                        </div>

                        {selectedIconFile && (
                          <div style={{ fontSize: "1.2rem", color: "#444" }}>
                            選択中: {selectedIconFile.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "10px",
                        padding: "20px 24px",
                        borderTop: "1px solid #e5e5e5",
                      }}
                    >
                      {saveError && (
                        <div style={{ fontSize: "1.3rem", color: "#c62828" }}>
                          {saveError}
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "12px",
                        }}
                      >
                        <button
                          type="button"
                          className="c-button -primary -medium"
                          style={{
                            ...modalActionButtonStyle,
                            opacity: isSaving ? 0.8 : 1,
                          }}
                          onClick={closeEditor}
                          disabled={isSaving}
                        >
                          キャンセル
                        </button>
                        <button
                          type="button"
                          className="c-button -primary -medium"
                          style={{
                            ...modalActionButtonStyle,
                            opacity: isSaving ? 0.8 : 1,
                          }}
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          {isSaving ? "保存中..." : "保存"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </main>
  );
}
