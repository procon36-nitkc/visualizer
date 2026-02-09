<script setup lang="ts">
// TODO: GameBoardMobile.vueとGameBoardDesktop.vueの共通部分を抽出して、1つのコンポーネントにまとめる
import { ref, computed } from 'vue'
import { useFieldStore } from '@/stores/field'
import { useGameUiStore } from '@/stores/gameUi'
import { useGameBoardCellStyles } from '@/composables/useGameBoardCellStyles'
import { useGameBoardOverlay } from '@/composables/useGameBoardOverlay'
import { getCellPositionFromTarget } from '@/utils/boardCellPosition'
import type { Position } from '@/types'
import { storeToRefs } from 'pinia'

const fieldStore = useFieldStore()
const gameUiStore = useGameUiStore()
const { selected } = storeToRefs(gameUiStore)

// ズーム・パン状態
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)

const touchStartAt = ref(0)
const touchMode = ref<'select' | 'panzoom'>('select')
let moved = false

let lastTouchDistance = 0
let initialScale = 1
let panStart = { x: 0, y: 0 }

// 2点タップ保持
const tapBuffer = ref<Position[]>([])

const firstTap = computed(() => tapBuffer.value.length === 1 ? tapBuffer.value[0] : null)

const { isInGarden, getBaseCellStyle, getCellStyleObject, cellFontSize } = useGameBoardCellStyles(selected, {
  inGardenLightnessDelta: 10,
})
const boardRef = ref<HTMLElement | null>(null)
const { overlay, overlayStyle } = useGameBoardOverlay(boardRef)

const boardStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  transformOrigin: '0 0',
  transition: 'transform 0.05s linear',
}))

const getCellFromTouch = (e: TouchEvent): Position | null => getCellPositionFromTarget(e.target)

const handleTouchStart = (e: TouchEvent) => {
  touchStartAt.value = Date.now()
  moved = false

  if (e.touches.length === 2) {
    touchMode.value = 'panzoom'
    const dx = e.touches[1].clientX - e.touches[0].clientX
    const dy = e.touches[1].clientY - e.touches[0].clientY
    lastTouchDistance = Math.hypot(dx, dy)
    initialScale = scale.value
  } else if (e.touches.length === 1) {
    panStart.x = e.touches[0].clientX - translateX.value
    panStart.y = e.touches[0].clientY - translateY.value
  }
}


const handleTouchMove = (e: TouchEvent) => {
  moved = true
  touchMode.value = 'panzoom'

  if (e.touches.length === 2) {
    const dx = e.touches[1].clientX - e.touches[0].clientX
    const dy = e.touches[1].clientY - e.touches[0].clientY
    const dist = Math.hypot(dx, dy)
    const factor = dist / lastTouchDistance
    scale.value = Math.min(Math.max(initialScale * factor, 0.25), 3)
  } else if (e.touches.length === 1) {
    translateX.value = e.touches[0].clientX - panStart.x
    translateY.value = e.touches[0].clientY - panStart.y
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  const duration = Date.now() - touchStartAt.value

  // ✅ 動かしてない && 100ms未満 → タップとして扱う
  if (!moved && duration < 100 && touchMode.value === 'select') {
    const pos = getCellFromTouch(e)
    if (pos) {
      if (tapBuffer.value.length === 2) {
        tapBuffer.value = []
        gameUiStore.clearSelected()
      }
      tapBuffer.value.push(pos)
      if (tapBuffer.value.length === 2) {
        gameUiStore.setSelected([...tapBuffer.value])
      }
    }
  }

  touchMode.value = 'select'
  moved = false
}

</script>

<template>
  <div class="w-full h-[80vh] overflow-hidden touch-none border rounded bg-white dark:bg-neutral-900"
    @touchstart.passive="handleTouchStart" @touchmove.passive="handleTouchMove" @touchend="handleTouchEnd">
    <div ref="boardRef" class="select-none origin-top-left inline-block" :style="boardStyle">
      <GameBoardGridBase
        board-class="grid relative"
        :field="fieldStore.field"
        :size="fieldStore.size"
        :overlay="overlay"
        :overlay-style="overlayStyle"
        overlay-class-name="z-50"
        :cell-font-size="cellFontSize"
        :get-base-cell-style="getBaseCellStyle"
        :get-cell-style-object="getCellStyleObject"
      >
        <template #cell-overlay="{ x, y }">
          <div v-if="isInGarden(x, y)" class="animated-border" />
          <div
            v-if="firstTap && firstTap.x === x && firstTap.y === y"
            class="animated-border border-blue-500"
          />
        </template>
      </GameBoardGridBase>
    </div>
  </div>
</template>

<style scoped>
* {
  user-select: none;
}

@keyframes marching-ants {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 100% 0;
  }
}

.animated-border {
  position: absolute;
  pointer-events: none;
  inset: 0;
  border: 2px dashed red;
  z-index: 20;
  background-size: 10px 10px;
  animation: marching-ants 1s linear infinite;
}

.animated-border.border-blue-500 {
  border-color: #3b82f6;
  /* Tailwind's blue-500 */
}
</style>
