<template>
  <div class="p-4 space-y-6 max-w-screen-lg mx-auto">
    <h1 class="text-2xl font-bold text-center">パズルゲーム</h1>

    <!-- 🛠 フィールド設定エリア -->
    <section class="space-y-2">
      <div class="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <label class="font-semibold">フィールドサイズ（偶数）:</label>
        <UInput v-model.number="size" type="number" min="4" max="24" step="2" class="w-32" />
        <UButton @click="handleGenerate" color="primary">ランダム生成</UButton>
      </div>

      <div>
        <label class="font-semibold">問題JSON読み込み:</label>
        <UTextarea
          v-model="problemInput"
          class="mt-1 w-full font-mono text-sm"
          placeholder='{"startsAt": ..., "problem": {"field": {"entities": [[1,2],[2,1]]}}}'
          :rows="5"
        />
        <UButton class="mt-2" @click="handleProblemLoad" color="primary">読み込み</UButton>
      </div>

      <div class="mt-4">
        <label class="font-semibold">操作JSON読み込み:</label>
        <UTextarea
          v-model="operationsInput"
          class="mt-1 w-full font-mono text-sm"
          placeholder='[{ "x":0, "y":0, "n":2 }]'
          :rows="5"
        />
        <UButton class="mt-2" @click="handleOpsLoad" color="primary">操作読み込み</UButton>
      </div>
    </section>

    <!-- 🎮 ゲーム盤面 -->
    <GameBoard v-model:selected="selected" />

    <!-- 🎛 操作パネル -->
    <GameControl v-model:selected="selected" :operations="operations" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFieldStore } from '@/stores/field'
import type { ProblemInput, Operation } from '@/types'

const fieldStore = useFieldStore()
const selected = ref<{ x: number; y: number }[]>([])

// 🎲 ランダム生成
const size = ref(4)
const handleGenerate = () => {
  fieldStore.size = size.value
  fieldStore.generateField()
}

// 📥 JSON読み込み
const problemInput = ref('')
const handleProblemLoad = () => {
  try {
    const parsed: ProblemInput = JSON.parse(problemInput.value)
    fieldStore.setFieldFromProblem(parsed.problem)
    size.value = parsed.problem.field.entities.length
  } catch (e) {
    alert('JSONの形式が正しくありません')
  }
}

const operationsInput = ref('')
const operations = ref<Operation[]>([])
const handleOpsLoad = () => {
  try {
    const parsed = JSON.parse(operationsInput.value)
    if (!Array.isArray(parsed)) throw new Error('not array')
    const ops: Operation[] = []
    for (const op of parsed) {
      if (
        typeof op.x !== 'number' ||
        typeof op.y !== 'number' ||
        typeof op.n !== 'number'
      ) {
        alert('操作JSONの形式が正しくありません')
        return
      }
      if (
        op.x < 0 ||
        op.y < 0 ||
        op.n <= 0 ||
        op.x + op.n > fieldStore.size ||
        op.y + op.n > fieldStore.size
      ) {
        alert('無効な操作が含まれています')
        return
      }
      ops.push({ x: op.x, y: op.y, n: op.n })
    }
    operations.value = ops
    alert('操作を読み込みました')
  } catch (e) {
    alert('操作JSONの形式が正しくありません')
  }
}
</script>
