import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { IntroSplash } from "./IntroSplash";
import { INTRO_ANIMATION_MAX_MS } from "./IntroGraph";
import {
  claimIntroActivation,
  findIntroReturnFocusTarget,
  introActivationDestination,
  introCtaReadyDelay,
  introExitDelay,
  listenForIntroKeydown,
  scheduleIntroCallback,
  trapIntroTab,
} from "./introBehavior";

describe("IntroSplash", () => {
  it("renders the approved GitPlay hero, practice chips, and both destinations", () => {
    const html = renderToStaticMarkup(createElement(IntroSplash, { onDismiss: () => {} }));

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('src="/assets/usth-logo.png"');
    expect(html).toContain("GitPlay");
    expect(html).toContain("Learn Git by seeing every commit, branch, and merge.");
    expect(html).toContain("commit");
    expect(html).toContain("branch");
    expect(html).toContain("merge");
    expect(html).toContain("Start practicing");
    expect(html).toContain("Explore levels");
    expect(html).toContain("Press <kbd>Enter</kbd> to start");
    expect(html).toContain('data-intro-destination="practice"');
    expect(html).toContain('data-intro-destination="levels"');
  });

  it("renders the A2 graph as non-interactive decoration", () => {
    const html = renderToStaticMarkup(createElement(IntroSplash, { onDismiss: () => {} }));

    expect(html).toContain('class="intro-graph"');
    expect(html).toContain('viewBox="0 0 1440 900"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).toContain(">feature<");
    expect(html).toContain(">fix<");
    expect(html).toContain(">release<");
    expect(html).toContain(">HEAD<");
    expect(html).toContain(">main<");
    expect(INTRO_ANIMATION_MAX_MS).toBe(1200);
    expect(html).toContain("animation-delay:960ms");
  });

  it("has no video, poster, Rive runtime, or old intro media references", () => {
    const component = readFileSync(new URL("./IntroSplash.tsx", import.meta.url), "utf8");
    const graph = readFileSync(new URL("./IntroGraph.tsx", import.meta.url), "utf8");
    const source = `${component}\n${graph}`;

    expect(source).not.toMatch(/<video|intro\.webm|intro-poster|intro-messy-files|rive|\.riv/i);
  });

  it("maps Enter to Practice and Space only to the focused button", () => {
    expect(introActivationDestination("Enter")).toBe("practice");
    expect(introActivationDestination("Enter", "levels")).toBe("practice");
    expect(introActivationDestination(" ")).toBeNull();
    expect(introActivationDestination("Spacebar")).toBeNull();
    expect(introActivationDestination(" ", "practice")).toBe("practice");
    expect(introActivationDestination("Spacebar", "levels")).toBe("levels");
    expect(introActivationDestination("Escape", "practice")).toBeNull();
  });

  it("lets one activation schedule the 450 ms exit", () => {
    const claim = { current: false };
    const onDismiss = vi.fn();
    const callbacks: Array<() => void> = [];
    const timerTarget = {
      setTimeout: vi.fn((callback: () => void) => {
        callbacks.push(callback);
        return callbacks.length;
      }),
      clearTimeout: vi.fn(),
    };

    expect(claimIntroActivation(claim)).toBe(true);
    expect(claimIntroActivation(claim)).toBe(false);
    scheduleIntroCallback(timerTarget, onDismiss, introExitDelay(false));
    expect(timerTarget.setTimeout).toHaveBeenCalledWith(expect.any(Function), 450);
    callbacks[0]?.();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("renders the final state and exits immediately under reduced motion", () => {
    const css = readFileSync(new URL("./layout.css", import.meta.url), "utf8");
    const introCss = css.slice(css.indexOf(".intro {"), css.indexOf("@keyframes graph-node-enter"));
    expect(introCtaReadyDelay(true)).toBe(0);
    expect(introExitDelay(true)).toBe(0);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*?\.intro \*[\s\S]*?animation:\s*none !important/);
    expect(introCss).not.toMatch(/intro-pulse|infinite/);
  });

  it("moves focus to the terminal in the destination tab after closing", () => {
    const seen: string[] = [];
    const practiceInput = findIntroReturnFocusTarget("practice", (selector) => {
      seen.push(selector);
      return selector === "#practice-panel #terminal-input" ? selector : null;
    });
    expect(practiceInput).toBe("#practice-panel #terminal-input");

    const levelsInput = findIntroReturnFocusTarget("levels", (selector) => {
      return selector === "#levels-panel #terminal-input" ? selector : null;
    });
    expect(levelsInput).toBe("#levels-panel #terminal-input");
    expect(seen).toEqual(["#practice-panel #terminal-input"]);
  });

  it("cleans up its timer and global keydown listener", () => {
    let boundListener: EventListener | null = null;
    const target = {
      addEventListener: vi.fn((_type: string, candidate: EventListenerOrEventListenerObject) => {
        boundListener = candidate as EventListener;
      }),
      removeEventListener: vi.fn((_type: string, candidate: EventListenerOrEventListenerObject) => {
        if (boundListener === candidate) boundListener = null;
      }),
    } as unknown as EventTarget;
    const listener = vi.fn();
    const removeKeydown = listenForIntroKeydown(target, listener);
    (boundListener as EventListener | null)?.(new Event("keydown"));
    expect(listener).toHaveBeenCalledOnce();
    removeKeydown();
    expect(boundListener).toBeNull();

    const timerTarget = {
      setTimeout: vi.fn(() => 42),
      clearTimeout: vi.fn(),
    };
    const cancelTimer = scheduleIntroCallback(timerTarget, vi.fn(), 1000);
    cancelTimer();
    expect(timerTarget.clearTimeout).toHaveBeenCalledWith(42);
  });

  it("traps forward and reverse Tab across both CTAs", () => {
    const first = { tabIndex: 0, focused: 0, focus() { this.focused += 1; }, hasAttribute: () => false, getClientRects: () => ({ length: 1 }) };
    const last = { tabIndex: 0, focused: 0, focus() { this.focused += 1; }, hasAttribute: () => false, getClientRects: () => ({ length: 1 }) };
    const dialog = {
      querySelectorAll: () => [first, last],
      contains: (element: unknown) => element === first || element === last,
      focus: vi.fn(),
    };
    const makeEvent = (shiftKey: boolean) => ({ key: "Tab", shiftKey, preventDefault: vi.fn() });

    expect(trapIntroTab(makeEvent(false), dialog, last)).toBe(true);
    expect(first.focused).toBe(1);
    expect(trapIntroTab(makeEvent(true), dialog, first)).toBe(true);
    expect(last.focused).toBe(1);
    expect(trapIntroTab(makeEvent(false), dialog, first)).toBe(true);
    expect(last.focused).toBe(2);
    expect(trapIntroTab(makeEvent(true), dialog, last)).toBe(true);
    expect(first.focused).toBe(2);
  });
});
