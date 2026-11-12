/** 役の例に使う牌画像を遅延読み込みで並べて表示する。 */
export default function YakuTileImages({ tiles, keyPrefix = "" }) {
  return tiles.map((tile, index) => (
    <img
      key={`${keyPrefix}${tile}-${index}`}
      className="p-yakuList__tile"
      src={`/assets/media/img/cards/${tile}.png`}
      alt={tile}
      loading="lazy"
    />
  ));
}
