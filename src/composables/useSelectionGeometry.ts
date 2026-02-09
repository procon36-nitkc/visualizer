import { computed, type Ref } from "vue";
import type { Position } from "@/types";

export const useSelectionGeometry = (selected: Ref<Position[]>) => {
  const hasSelection = computed(() => selected.value.length >= 2);

  const topLeft = computed<Position | null>(() => {
    if (!hasSelection.value) return null;
    const [a, b] = selected.value;
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
    };
  });

  const squareSize = computed(() => {
    if (!hasSelection.value) return 0;
    const [a, b] = selected.value;
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) + 1;
  });

  const selectionRect = computed(() => {
    if (!hasSelection.value) return null;
    const [a, b] = selected.value;
    return {
      x0: Math.min(a.x, b.x),
      x1: Math.max(a.x, b.x),
      y0: Math.min(a.y, b.y),
      y1: Math.max(a.y, b.y),
    };
  });

  const isInGarden = (x: number, y: number): boolean => {
    if (!topLeft.value || squareSize.value === 0) return false;
    return (
      x >= topLeft.value.x &&
      x < topLeft.value.x + squareSize.value &&
      y >= topLeft.value.y &&
      y < topLeft.value.y + squareSize.value
    );
  };

  const isInSelectionRect = (x: number, y: number): boolean => {
    if (!selectionRect.value) return false;
    return (
      x >= selectionRect.value.x0 &&
      x <= selectionRect.value.x1 &&
      y >= selectionRect.value.y0 &&
      y <= selectionRect.value.y1
    );
  };

  return {
    hasSelection,
    topLeft,
    squareSize,
    selectionRect,
    isInGarden,
    isInSelectionRect,
  };
};
