import { levels } from "../levels/data";
import type { ProgressSet } from "../progress/types";

export function nextTabIndex(currentIndex: number, key: string, tabCount: number): number | null {
  if (tabCount <= 0) return null;
  if (key === "ArrowRight") return (currentIndex + 1) % tabCount;
  if (key === "ArrowLeft") return (currentIndex - 1 + tabCount) % tabCount;
  if (key === "Home") return 0;
  if (key === "End") return tabCount - 1;
  return null;
}

export function countCompletedLevels(progress: ProgressSet): number {
  return levels.reduce((count, level) => count + Number(Object.hasOwn(progress, level.id)), 0);
}
