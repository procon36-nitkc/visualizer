import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { Operation, OperationWithDir, Problem } from "@/types";
import { applyRotation } from "~/utils/rotation";

export const useFieldStore = defineStore("field", () => {
  const size = ref<number>(4);
  const field = ref<number[][]>([]);
  const history = ref<OperationWithDir[]>([]);
  const animator = ref<((op: OperationWithDir) => Promise<void>) | null>(null);

  const generateField = (): void => {
    const total = size.value * size.value;
    const values: number[] = [];
    for (let i = 0; i < total / 2; i++) values.push(i, i);

    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    const newField: number[][] = [];
    for (let y = 0; y < size.value; y++) {
      newField.push(values.slice(y * size.value, (y + 1) * size.value));
    }

    field.value = newField;
    history.value = [];
  };

  const setAnimator = (fn: ((op: OperationWithDir) => Promise<void>) | null) => {
    animator.value = fn;
  };

  const applyOperation = async (
    op: OperationWithDir,
    animated = false
  ): Promise<void> => {
    if (animated && animator.value) {
      await animator.value(op);
    }
    field.value = applyRotation(field.value, op.x, op.y, op.n, op.clockwise);
    history.value.push({ ...op });
  };

  const rotate = (x: number, y: number, n: number): void => {
    applyOperation({ x, y, n, clockwise: true });
  };

  const undo = (): void => {
    const last = history.value.pop();
    if (last) {
      field.value = applyRotation(
        field.value,
        last.x,
        last.y,
        last.n,
        !last.clockwise
      );
    }
  };

  const setFieldFromProblem = (problem: Problem): void => {
    const entities = problem.field.entities;
    if (!Array.isArray(entities) || entities.length === 0) {
      throw new Error("Invalid entities");
    }

    size.value = entities.length;
    field.value = entities.map((row) => [...row]);
    history.value = [];
  };

  const exportHistoryAsOps = computed(() => {
    const reduced: OperationWithDir[] = [];
    let buffer: OperationWithDir[] = [];

    const flushBuffer = () => {
      if (buffer.length === 0) return;

      // 4回で1サイクル → 残す回数 = buffer.length % 4
      const keep = buffer.length % 4;
      for (let i = 0; i < keep; i++) {
        reduced.push(buffer[i]);
      }

      buffer = [];
    };

    for (const op of history.value) {
      const last = buffer[buffer.length - 1];
      if (last && last.x === op.x && last.y === op.y && last.n === op.n) {
        buffer.push(op);
      } else {
        flushBuffer();
        buffer = [op];
      }
    }

    flushBuffer();

    return {
      ops: reduced.map((op) => ({ x: op.x, y: op.y, n: op.n })),
    };
  });


  return {
    size,
    field,
    history,
    generateField,
    setAnimator,
    applyOperation,
    rotate,
    undo,
    setFieldFromProblem,
    exportHistoryAsOps,
  };
});
