import React, { useEffect, useState } from "react";
import { useLoadRankings, useLoadRecentMatches } from "../hooks/useLoadMainData";
import { Link } from "react-router-dom";
import ResultsPreviewModal from "../components/ResultsPreviewModal";

const createFallbackIcon = (name) => {
	const firstChar = String(name ?? "?").slice(0, 1);
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
			<rect width="120" height="120" rx="60" fill="#f4f4f4"/>
			<circle cx="60" cy="45" r="22" fill="#f08300" opacity="0.92"/>
			<path d="M24 104c6-22 20-33 36-33s30 11 36 33" fill="#f08300" opacity="0.86"/>
			<text x="60" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">${firstChar}</text>
		</svg>
	`;

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};


import { getIconSrc } from "../utils/getIconSrc";

// ローカル画像優先＋共通getIconSrcラッパー
const getMainIconSrc = (iconPath, iconVersion, name, playerId) => {
	if (playerId && [1,2,3,4,5].includes(Number(playerId))) {
		return `/assets/media/players/player_${playerId}.png`;
	}
	return getIconSrc(iconPath, iconVersion, createFallbackIcon(name));
};

const rankingConfigs = [
	{ key: "personalScore", title: "個人スコア", valueLabel: "pt", formatter: (value) => Number(value ?? 0).toFixed(1) },
	{ key: "highScore", title: "最高スコア", valueLabel: "点", formatter: (value) => Number(value ?? 0).toLocaleString("ja-JP") },
	{ key: "avoidFourthRate", title: "4着回避率", valueLabel: "", formatter: (value) => Number(value ?? 0).toFixed(4) },
	{ key: "topCount", title: "最多トップ", valueLabel: "回数", formatter: (value) => `${Number(value ?? 0)}` },
];

const formatRecentDate = (dateValue) => {
	const [year, month, day] = String(dateValue ?? "").split("-");
	if (!year || !month || !day) {
		return { month: "-", day: "-" };
	}

	return {
		year: year,
		month: String(Number(month)),
		day: String(Number(day)),
	};
};

const normalizeRecentMatches = (dates = []) => dates.slice(0, 5).map((dateEntry) => {
	const rounds = (dateEntry.games ?? []).map((game, index) => ({
		id: game.gameId ?? `${dateEntry.date}-${index}`,
		roundNumber: Number(game.matchNumber ?? index + 1),
		ruleName: game.rule?.name || "未設定",
		players: [...(game.players ?? [])]
			.map((player) => ({
				playerId: player.playerId,
				name: player.name,
				avatar: getMainIconSrc(player.iconPath, player.iconVersion, player.name, player.playerId),
				point: Number(player.finalPoint ?? 0),
				rank: Number(player.rank ?? 0),
			}))
			.sort((a, b) => a.rank - b.rank),
	}));

	const totals = rounds.flatMap((round) => round.players).reduce((map, player) => {
		const key = String(player.playerId ?? player.name);
		if (!map[key]) {
			map[key] = {
				...player,
				totalPoint: 0,
			};
		}
		map[key].totalPoint += player.point;
		return map;
	}, {});

	const participants = [...(dateEntry.participants ?? [])]
		.map((player) => ({
			playerId: player.playerId,
			name: player.name,
			iconPath: player.iconPath,
			avatar: getMainIconSrc(player.iconPath, player.iconVersion, player.name, player.playerId),
			totalPoint: totals[String(player.playerId ?? player.name)]?.totalPoint ?? 0,
		}))
		.sort((a, b) => Number(a.playerId ?? 0) - Number(b.playerId ?? 0));

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
		participants,
		winningPlayerId,
		rounds,
	};
});

const Main = () => {
	// カスタムフックでランキング・直近対戦履歴を取得
	const { rankings, isLoadingRankings, rankingError } = useLoadRankings();
	const { recentMatches, isLoadingRecentMatches, recentMatchesError } = useLoadRecentMatches(normalizeRecentMatches);
	const [selectedMatch, setSelectedMatch] = useState(null);
	const [roundPageStart, setRoundPageStart] = useState(0);
	const [slideDirection, setSlideDirection] = useState("next");
	const [isMobileView, setIsMobileView] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 767 : false));

	useEffect(() => {
		const handleResize = () => {
			setIsMobileView(window.innerWidth <= 767);
		};

		handleResize();
		window.addEventListener("resize", handleResize);

		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		if (!selectedMatch) {
			return undefined;
		}

		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				setSelectedMatch(null);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [selectedMatch]);


	const roundsPerPage = isMobileView ? 1 : 2;
	const pageCount = selectedMatch ? 1 + Math.ceil(selectedMatch.rounds.length / roundsPerPage) : 1;
	const showTotalPage = roundPageStart === 0;
	const roundSliceStart = showTotalPage ? 0 : (roundPageStart - 1) * roundsPerPage;
	const visibleRounds = selectedMatch ? selectedMatch.rounds.slice(roundSliceStart, roundSliceStart + roundsPerPage) : [];
	const hasRoundPager = pageCount > 1;

	useEffect(() => {
		setRoundPageStart((current) => Math.min(current, Math.max(pageCount - 1, 0)));
	}, [pageCount]);

	const totalStandings = selectedMatch
		? Object.values(
				selectedMatch.rounds.flatMap((round) => round.players).reduce((totals, player) => {
					const key = String(player.playerId ?? player.name);

					if (!totals[key]) {
						totals[key] = {
							...player,
							totalPoint: 0,
						};
					}

					totals[key].totalPoint += player.point;
					return totals;
				}, {})
			)
				.sort((a, b) => b.totalPoint - a.totalPoint)
				.map((player, index) => ({
					...player,
					totalRank: index + 1,
				}))
		: [];

	const handleRoundPageChange = (direction) => {
		setSlideDirection(direction);
		setRoundPageStart((current) => {
			if (!selectedMatch) {
				return current;
			}

			if (direction === "prev") {
				return Math.max(0, current - 1);
			}

			return Math.min(current + 1, pageCount - 1);
		});
	};

	return (
		<main className="l-main p-loadAnimation" role="main">
			<style>{`
				@keyframes resultSlideNext {
					0% {
						opacity: 0.88;
						transform: translate3d(56px, 0, 0);
					}
					70% {
						opacity: 1;
						transform: translate3d(-4px, 0, 0);
					}
					100% {
						opacity: 1;
						transform: translate3d(0, 0, 0);
					}
				}

				@keyframes resultSlidePrev {
					0% {
						opacity: 0.88;
						transform: translate3d(-56px, 0, 0);
					}
					70% {
						opacity: 1;
						transform: translate3d(4px, 0, 0);
					}
					100% {
						opacity: 1;
						transform: translate3d(0, 0, 0);
					}
				}

				.resultsModal__contents {
					position: fixed;
					top: 54%;
					left: 50%;
					transform: translate(-50%, -50%);
					width: min(84vw, 700px);
				}

				@media (max-width: 767px) {
					.c-modal2__contents .p-gamesResult {
						height: auto !important;
						overflow: visible !important;
						padding: 16px 12px 24px !important;
					}

					.c-modal2__contents .p-gamesResult__date {
						font-size: 2.8rem;
						margin-bottom: 16px;
					}

					.c-modal2__contents .p-gamesResult__dotw {
						font-size: 1.6rem;
					}

					.c-modal2__contents .p-gamesResult__number {
						margin-bottom: 12px;
						font-size: 1.3rem;
					}

					.c-modal2__contents .p-gamesResult__rank-list > li:not(:last-child) {
						margin-bottom: 12px;
					}

					.c-modal2__contents .p-gamesResult__thumbnail {
						width: 72px;
						height: 72px;
					}

					.c-modal2__contents .p-gamesResult__thumbnail-wrap {
						margin-left: 10px;
					}

					.c-modal2__contents .p-gamesResult__button-wrap {
						padding-top: 12px;
						margin-bottom: 0;
					}
				}
			`}</style>
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
<div className="p-ranking__personal-container">
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
					) : items.length === 0 ? (
						<tr className="is-firstView">
							<td colSpan="3" style={{ padding: "20px 12px", textAlign: "center", color: "#666" }}>
								データなし
							</td>
						</tr>
					) : (
						items.map((item, index) => {
							const rank = index + 1;
							const rankClass = `is-${Math.min(rank, 6)}`;

							return (
								<tr key={`${config.key}-${item.playerId}`} className={`${rank === 1 ? "is-rank1 " : ""}is-firstView`}>
									<td>
										<div className={`p-ranking__personal-number ${rankClass}`}>{rank}</div>
									</td>
									<td className="p-ranking__personal-wrap">
										<div className="p-ranking__personal-thumbnail">
											<img alt={item.name} src={getMainIconSrc(item.iconPath, item.iconVersion, item.name, item.playerId)} />
										</div>
										<div className={`p-ranking__personal-name ${rankClass}`}>{item.name}</div>
									</td>
									<td className={`p-ranking__personal-point ${rankClass}`}>
										{config.formatter(item.value)}
									</td>
								</tr>
							);
						})
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
								<span className="c-schedule__date-brackets">（{match.dayText}）</span>
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