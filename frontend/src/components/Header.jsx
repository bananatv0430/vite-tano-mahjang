import React, { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  // 各メニューの開閉状態を管理
  const [openMenu, setOpenMenu] = useState(null);
  // ハンバーガーメニューの開閉状態
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleMenu = (name) => setOpenMenu(name);
  const closeMenu = () => setOpenMenu(null);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenuAll = () => {
    setIsMenuOpen(false);
    setOpenMenu(null);
  };
  return (
    <header className="l-header p-header" role="banner">
    <div className="l-header__inner">
    <h1 className="p-header__logo">
      <Link
        aria-current="page"
        className="p-header__logoLink"
        to="/"
        onClick={closeMenuAll}
      >
        <img
          alt="M.League"
          className="p-header__logoImg"
          src="/assets/media/img/common/tano-logo.svg"
          style={{ pointerEvents: "auto" }}
        />
      </Link>
    </h1>
    <nav aria-label="メインメニュー" className="p-globalNavi">
      <button
        aria-haspopup="true"
        className="p-globalNavi__btn js-menu"
        type="button"
        aria-expanded={isMenuOpen}
        onClick={toggleMenu}
      >
        <svg
          className="p-globalNavi__icon"
          height="36"
          role="img"
          viewBox="0 0 36 36"
          width="36"
          xmlns="http://www.w3.org/2000/svg">
          <title>メニュー</title>
          <rect
            className="p-globalNavi__bar -top"
            height="6"
            rx="3"
            ry="3"
            width="36"
            y="2"
          />
          <rect
            className="p-globalNavi__bar -center"
            height="6"
            rx="3"
            ry="3"
            width="36"
            y="15"
          />
          <rect
            className="p-globalNavi__bar -bottom"
            height="6"
            rx="3"
            ry="3"
            width="36"
            y="28"
          />
        </svg>
      </button>
      <div className="c-modal" hidden={!isMenuOpen} onClick={closeMenuAll}>
        <div className="c-modal__contents" role="dialog">
          <ul className="p-globalNavi__list">
            {/* 対戦成績 */}
            <li
              className={`p-globalNavi__item${openMenu === 'results' ? ' -menuOpen' : ''}`}
              onMouseEnter={() => handleMenu('results')}
              onMouseLeave={closeMenu}
            >
              <span className="p-globalNavi__link" >対戦成績</span>
              <div className="p-globalNavi__itemMenu" style={{ display: openMenu === 'results' ? 'block' : 'none' }}>
                <Link className="p-globalNavi__link" to="/results/date" onClick={closeMenuAll}>対戦履歴</Link>
                <Link className="p-globalNavi__link" to="/results/total" onClick={closeMenuAll}>累計成績</Link>
              </div>
            </li>
            {/* データ編集 */}
            <li
              className={`p-globalNavi__item${openMenu === 'data' ? ' -menuOpen' : ''}`}
              onMouseEnter={() => handleMenu('data')}
              onMouseLeave={closeMenu}
            >
              <span className="p-globalNavi__link" tabIndex={0}>データ編集</span>
              <div className="p-globalNavi__itemMenu" style={{ display: openMenu === 'data' ? 'block' : 'none' }}>
                <Link className="p-globalNavi__link" to="/data/register" onClick={closeMenuAll}>データ登録</Link>
                <Link className="p-globalNavi__link" to="/data/edit-delete" onClick={closeMenuAll}>データ編集・削除</Link>
              </div>
            </li>
            {/* プレイヤー */}
            <li className="p-globalNavi__item">
              <Link className="p-globalNavi__link" to="/player" onClick={closeMenuAll}>プレイヤー</Link>
            </li>
            {/* ルール */}
            <li
              className={`p-globalNavi__item${openMenu === 'rule' ? ' -menuOpen' : ''}`}
              onMouseEnter={() => handleMenu('rule')}
              onMouseLeave={closeMenu}
            >
              <span className="p-globalNavi__link" tabIndex={0}>ルール</span>
              <div className="p-globalNavi__itemMenu" style={{ display: openMenu === 'rule' ? 'block' : 'none' }}>
                <Link className="p-globalNavi__link" to="/rule/list" onClick={closeMenuAll}>役一覧</Link>
                <Link className="p-globalNavi__link" to="/rule/score" onClick={closeMenuAll}>点数早見表</Link>
                <Link className="p-globalNavi__link" to="/rule/fu" onClick={closeMenuAll}>符計算アプリ</Link>
                <Link className="p-globalNavi__link" to="/rule/org" onClick={closeMenuAll}>各団体ルール</Link>
              </div>
            </li>
            {/* その他 */}
            <li
              className={`p-globalNavi__item${openMenu === 'other' ? ' -menuOpen' : ''}`}
              onMouseEnter={() => handleMenu('other')}
              onMouseLeave={closeMenu}
            >
              <span className="p-globalNavi__link" tabIndex={0}>その他</span>
              <div className="p-globalNavi__itemMenu" style={{ display: openMenu === 'other' ? 'block' : 'none' }}>
                <Link className="p-globalNavi__link" to="/other/schedule" onClick={closeMenuAll}>スケジュール</Link>
                <Link className="p-globalNavi__link" to="/other/news" onClick={closeMenuAll}>ニュース</Link>
                <Link className="p-globalNavi__link" to="/other/log" onClick={closeMenuAll}>ログ</Link>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </div>
</header>
  );
};

export default Header;
