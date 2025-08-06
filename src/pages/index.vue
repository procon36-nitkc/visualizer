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

      <div>
        <label class="font-semibold">操作JSON読み込み:</label>
        <UTextarea
          v-model="opsInput"
          class="mt-1 w-full font-mono text-sm"
          placeholder='{"ops": [{"x":0,"y":0,"n":2},{"x":0,"y":0,"n":2}]}'
          :rows="5"
        />
        <UButton class="mt-2" @click="handleOpsLoad" color="primary">読み込み</UButton>
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
      </div>
    </section>

    <!-- 🎮 ゲーム盤面 -->
    <GameBoard v-model:selected="selected" />

    <!-- 🎛 操作パネル -->
    <GameControl v-model:selected="selected" :operations="operations.ops" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFieldStore } from '@/stores/field'
import type { ProblemInput, OperationInput } from '@/types'

const fieldStore = useFieldStore()
const selected = ref<{ x: number; y: number }[]>([])

const operations = ref<OperationInput>({ops:[]})
const opsLoadStatus = ref<boolean | null>(null)

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

const opsInput = ref('')
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
  } catch (e) {
    opsLoadStatus.value = false
  }
}
</script>
