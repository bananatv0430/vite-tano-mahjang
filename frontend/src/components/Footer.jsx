import React from "react";

const Footer = () => (
  <>
    <style>{`
      @media (max-width: 767px) {
        .p-footer__upper {
          padding-top: 12px !important;
          padding-bottom: 12px !important;
        }

        .p-footer__upper .l-footer__inner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 72px;
        }

        .p-footer__logo {
          margin-bottom: 0 !important;
          text-align: center;
        }
      }
    `}</style>
    <footer className="l-footer p-footer" role="contentinfo" style={{ backgroundColor: "#000" }}>
      <div className="p-footer__upper" style={{ paddingTop: 0, paddingBottom: 0, backgroundColor: "#000" }}>
        <div className="l-footer__inner">
          <p className="p-footer__logo">
            <a href="https://schit.net/mashiko/jhtano/"><img className="p-footer__logoImg" src="/assets/media/img/common/school_emblem.png" alt="T.League" /></a>
          </p>
          <figure className="p-footer__bird">
            <img className="p-footer__birdImg" src="/assets/media/img/common/img-bird.svg" alt="イラスト:麻雀の牌に描かれている鳥" />
          </figure>
        </div>
      </div>
      <div className="p-footer__lower">
        <div className="l-footer__inner">
          <p className="p-footer__copyright">
            <small>Copyright © <span className="p-footer__sitename">T.League</span></small>
          </p>
        </div>
      </div>
    </footer>
  </>
);

export default Footer;
