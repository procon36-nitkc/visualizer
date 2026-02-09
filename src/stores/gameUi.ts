import { defineStore } from "pinia";
import { ref } from "vue";
import type { Operation, Position } from "@/types";

export const useGameUiStore = defineStore("gameUi", () => {
  const selected = ref<Position[]>([]);
  const operations = ref<Operation[]>([]);
  const pairMinDistance = ref(2);
  const pairMaxDistance = ref(20);

  const setSelected = (value: Position[]) => {
    selected.value = value;
  };

  const clearSelected = () => {
    selected.value = [];
  };

  const setOperations = (ops: Operation[]) => {
    operations.value = ops;
  };

  const clearOperations = () => {
    operations.value = [];
  };

  const clampPairDistanceRange = () => {
    if (pairMinDistance.value < 1) pairMinDistance.value = 1;
    if (pairMaxDistance.value < 2) pairMaxDistance.value = 2;
    if (pairMinDistance.value >= pairMaxDistance.value) {
      pairMinDistance.value = pairMaxDistance.value - 1;
    }
  };

  return {
    selected,
    operations,
    pairMinDistance,
    pairMaxDistance,
    setSelected,
    clearSelected,
    setOperations,
    clearOperations,
    clampPairDistanceRange,
  };
});
