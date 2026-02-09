<template>
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
              placeholder='M
x1 y1 n1
x2 y2 n2
...
xM yM nM'
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
      <span v-else class="text-red-600 dark:text-red-400 font-semibold"
        >❌ 読み込みに失敗しました</span
      >
    </div>
  </section>
</template>

<script setup lang="ts">
import { useGameInputPanel } from "@/composables/useGameInputPanel";

const {
  opsLoadStatus,
  size,
  items,
  problemInput,
  kyoproProblemInput,
  opsInput,
  opsKyoproInput,
  handleGenerate,
  handleProblemLoad,
  handleKyoproProblemLoad,
  handleOpsLoad,
  handleKyoproOpsLoad,
} = useGameInputPanel();
</script>
