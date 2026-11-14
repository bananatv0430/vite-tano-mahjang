import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useActivateMain } from "../hooks/useActivateMain";
import { getJapaneseWeekday } from "../utils/gameUtils";
import { apiFetch, fetchJson } from "../utils/apiFetch";
import EntrySharedStyles from "../components/EntrySharedStyles";
import styles from "./ReplayImport.module.css";

const sections = [
  ["総合・順位", ["総半荘数", "総局数", "累計ポイント", "平均着順", "1着率", "2着率", "3着率", "4着率", "連対率", "4着回避率"]],
  ["和了・放銃", ["和了率", "放銃率", "被自摸率", "横移動率", "流局率", "和了回数", "和了時立直率", "和了時副露率", "黙聴率", "自摸率", "平均打点", "平均荘家打点", "平均散家打点", "1局当たりの平均収支"]],
  ["立直・副露・流局", ["総立直率", "立直成功率", "立直放銃率", "平均待ち牌種数", "平均待ち牌枚数", "平均見た目待ち枚数", "総副露率", "流局聴牌率", "聴牌料収支", "配牌時平均向聴数"]],
  ["親番・ドラ", ["連荘率", "親被り率", "満貫以上親被り率", "親番の平均収支", "本場回収点", "供託回収点", "平均全ドラ枚数", "平均表ドラ枚数", "平均赤ドラ枚数", "平均裏ドラ枚数", "裏ドラ的中率"]],
];

const metricDefinitions = {
  "総半荘数": "集計対象の対局に参加した回数。",
  "総局数": "参加した局の数。流局も含みます。",
  "累計ポイント": "対局ごとの成績ポイントの合計。登録成績のポイントがある場合はその値を使い、それ以外は牌譜のポイントを使います。",
  "平均着順": "各対局の最終着順の平均。",
  "1着率": "全対局のうち、1着で終えた割合。",
  "2着率": "全対局のうち、2着で終えた割合。",
  "3着率": "全対局のうち、3着で終えた割合。",
  "4着率": "全対局のうち、4着で終えた割合。三人戦と四人戦をまとめて表示する場合、分母には三人戦も含みます。",
  "連対率": "全対局のうち、1着または2着で終えた割合。",
  "4着回避率": "四人戦のうち、1〜3着で終えた割合。",
  "和了率": "全局のうち、ロンまたはツモで和了した割合。",
  "放銃率": "全局のうち、自分が他家にロンされた割合。",
  "被自摸率": "全局のうち、他家がツモ和了した割合。",
  "横移動率": "全局のうち、他家同士のロンで終わった割合。",
  "流局率": "全局のうち、和了で終わらなかった割合。途中流局も含みます。",
  "和了回数": "ロンまたはツモで和了した回数。",
  "和了時立直率": "和了のうち、立直していた割合。",
  "和了時副露率": "和了のうち、チー・ポン・明槓で副露していた割合。",
  "黙聴率": "和了のうち、門前で立直せずに和了した割合。",
  "自摸率": "和了のうち、ツモで和了した割合。",
  "平均打点": "和了1回あたりの、牌譜に記録された和了点の平均。",
  "平均荘家打点": "親で和了したときの打点の平均。",
  "平均散家打点": "子で和了したときの打点の平均。",
  "1局当たりの平均収支": "局の終了時の持ち点から開始時の持ち点を引いた値の平均。",
  "総立直率": "全局のうち、立直を宣言した割合。",
  "立直成功率": "立直を宣言した局のうち、和了した割合。",
  "立直放銃率": "立直を宣言した局のうち、放銃した割合。",
  "平均待ち牌種数": "待ち牌が記録されている立直について、宣言時の待ち牌の種類数の平均。",
  "平均待ち牌枚数": "立直時の待ち牌を各4枚として、自分の手牌にある分を引いた枚数の平均。",
  "平均見た目待ち枚数": "立直時の待ち牌を各4枚として、自分の手牌や場に見えている分を引いた枚数の平均。",
  "総副露率": "全局のうち、チー・ポン・明槓をした割合。",
  "流局聴牌率": "牌を引き切って流局した局のうち、終了時に聴牌していた割合。",
  "聴牌料収支": "流局時に受け取った聴牌料から、支払った聴牌料を引いた合計。流し満貫は除きます。",
  "配牌時平均向聴数": "配牌時点で聴牌までに必要な手牌の進み具合の平均。聴牌は0向聴です。",
  "連荘率": "次局の記録がある親番のうち、次局も同じ親が続いた割合。",
  "親被り率": "親番のうち、子にツモ和了された割合。",
  "満貫以上親被り率": "親番のうち、子のツモ和了が役満、または牌譜上の打点が8,000点以上だった割合。",
  "親番の平均収支": "親番での、局の開始から終了までの持ち点の増減の平均。",
  "本場回収点": "和了時に本場分として受け取った点数の合計。",
  "供託回収点": "和了時に供託の立直棒から受け取った点数の合計。",
  "平均全ドラ枚数": "和了時の表ドラ・赤ドラ・裏ドラ・抜きドラの合計枚数の平均。",
  "平均表ドラ枚数": "和了時の表ドラの枚数の平均。",
  "平均赤ドラ枚数": "和了時の赤ドラの枚数の平均。",
  "平均裏ドラ枚数": "和了時の裏ドラの枚数の平均。",
  "裏ドラ的中率": "立直して和了したときに、裏ドラが1枚以上あった割合。",
};

function MetricDefinitions() {
  return (
    <section className={styles.metricDefinitions} aria-labelledby="metric-definitions">
      <h2 id="metric-definitions" className="dataEntry__subTitle">指標の説明</h2>
      <p>「—」は、集計に必要な対局や局がない場合に表示されます。</p>
      <div className={"dataEntry__round " + styles.tableScroll}>
        <table>
          <thead><tr><th scope="col">指標</th><th scope="col">内容・集計方法</th></tr></thead>
          {sections.map(([title, metrics]) => (
            <tbody key={title}>
              <tr className={styles.metricGroup}><th scope="rowgroup" colSpan={2}>{title}</th></tr>
              {metrics.map(metric => (
                <tr key={metric}>
                  <th scope="row">{metric}</th>
                  <td>{metricDefinitions[metric]}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}

const percentage = new Intl.NumberFormat("ja-JP", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMetric(metric, value) {
  if (value == null) return "—";
  return metric.endsWith("率") ? percentage.format(value / 100) : value.toLocaleString("ja-JP");
}

function StatisticsTable({ rows, count }) {
  return (
    <div className={"dataEntry__round " + styles.tableScroll + " " + styles.statisticsTable} tabIndex={0} role="region" aria-label="選手とCPUの詳細成績">
      <table>
        <thead><tr>
          <th scope="col">指標</th>
          {rows.map(row => <th scope="col" key={row.name}>{row.name}</th>)}
        </tr></thead>
        {sections.map(([title, metrics]) => (
          <tbody key={title}>
            <tr className={styles.metricGroup}><th scope="rowgroup" colSpan={rows.length + 1}><span className={styles.metricGroupTitle}>{title}</span></th></tr>
            {metrics.filter(metric => count !== "3" || !metric.startsWith("4着")).map(metric => (
              <tr key={metric}>
                <th scope="row">{metric}</th>
                {rows.map(row => {
                  const value = row.stats?.[metric];
                  return <td key={row.name}>{formatMetric(metric, value)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function StatisticsView({ filters }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await apiFetch("/api/replays/stats?" + filters, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.message || "詳細成績を取得できませんでした");
        if (!controller.signal.aborted) setRows(result.data);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause.message);
      }
    }
    load();
    return () => controller.abort();
  }, [filters]);

  if (error) return <p role="alert">{error}</p>;
  if (!rows) return <p role="status">集計中</p>;

  const params = new URLSearchParams(filters);
  const year = params.get("year");
  const period = params.get("date") || (year ? year + "年" : "全期間");
  const count = params.get("count");
  return <>
    <p role="status">{period} ／ {count ? count + "人戦" : "全対局"}{rows.some(row => row.stats) ? "" : " ／ 対象の詳細成績はありません。"}</p>
    <StatisticsTable rows={rows} count={count} />
  </>;
}

function PeriodSelect({ label, options, value, onChange, loading, error, formatOption }) {
  return <label>{label}
    <select className="dataEntry__select" required disabled={loading || !options.length}
      value={options.includes(value) ? value : ""} onChange={event => onChange(event.target.value)}>
      <option value="">{loading ? "読み込み中..." : error ? "取得できませんでした" :
        options.length ? label + "を選択してください" : "登録済みの" + label + "がありません"}</option>
      {options.map(option => <option value={option} key={option}>{formatOption(option)}</option>)}
    </select>
  </label>;
}

function StatisticsFilters({ params, dates, datesError, onApply }) {
  const [period, setPeriod] = useState(params.has("date") ? "date" : params.has("year") ? "year" : "");
  const [date, setDate] = useState(params.get("date") ?? "");
  const [year, setYear] = useState(params.get("year") ?? "");
  const [count, setCount] = useState(params.get("count") ?? "");

  const dateOptions = dates ?? [];
  const yearOptions = [...new Set(dateOptions.map(option => option.slice(0, 4)))];
  const canApply = period === "date" ? dateOptions.includes(date) :
    period === "year" ? yearOptions.includes(year) : true;

  function apply(event) {
    event.preventDefault();
    if (!canApply) return;
    const next = new URLSearchParams();
    if (period === "date") next.set("date", date);
    if (period === "year") next.set("year", year);
    if (count) next.set("count", count);
    onApply(next);
  }

  return (
    <form className={styles.filters} onSubmit={apply}>
      <label>集計期間<select className="dataEntry__select" value={period} onChange={event => setPeriod(event.target.value)}>
        <option value="">全期間</option><option value="date">指定対局日</option><option value="year">指定年</option>
      </select></label>
      {period === "date" && <PeriodSelect label="対局日" options={dateOptions} value={date} onChange={setDate}
        loading={dates === null && !datesError} error={datesError}
        formatOption={option => `${option}（${getJapaneseWeekday(option)}）`} />}
      {period === "year" && <PeriodSelect label="年" options={yearOptions} value={year} onChange={setYear}
        loading={dates === null && !datesError} error={datesError} formatOption={option => option + "年"} />}
      <label>対局人数<select className="dataEntry__select" value={count} onChange={event => setCount(event.target.value)}>
        <option value="">すべて</option><option value="4">四人戦</option><option value="3">三人戦</option>
      </select></label>
      <button className="c-button -primary -medium -gray" disabled={!canApply}>表示</button>
    </form>
  );
}

export default function ReplayStats() {
  const mainRef = useRef(null);
  useActivateMain(mainRef);
  const [params, setParams] = useSearchParams();
  const [revision, setRevision] = useState(0);
  const filters = params.toString();
  const [dates, setDates] = useState(null);
  const [datesError, setDatesError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadDates() {
      try {
        const result = await fetchJson("/api/replays/stats/dates", { signal: controller.signal }, "対局日の取得に失敗しました");
        if (!result.ok || !Array.isArray(result.data)) throw new Error("対局日の取得に失敗しました");
        if (!controller.signal.aborted) setDates(result.data);
      } catch (error) {
        if (!controller.signal.aborted) setDatesError(error.message);
      }
    }
    loadDates();
    return () => controller.abort();
  }, []);

  return <main ref={mainRef} className="l-main u-next-fill-gray p-loadAnimation">
    <EntrySharedStyles />
    <section className="p-gamesSchedule">
      <div className="p-gamesSchedule__inner p-loadAnimation__target">
        <h1 className="p-gamesSchedule__title" lang="en">Result</h1>
        <p className="p-gamesSchedule__desc">雀魂牌譜の詳細成績</p>
      </div>
    </section>
    <section className={"p-gamesSchedule2 " + styles.registrationSection}>
      <div className="dataEntry__inner p-loadAnimation__target">
        <div className={"dataEntry__panel " + styles.page}>
          <StatisticsFilters key={filters} params={params} dates={dates} datesError={datesError} onApply={next => {
            setParams(next);
            setRevision(previous => previous + 1);
          }} />
          <StatisticsView key={filters + ":" + revision} filters={filters} />
          <MetricDefinitions />
        </div>
      </div>
    </section>
  </main>;
}
