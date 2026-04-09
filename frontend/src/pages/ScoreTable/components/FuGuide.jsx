import React from "react";
import styles from "../ScoreTable.module.css";
import Tile from "./Tile";

export default function FuGuide() {
  const isWip = true; // ← falseで表、trueで「実装中」表示
  if (isWip) {
    return <div style={{textAlign: 'center', fontSize: 20, fontWeight: 'bold', margin: '32px 0'}}>実装中</div>;
  }
  return (
    <div className={styles.fuGuideSection}>
      {/* 符計算早見表 */}
        <div className={styles.fuGuideSection}>
          {/* <h2 className={styles.title}>符計算早見表</h2> 削除 */}
          <div className={styles.fuGuideContent}>
            <div className={styles.fuGuideLeft}>
              <div className={styles.fuRulesList}>
                <div className={styles.fuRuleCardWrapper}>
                  <div className={`${styles.fuRuleCard} ${styles.red}`}>
                    <span className={styles.fuRuleNumber}>①</span>
                    <div className={styles.fuRuleContent}>
                      <div className={styles.fuRuleTitle}>基本符</div>
                      <div className={styles.fuRuleDesc}>副底（フーティ）：20符</div>
                    </div>
                  </div>
                  <div className={styles.fuPlusSign}>⊕</div>
                </div>
                <div className={styles.fuRuleCardWrapper}>
                  <div className={`${styles.fuRuleCard} ${styles.orange}`}>
                    <span className={styles.fuRuleNumber}>②</span>
                    <div className={styles.fuRuleContent}>
                      <div className={styles.fuRuleTitle}>アガリ方</div>
                      <div className={styles.fuRuleDesc}>メンゼンロン：10符、ツモ：2符</div>
                    </div>
                  </div>
                  <div className={styles.fuPlusSign}>⊕</div>
                </div>
                <div className={styles.fuRuleCardWrapper}>
                  <div className={`${styles.fuRuleCard} ${styles.green}`}>
                    <span className={styles.fuRuleNumber}>③</span>
                    <div className={styles.fuRuleContent}>
                      <div className={styles.fuRuleTitle}>各メンツ</div>
                      <div className={styles.fuRuleDesc}>順子の場合：0符<br/>刻子や槓子の場合：プラス2～32符</div>
                    </div>
                  </div>
                  <div className={styles.fuPlusSign}>⊕</div>
                </div>
                <div className={styles.fuRuleCardWrapper}>
                  <div className={`${styles.fuRuleCard} ${styles.cyan}`}>
                    <span className={styles.fuRuleNumber}>④</span>
                    <div className={styles.fuRuleContent}>
                      <div className={styles.fuRuleTitle}>アタマ</div>
                      <div className={styles.fuRuleDesc}>雀頭が役牌の場合：プラス2符</div>
                    </div>
                  </div>
                  <div className={styles.fuPlusSign}>⊕</div>
                </div>
                <div className={styles.fuRuleCardWrapper}>
                  <div className={`${styles.fuRuleCard} ${styles.blue}`}>
                    <span className={styles.fuRuleNumber}>⑤</span>
                    <div className={styles.fuRuleContent}>
                      <div className={styles.fuRuleTitle}>待ちの形</div>
                      <div className={styles.fuRuleDesc}>アガリが1種の場合：プラス2符<br/>アガリが2種以上の場合：0符</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* 右側：4つの表 */}
          <div className={styles.fuGuideRight}>
            {/* 各メンツによる加符点 */}
            <div className={styles.fuTableBlockDouble}>
              <h3 className={styles.fuTableTitle}>各メンツによる加符点</h3>
              <div className={styles.fuTablePair}>
                <table className={styles.fuDetailTable}>
                  <thead>
                    <tr>
                      <th>メンツ</th>
                      <th>例</th>
                      <th>符</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.fuTableLabel}>
                        <div>順子</div>
                        <div className={styles.fuTableKana}>シュンツ</div>
                      </td>
                      <td>
                        <div className={styles.tileImages}>
                          <Tile name="m2-h" alt="2萬" className={styles.tileImgRotated} />
                          <Tile name="m3" alt="3萬" className={styles.tileImg} />
                          <Tile name="m4" alt="4萬" className={styles.tileImg} />
                        </div>
                      </td>
                      <td className={styles.fuTableValue}>0</td>
                    </tr>
                    <tr>
                      <td className={styles.fuTableLabel}>
                        <div>明刻</div>
                        <div className={styles.fuTableKana}>ミンコ</div>
                      </td>
                      <td>
                        <div className={styles.tileImages}>
                          <Tile name="p5-h" alt="5筒" className={styles.tileImgRotated} />
                          <Tile name="p5" alt="5筒" className={styles.tileImg} />
                          <Tile name="p5" alt="5筒" className={styles.tileImg} />
                        </div>
                      </td>
                      <td className={styles.fuTableValue}>2</td>
                    </tr>
                    <tr>
                      <td className={styles.fuTableLabel}>
                        <div>暗刻</div>
                        <div className={styles.fuTableKana}>アンコ</div>
                      </td>
                      <td>
                        <div className={styles.tileImages}>
                          <Tile name="s5" alt="5索" className={styles.tileImg} />
                          <Tile name="s5" alt="5索" className={styles.tileImg} />
                          <Tile name="s5" alt="5索" className={styles.tileImg} />
                        </div>
                      </td>
                      <td className={styles.fuTableValue}>4</td>
                    </tr>
                    <tr>
                      <td className={styles.fuTableLabel}>
                        <div>明槓</div>
                        <div className={styles.fuTableKana}>ミンカン</div>
                      </td>
                      <td>
                        <div className={styles.tileImages}>
                          <Tile name="p5-h" alt="5筒" className={styles.tileImgRotated} />
                          <Tile name="p5" alt="5筒" className={styles.tileImg} />
                          <Tile name="p5" alt="5筒" className={styles.tileImg} />
                          <Tile name="p5" alt="5筒" className={styles.tileImg} />
                        </div>
                      </td>
                      <td className={styles.fuTableValue}>8</td>
                    </tr>
                    <tr>
                      <td className={styles.fuTableLabel}>
                        <div>暗槓</div>
                        <div className={styles.fuTableKana}>アンカン</div>
                      </td>
                      <td>
                        <div className={styles.tileImages}>
                          <Tile name="back" alt="裏" className={styles.tileImgBack} />
                          <Tile name="s5" alt="5索" className={styles.tileImg} />
                          <Tile name="s5" alt="5索" className={styles.tileImg} />
                          <Tile name="back" alt="裏" className={styles.tileImgBack} />
                        </div>
                      </td>
                      <td className={styles.fuTableValue}>16</td>
                    </tr>
                  </tbody>
                </table>
                
                <table className={styles.fuDetailTable}>
                  <thead>
                    <tr>
                      <th>例</th>
                      <th>符</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={styles.fuTableRightRow}>
                      <td>
                        <div className={styles.tileImages} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px'}}>
                          <span className={styles.fuTableExampleHyphen}>-</span>
                        </div>
                      </td>
                      <td className={styles.fuTableValue}>0</td>
                    </tr>
                    <tr className={styles.fuTableRightRow}>
                      <td>
                        <div className={styles.tileImages}>
                          <Tile name="east-h" alt="東" className={styles.tileImgRotated} />
                          <Tile name="east" alt="東" className={styles.tileImg} />
                          <Tile name="east" alt="東" className={styles.tileImg} />
                        </div>
                      </td>
                      <td className={styles.fuTableValue}>4</td>
                    </tr>
                    <tr className={styles.fuTableRightRow}>
                      <td>
                        <div className={styles.tileImages}>
                          <Tile name="green" alt="發" className={styles.tileImg} />
                          <Tile name="green" alt="發" className={styles.tileImg} />
                          <Tile name="green" alt="發" className={styles.tileImg} />
                        </div>
                      </td>
                      <td className={styles.fuTableValue}>8</td>
                    </tr>
                    <tr className={styles.fuTableRightRow}>
                      <td>
                        <div className={styles.tileImages}>
                          <Tile name="east-h" alt="東" className={styles.tileImgRotated} />
                          <Tile name="east" alt="東" className={styles.tileImg} />
                          <Tile name="east" alt="東" className={styles.tileImg} />
                          <Tile name="east" alt="東" className={styles.tileImg} />
                        </div>
                      </td>
                      <td className={styles.fuTableValue}>16</td>
                    </tr>
                    <tr className={styles.fuTableRightRow}>
                      <td>
                        <div className={styles.tileImages}>
                          <Tile name="back" alt="裏" className={styles.tileImgBack} />
                          <Tile name="green" alt="發" className={styles.tileImg} />
                          <Tile name="green" alt="發" className={styles.tileImg} />
                          <Tile name="back" alt="裏" className={styles.tileImgBack} />
                        </div>
                      </td>
                      <td className={styles.fuTableValue}>32</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 待ちの形による加符点 */}
            <div className={styles.fuTableBlock}>
              <h3 className={styles.fuTableTitle}>待ちの形による加符点</h3>
              <table className={styles.fuDetailTable}>
                <thead>
                  <tr>
                    <th></th>
                    <th>待ちの形</th>
                    <th>符</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.fuTableLabel}>
                      <div>両面</div>
                      <div className={styles.fuTableKana}>リャンメン</div>
                    </td>
                    <td>
                      <div className={styles.tileImages}>
                        <Tile name="m2" alt="2萬" className={styles.tileImg} />
                        <Tile name="m3" alt="3萬" className={styles.tileImg} />
                      </div>
                    </td>
                    <td className={styles.fuTableValue}>0</td>
                  </tr>
                  <tr>
                    <td className={styles.fuTableLabel}>
                      <div>双碰</div>
                      <div className={styles.fuTableKana}>シャンポン</div>
                    </td>
                    <td>
                      <div className={styles.tileImages}>
                        <Tile name="m1" alt="1萬" className={styles.tileImg} />
                        <Tile name="m1" alt="1萬" className={styles.tileImg} />
                        <Tile name="m2" alt="2萬" className={styles.tileImg} />
                        <Tile name="m2" alt="2萬" className={styles.tileImg} />
                      </div>
                    </td>
                    <td className={styles.fuTableValue}>0</td>
                  </tr>
                  <tr>
                    <td className={styles.fuTableLabel}>
                      <div>辺張</div>
                      <div className={styles.fuTableKana}>ペンチャン</div>
                    </td>
                    <td>
                      <div className={styles.tileImages}>
                        <Tile name="m1" alt="1萬" className={styles.tileImg} />
                        <Tile name="m2" alt="2萬" className={styles.tileImg} />
                      </div>
                    </td>
                    <td className={styles.fuTableValue}>2</td>
                  </tr>
                  <tr>
                    <td className={styles.fuTableLabel}>
                      <div>嵌張</div>
                      <div className={styles.fuTableKana}>カンチャン</div>
                    </td>
                    <td>
                      <div className={styles.tileImages}>
                        <Tile name="m2" alt="2萬" className={styles.tileImg} />
                        <Tile name="m4" alt="4萬" className={styles.tileImg} />
                      </div>
                    </td>
                    <td className={styles.fuTableValue}>2</td>
                  </tr>
                  <tr>
                    <td className={styles.fuTableLabel}>
                      <div>単騎</div>
                      <div className={styles.fuTableKana}>タンキ</div>
                    </td>
                    <td>
                      <div className={styles.tileImages}>
                        <Tile name="m1" alt="1萬" className={styles.tileImg} />
                      </div>
                    </td>
                    <td className={styles.fuTableValue}>2</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </div>
          
          <div className={styles.fuGuideNotes}>
            <p>※ 符計算は、10符位に切り上げて計算します（例：42符の場合は50符）</p>
            <p>※ 特例として、平和ツモは一律20符、七対子は一律25符となります</p>
          </div>
        </div>
    </div>
  );
}