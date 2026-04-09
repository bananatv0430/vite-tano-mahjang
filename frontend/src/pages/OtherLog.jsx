import { useEffect, useRef, useState } from "react";

export default function OtherLog() {
  const mainRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const main = mainRef.current;
    if (main) {
      main.classList.add("-active");
    }
    // ログ取得
    fetch("/api/logs")
      .then((res) => {
        if (!res.ok) throw new Error("ログ取得に失敗しました");
        return res.json();
      })
      .then((data) => {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "ログ取得に失敗しました");
        setLoading(false);
      });
  }, []);

  return (
    <main ref={mainRef} className="l-main p-loadAnimation" role="main">
      <section className="p-gamesSchedule">
        <div className="p-gamesSchedule__inner p-loadAnimation__target">
          <h1 className="p-gamesSchedule__title" lang="en">
            Log
          </h1>
          <p className="p-gamesSchedule__desc">履歴</p>
        </div>
      </section>

      <section style={{ minHeight: "40vh", padding: "0 16px 48px" }}>
        <div style={{ maxWidth: 640, margin: "32px auto 0 auto" }}>
          {loading ? (
            <div style={{ color: "#888", textAlign: "center", padding: 32 }}>読み込み中...</div>
          ) : error ? (
            <div style={{ color: "#f00", textAlign: "center", padding: 32 }}>{error}</div>
          ) : logs.length === 0 ? (
            <div style={{ color: "#888", textAlign: "center", padding: 32 }}>ログはありません</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                marginBottom: 20,
                padding: "16px 20px"
              }}>
                <div style={{ fontSize: 15, color: "#888", marginBottom: 6, fontWeight: 500 }}>{log.operated_at.replace("T", " ").slice(0, 19)}</div>
                <div style={{ fontSize: 16, color: "#222" }}>{log.message}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
