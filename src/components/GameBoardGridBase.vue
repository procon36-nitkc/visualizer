<script setup lang="ts">
import type { BoardOverlay } from "@/composables/useGameBoardOverlay";

const props = withDefaults(
  defineProps<{
    field: number[][];
    size: number;
    overlay: BoardOverlay | null;
    overlayStyle: Record<string, string>;
    cellFontSize: string;
    boardClass?: string;
    boardStyle?: Record<string, string | number>;
    cellClassName?: string;
    overlayClassName?: string;
    getBaseCellStyle: (value: number) => Record<string, string>;
    getCellStyleObject: (value: number, x: number, y: number) => Record<string, string>;
    getCellClass?: (x: number, y: number) => string;
  }>(),
  {
    boardClass: "grid relative",
    boardStyle: undefined,
    cellClassName: "",
    overlayClassName: "z-20",
    getCellClass: undefined,
  }
);
</script>

<template>
  <div
    :class="props.boardClass"
    :style="{
      ...props.boardStyle,
      gridTemplateColumns: `repeat(${props.size}, minmax(2.5rem, 1fr))`,
    }"
  >
    <slot name="background-layer" />

    <div
      v-if="props.overlay"
      :class="`absolute pointer-events-none grid border-2 border-red-500 ${props.overlayClassName}`"
      :style="{
        ...props.overlayStyle,
        gridTemplateColumns: `repeat(${props.overlay.op.n}, minmax(2.5rem, 1fr))`,
      }"
    >
      <template v-for="(row, oy) in props.overlay.cells" :key="`o-${oy}`">
        <div
          v-for="(cell, ox) in row"
          :key="`o-${oy}-${ox}`"
          class="cell relative aspect-square border border-gray-300 dark:border-neutral-700 text-center flex items-center justify-center font-bold"
          :style="{ ...props.getBaseCellStyle(cell), fontSize: props.cellFontSize }"
        />
      </template>
    </div>

    <template v-for="(row, y) in props.field" :key="y">
      <div
        v-for="(cell, x) in row"
        :key="`${y}-${x}`"
        class="cell relative aspect-square border border-gray-300 dark:border-neutral-700 text-center flex items-center justify-center font-bold"
        :data-x="x"
        :data-y="y"
        :class="[props.cellClassName, props.getCellClass ? props.getCellClass(x, y) : '']"
        :style="{ ...props.getCellStyleObject(cell, x, y), fontSize: props.cellFontSize }"
      >
        {{ cell }}
        <slot name="cell-overlay" :x="x" :y="y" :cell="cell" />
      </div>
    </template>
  </div>
</template>
