import { useRef } from "react";
import { useActivateMain } from "../hooks/useActivateMain";
import YakuTileImages from "./YakuTileImages.jsx";
import {
  RIICHI_EXAMPLE_TILES,
  MENZEN_TSUMO_EXAMPLE_TILES,
  IPPATSU_EXAMPLE_TILES,
  TANYAO_EXAMPLE_TILES,
  PINFU_EXAMPLE_TILES,
  IIPEIKOU_EXAMPLE_TILES,
  RINSHAN_HAND_TILES,
  RINSHAN_ANKAN_TILES,
  HAITEI_EXAMPLE_TILES,
  HOUTEI_EXAMPLE_TILES,
  CHANKAN_EXAMPLE_TILES,
  YAKUHAI_EXAMPLE_TILES,
  SANSHOKU_DOUJUN_TILES,
  ITTSU_TILES,
  TOITOI_TILES,
  DABURU_RIICHI_TILES,
  CHIITOITSU_TILES,
  CHANTA_TILES,
  SANANKOU_TILES,
  KONROUTOU_TILES,
  SANKANTSU_TILES,
  SHOUSANGEN_TILES,
  SANSHOKU_DOUKOKU_TILES,
  HONITU_TILES,
  RYANPEIKOU_TILES,
  JUNCHAN_TILES,
  CHINITSU_TILES,
  KOKUSHI_TILES,
  SUANKO_TILES,
  DAISANGEN_TILES,
  JIIISSHOKU_TILES,
  RYOKUISSHOKU_TILES,
  SHOUSUSHI_TILES,
  DAISUSHI_TILES,
  CHUURENPOUTOU_TILES,
  CHINROUTOU_TILES,
  SUKANTSU_TILES,
  TENHO_TILES,
  CHIHO_TILES,
} from "./ruleListExamples.js";









































export default function RuleList() {
  const mainRef = useRef(null);

  useActivateMain(mainRef);

  return (
    <main ref={mainRef} className="l-main p-loadAnimation" role="main">
      <style>{`
        .p-yakuList {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 16px 56px;
        }

        .p-yakuList__article {
          margin: 0 auto;
          padding: 0 0 10px;
          max-width: 720px;
          margin-top: 30px;
        }

        .p-yakuList__article + .p-yakuList__article {
          margin-top: 50px;
        }

        .p-yakuList__bar {
          margin: 0 auto 16px;
          width: 100%;
          border-radius: 999px;
          background: #ececec;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          position: relative;
          padding: 6px 18px;
        }

        .p-yakuList__title {
          margin: 0;
          color: #000;
          font-size: 1.8rem;
          font-weight: 800;
          text-align: left;
          line-height: 1.1;
        }

        .p-yakuList__dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #c90000;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .p-yakuList__han {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.8rem;
          font-weight: 800;
          color: #000;
          line-height: 1;
        }

        .p-yakuList__detail {
          margin: 0 auto 20px;
          max-width: 620px;
          color: #111;
          line-height: 1.9;
          font-size: clamp(1.4rem, 2vw, 1.6rem);
          font-weight: 600;
          text-align: left;
        }

        .p-yakuList__tileWrap {
          margin: 0 auto;
          max-width: 700px;
          padding: 0;
        }

        .p-yakuList__tiles {
          display: flex;
          flex-wrap: wrap;
          gap: 0;
          justify-content: center;
          align-items: flex-end;
        }

        .p-yakuList__tile {
          width: 40px;
          height: auto;
          display: block;
        }

        .p-yakuList__tilesSplit {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 0;
        }

        .p-yakuList__meldRight {
          display: flex;
          margin-left: 20px;
        }

        @media (max-width: 767px) {
          .p-yakuList {
            padding-bottom: 48px;
          }

          .p-yakuList__article {
            margin-top: 18px;
          }

          .p-yakuList__article + .p-yakuList__article {
            margin-top: 30px;
          }

          .p-yakuList__bar {
            min-height: auto;
            padding: 18px 0 0;
            margin: 0 auto 14px;
            background: transparent;
            border-radius: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            text-align: center;
            line-height: 1;
          }

          .p-yakuList__bar::before {
            content: "";
            display: block;
            position: absolute;
            left: 50%;
            top: 0;
            transform: translateX(-50%);
            width: 156px;
            height: 12px;
            border-radius: 999px;
            background: #efefef;
            margin: 0;
          }

          .p-yakuList__dot {
            width: 7px;
            height: 7px;
            top: 6px;
            left: 50%;
            transform: translate(-50%, -50%);
          }

          .p-yakuList__title {
            font-size: 1.6rem;
            margin-top: 0;
            text-align: center;
            display: block;
            line-height: 1.25;
          }

          .p-yakuList__han {
            font-size: 1.6rem;
            position: static;
            transform: none;
            display: block;
            margin-top: 0;
            margin-left: 0;
            text-align: center;
            line-height: 1.25;
          }

          .p-yakuList__detail {
            line-height: 1.8;
          }

          .p-yakuList__tile {
            width: 34px;
          }

          .p-yakuList__meldRight {
            margin-left: 14px;
          }
        }
      `}</style>
      <section className="p-gamesSchedule">
        <div className="p-gamesSchedule__inner p-loadAnimation__target">
          <h1 className="p-gamesSchedule__title" lang="en">
            Yaku List
          </h1>
          <p className="p-gamesSchedule__desc">役一覧</p>
        </div>
      </section>

      <section className="p-yakuList">
        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">立直（リーチ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">1翻</span>
          </div>

          <p className="p-yakuList__detail">
            門前の手牌でテンパイしたとき、1000点棒を供託して「リーチ」と宣言することで成立する1翻役。宣言後は手牌を変更できず、
            ツモ和了またはロン和了で得点する。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="立直の手牌例">
              <YakuTileImages tiles={RIICHI_EXAMPLE_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">門前自摸（メンゼンツモ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">1翻</span>
          </div>

          <p className="p-yakuList__detail">
            門前の手牌で和了牌を自分でツモしたときに成立する1翻役。鳴き（チー・ポン・明槓）をしていないことが条件で、
            最後の1枚を自摸して和了すると成立する。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="門前自摸の手牌例">
              <YakuTileImages tiles={MENZEN_TSUMO_EXAMPLE_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">一発（イッパツ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">1翻</span>
          </div>

          <p className="p-yakuList__detail">
            立直宣言後、自分の次のツモ番までに和了したときに成立する1翻役。途中で鳴きが入ると一発は消滅する。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="一発の手牌例">
              <YakuTileImages tiles={IPPATSU_EXAMPLE_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">断么九（タンヤオ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">1翻</span>
          </div>

          <p className="p-yakuList__detail">
            手牌を2〜8の数牌のみで構成し、么九牌（1・9・字牌）を一切含まないと成立する1翻役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="断么九の手牌例">
              <YakuTileImages tiles={TANYAO_EXAMPLE_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">平和（ピンフ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">1翻</span>
          </div>

          <p className="p-yakuList__detail">
            門前限定で、4面子をすべて順子で構成し、雀頭は役牌以外、待ち形が両面待ちのときに成立する1翻役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="平和の手牌例">
              <YakuTileImages tiles={PINFU_EXAMPLE_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">一盃口（イーペイコー）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">1翻</span>
          </div>

          <p className="p-yakuList__detail">
            門前限定で、同一種・同一数の順子を2組そろえると成立する1翻役。例として同じ萬子の順子を2組作る。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="一盃口の手牌例">
              <YakuTileImages tiles={IIPEIKOU_EXAMPLE_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">嶺上開花（リンシャンカイホウ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">1翻</span>
          </div>

          <p className="p-yakuList__detail">
            槓をした直後に、嶺上牌（リンシャン牌）から引いた牌でツモ和了すると成立する1翻役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tilesSplit" aria-label="嶺上開花の手牌例（白の暗槓）">
              <YakuTileImages tiles={RINSHAN_HAND_TILES} keyPrefix="rinshan-hand-"  />
              <div className="p-yakuList__meldRight" aria-label="白の暗槓">
                <YakuTileImages tiles={RINSHAN_ANKAN_TILES} keyPrefix="rinshan-ankan-"  />
              </div>
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">海底摸月（ハイテイ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">1翻</span>
          </div>

          <p className="p-yakuList__detail">
            その局の最後のツモ牌（海底牌）でツモ和了したときに成立する1翻役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="海底摸月の手牌例">
              <YakuTileImages tiles={HAITEI_EXAMPLE_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">河底撈魚（ホウテイ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">1翻</span>
          </div>

          <p className="p-yakuList__detail">
            その局の最後に捨てられた牌（河底牌）をロン和了したときに成立する1翻役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="河底撈魚の手牌例">
              <YakuTileImages tiles={HOUTEI_EXAMPLE_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">槍槓（チャンカン）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">1翻</span>
          </div>

          <p className="p-yakuList__detail">
            相手が加槓しようとした牌をロン和了したときに成立する1翻役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="槍槓の手牌例">
              <YakuTileImages tiles={CHANKAN_EXAMPLE_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">役牌（ヤクハイ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">1翻</span>
          </div>

          <p className="p-yakuList__detail">
            風牌（東・南・西・北）または三元牌（白・發・中）をポン（副露）したときに成立する1翻役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="役牌の手牌例">
              <YakuTileImages tiles={YAKUHAI_EXAMPLE_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">三色同順（サンショクドウジュン）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">2翻</span>
          </div>

          <p className="p-yakuList__detail">
            萬・筒・索の3種類の牌それぞれで、同じ数字の順序牌を鳴いて構成する役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="三色同順の手牌例">
              <YakuTileImages tiles={SANSHOKU_DOUJUN_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">一気通貫（イッキツウカン）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">2翻</span>
          </div>

          <p className="p-yakuList__detail">
            萬・筒・索のいずれかで1〜9の全ての数字を順序牌で構成する役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="一気通貫の手牌例">
              <YakuTileImages tiles={ITTSU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">対々和（トイトイ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">2翻</span>
          </div>

          <p className="p-yakuList__detail">
            全ての面子がポン（副露した刻子）で構成される役。高い打点が狙える。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="トイトイの手牌例">
              <YakuTileImages tiles={TOITOI_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">二度立直（ダブルリーチ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">2翻</span>
          </div>

          <p className="p-yakuList__detail">
            配牌（ツモ1回目の前）の時点で立直を宣言した場合に成立する2翻役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="ダブル立直の手牌例">
              <YakuTileImages tiles={DABURU_RIICHI_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">七対子（チートイツ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">2翻</span>
          </div>

          <p className="p-yakuList__detail">
            7つの異なる牌の対子で構成される役。通常の役と組み合わないため、役牌や他の役とは別に評価される。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="七対子の手牌例">
              <YakuTileImages tiles={CHIITOITSU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">全帯么九（チャンタ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">2翻</span>
          </div>

          <p className="p-yakuList__detail">
            全ての面子に1・5・9などの端の牌または字牌を含む役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="チャンタの手牌例">
              <YakuTileImages tiles={CHANTA_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">三暗刻（サンアンコ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">2翻</span>
          </div>

          <p className="p-yakuList__detail">
            ツモ（自分でツモした）暗刻を3つ以上作る役。副露した刻子では成立しない。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="三暗刻の手牌例">
              <YakuTileImages tiles={SANANKOU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">混老頭（ホンロウトウ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">2翻</span>
          </div>

          <p className="p-yakuList__detail">
            手牌を1・9の么九牌と字牌のみで構成する役。全て老頭牌（1・9）と字牌で構成される。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="混老頭の手牌例">
              <YakuTileImages tiles={KONROUTOU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">三槓子（サンカンツ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">2翻</span>
          </div>

          <p className="p-yakuList__detail">
            槓（かん）を3つ作って和了する役。この和了で3つの槓が成立する必要がある。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="三槓子の手牌例">
              <YakuTileImages tiles={SANKANTSU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">小三元（ショウサンゲン）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">2翻</span>
          </div>

          <p className="p-yakuList__detail">
            三元牌（白・發・中）のうち2つをポンして、残りの1つを対子にする役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="小三元の手牌例">
              <YakuTileImages tiles={SHOUSANGEN_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">三色同刻（サンショクドウコウ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">2翻</span>
          </div>

          <p className="p-yakuList__detail">
            萬・筒・索の3種類の牌で同じ数字の刻子を3つ作る役。副露した刻子でも成立する。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="三色同刻の手牌例">
              <YakuTileImages tiles={SANSHOKU_DOUKOKU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">混一色（ホンイーソー）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">3翻</span>
          </div>

          <p className="p-yakuList__detail">
            字牌と1種類の数牌のみで手牌を構成する役。混合色の役の中で高得点が狙える。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="ホンイツの手牌例">
              <YakuTileImages tiles={HONITU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">二盃口（リャンペイコー）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">3翻</span>
          </div>

          <p className="p-yakuList__detail">
            同じ順序牌の面子を2つ作る役。一盃口の上位版で、より高い評価を得られる。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="二盃口の手牌例">
              <YakuTileImages tiles={RYANPEIKOU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">純全帯么九（ジュンチャン）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">3翻</span>
          </div>

          <p className="p-yakuList__detail">
            全ての面子が1・5・9いずれかの牌を含み、対子も1・9・字牌で構成される役。チャンタより強い。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="純チャンの手牌例">
              <YakuTileImages tiles={JUNCHAN_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">清一色（チンイーソー）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">6翻</span>
          </div>

          <p className="p-yakuList__detail">
            1種類の数牌のみで手牌を構成する役。最高翻数のため、大きな打点が狙える。鳴きがあると5翻。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="清一色の手牌例">
              <YakuTileImages tiles={CHINITSU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">国士無双（コクシムソウ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">役満</span>
          </div>

          <p className="p-yakuList__detail">
            1・9・字牌13種類で対子を1つ作る役。最高得点の特殊役の1つ。全て異なる么九牌で構成される唯一の形式。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="国士無双の手牌例">
              <YakuTileImages tiles={KOKUSHI_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">四暗刻（スーアンコ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">役満</span>
          </div>

          <p className="p-yakuList__detail">
            ツモで暗刻を4つ作る役。副露した刻子では成立しない。麀雀ではオンラインゲームのような高得点役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="四暗刻の手牌例">
              <YakuTileImages tiles={SUANKO_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">大三元（ダイサンゲン）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">役満</span>
          </div>

          <p className="p-yakuList__detail">
            三元牌（白・發・中）3つをポンして構成する役。小三元よりも難しく、より高い評価を得られる。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="大三元の手牌例">
              <YakuTileImages tiles={DAISANGEN_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">字一色（ツーイーソー）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">役満</span>
          </div>

          <p className="p-yakuList__detail">
            字牌7種類のみで手牌を構成する役。数牌を一切含まない最も特殊な形式。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="字一色の手牌例">
              <YakuTileImages tiles={JIIISSHOKU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">緑一色（リューイーソー）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">役満</span>
          </div>

          <p className="p-yakuList__detail">
            緑い牌（發と索の2・3・4・6・8）のみで手牌を構成する役。非常にレアな高得点役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="緑一色の手牌例">
              <YakuTileImages tiles={RYOKUISSHOKU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">小四喜（ショウスーシー）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">役満</span>
          </div>

          <p className="p-yakuList__detail">
            風牌4種類のうち3つをポンして、残り1つを対子にする役。大四喜よりも実現しやすい。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="小四喜の手牌例">
              <YakuTileImages tiles={SHOUSUSHI_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">大四喜（ダイスーシー）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">役満</span>
          </div>

          <p className="p-yakuList__detail">
            風牌4種類（東・南・西・北）全てをポンして構成する役。小四喜よりも難しく、より高い評価。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="大四喜の手牌例">
              <YakuTileImages tiles={DAISUSHI_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">九蓮宝燈（チューレンポートウ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">役満</span>
          </div>

          <p className="p-yakuList__detail">
            1種類の数牌で1～9の全て+対子+アンペイを揃える役。1種類のみで構成される特殊形式。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="チューレンポートーの手牌例">
              <YakuTileImages tiles={CHUURENPOUTOU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">清老頭（チンロートー）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">役満</span>
          </div>

          <p className="p-yakuList__detail">
            1・9・字牌のみで手牌を構成し、全て刻子で成立する役。国士無双と並ぶ最高得点役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="清老頭の手牌例">
              <YakuTileImages tiles={CHINROUTOU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">四槓子（スーカンツ）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">役満</span>
          </div>

          <p className="p-yakuList__detail">
            4つの槓（かん）を作って和了する役。通常プレイでは非常にレアな最高得点役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="四槓子の手牌例">
              <YakuTileImages tiles={SUKANTSU_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">天和（テンホー）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">役満</span>
          </div>

          <p className="p-yakuList__detail">
            親が配牌の時点で既に和了している状態。運と実力が詰まった最高峰の役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="天和の手牌例">
              <YakuTileImages tiles={TENHO_TILES} />
            </div>
          </div>
        </article>

        <article className="p-yakuList__article">
          <div className="p-yakuList__bar">
            <h2 className="p-yakuList__title">地和（チーホー）</h2>
            <span className="p-yakuList__dot" aria-hidden="true" />
            <span className="p-yakuList__han">役満</span>
          </div>

          <p className="p-yakuList__detail">
            子が最初のツモで既に和了している状態。天和に次ぐ幸運な役。
          </p>

          <div className="p-yakuList__tileWrap">
            <div className="p-yakuList__tiles" aria-label="地和の手牌例">
              <YakuTileImages tiles={CHIHO_TILES} />
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
