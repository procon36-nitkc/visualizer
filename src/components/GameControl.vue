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
const customStep = ref(10);

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

const handleReset = () => {
  if (window.confirm('リセットしますか？')) {
    fieldStore.resetField();
    emit('update:selected', []);
  }
};

const handleCheckComplete = () => {
  completeStatus.value = isFieldComplete(fieldStore.field);
};

const stepSeek = (delta: number) => {
  const target = Math.min(
    Math.max(fieldStore.playbackIndex + delta, 0),
    props.operations.length
  );
  fieldStore.beginSeek(props.operations);
  fieldStore.commitSeek(target, props.operations);
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
          一時停止
        </UButton>

        <input
          type="range"
          min="0"
          :max="props.operations.length"
          v-model.number="fieldStore.playbackIndex"
          @mousedown="fieldStore.beginSeek(props.operations)"
          @input="fieldStore.seekTo(fieldStore.playbackIndex, props.operations)"
          @mouseup="fieldStore.commitSeek(fieldStore.playbackIndex, props.operations)"
          @touchend="fieldStore.commitSeek(fieldStore.playbackIndex, props.operations)"
          :disabled="isPlaying"
          class="w-48"
        />

        <div class="flex items-center gap-1 ml-2">
          <span class="text-sm"
            >{{ fieldStore.playbackIndex }}/{{ props.operations.length }}</span
          >
          <label class="text-sm ml-1">N</label>
          <UInput
            v-model.number="customStep"
            type="number"
            min="1"
            class="w-16"
            :disabled="isPlaying"
          />
          <UButton
            @click="stepSeek(-customStep)"
            :disabled="isPlaying"
            size="xs"
            >{{ customStep }}手戻る</UButton
          >
          <UButton
            @click="stepSeek(-5)"
            :disabled="isPlaying"
            size="xs"
            >5手戻る</UButton
          >
          <UButton
            @click="stepSeek(-1)"
            :disabled="isPlaying"
            size="xs"
            >1手戻る</UButton
          >
          <span>|</span>
          <UButton
            @click="stepSeek(1)"
            :disabled="isPlaying"
            size="xs"
            >1手進む</UButton
          >
          <UButton
            @click="stepSeek(5)"
            :disabled="isPlaying"
            size="xs"
            >5手進む</UButton
          >
          <UButton
            @click="stepSeek(customStep)"
            :disabled="isPlaying"
            size="xs"
            >{{ customStep }}手進む</UButton
          >
        </div>

        <UButton
          @click="fieldStore.undo"
          :disabled="fieldStore.history.length === 0 || isPlaying"
          icon="i-heroicons-arrow-uturn-left"
        >
          Undo
        </UButton>
        <UButton
          @click="handleReset"
          :disabled="!fieldStore.canReset"
          icon="i-heroicons-arrow-path-rounded-square"
          color="warning"
        >
          リセット
        </UButton>

        <div class="flex items-center gap-2 ml-2">
          <label class="text-sm">速度</label>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
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
