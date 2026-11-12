import DataEntryRound from "./DataEntryRound";

/** 各半荘の得点入力行を共通の一覧として描画する。 */
export default function EntryRoundList({
  rounds,
  roundStartNumber,
  roundValidations,
  selectedPlayers,
  isMobileView,
  isDeleteDisabled,
  isDragEnabled,
  draggedRoundId,
  dragOverRoundId,
  onRemoveRound,
  onUpdateRoundPlayer,
  onScoreCommit,
  onScoreKeyDown,
  onScoreStep,
  onRankStep,
  onRoundDragStart,
  onRoundDragOver,
  onRoundDrop,
  onRoundDragEnd,
  registerScoreInputRef,
}) {
  return (
    <div className="dataEntry__roundList">
      {rounds.map((round, roundIndex) => (
        <DataEntryRound
          key={round.id}
          round={round}
          roundIndex={roundIndex}
          roundStartNumber={roundStartNumber}
          isRoundValid={roundValidations[roundIndex]?.isValid ?? true}
          selectedPlayers={selectedPlayers}
          isMobileView={isMobileView}
          isDeleteDisabled={isDeleteDisabled}
          isDragEnabled={isDragEnabled}
          isDragging={draggedRoundId === round.id}
          isDropTarget={dragOverRoundId === round.id && draggedRoundId !== round.id}
          onRemoveRound={onRemoveRound}
          onUpdateRoundPlayer={onUpdateRoundPlayer}
          onScoreCommit={onScoreCommit}
          onScoreKeyDown={onScoreKeyDown}
          onScoreStep={onScoreStep}
          onRankStep={onRankStep}
          onRoundDragStart={onRoundDragStart}
          onRoundDragOver={onRoundDragOver}
          onRoundDrop={onRoundDrop}
          onRoundDragEnd={onRoundDragEnd}
          registerScoreInputRef={registerScoreInputRef}
        />
      ))}
    </div>
  );
}
