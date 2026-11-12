import React from "react";

const Footer = () => (
  <>
    <style>{`
      .p-footer__bird {
        width: 200px;
      }

      .p-footer__birdImg {
        display: block;
        filter:
          drop-shadow(1px 0 0 rgba(255, 255, 255, 0.98))
          drop-shadow(-1px 0 0 rgba(255, 255, 255, 0.98))
          drop-shadow(0 1px 0 rgba(255, 255, 255, 0.98))
          drop-shadow(0 -1px 0 rgba(255, 255, 255, 0.98))
          drop-shadow(1px 1px 0 rgba(255, 255, 255, 0.98))
          drop-shadow(-1px 1px 0 rgba(255, 255, 255, 0.98))
          drop-shadow(1px -1px 0 rgba(255, 255, 255, 0.98))
          drop-shadow(-1px -1px 0 rgba(255, 255, 255, 0.98));
      }

      .p-footer__birdLink {
        display: block;
      }

      @media (max-width: 767px) {
        .p-footer__bird {
          width: 68px;
          top: -48px;
          left: 10px;
        }

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
            <a className="p-footer__birdLink" href="https://www.town.mashiko.lg.jp/" target="_blank" rel="noreferrer">
              <img className="p-footer__birdImg" src="/assets/media/img/common/mashikotto.png" alt="イラスト:mashikotto" />
            </a>
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
