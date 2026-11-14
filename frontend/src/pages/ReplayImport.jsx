import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActivateMain } from "../hooks/useActivateMain";
import { useLoadReferenceData } from "../hooks/useLoadReferenceData";
import { apiFetch } from "../utils/apiFetch";
import DataEntryMessageModal from "../components/DataEntryMessageModal";
import EntrySharedStyles from "../components/EntrySharedStyles";
import styles from "./ReplayImport.module.css";

async function sendReplay(payload, path = "/api/replays") {
  const response = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.message || "牌譜の登録に失敗しました");
  return result.data;
}

function loadPreview(replay, options) {
  const head = replay?.head;
  if (![3, 4].includes(head?.result?.players?.length) || !head.start_time) throw new Error("対応する牌譜JSONを選択してください");
  const accounts = new Map((head.accounts ?? []).map(player => [player.seat ?? 0, player]));
  const date = new Date((head.start_time + 9 * 3600) * 1000).toISOString().slice(0, 10);
  const players = head.result.players.map((result, index) => {
    const seat = result.seat ?? 0;
    const account = accounts.get(seat);
    const name = account?.nickname || "CPUプレイヤー";
    const accountId = Number.isSafeInteger(account?.account_id) && account.account_id > 0 ? String(account.account_id) : null;
    const exact = options.filter(player => player.name === name);
    const cpu = options.filter(player => player.name === "CPU" || player.name === "CPUプレイヤー");
    const matches = accounts.has(seat) ? exact : cpu;
    return { seat, name, accountId, cpu: !accounts.has(seat), rank: index + 1, score: result.part_point_1 ?? 0, playerId: matches.length === 1 ? matches[0].id : "" };
  });
  return { replay, date, players };
}

function PlayerMapping({ players, options, disabled, onChange, onConfirm }) {
  const pending = players.filter(player => !player.linked);
  const humans = players.filter(player => !player.cpu).map(player => player.playerId);
  const cpuIds = new Set(players.filter(player => player.cpu).map(player => player.playerId));
  const duplicate = new Set(humans).size !== humans.length || humans.some(id => id && cpuIds.has(id));

  return (
    <fieldset disabled={disabled}>
      <legend className="dataEntry__subTitle">雀魂アカウントの紐づけ</legend>
      <p>対応する登録選手を選択してください。保存した紐づけは次回の取り込みにも使われます。</p>
      {pending.map(player => (
        <label key={player.seat}>
          {player.name}{player.accountId && `（ID ${player.accountId}）`}
          <select className="dataEntry__select" value={player.playerId} onChange={event => onChange(player.seat, event.target.value)}>
            <option value="">登録選手を選択</option>
            {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </label>
      ))}
      {duplicate && players.every(player => player.playerId) && <p role="alert">同じ登録選手が選ばれています。紐づけを確認してください。</p>}
      <button className="c-button -primary -medium" type="button" disabled={duplicate || players.some(player => !player.playerId)} onClick={onConfirm}>
        決定
      </button>
    </fieldset>
  );
}

export default function ReplayImport() {
  const mainRef = useRef(null);
  const navigate = useNavigate();
  const [savedEntry, setSavedEntry] = useState(null);
  useActivateMain(mainRef);
  const { playerOptions, isLoadingPlayers } = useLoadReferenceData();
  const [entries, setEntries] = useState([]);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState("");
  const [mode, setMode] = useState("register");
  const [batchStatus, setBatchStatus] = useState("");
  const pending = entries.filter(entry => !entry.done && !entry.error);
  const hasSaved = entries.some(entry => entry.saved);
  const hasReplays = entries.some(entry => entry.replay);
  const invalidFiles = entries.some(entry => entry.error);
  const canSave = date && pending.length && !invalidFiles && pending.every(entry =>
    entry.confirmed && (!entry.candidates || entry.gameId));

  function changeSettings(setValue, value) {
    setValue(value);
    setBatchStatus("");
    setEntries(current => current.map(entry => entry.done ? entry :
      { ...entry, candidates: null, gameId: "", status: "" }));
  }

  function update(index, change) {
    setEntries(current => current.map((entry, i) => i === index ? { ...entry, ...change } : entry));
  }

  async function chooseFiles(event) {
    const files = [...event.target.files];
    event.target.value = "";
    if (!files.length) return;
    setBusy(true);
    try {
      const previews = await Promise.all(files.map(async file => {
        try {
          const preview = loadPreview(JSON.parse((await file.text()).replace(/^\uFEFF/, "")), playerOptions);
          return { ...preview, name: file.name, gameId: "" };
        } catch (error) {
          return { name: file.name, error: error.message };
        }
      }));
      const firstDate = previews.flatMap(entry => entry.date ? [entry.date] : []).sort()[0] ?? "";
      setDate(previous => !entries.length && previous ? previous : firstDate);
      setBatchStatus("");
      const accountIds = [...new Set(previews.flatMap(entry => entry.players ?? [])
        .filter(player => player.accountId).map(player => Number(player.accountId)))];
      try {
        const saved = accountIds.length ? await sendReplay({ accountIds }, '/api/replays/player-accounts') : [];
        const validIds = new Set(playerOptions.map(player => String(player.id)));
        const mappings = new Map(saved.map(row => [String(row.accountId), String(row.playerId)])
          .filter(([, playerId]) => validIds.has(playerId)));
        setEntries(previews.map(entry => {
          if (!entry.players) return entry;
          const players = entry.players.map(player => ({
            ...player,
            playerId: mappings.get(player.accountId) ?? player.playerId,
            linked: mappings.has(player.accountId) || (player.cpu && Boolean(player.playerId)),
          }));
          return { ...entry, players, confirmed: players.every(player => player.linked) };
        }));
      } catch {
        setEntries(previews.map(entry => entry.players ? {
          ...entry, error: "紐づけを読み込めませんでした。ファイルを選び直してください。",
        } : entry));
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitAll(event) {
    event.preventDefault();
    if (!canSave || busy) return;

    const mappings = new Map();
    for (const entry of pending) {
      for (const player of entry.players) {
        if (!player.accountId) continue;
        const playerId = String(player.playerId);
        if (mappings.has(player.accountId) && mappings.get(player.accountId) !== playerId) {
          setBatchStatus(`「${player.name}」の紐づけが対局によって異なります。登録選手を揃えてください。`);
          return;
        }
        mappings.set(player.accountId, playerId);
      }
    }

    setBusy(true);
    setBatchStatus("保存中…");
    let saved = 0;
    let duplicates = 0;
    let remaining = 0;
    let hasResult = false;
    let hasDetails = false;
    try {
      for (const [index, entry] of entries.entries()) {
        if (entry.done) continue;
        try {
          const response = await sendReplay({
            replay: entry.replay, date, mode, gameId: entry.gameId,
            players: Object.fromEntries(entry.players.map(player => [player.seat, player.playerId])),
          });
          if (response.status === "choose-game") {
            remaining++;
            update(index, { candidates: response.candidates, gameId: "", status: "一致する既存成績を選択してください。" });
          } else if (response.status === "saved") {
            saved++;
            hasResult ||= response.hasResult;
            hasDetails ||= response.hasDetails;
            update(index, { done: true, saved: true, status: "保存済み" });
          } else {
            duplicates++;
            update(index, { done: true, status: "登録済み" });
          }
        } catch (error) {
          remaining++;
          update(index, { status: error.message });
        }
      }
      const message = `保存 ${saved}件 ／ 登録済み ${duplicates}件 ／ 未保存 ${remaining}件`;
      setBatchStatus(message);
      if (saved) setSavedEntry({ date, hasResult, hasDetails, message, remaining });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main ref={mainRef} className="l-main u-next-fill-gray p-loadAnimation">
      <EntrySharedStyles />
      <section className="p-gamesSchedule">
        <div className="p-gamesSchedule__inner p-loadAnimation__target">
          <h1 className="p-gamesSchedule__title" lang="en">Entry</h1>
          <p className="p-gamesSchedule__desc">雀魂データ登録</p>
        </div>
      </section>
      <section className={"p-gamesSchedule2 " + styles.registrationSection}>
        <div className="dataEntry__inner p-loadAnimation__target">
          <div className={"dataEntry__panel " + styles.page}>
          <form className={styles.batchSettings} onSubmit={submitAll}>
            <label className={styles.batchFile}>保存済みの牌譜JSON
              <input className={styles.fileInput} type="file" accept=".json,application/json" multiple
                disabled={busy || isLoadingPlayers} onChange={chooseFiles} />
            </label>
            {hasReplays && <>
              <label>対局日
                <input className="dataEntry__input" type="date" required value={date} disabled={busy || hasSaved}
                  onChange={event => changeSettings(setDate, event.target.value)} />
              </label>
              <label>登録内容
                <select className="dataEntry__select" value={mode} disabled={busy || hasSaved}
                  onChange={event => changeSettings(setMode, event.target.value)}>
                  <option value="register">結果と詳細データ</option>
                  <option value="result">結果のみ</option>
                  <option value="detail">詳細データのみ</option>
                </select>
              </label>
            </>}
            {hasReplays && <button className="c-button -primary -medium" disabled={busy || !canSave}>一括保存</button>}
          </form>
          {invalidFiles && <p role="alert">読み込めないファイルがあります。ファイルを選び直してください。</p>}
          {pending.some(entry => !entry.confirmed) && <p>紐づけを決定すると一括保存できます。</p>}
          <p role="status">{batchStatus}</p>
          <div className="dataEntry__roundList">{entries.map((entry, index) => (
            <div key={entry.name + index}>
              {entry.error || entry.confirmed ? (
                <article className="dataEntry__round">
                  <header className="dataEntry__roundHeader"><h2>{entry.name}</h2></header>
                  <div className={styles.entryBody}>
                    {entry.error ? <p role="alert">{entry.error}</p> : <>
                      <p>{entry.players.length}人戦</p>
                      <h3 className="dataEntry__subTitle">対局結果</h3>
                      <ol className={styles.resultList}>
                        {entry.players.map(player => (
                          <li key={player.seat}>
                            <span>{player.rank}位</span>
                            <span>{playerOptions.find(option => String(option.id) === String(player.playerId))?.name}</span>
                            <strong>{player.score.toLocaleString("ja-JP")}点</strong>
                          </li>
                        ))}
                      </ol>
                      <fieldset disabled={busy || entry.done}>
                        {entry.candidates && <label>
                          対象の既存成績
                          <select className="dataEntry__select" value={entry.gameId} onChange={event => update(index, { gameId: event.target.value })}>
                            <option value="">対局を選択</option>
                            {entry.candidates.map(game => <option key={game.id} value={game.id}>第{game.matchNumber}試合（ID {game.id}）</option>)}
                          </select>
                        </label>}
                      </fieldset>
                      {!entry.done && entry.players.some(player => !player.linked) && (
                        <button className="c-button -primary -medium" type="button" disabled={busy}
                          onClick={() => update(index, { confirmed: false, candidates: null, gameId: "", status: "" })}>
                          紐づけを変更
                        </button>
                      )}
                      <p role="status">{entry.status}</p>
                    </>}
                  </div>
                </article>
              ) : (
                <section className="dataEntry__round">
                  <header className="dataEntry__roundHeader"><h2>{entry.name}</h2></header>
                  <div className={styles.entryBody}>
                    <PlayerMapping players={entry.players} options={playerOptions} disabled={busy}
                      onChange={(seat, playerId) => update(index, {
                        players: entry.players.map(player => player.seat === seat ? { ...player, playerId } : player),
                      })}
                      onConfirm={() => update(index, { confirmed: true })} />
                  </div>
                </section>
              )}
            </div>
          ))}</div>
          </div>
        </div>
        </section>
      <DataEntryMessageModal
        isOpen={Boolean(savedEntry)}
        title={savedEntry?.remaining ? "一部保存完了" : "登録完了"}
        message={savedEntry?.message}
        onClose={() => setSavedEntry(null)}
        popupClassName={styles.completionPopup}
        buttons={savedEntry ? [
          ...(savedEntry.hasResult ? [{ label: "結果確認", onClick: () => navigate("/results/date") }] : []),
          ...(savedEntry.hasDetails ? [{ label: "詳細結果確認", onClick: () => navigate("/results/replay-stats?" + new URLSearchParams({
            date: savedEntry.date,
          })) }] : []),
          { label: "閉じる", onClick: () => setSavedEntry(null) },
        ] : []}
      />
    </main>
  );
}
