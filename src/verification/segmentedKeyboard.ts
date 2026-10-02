export function nextSegmentIndex(currentIndex: number, key: string, itemCount: number): number | null {
  if (itemCount <= 0) return null;
  if (key === "ArrowRight" || key === "ArrowDown") return (currentIndex + 1) % itemCount;
  if (key === "ArrowLeft" || key === "ArrowUp") return (currentIndex - 1 + itemCount) % itemCount;
  if (key === "Home") return 0;
  if (key === "End") return itemCount - 1;
  return null;
}
