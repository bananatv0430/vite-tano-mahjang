/** 対局の4人分の参加者選択欄を共通表示する。 */
export default function EntryPlayerSelectors({ selectedPlayerIds, playerOptions, onPlayerChange }) {
  return (
    <>
      <p className="dataEntry__subTitle">参加プレイヤー</p>
      <div className="dataEntry__members">
        {selectedPlayerIds.map((playerId, playerIndex) => (
          <div key={`day-player-${playerIndex}`} className="dataEntry__memberField">
            <select
              id={`data-entry-player-${playerIndex}`}
              className="dataEntry__select"
              value={playerId}
              aria-label={`参加プレイヤー${playerIndex + 1}`}
              onChange={(event) => onPlayerChange(playerIndex, event.target.value)}
            >
              <option value="">選択してください</option>
              {playerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </>
  );
}
