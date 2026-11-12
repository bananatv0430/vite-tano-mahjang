/** 結果プレビューの共通位置調整とモバイル表示ルールを適用する。 */
export default function ResultsPreviewStyles() {
  return (
    <style>{`
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
  );
}
