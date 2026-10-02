import { useCallback, useEffect, useRef, useState } from "react";
import { IntroGraph } from "./IntroGraph";
import {
  claimIntroActivation,
  introActivationDestination,
  introCtaReadyDelay,
  introExitDelay,
  listenForIntroKeydown,
  scheduleIntroCallback,
  trapIntroTab,
  type IntroDestination,
} from "./introBehavior";

function readReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface Props {
  onDismiss(destination: IntroDestination): void;
}

function PracticeChip({ kind }: { kind: "commit" | "branch" | "merge" }) {
  return (
    <li>
      <svg viewBox="0 0 12 12" aria-hidden="true">
        {kind === "commit" ? (
          <circle cx="6" cy="6" r="3.5" />
        ) : kind === "merge" ? (
          <>
            <path d="M3 1.5v7a2 2 0 0 0 2 2h4" />
            <path d="M3 5.5h2a2 2 0 0 0 2-2v-2" />
            <circle className="intro-chip__merge-dot" cx="3" cy="9.5" r="1.6" />
          </>
        ) : (
          <path d="M3 1.5v9M3 4.5h3a2 2 0 0 0 2-2v-1" />
        )}
      </svg>
      <span>{kind}</span>
    </li>
  );
}

export function IntroSplash({ onDismiss }: Props) {
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion);
  const [leaving, setLeaving] = useState(false);
  const [destination, setDestination] = useState<IntroDestination>("practice");
  const [keyboardUsed, setKeyboardUsed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const activationClaimedRef = useRef(false);

  const dismiss = useCallback((nextDestination: IntroDestination) => {
    if (!claimIntroActivation(activationClaimedRef)) return;
    setDestination(nextDestination);
    setLeaving(true);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(query.matches);
    query.addEventListener?.("change", updatePreference);
    return () => query.removeEventListener?.("change", updatePreference);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      setKeyboardUsed(true);
      const focusedDestination = document.activeElement instanceof HTMLElement
        ? document.activeElement.dataset.introDestination as IntroDestination | undefined
        : undefined;
      const nextDestination = introActivationDestination(event.key, focusedDestination);
      if (nextDestination) {
        event.preventDefault();
        dismiss(nextDestination);
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) return;
      trapIntroTab(event, {
        querySelectorAll: (selector) => dialog.querySelectorAll<HTMLElement>(selector),
        contains: (element) => element instanceof Node && dialog.contains(element),
        focus: () => dialog.focus(),
      }, document.activeElement);
    };

    return listenForIntroKeydown(window, handleKeyDown);
  }, [dismiss]);

  useEffect(() => {
    if (leaving) return;
    return scheduleIntroCallback(window, () => primaryRef.current?.focus(), introCtaReadyDelay(reducedMotion));
  }, [leaving, reducedMotion]);

  useEffect(() => {
    if (!leaving) return;
    return scheduleIntroCallback(window, () => onDismiss(destination), introExitDelay(reducedMotion));
  }, [destination, leaving, onDismiss, reducedMotion]);

  return (
    <div
      ref={dialogRef}
      className={`intro ${leaving ? "intro--leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      tabIndex={-1}
    >
      <div className="intro__dot-grid" aria-hidden="true" />
      <IntroGraph />

      <main className="intro__hero">
        <div className="intro__logo" role="img" aria-label="USTH — Vietnam France University">
          <img className="intro__logo-part intro__logo-part--symbol" src="/assets/usth-logo.png" alt="" />
          <img className="intro__logo-part intro__logo-part--wordmark" src="/assets/usth-logo.png" alt="" />
          <img className="intro__logo-part intro__logo-part--subline" src="/assets/usth-logo.png" alt="" />
        </div>

        <h1 id="intro-title">GitPlay<span aria-hidden="true">.</span></h1>
        <p className="intro__tagline">Learn Git by seeing every commit, branch, and merge.</p>

        <ul className="intro__chips" aria-label="What you will practice">
          <PracticeChip kind="commit" />
          <PracticeChip kind="branch" />
          <PracticeChip kind="merge" />
        </ul>

        <div className="intro__actions">
          <button
            ref={primaryRef}
            className="intro__action intro__action--primary"
            type="button"
            data-intro-destination="practice"
            data-intro-autofocus={!keyboardUsed ? "true" : undefined}
            onClick={() => dismiss("practice")}
          >
            Start practicing
          </button>
          <button
            className="intro__action intro__action--secondary"
            type="button"
            data-intro-destination="levels"
            onClick={() => dismiss("levels")}
          >
            Explore levels
          </button>
        </div>

        <p className="intro__hint">Press <kbd>Enter</kbd> to start</p>
      </main>
    </div>
  );
}
