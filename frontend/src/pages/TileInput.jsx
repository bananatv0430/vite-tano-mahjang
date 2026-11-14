import { useState } from "react";
import styles from "./TileInput.module.css";

export default function TileInput() {
  const [handTiles, setHandTiles] = useState([]);
  const melds = [];
  const [inputValue, setInputValue] = useState("");
  const [tileType, setTileType] = useState("m"); // m: 萬子, p: 筒子, s: 索子, z: 字牌

  const handleTileInput = (num, type) => {
    const tile = `${num}${type}`;
    setInputValue(tile);
  };

  const handleConfirm = () => {
    if (inputValue) {
      setHandTiles([...handTiles, inputValue]);
      setInputValue("");
    }
  };

  const handleUndo = () => {
    if (inputValue) {
      setInputValue("");
    } else if (handTiles.length > 0) {
      const newTiles = [...handTiles];
      newTiles.pop();
      setHandTiles(newTiles);
    }
  };

  const switchTileType = () => {
    if (tileType === "m") setTileType("p");
    else if (tileType === "p") setTileType("s");
    else if (tileType === "s") setTileType("z");
    else setTileType("m");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>牌入力</h1>

      {/* 手牌表示ゾーン */}
      <section className={styles.tileDisplay}>
        <h2 className={styles.displayLabel}>手牌</h2>
        <div className={styles.tileZone}>
          {handTiles.length === 0 ? (
            <div className={styles.placeholder}>牌を入力してください</div>
          ) : (
            handTiles.map((tile, idx) => (
              <div key={idx} className={styles.tile}>
                {tile}
              </div>
            ))
          )}
        </div>
      </section>

      {/* 鳴牌表示ゾーン */}
      <section className={styles.tileDisplay}>
        <h2 className={styles.displayLabel}>鳴牌</h2>
        <div className={styles.tileZone}>
          {melds.length === 0 ? (
            <div className={styles.placeholder}>鳴きはありません</div>
          ) : (
            melds.map((meld, idx) => (
              <div key={idx} className={styles.meld}>
                {meld}
              </div>
            ))
          )}
        </div>
      </section>

      {/* 入力ゾーン */}
      <section className={styles.inputDisplay}>
        <h2 className={styles.displayLabel}>入力中</h2>
        <div className={styles.inputBox}>
          {inputValue ? (
            <div className={styles.inputTile}>{inputValue}</div>
          ) : (
            <div className={styles.inputPlaceholder}>-</div>
          )}
        </div>
      </section>

      {/* キーボード */}
      <section className={styles.keyboard}>
        {/* 最上段: 手牌 鳴牌 戻る */}
        <div className={styles.keyRow}>
          <button className={styles.keyBtn + " " + styles.keyWide} onClick={() => {}}>
            手牌
          </button>
          <button className={styles.keyBtn + " " + styles.keyWide} onClick={() => {}}>
            鳴牌
          </button>
          <button className={styles.keyBtn + " " + styles.keyWide} onClick={handleUndo}>
            戻る
          </button>
        </div>

        {/* 2段目: 7 8 9 p */}
        <div className={styles.keyRow}>
          <button className={styles.keyBtn} onClick={() => handleTileInput("7", tileType)}>
            7
          </button>
          <button className={styles.keyBtn} onClick={() => handleTileInput("8", tileType)}>
            8
          </button>
          <button className={styles.keyBtn} onClick={() => handleTileInput("9", tileType)}>
            9
          </button>
          <button className={styles.keyBtn + " " + styles.keyType} onClick={() => setTileType("p")}>
            p
          </button>
        </div>

        {/* 3段目: 4 5 6 m */}
        <div className={styles.keyRow}>
          <button className={styles.keyBtn} onClick={() => handleTileInput("4", tileType)}>
            4
          </button>
          <button className={styles.keyBtn} onClick={() => handleTileInput("5", tileType)}>
            5
          </button>
          <button className={styles.keyBtn} onClick={() => handleTileInput("6", tileType)}>
            6
          </button>
          <button className={styles.keyBtn + " " + styles.keyType} onClick={() => setTileType("m")}>
            m
          </button>
        </div>

        {/* 4段目: 1 2 3 s */}
        <div className={styles.keyRow}>
          <button className={styles.keyBtn} onClick={() => handleTileInput("1", tileType)}>
            1
          </button>
          <button className={styles.keyBtn} onClick={() => handleTileInput("2", tileType)}>
            2
          </button>
          <button className={styles.keyBtn} onClick={() => handleTileInput("3", tileType)}>
            3
          </button>
          <button className={styles.keyBtn + " " + styles.keyType} onClick={() => setTileType("s")}>
            s
          </button>
        </div>

        {/* 5段目: 字牌切替 */}
        <div className={styles.keyRow}>
          <button
            className={styles.keyBtn + " " + styles.keyFull}
            onClick={switchTileType}
          >
            字牌切替
          </button>
        </div>
      </section>

      {/* 確定ボタン */}
      <section className={styles.actionButtons}>
        <button className={styles.confirmBtn} onClick={handleConfirm}>
          確定
        </button>
      </section>
    </div>
  );
}
