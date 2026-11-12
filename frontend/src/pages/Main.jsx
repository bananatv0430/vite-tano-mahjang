import React, { useState } from "react";
import { useLoadRankings } from "../hooks/useLoadRankings";
import { useLoadRecentMatches } from "../hooks/useLoadRecentMatches";
import { Link } from "react-router-dom";
import ResultsPreviewModal from "../components/ResultsPreviewModal";
import ResultsPreviewStyles from "../components/ResultsPreviewStyles";

import { calculateTotalStandings, formatNumber, getDisplayDateParts } from "../utils/gameUtils";
import { getRankingPlayerIconSrc } from "../utils/playerIcons";
import { normalizePlayMode, normalizeResultParticipants, normalizeResultRounds, PLAY_MODE_FILTERS } from "../utils/resultDisplayUtils";
import { useRoundPagination } from "../hooks/useRoundPagination";
import { usePreviewViewport } from "../hooks/usePreviewViewport";
import "../previewAnimations.css";

const rankingConfigs = [
	{ key: "personalScore", title: "個人スコア", valueLabel: "pt", formatter: (value) => Number(value ?? 0).toFixed(1) },
	{ key: "highScore", title: "最高スコア", valueLabel: "点", formatter: formatNumber },
	{ key: "avoidFourthRate", title: "4着回避率", valueLabel: "", formatter: (value) => Number(value ?? 0).toFixed(4) },
	{ key: "topCount", title: "最多トップ", valueLabel: "回数", formatter: (value) => `${Number(value ?? 0)}` },
];

const formatRecentDate = (dateValue) => {
	const parts = getDisplayDateParts(dateValue);
	if (!parts) {
		return { month: "-", day: "-" };
	}

	return {
		year: parts.year,
		month: parts.month,
		day: parts.day,
	};
};

const normalizeRecentMatches = (dates = []) => dates.slice(0, 5).map((dateEntry) => {
	// 共通関数で半荘・参加者を整え、トップ画面固有の日付情報を追加する。
	const normalizedPlayMode = normalizePlayMode(dateEntry.playMode ?? dateEntry.games?.[0]?.playMode);
	const rounds = normalizeResultRounds(dateEntry, { fallbackRoundId: true });
	const participants = normalizeResultParticipants(dateEntry, rounds, { order: "playerId" });

	const winningPlayerId = [...participants].sort((a, b) => b.totalPoint - a.totalPoint)[0]?.playerId;
	const displayDate = formatRecentDate(dateEntry.date);

	return {
		id: dateEntry.date,
		rawDate: dateEntry.date,
		date: `${displayDate.month}/${displayDate.day}`,
		year: displayDate.year,
		month: displayDate.month,
		day: displayDate.day,
		dayText: dateEntry.dayText || "",
		playMode: normalizedPlayMode,
		participants,
		winningPlayerId,
		rounds,
	};
});

const Main = () => {
	// カスタムフックでランキング・直近対戦履歴を取得
	const [selectedRankingFilter, setSelectedRankingFilter] = useState("all");
	const { rankings, isLoadingRankings, rankingError } = useLoadRankings(selectedRankingFilter);
	const { recentMatches, isLoadingRecentMatches, recentMatchesError } = useLoadRecentMatches(normalizeRecentMatches);
	const [selectedMatch, setSelectedMatch] = useState(null);
	const [roundPageStart, setRoundPageStart] = useState(0);
	const [slideDirection, setSlideDirection] = useState("next");
	const isMobileView = usePreviewViewport(selectedMatch, setSelectedMatch);
	const rankingAreaMinHeight = isMobileView ? "520px" : "620px";


	const {
		roundsPerPage,
		pageCount,
		showTotalPage,
		visibleRounds,
		hasRoundPager,
		handleRoundPageChange,
	} = useRoundPagination({ selectedMatch, isMobileView, roundPageStart, setRoundPageStart, setSlideDirection });

	// プレビューの総合順位も日付別結果画面と同じ計算を使う。
	const totalStandings = selectedMatch ? calculateTotalStandings(selectedMatch.rounds) : [];

	return (
		<main className="l-main p-loadAnimation" role="main">
			<ResultsPreviewStyles />
<section className="p-topAbout ">
<div className="p-topAbout__inner">
<h2 className="c-title -initial">
<span lang="en">What is T.LEAGUE</span>
<span>
田野のメンツの麻雀を、
<br className="u-sp-only" />
記録していく。
</span>
</h2>
<div className="p-topAbout__body">
<p className="p-topAbout__text">
雀荘、雀魂等で行った麻雀のデータを参照、編集するためのアプリ。機能の改善をして、結果だけではなく細かい要素の集計も行えるように改良をしていく予定。改善点、不具合含め要望があるときは伝えてほしい。一応、このサイトは限定公開になっている。許可されたアカウントのみが閲覧できるようになっている。
</p>
</div>
</div>
</section>
<section className="p-ranking js-rankingToggle" data-expanded="false">
<div className="p-ranking__inner">
				<h2 className="c-title">
				<span lang="en">ranking</span>
				<span>ランキング</span>
			</h2>
			<div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
				{PLAY_MODE_FILTERS.map((mode) => {
					const isActive = selectedRankingFilter === mode.key;
					return (
						<button
							key={mode.key}
							type="button"
							onClick={() => setSelectedRankingFilter(mode.key)}
							style={{
								minWidth: "96px",
								height: "36px",
								borderRadius: "999px",
								border: `1.5px solid ${isActive ? mode.style.activeBorderColor : mode.style.borderColor}`,
								cursor: "pointer",
								fontWeight: 700,
								fontSize: "1.3rem",
								opacity: isActive ? 1 : 0.55,
								boxShadow: isActive ? `inset 0 0 0 1px ${mode.style.activeBorderColor}` : "none",
								...mode.style,
							}}
						>
							{mode.label}
						</button>
					);
				})}
			</div>
			<div className="p-ranking__personal-container" style={{ minHeight: rankingAreaMinHeight }}>
{rankingError ? (
	<p style={{ marginBottom: "16px", textAlign: "center", color: "#c62828", fontWeight: 700 }}>
		{rankingError}
	</p>
) : null}
<div className="p-ranking__personal-columns">
{rankingConfigs.map((config) => {
	const items = rankings[config.key] ?? [];

	return (
		<div
			key={config.key}
			aria-expanded="false"
			className="p-ranking__personal-column js-rankingToggleSingle">
			<h3 className="p-ranking__personal-heading">{config.title}</h3>
			<table className="p-ranking__personal-table">
				<thead>
					<tr>
						<th>順位</th>
						<th>個人名</th>
						<th>{config.valueLabel}</th>
					</tr>
				</thead>
				<tbody>
							{isLoadingRankings ? (
						<tr className="is-firstView">
							<td colSpan="3" style={{ padding: "20px 12px", textAlign: "center", color: "#666" }}>
								読み込み中...
							</td>
						</tr>
							) : items.filter((item) => Number(item.gameCount ?? 0) > 0).length === 0 ? (
						<tr className="is-firstView">
							<td colSpan="3" style={{ padding: "20px 12px", textAlign: "center", color: "#666" }}>
								データなし
							</td>
						</tr>
					) : (
						(() => {
							let rankCounter = 0;
										const visibleItems = items.filter((item) => Number(item.gameCount ?? 0) > 0);
										return visibleItems.map((item) => {
											rankCounter++;
											const rank = rankCounter;
								const rankClass = rank ? `is-${Math.min(rank, 6)}` : "";

								return (
									<tr key={`${config.key}-${item.playerId}`} className={`${rank === 1 ? "is-rank1 " : ""}is-firstView`}>
										<td>
													<div className={`p-ranking__personal-number ${rankClass}`}>{rank}</div>
										</td>
										<td className="p-ranking__personal-wrap">
											<div className="p-ranking__personal-thumbnail">
																							{(() => {
																								const src = getRankingPlayerIconSrc(item.iconPath, item.iconVersion, item.name);
																								return <img alt={item.name} src={src} />;
																							})()}
											</div>
													<div className={`p-ranking__personal-name ${rankClass}`}>{item.name}</div>
										</td>
												<td className={`p-ranking__personal-point ${rankClass}`}>
													{config.formatter(item.value)}
										</td>
									</tr>
								);
							});
						})()
					)}
				</tbody>
			</table>
		</div>
	);
})}
</div>
</div>
</div>
</section>
<section className="p-topSchedule">
<div className="p-topSchedule__inner">
<h2 className="c-title">
<span lang="en">schedule</span>
<span>直近の対戦予定</span>
</h2>
<div>
{recentMatchesError ? (
	<p style={{ textAlign: "center", color: "#c62828", fontWeight: 700 }}>
		{recentMatchesError}
	</p>
) : isLoadingRecentMatches ? (
	<p style={{ textAlign: "center", color: "#666" }}>直近の対戦履歴を読み込み中です...</p>
) : recentMatches.length === 0 ? (
	<p style={{ textAlign: "center", color: "#666" }}>表示できる対戦履歴はありません。</p>
) : (
	<ol className="p-topSchedule__body c-schedule -top">
		{recentMatches.map((match) => (
			<li
				className="c-schedule__list"
				key={match.id}
				tabIndex="0"
				role="button"
				onClick={() => {
					setRoundPageStart(0);
					setSlideDirection("next");
					setSelectedMatch(match);
				}}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						setRoundPageStart(0);
						setSlideDirection("next");
						setSelectedMatch(match);
					}
				}}
				style={{ cursor: "pointer" }}>
				<div className="c-schedule__head">
					<div className="c-schedule__date-round">
						<p className="c-schedule__date" style={{ display: "flex", flexDirection: "column", paddingRight: "14px", lineHeight: 1.1 }}>
							<span style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "4px" }}>{match.year}</span>
							<span>
								{match.month}
								<span className="c-schedule__date-slash">/</span>
								{match.day}
												<span className="c-schedule__date-brackets" style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
											<span>（{match.dayText}）</span>
													<span
														role="img"
														aria-label={match.playMode === "online" ? "オンライン" : "オフライン"}
														style={{
															display: "block",
															width: "18px",
															height: "18px",
															flex: "none",
															margin: 0,
															transform: "scale(2.5)",
															transformOrigin: "center",
															backgroundColor: match.playMode === "online" ? "#22a55f" : "#d64545",
															WebkitMaskImage: `url(${match.playMode === "online" ? "/assets/media/icons/online.png" : "/assets/media/icons/offline.png"})`,
															maskImage: `url(${match.playMode === "online" ? "/assets/media/icons/online.png" : "/assets/media/icons/offline.png"})`,
															WebkitMaskRepeat: "no-repeat",
															maskRepeat: "no-repeat",
															WebkitMaskPosition: "center",
															maskPosition: "center",
															WebkitMaskSize: "contain",
															maskSize: "contain",
														}} />
										</span>
							</span>
						</p>
					</div>
					<ul className="c-schedule__logos">
						{match.participants.map((player) => {
							const isWinner = player.playerId === match.winningPlayerId;

							return (
								<li key={`${match.id}-${player.playerId}`}>
									<img
										alt={player.name}
										src={player.avatar}
										style={{
											objectFit: "cover",
											borderRadius: "50%",
											width: "80%",
											border: isWinner ? "2px solid #f08300" : "2px solid transparent",
											filter: isWinner ? "none" : "grayscale(100%)",
											opacity: isWinner ? 1 : 0.35,
										}}
									/>
								</li>
							);
						})}
					</ul>
				</div>
				<ul className="c-schedule__teams">
					{match.participants.map((player) => (
						<li key={`${match.id}-name-${player.playerId}`}>{player.name}</li>
					))}
				</ul>
			</li>
		))}
	</ol>
)}
</div>
<p className="p-topSchedule__btn">
<Link
	aria-label="対戦履歴一覧を表示"
	className="c-button -primary -medium"
	to="/results/date">
	詳しく見る
</Link>
</p>
</div>
<ResultsPreviewModal
	selectedMatch={selectedMatch}
	roundsPerPage={roundsPerPage}
	visibleRounds={visibleRounds}
	totalStandings={totalStandings}
	showTotalPage={showTotalPage}
	roundPageStart={roundPageStart}
	pageCount={pageCount}
	slideDirection={slideDirection}
	wrapperClassName="resultsModal__contents"
	dayText={selectedMatch?.dayText || selectedMatch?.day}
	onClose={() => setSelectedMatch(null)}
	onPageChange={handleRoundPageChange}
/>
</section>
		</main>
	);
};

export default Main;
