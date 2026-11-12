/** 登録・編集画面で共通するモバイル用レイアウトを適用する。 */
export default function EntryMobileStyles() {
  return (
    <style>{`
      @media (max-width: 767px) {
        .dataEntry__inner {
          width: min(100%, calc(100% - 12px));
          margin-bottom: 0;
        }

        .dataEntry__panel {
          padding: 12px 10px;
        }

        .dataEntry__lead {
          margin-bottom: 12px;
          font-size: 1.15rem;
          line-height: 1.55;
        }

        .dataEntry__controls {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .dataEntry__field label {
          flex: 0 0 60px;
          font-size: 1.15rem;
        }

        .dataEntry__summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
          margin-top: 10px;
        }

        .dataEntry__chip {
          min-width: 0;
          justify-content: center;
          padding: 8px 6px;
          gap: 4px;
          font-size: 1rem;
          text-align: center;
          line-height: 1.3;
        }

        .dataEntry__chip:nth-child(4) {
          grid-column: 1 / -1;
        }

        .dataEntry__subTitle {
          margin: 12px 0 8px;
          font-size: 1.25rem;
        }

        .dataEntry__members {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .dataEntry__roundList {
          margin-top: 12px;
          gap: 10px;
        }

        .dataEntry__roundHeader {
          flex-direction: row;
          align-items: center;
          padding: 10px 12px;
        }

        .dataEntry__roundTitle {
          font-size: 1.35rem;
        }

        .dataEntry__roundGrid {
          grid-template-columns: 1fr;
        }

        .dataEntry__slot {
          padding: 10px 10px 8px;
          border-right: none;
          border-bottom: 1px solid #ededed;
        }

        .dataEntry__playerName {
          margin-bottom: 6px;
          font-size: 1.15rem;
          line-height: 1.3;
        }

        .dataEntry__slotRow + .dataEntry__slotRow {
          margin-top: 8px;
        }

        .dataEntry__slotRow {
          display: flex;
          align-items: center;
        }

        .dataEntry__mobileRollWrap {
          position: relative;
          display: block;
          flex: 0 0 42px;
          width: 42px;
        }

        .dataEntry__mobileRankButtons {
          display: flex;
          flex-direction: row;
          gap: 4px;
          flex: 0 0 88px;
          width: 88px;
        }

        .dataEntry__mobileRankButtons .dataEntry__stepButton {
          width: 42px;
          height: 40px;
          border-radius: 10px;
          background: #f5f6f7;
          color: #f08300;
          border: 1px solid #d9d9d9;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .dataEntry__slot:nth-child(-n + 2) {
          border-bottom: 1px solid #ededed;
        }

        .dataEntry__addWrap {
          margin-top: 12px;
        }

        .dataEntry__actions {
          margin-top: 16px;
          gap: 8px;
        }

        .dataEntry__notice,
        .dataEntry__status {
          margin-top: 10px;
        }

        .dataEntry__completeActions {
          flex-direction: column;
        }

        .dataEntry__completeButton {
          width: 100%;
        }
      }
    `}</style>
  );
}
