import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Main from "./pages/Main";
import ResultsByDate from "./pages/ResultsByDate";
import ResultsTotal from "./pages/ResultsTotal";
import DataRegister from "./pages/DataRegister";
import DataEditDelete from "./pages/DataEditDelete";
import Player from "./pages/Player";
import RuleList from "./pages/RuleList";
import RuleScore from "./pages/RuleScore";
import RuleFu from "./pages/RuleFu";
import RuleOrg from "./pages/RuleOrg";
import OtherSchedule from "./pages/OtherSchedule";
import OtherNews from "./pages/OtherNews";
import OtherLog from "./pages/OtherLog";

function AppLayout() {
  const location = useLocation();
  const isFirstRender = useRef(true);
  const [pageAnimationState, setPageAnimationState] = useState("-deactive");
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isRouteVisible, setIsRouteVisible] = useState(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return undefined;
    }

    const isSamePage =
      location.pathname === displayLocation.pathname &&
      location.search === displayLocation.search &&
      location.hash === displayLocation.hash;

    if (isSamePage) {
      if (location.hash) {
        const target = document.querySelector(location.hash);
        if (target) {
          target.scrollIntoView({ block: "start" });
          return undefined;
        }
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return undefined;
    }

    setPageAnimationState("-active");
    setIsRouteVisible(false);

    const timeoutId = window.setTimeout(() => {
      setDisplayLocation(location);
      setPageAnimationState("-deactive");

      window.requestAnimationFrame(() => {
        if (location.hash) {
          const target = document.querySelector(location.hash);
          if (target) {
            target.scrollIntoView({ block: "start" });
          } else {
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
          }
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }

        setIsRouteVisible(true);
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location, displayLocation]);

  return (
    <div className={`p-pageAnimation ${pageAnimationState}`}>
      <div id="wrapper">
        <Header />
        <div
          className="js-pjax"
          data-namespace="common"
          style={{
            opacity: isRouteVisible ? 1 : 0,
            transition: "opacity 400ms ease",
            pointerEvents: isRouteVisible ? "auto" : "none",
          }}
        >
          <Routes location={displayLocation}>
            <Route path="/" element={<Main />} />
            <Route path="/results/date" element={<ResultsByDate />} />
            <Route path="/results/total" element={<ResultsTotal />} />
            <Route path="/data/register" element={<DataRegister />} />
            <Route path="/data/edit-delete" element={<DataEditDelete />} />
            <Route path="/player" element={<Player />} />
            <Route path="/rule/list" element={<RuleList />} />
            <Route path="/rule/score" element={<RuleScore />} />
            <Route path="/rule/fu" element={<RuleFu />} />
            <Route path="/rule/org" element={<RuleOrg />} />
            <Route path="/other/schedule" element={<OtherSchedule />} />
            <Route path="/other/news" element={<OtherNews />} />
            <Route path="/other/log" element={<OtherLog />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="teams-template-default single single-teams postid-11545 p-body">
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </div>
  );
}

