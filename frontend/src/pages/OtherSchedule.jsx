import { useEffect, useRef } from "react";

export default function OtherSchedule() {
  const mainRef = useRef(null);

  useEffect(() => {
    const main = mainRef.current;
    if (main) {
      main.classList.add("-active");
    }
  }, []);

  return (
    <main ref={mainRef} className="l-main p-loadAnimation" role="main">
      <section className="p-gamesSchedule">
        <div className="p-gamesSchedule__inner p-loadAnimation__target">
          <h1 className="p-gamesSchedule__title" lang="en">
            Schedule
          </h1>
          <p className="p-gamesSchedule__desc">スケジュール</p>
        </div>
      </section>

      <section
        style={{
          minHeight: "40vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px 48px",
        }}
      >
        <div style={{ fontSize: "2rem", color: "#f08300", fontWeight: "bold", textAlign: "center" }}>
          編集中（スケジュール）
        </div>
      </section>
    </main>
  );
}
