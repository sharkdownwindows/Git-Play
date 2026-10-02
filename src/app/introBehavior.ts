export type IntroDestination = "practice" | "levels";

export type IntroSessionState = "visible" | "dismissed";
export type IntroSessionEvent = "dismiss" | "tab-change";

export function introSessionReducer(state: IntroSessionState, event: IntroSessionEvent): IntroSessionState {
  return event === "dismiss" ? "dismissed" : state;
}

export function introExitDelay(reducedMotion: boolean): number {
  return reducedMotion ? 0 : 450;
}

export function introCtaReadyDelay(reducedMotion: boolean): number {
  return reducedMotion ? 0 : 1000;
}

export function introActivationDestination(
  key: string,
  focusedDestination?: IntroDestination,
): IntroDestination | null {
  if (key === "Enter") return "practice";
  if ((key === " " || key === "Spacebar") && focusedDestination) return focusedDestination;
  return null;
}

interface ActivationClaim {
  current: boolean;
}

export function claimIntroActivation(claim: ActivationClaim): boolean {
  if (claim.current) return false;
  claim.current = true;
  return true;
}

export function listenForIntroKeydown(
  target: EventTarget,
  listener: (event: KeyboardEvent) => void,
): () => void {
  const eventListener: EventListener = (event) => listener(event as KeyboardEvent);
  target.addEventListener("keydown", eventListener, true);
  return () => target.removeEventListener("keydown", eventListener, true);
}

interface IntroTimerTarget {
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(timer: number): void;
}

export function scheduleIntroCallback(
  target: IntroTimerTarget,
  callback: () => void,
  delay: number,
): () => void {
  const timer = target.setTimeout(callback, delay);
  return () => target.clearTimeout(timer);
}

export function findIntroReturnFocusTarget<T>(
  activeTab: string,
  find: (selector: string) => T | null,
): T | null {
  return find(`#${activeTab}-panel #terminal-input`)
    ?? find("body");
}

interface TabEvent {
  key: string;
  shiftKey: boolean;
  preventDefault(): void;
}

interface FocusableElement {
  focus(): void;
  tabIndex: number;
  hasAttribute(name: string): boolean;
  getClientRects(): { length: number };
}

interface FocusScope {
  querySelectorAll(selector: string): ArrayLike<FocusableElement>;
  contains(element: unknown): boolean;
  focus(): void;
}

const FOCUSABLE_SELECTOR = "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function trapIntroTab(event: TabEvent, scope: FocusScope, activeElement: unknown): boolean {
  if (event.key !== "Tab") return false;

  const focusable = Array.from(scope.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && element.tabIndex >= 0 && element.getClientRects().length > 0,
  );
  event.preventDefault();

  if (focusable.length === 0) {
    scope.focus();
    return true;
  }

  const activeIndex = focusable.findIndex((element) => element === activeElement);
  const outside = !scope.contains(activeElement);
  const nextIndex = outside
    ? event.shiftKey ? focusable.length - 1 : 0
    : event.shiftKey
      ? (activeIndex - 1 + focusable.length) % focusable.length
      : (activeIndex + 1) % focusable.length;
  focusable[nextIndex]?.focus();
  return true;
}
