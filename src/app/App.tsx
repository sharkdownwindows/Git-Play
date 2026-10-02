import { useCallback, useEffect, useReducer, useRef, useState, type KeyboardEvent } from "react";
import { CommandRefPanel } from "../commands-ref/CommandRefPanel";
import { levels } from "../levels/data";
import { Levels } from "../levels/Levels";
import { progressStore } from "../progress/store";
import type { ProgressSet } from "../progress/types";
import { VerificationTab } from "../verification/VerificationTab";
import { IntroSplash } from "./IntroSplash";
import { Practice } from "./Practice";
import { findIntroReturnFocusTarget, introSessionReducer, type IntroDestination } from "./introBehavior";
import { countCompletedLevels, nextTabIndex } from "./tabNavigation";

const TABS = [
  { id: "practice", label: "Practice", mobileLabel: "Practice" },
  { id: "levels", label: "Levels", mobileLabel: "Levels" },
  { id: "reference", label: "Reference", mobileLabel: "Reference" },
  { id: "verification", label: "Verification", mobileLabel: "Verify" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function App() {
  const [active, setActive] = useState<TabId>("practice");
  const [introState, dispatchIntro] = useReducer(introSessionReducer, "visible");
  const introVisible = introState === "visible";
  const [completedLevels, setCompletedLevels] = useState(() => countCompletedLevels(progressStore.getAll()));
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const introWasVisible = useRef(introVisible);
  const current = TABS.find((tab) => tab.id === active) ?? TABS[0];
  const hasTerminal = active === "practice" || active === "levels";
  const closeIntro = useCallback((destination: IntroDestination) => {
    setActive(destination);
    dispatchIntro("dismiss");
  }, []);

  useEffect(() => {
    const updateProgress = (progress: ProgressSet) => setCompletedLevels(countCompletedLevels(progress));
    updateProgress(progressStore.getAll());
    return progressStore.subscribe(updateProgress);
  }, []);

  useEffect(() => {
    const shouldRestoreFocus = introWasVisible.current && !introVisible;
    introWasVisible.current = introVisible;
    if (!shouldRestoreFocus) return;
    const target = findIntroReturnFocusTarget(active, (selector) => document.querySelector<HTMLElement>(selector));
    if (target === document.body) target.tabIndex = -1;
    target?.focus();
  }, [active, introVisible]);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    if (event.key === "Enter" || event.key === " ") {
      const tab = TABS[index];
      if (!tab) return;
      event.preventDefault();
      setActive(tab.id);
      return;
    }

    const nextIndex = nextTabIndex(index, event.key, TABS.length);
    if (nextIndex === null) return;
    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <>
      {introVisible && <IntroSplash onDismiss={closeIntro} />}
      <div className="app-shell" inert={introVisible}>
        <a className="skip-link" href={hasTerminal ? "#terminal-input" : "#main-content"}>
          {hasTerminal ? "Skip to terminal" : "Skip to main content"}
        </a>

        <header className="app-header">
          <div className="app-header__inner">
            <div className="app-wordmark" aria-label="GitPlay">
              <span aria-hidden="true">GitPlay</span>
              <span className="app-wordmark__dot" aria-hidden="true" />
            </div>

            <nav className="app-nav" aria-label="Primary navigation">
              <div className="app-tablist" role="tablist" aria-orientation="horizontal">
                {TABS.map((tab, index) => {
                  const selected = tab.id === active;
                  const accessibleLabel = tab.id === "levels"
                    ? `${tab.label}, ${completedLevels} of ${levels.length} complete`
                    : tab.label;

                  return (
                    <button
                      key={tab.id}
                      ref={(element) => { tabRefs.current[index] = element; }}
                      id={`${tab.id}-tab`}
                      type="button"
                      role="tab"
                      aria-label={accessibleLabel}
                      aria-selected={selected}
                      aria-controls={`${tab.id}-panel`}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setActive(tab.id)}
                      onKeyDown={(event) => handleTabKeyDown(event, index)}
                      className="app-tab"
                    >
                      <span className="app-tab__label app-tab__label--desktop">{tab.label}</span>
                      <span className="app-tab__label app-tab__label--mobile" aria-hidden="true">{tab.mobileLabel}</span>
                      {tab.id === "levels" && (
                        <span className="app-tab__progress" aria-hidden="true">{completedLevels}/{levels.length}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </header>

        <main
          id="main-content"
          className={`app-main app-main--${active === "verification" ? "document" : "workspace"}`}
        >
          <div
            id={`${current.id}-panel`}
            role="tabpanel"
            aria-labelledby={`${current.id}-tab`}
            className="app-panel"
          >
            {current.id === "practice" ? (
              <Practice />
            ) : current.id === "verification" ? (
              <VerificationTab />
            ) : current.id === "reference" ? (
              <CommandRefPanel />
            ) : (
              <Levels />
            )}
          </div>
        </main>
      </div>
    </>
  );
}
