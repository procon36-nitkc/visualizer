import type { Position } from "@/types";

export const getCellPositionFromTarget = (
  target: EventTarget | null
): Position | null => {
  const cell = (target as HTMLElement | null)?.closest?.(".cell");
  if (!cell) return null;
  const x = Number(cell.dataset.x);
  const y = Number(cell.dataset.y);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  return { x, y };
};
