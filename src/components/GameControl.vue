<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useFieldStore } from "@/stores/field";
import { useGameUiStore } from "@/stores/gameUi";
import { isFieldComplete } from "@/utils/isFieldComplete";
import { storeToRefs } from "pinia";
import { useSelectionGeometry } from "@/composables/useSelectionGeometry";

const fieldStore = useFieldStore();
const gameUiStore = useGameUiStore();
const { selected, operations, pairMinDistance, pairMaxDistance } = storeToRefs(gameUiStore);
const showExport = ref(false);
const completeStatus = ref<boolean | null>(null); // ← 完成状態の保持
const isPlaying = computed(() => fieldStore.isPlaying);
const customStep = ref(10);
const { hasSelection, topLeft, squareSize } = useSelectionGeometry(selected);
const pairDistanceUpperBound = computed(() => Math.max(2, fieldStore.size * 2));

const clampPairDistanceByBoardSize = () => {
  if (pairMaxDistance.value > pairDistanceUpperBound.value) {
    pairMaxDistance.value = pairDistanceUpperBound.value;
  }
  gameUiStore.clampPairDistanceRange();
};

watch(pairDistanceUpperBound, clampPairDistanceByBoardSize, { immediate: true });

const canRotate = computed(() => {
  if (import.meta.server) return false;
  if (!hasSelection.value) return false;
  if (!topLeft.value) return false;
  const { x, y } = topLeft.value;
  return (
    squareSize.value >= 2 &&
    x + squareSize.value <= fieldStore.size &&
    y + squareSize.value <= fieldStore.size
  );
});

const handleRotate = () => {
  if (!canRotate.value || !topLeft.value) return;
  fieldStore.rotate(topLeft.value.x, topLeft.value.y, squareSize.value);
};

const startPlayback = () => {
  if (operations.value.length === 0) return;
  fieldStore.startPlayback(operations.value);
};

const stopPlayback = () => {
  fieldStore.stopPlayback();
};

const handleReset = () => {
  if (window.confirm('リセットしますか？')) {
    fieldStore.resetField();
    gameUiStore.clearSelected();
  }
};

const handleCheckComplete = () => {
  completeStatus.value = isFieldComplete(fieldStore.field);
};

const stepSeek = (delta: number) => {
  const target = Math.min(
    Math.max(fieldStore.playbackIndex + delta, 0),
    operations.value.length
  );
  fieldStore.beginSeek(operations.value);
  fieldStore.commitSeek(target, operations.value);
};

const handlePairDistanceInput = () => {
  clampPairDistanceByBoardSize();
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
          :disabled="isPlaying || operations.length === 0"
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
          :max="operations.length"
          v-model.number="fieldStore.playbackIndex"
          @mousedown="fieldStore.beginSeek(operations)"
          @input="fieldStore.seekTo(fieldStore.playbackIndex, operations)"
          @mouseup="fieldStore.commitSeek(fieldStore.playbackIndex, operations)"
          @touchend="fieldStore.commitSeek(fieldStore.playbackIndex, operations)"
          :disabled="isPlaying"
          class="w-48"
        />

        <div class="flex items-center gap-1 ml-2">
          <span class="text-sm min-w-[10rem]"
            >step: {{ fieldStore.playbackIndex }}/{{ operations.length }}</span
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

        <div class="flex items-center gap-2 ml-2">
          <label class="text-sm">距離Min</label>
          <input
            type="range"
            min="1"
            :max="Math.max(1, pairMaxDistance - 1)"
            step="1"
            v-model.number="pairMinDistance"
            @input="handlePairDistanceInput"
            class="w-24"
          />
          <span class="text-sm w-8 text-right">{{ pairMinDistance }}</span>
          <label class="text-sm">距離Max</label>
          <input
            type="range"
            :min="pairMinDistance + 1"
            :max="pairDistanceUpperBound"
            step="1"
            v-model.number="pairMaxDistance"
            @input="handlePairDistanceInput"
            class="w-24"
          />
          <span class="text-sm w-8 text-right">{{ pairMaxDistance }}</span>
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
        v-if="hasSelection && topLeft"
        class="text-sm text-gray-600 dark:text-gray-300"
      >
        園: 左上 ({{ topLeft.x }}, {{ topLeft.y }}) / サイズ: {{ squareSize }}x{{
          squareSize
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
