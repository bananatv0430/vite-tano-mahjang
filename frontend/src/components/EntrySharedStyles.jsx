/** 登録・編集画面で共通する入力欄、ラウンド一覧、点数操作部品などの見た目を定義する。 */
export default function EntrySharedStyles() {
  return (
    <style>{`
      .dataEntry__inner {
        width: min(920px, calc(100% - 32px));
        margin: 0 auto 0;
      }

      .dataEntry__panel {
        background: transparent;
        border-radius: 16px;
        box-shadow: none;
        padding: 24px;
      }

      .dataEntry__lead {
        margin: 0 0 18px;
        color: #666;
        font-size: 1.3rem;
        line-height: 1.7;
      }

      .dataEntry__field label {
        flex: 0 0 72px;
        margin-bottom: 0;
        color: #222;
        font-size: 1.25rem;
        font-weight: 700;
      }

      .dataEntry__input,
      .dataEntry__select,
      .dataEntry__smallInput,
      .dataEntry__smallSelect {
        width: 100%;
        border: 1px solid #d9d9d9;
        border-radius: 10px;
        background: #fff;
        color: #222;
      }

      .dataEntry__input:focus,
      .dataEntry__select:focus,
      .dataEntry__smallInput:focus,
      .dataEntry__smallSelect:focus,
      .dataEntry__mobileRollSelect:focus + .dataEntry__mobileRollButton,
      .dataEntry__mobileRollWrap:focus-within .dataEntry__mobileRollButton {
        outline: none;
        border-color: #f08300;
        box-shadow: 0 0 0 3px rgba(240, 131, 0, 0.18);
      }

      .dataEntry__input,
      .dataEntry__select {
        height: 46px;
        padding: 0 14px;
        font-size: 1.4rem;
      }

      .dataEntry__summary {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }

      .dataEntry__chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 14px;
        border-radius: 999px;
        background: #f5f6f7;
        font-size: 1.2rem;
        font-weight: 700;
        color: #222;
      }

      .dataEntry__chip strong {
        color: #f08300;
      }

      .dataEntry__subTitle {
        margin: 18px 0 12px;
        color: #f08300;
        font-size: 1.4rem;
        font-weight: 700;
      }

      .dataEntry__members {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .dataEntry__memberField {
        width: 100%;
      }

      .dataEntry__playerName {
        margin-bottom: 10px;
        color: #f08300;
        font-size: 1.25rem;
        font-weight: 700;
        line-height: 1.4;
        text-align: center;
        word-break: break-word;
      }

      .dataEntry__roundList {
        margin-top: 20px;
        display: grid;
        gap: 16px;
      }

      .dataEntry__round {
        border: 1px solid #e7e7e7;
        border-radius: 16px;
        overflow: hidden;
        background: #fff;
        transition: border-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease, transform 0.18s ease;
      }

      .dataEntry__round.is-dragging {
        opacity: 0.58;
        transform: scale(0.995);
      }

      .dataEntry__round.is-dropTarget {
        border-color: #f08300;
        box-shadow: 0 0 0 3px rgba(240, 131, 0, 0.18);
      }

      .dataEntry__roundHeader {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: #f08300;
        color: #fff;
      }

      .dataEntry__roundHeader--draggable {
        cursor: grab;
        user-select: none;
      }

      .dataEntry__roundHeader--draggable:active {
        cursor: grabbing;
      }

      .dataEntry__roundHeaderActions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
        line-height: 0;
        margin-left: auto;
      }

      .dataEntry__warningMark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        flex: 0 0 auto;
        overflow: visible;
      }

      .dataEntry__warningMark img {
        display: block;
        width: 30px;
        height: 30px;
        object-fit: contain;
        transform: scale(1.45);
        transform-origin: center;
      }

      .dataEntry__deleteIconButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .dataEntry__deleteIconButton:hover {
        opacity: 0.88;
        transform: scale(1.04);
      }

      .dataEntry__deleteIconButton:disabled {
        opacity: 0.45;
        cursor: default;
        transform: none;
      }

      .dataEntry__deleteCircle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        position: relative;
        transform: rotate(45deg);
        border: 3px solid #f08300;
        border-radius: 50%;
        background: #fff;
        box-sizing: border-box;
      }

      .dataEntry__deleteCircle::before,
      .dataEntry__deleteCircle::after {
        content: "";
        position: absolute;
        width: 58%;
        height: 3px;
        border-radius: 999px;
        background: #f08300;
      }

      .dataEntry__deleteCircle::after {
        transform: rotate(90deg);
      }

      .dataEntry__roundTitle {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 1.5rem;
        font-weight: 700;
      }

      .dataEntry__dragHandle {
        display: grid;
        grid-template-columns: repeat(2, 4px);
        gap: 3px 4px;
        opacity: 0.9;
        transition: transform 0.18s ease, opacity 0.18s ease;
      }

      .dataEntry__roundHeader--draggable:hover .dataEntry__dragHandle {
        opacity: 1;
        transform: scale(1.05);
      }

      .dataEntry__dragHandle span {
        display: block;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
      }

      .dataEntry__roundGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .dataEntry__slot {
        min-width: 0;
        padding: 16px 14px 14px;
        border-right: 1px solid #ededed;
      }

      .dataEntry__slotRow + .dataEntry__slotRow {
        margin-top: 10px;
      }

      .dataEntry__slotRow {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .dataEntry__slotLabel {
        flex: 0 0 42px;
        margin-bottom: 0;
        color: #555;
        font-size: 1.1rem;
        font-weight: 700;
      }

      .dataEntry__stepper {
        display: flex;
        align-items: stretch;
        gap: 6px;
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
      }

      .dataEntry__smallInput,
      .dataEntry__smallSelect {
        height: 40px;
        padding: 0 10px;
        font-size: 1.3rem;
      }

      .dataEntry__stepper .dataEntry__smallInput {
        flex: 1 1 0;
        width: 0;
        min-width: 0;
        box-sizing: border-box;
      }

      .dataEntry__stepButtons,
      .dataEntry__mobileRollWrap,
      .dataEntry__mobileRankButtons {
        display: none;
      }

      .dataEntry__mobileRollButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 40px;
        padding: 0;
        border: 1px solid #d9d9d9;
        border-radius: 10px;
        background: #f5f6f7;
        color: #f08300;
        font-size: 1.1rem;
        font-weight: 700;
        white-space: nowrap;
      }

      .dataEntry__mobileRollSelect {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
      }

      .dataEntry__stepButton {
        width: 24px;
        height: 19px;
        padding: 0;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        background: #f5f6f7;
        color: #f08300;
        font-size: 1rem;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
        touch-action: manipulation;
        user-select: none;
      }

      .dataEntry__stepButton:hover {
        background: #fff3e0;
      }
    `}</style>
  );
}
