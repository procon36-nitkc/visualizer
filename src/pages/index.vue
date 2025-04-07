<template>
  <div class="p-4 space-y-6 max-w-screen-md mx-auto">
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
    </section>

    <!-- 🎮 ゲーム盤面 -->
    <GameBoard v-model:selected="selected" />

    <!-- 🎛 操作パネル -->
    <GameControl v-model:selected="selected" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFieldStore } from '@/stores/field'
import GameBoard from '@/components/GameBoard.vue'
import GameControl from '@/components/GameControl.vue'
import type { ProblemInput } from '@/types'

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
</script>
