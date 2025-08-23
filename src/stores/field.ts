import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { Operation, Problem } from "@/types";
import { applyRotation } from "~/utils/rotation";

export const useFieldStore = defineStore("field", () => {
  const size = ref<number>(4);
  const field = ref<number[][]>([]);
  const history = ref<Operation[]>([]);
  const originalField = ref<number[][] | null>(null);
  const animator = ref<((op: Operation, apply: () => void) => Promise<void>) | null>(null);
  const animation = ref<{
    op: Operation;
    clockwise: boolean;
    from: number[][];
  } | null>(null);

  const animationDuration = ref(500); // ms default
  let animTimeout: ReturnType<typeof setTimeout> | null = null;
  let animResolve: (() => void) | null = null;

  const isPlaying = ref(false);
  const playbackIndex = ref(0);
  let playbackSnapshot: number[][] | null = null;
  let playbackStartIndex: number | null = null;
  let playbackLength = 0;

  const clearAnimation = (applyPending = false) => {
    if (animTimeout) {
      clearTimeout(animTimeout);
      animTimeout = null;
    }
    if (applyPending && animation.value) {
      const { op, clockwise } = animation.value;
      field.value = applyRotation(field.value, op.x, op.y, op.n, clockwise);
      history.value.push({ ...op });
    }
    if (animResolve) {
      animResolve();
      animResolve = null;
    }
    animation.value = null;
  };

  const setAnimator = (fn: ((op: Operation, apply: () => void) => Promise<void>) | null) => {
    animator.value = fn;
  };

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
    originalField.value = newField.map((r) => [...r]);
  };

  const applyOperation = async (
    op: Operation,
    clockwise = true,
    animated = false,
    recordHistory = true
  ): Promise<void> => {
    clearAnimation();
    if (animated && animator.value) {
      await animator.value(op, () => {
        field.value = applyRotation(field.value, op.x, op.y, op.n, clockwise);
        if (recordHistory) history.value.push({ ...op });
      });
      return;
    }

    if (!animated) {
      field.value = applyRotation(field.value, op.x, op.y, op.n, clockwise);
      if (recordHistory) history.value.push({ ...op });
      return;
    }

    animation.value = { op, clockwise, from: field.value.map((r) => [...r]) };

    await new Promise<void>((resolve) => {
      animResolve = resolve;
      animTimeout = setTimeout(() => {
        field.value = applyRotation(field.value, op.x, op.y, op.n, clockwise);
        if (recordHistory) history.value.push({ ...op });
        clearAnimation();
        resolve();
      }, animationDuration.value);
    });
  };

  const clearPlaybackSnapshot = () => {
    playbackSnapshot = null;
    playbackStartIndex = null;
    playbackLength = 0;
    playbackIndex.value = 0;
  };

  const rotate = (x: number, y: number, n: number): void => {
    clearAnimation();
    applyOperation({ x, y, n }, true, false);
  };

  const startPlayback = async (ops: Operation[]) => {
    if (isPlaying.value) return;
    clearAnimation();
    if (
      playbackSnapshot &&
      playbackStartIndex !== null &&
      history.value.length !== playbackStartIndex + playbackLength
    ) {
      alert("最初から再生し直します。回転操作は失われますがよいですか？");
      field.value = playbackSnapshot.map((r) => [...r]);
      history.value = history.value.slice(0, playbackStartIndex);
      playbackLength = 0;
      playbackIndex.value = 0;
    }
    if (!playbackSnapshot || playbackStartIndex === null) {
      playbackSnapshot = field.value.map((r) => [...r]);
      playbackStartIndex = history.value.length;
    }

    playbackIndex.value = playbackLength;
    isPlaying.value = true;
    try {
      for (let i = playbackLength; i < ops.length; i++) {
        if (!isPlaying.value) break;
        const op = ops[i];
        await applyOperation(op, true, true);
        playbackLength++;
        playbackIndex.value = playbackLength;
        if (!animator.value && isPlaying.value) {
          await new Promise((r) => setTimeout(r, animationDuration.value));
        }
      }
    } finally {
      isPlaying.value = false;
      clearAnimation();
    }
  };

  const stopPlayback = () => {
    isPlaying.value = false;
    clearAnimation(true);
  };

  const resetField = (): void => {
    if (!originalField.value) return;
    field.value = originalField.value.map((r) => [...r]);
    history.value = [];
    isPlaying.value = false;
    clearAnimation();
    clearPlaybackSnapshot();
  };

  const undo = (): void => {
    clearAnimation();
    if (
      playbackStartIndex !== null &&
      history.value.length === playbackStartIndex + playbackLength
    ) {
      for (let i = playbackLength - 1; i >= 0; i--) {
        const op = history.value.pop();
        if (op) field.value = applyRotation(field.value, op.x, op.y, op.n, false);
      }
      clearPlaybackSnapshot();
      return;
    }

    const last = history.value.pop();
    if (last) {
      field.value = applyRotation(field.value, last.x, last.y, last.n, false);
    }
  };

  const canReset = computed(() => originalField.value !== null);

  const setFieldFromProblem = (problem: Problem): void => {
    const entities = problem.field.entities;
    if (!Array.isArray(entities) || entities.length === 0) {
      throw new Error("Invalid entities");
    }

    size.value = entities.length;
    field.value = entities.map((row) => [...row]);
    history.value = [];
    originalField.value = field.value.map((r) => [...r]);
  };

  const exportHistoryAsOps = computed(() => {
    const reduced: Operation[] = [];
    let buffer: Operation[] = [];

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

  const beginSeek = (ops: Operation[]) => {
    if (
      !playbackSnapshot ||
      playbackStartIndex === null ||
      history.value.length !== playbackStartIndex + playbackLength
    ) {
      playbackSnapshot = field.value.map((r) => [...r]);
      playbackStartIndex = history.value.length;
    } else {
      field.value = playbackSnapshot.map((r) => [...r]);
      history.value = history.value.slice(0, playbackStartIndex);
    }
    playbackIndex.value = playbackLength;
  };

  const seekTo = (index: number, ops: Operation[]) => {
    if (!playbackSnapshot || playbackStartIndex === null) return;
    field.value = playbackSnapshot.map((r) => [...r]);
    history.value = history.value.slice(0, playbackStartIndex);
    playbackIndex.value = Math.max(0, Math.min(index, ops.length));
    for (let i = 0; i < playbackIndex.value; i++) {
      const op = ops[i];
      field.value = applyRotation(field.value, op.x, op.y, op.n, true);
      history.value.push({ ...op });
    }
  };

  const commitSeek = (index: number, ops: Operation[]) => {
    seekTo(index, ops);
    playbackLength = playbackIndex.value;
    if (playbackLength === 0) {
      clearPlaybackSnapshot();
    }
  };


  return {
    size,
    field,
    history,
    originalField,
    canReset,
    animation,
    animationDuration,
    isPlaying,
    playbackIndex,
    setAnimator,
    generateField,
    applyOperation,
    rotate,
    startPlayback,
    stopPlayback,
    resetField,
    undo,
    setFieldFromProblem,
    exportHistoryAsOps,
    beginSeek,
    seekTo,
    commitSeek,
  };
});
