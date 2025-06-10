<script setup lang="ts">
import { ref, computed } from "vue";
import { useFieldStore } from "@/stores/field";
import { isFieldComplete } from "@/utils/isFieldComplete";
import type { Operation } from "@/types";

const props = defineProps<{
  selected: { x: number; y: number }[];
  operations: Operation[];
}>();

const emit = defineEmits<{
  (e: "update:selected", value: { x: number; y: number }[]): void;
}>();

const fieldStore = useFieldStore();
const showExport = ref(false);
const completeStatus = ref<boolean | null>(null); // ← 完成状態の保持
const isPlaying = computed(() => fieldStore.isPlaying);

const topLeft = computed(() => {
  if (props.selected.length < 2) return { x: 0, y: 0 };
  return {
    x: Math.min(props.selected[0].x, props.selected[1].x),
    y: Math.min(props.selected[0].y, props.selected[1].y),
  };
});

const size = computed(() => {
  if (props.selected.length < 2) return 0;
  const [a, b] = props.selected;
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) + 1;
});

const canRotate = computed(() => {
  if (import.meta.server) return false;
  if (props.selected.length < 2) return false;
  const { x, y } = topLeft.value;
  return (
    size.value >= 2 &&
    x + size.value <= fieldStore.size &&
    y + size.value <= fieldStore.size
  );
});

const handleRotate = () => {
  if (!canRotate.value) return;
  fieldStore.rotate(topLeft.value.x, topLeft.value.y, size.value);
};

const startPlayback = () => {
  if (props.operations.length === 0) return;
  fieldStore.startPlayback(props.operations);
};

const stopPlayback = () => {
  fieldStore.stopPlayback();
};

const handleCheckComplete = () => {
  completeStatus.value = isFieldComplete(fieldStore.field);
};
</script>

<template>
  <div class="space-y-4 mt-4">
    <div class="flex flex-wrap gap-2 items-center">
      <ClientOnly>
        <UButton
          @click="handleRotate"
          :disabled="!canRotate"
          color="success"
          icon="i-heroicons-arrow-path"
        >
          導く（90度回転）
        </UButton>

        <UButton
          @click="startPlayback"
          :disabled="isPlaying || props.operations.length === 0"
          icon="i-heroicons-play"
          color="primary"
        >
          再生
        </UButton>
        <UButton
          @click="stopPlayback"
          :disabled="!isPlaying"
          icon="i-heroicons-pause"
        >
          停止
        </UButton>

        <UButton
          @click="fieldStore.undo"
          :disabled="fieldStore.history.length === 0 || isPlaying"
          icon="i-heroicons-arrow-uturn-left"
        >
          Undo
        </UButton>

        <div class="flex items-center gap-2 ml-2">
          <label class="text-sm">速度</label>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            v-model.number="fieldStore.animationDuration"
            class="w-32"
          />
          <span class="text-sm w-12 text-right">{{ fieldStore.animationDuration }}ms</span>
        </div>
      </ClientOnly>

      <UButton
        @click="showExport = !showExport"
        icon="i-heroicons-document-text"
      >
        履歴を{{ showExport ? "隠す" : "出力" }}
      </UButton>

      <UButton @click="handleCheckComplete" icon="i-heroicons-check-circle">
        完成チェック
      </UButton>

      <span
        v-if="props.selected.length === 2"
        class="text-sm text-gray-600 dark:text-gray-300"
      >
        園: 左上 ({{ topLeft.x }}, {{ topLeft.y }}) / サイズ: {{ size }}x{{
          size
        }}
      </span>
    </div>

    <div v-if="completeStatus !== null" class="mt-1 text-sm">
      <span
        v-if="completeStatus"
        class="text-green-600 dark:text-green-400 font-semibold"
        >✔ 完成しています！</span
      >
      <span v-else class="text-red-600 dark:text-red-400 font-semibold"
        >❌ まだペアが揃っていません</span
      >
    </div>

    <div
      v-if="showExport"
      class="bg-gray-100 dark:bg-neutral-800 p-2 rounded font-mono text-sm whitespace-pre-wrap"
    >
      {{ JSON.stringify(fieldStore.exportHistoryAsOps, null, 2) }}
    </div>
  </div>
</template>
