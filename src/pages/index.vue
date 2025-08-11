<template>
  <div class="p-4 space-y-6 max-w-screen-lg mx-auto">
    <h1 class="text-2xl font-bold text-center">パズルゲーム</h1>

    <!-- 🛠 フィールド設定エリア -->
    <section class="space-y-2">
      <div class="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <label class="font-semibold">フィールドサイズ（偶数）:</label>
        <UInput
          v-model.number="size"
          type="number"
          min="4"
          max="24"
          step="2"
          class="w-32"
        />
        <UButton @click="handleGenerate" color="primary">ランダム生成</UButton>
      </div>

      <div>
        <UTabs :items="items" default-value="json">
          <template #json="{ item }">
            <div>
              <div>
              <label class="font-semibold">問題JSON読み込み:</label>
              <UTextarea
                v-model="problemInput"
                class="mt-1 w-full font-mono text-sm"
                placeholder='{"startsAt": ..., "problem": {"field": {"entities": [[1,2],[2,1]]}}}'
                :rows="5"
              />
              <UButton class="mt-2" @click="handleProblemLoad" color="primary"
                >読み込み</UButton
              >
              </div>
              <div>
                <label class="font-semibold">操作JSON読み込み:</label>
                <UTextarea
                  v-model="opsInput"
                  class="mt-1 w-full font-mono text-sm"
                  placeholder='{"ops": [{"x":0,"y":0,"n":2},{"x":0,"y":0,"n":2}]}'
                  :rows="5"
                />
                <UButton class="mt-2" @click="handleOpsLoad" color="primary"
                  >読み込み</UButton
                >
              </div>
              
            </div>
          </template>
          <template #competition="{ item }">
            <div>

              <label class="font-semibold">競技用文字列読み込み:</label>
              <UTextarea
              v-model="kyoproProblemInput"
              class="mt-1 w-full font-mono text-sm"
              placeholder="N
A1,1 A1,2 ... A1,N
A2,1 A2,2 ... A2,N
...
AN,1 AN,2 ... AN,N"
              :rows="5"
            />
            <UButton
              class="mt-2"
              @click="handleKyoproProblemLoad"
              color="primary"
              >読み込み</UButton
              >
            </div>
            <div>
                <label class="font-semibold">操作競技用文字列読み込み:</label>
                <UTextarea
                  v-model="opsKyoproInput"
                  class="mt-1 w-full font-mono text-sm"
                  placeholder='N
x1 y1 n1
x2 y2 n2
...
xN yN nN'
                  :rows="5"
                />
                <UButton class="mt-2" @click="handleKyoproOpsLoad" color="primary"
                  >読み込み</UButton
                >
              </div>
          </template>
        </UTabs>
      </div>
      <div v-if="opsLoadStatus !== null" class="mt-1 text-sm">
                <span
                  v-if="opsLoadStatus"
                  class="text-green-600 dark:text-green-400 font-semibold"
                  >✔ 読み込みに成功しました</span
                >
                <span
                  v-else
                  class="text-red-600 dark:text-red-400 font-semibold"
                  >❌ 読み込みに失敗しました</span
                >
              </div>
    </section>

    <!-- 🎮 ゲーム盤面 -->
    <GameBoard v-model:selected="selected" />

    <!-- 🎛 操作パネル -->
    <GameControl v-model:selected="selected" :operations="operations.ops" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useFieldStore } from "@/stores/field";
import {
  type ProblemInput,
  type OperationInput,
  isProblemInput,
  isOperationInput,
} from "@/types";
import type { TabsItem } from "@nuxt/ui";

const fieldStore = useFieldStore();
const selected = ref<{ x: number; y: number }[]>([]);

const operations = ref<OperationInput>({ ops: [] });
const opsLoadStatus = ref<boolean | null>(null);
const size = ref(4);

const items = ref<TabsItem[]>([
  { label: "JSON Format", value: "json", slot: "json" as const },
  {
    label: "Competition Format",
    value: "competition",
    slot: "competition" as const,
  },
]);

// ランダム生成
const handleGenerate = () => {
  fieldStore.size = size.value;
  fieldStore.generateField();
};

// JSON読み込み
const problemInput = ref("");
const handleProblemLoad = () => {
  try {
    const parsed: ProblemInput = JSON.parse(problemInput.value);
    if (!isProblemInput(parsed)) {
      throw new Error("Invalid problem format");
    }
    fieldStore.setFieldFromProblem(parsed.problem);
    size.value = parsed.problem.field.entities.length;
    const KyoproProblem = convertProblemToKyopro(parsed.problem);
    kyoproProblemInput.value = KyoproProblem;
  } catch (e) {
    alert("JSONの形式が正しくありません");
  }
};

// 競プロ形式の問題文字列読み込み
const kyoproProblemInput = ref("");
const handleKyoproProblemLoad = () => {
  try {
    const parsed: ProblemInput = convertKyoproToProblem(
      kyoproProblemInput.value
    );
    console.log(parsed);
    if (!isProblemInput(parsed)) {
      throw new Error("Invalid problem format");
    }
    fieldStore.setFieldFromProblem(parsed.problem);
    problemInput.value = JSON.stringify(parsed, null, 2);
    size.value = parsed.problem.field.entities.length;
  } catch (e) {
    console.error(e);
  }
};

// 操作JSON読み込み
const opsInput = ref("");
const handleOpsLoad = () => {
  try {
    const parsed: OperationInput = JSON.parse(opsInput.value)
    if (!Array.isArray(parsed.ops)) throw new Error('invalid')
    const ok = parsed.ops.every(op =>
      typeof op.x === 'number' &&
      typeof op.y === 'number' &&
      typeof op.n === 'number' &&
      op.n > 0 &&
      op.x >= 0 &&
      op.y >= 0 &&
      op.x + op.n <= fieldStore.size &&
      op.y + op.n <= fieldStore.size
    )
    if (!ok) throw new Error('invalid-range')
    operations.value = parsed
    opsLoadStatus.value = true
    const KyoproOps = convertOpsToKyoproOps(parsed)
    opsKyoproInput.value = KyoproOps
  } catch (e) {
    opsLoadStatus.value = false;
  }
};

const handleKyoproOpsLoad = () => {
  try {
    const parsed: OperationInput = convertKyoproOpsToOps(
      opsKyoproInput.value
    );
    console.log(parsed);
    if (!isOperationInput(parsed)) {
      throw new Error("Invalid operation format");
    }
    const ok = parsed.ops.every(
      (op) =>
        typeof op.x === "number" &&
        typeof op.y === "number" &&
        typeof op.n === "number" &&
        op.n > 0 &&
        op.x >= 0 &&
        op.y >= 0 &&
        op.x + op.n <= fieldStore.size &&
        op.y + op.n <= fieldStore.size
    );
    if (!ok) throw new Error("invalid-range");
    operations.value = parsed;
    opsInput.value = JSON.stringify(parsed, null, 2);
    size.value = parsed.ops.length;
    opsLoadStatus.value = true;
  } catch (e) {
    console.error(e);
    opsLoadStatus.value = false;
  }
};
const opsKyoproInput = ref("");
</script>
