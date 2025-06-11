<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useFieldStore } from '@/stores/field'
import type { Operation } from '@/types'

const fieldStore = useFieldStore()
const selected = defineModel<{ x: number; y: number }[]>('selected')

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
const tapBuffer = ref<{ x: number; y: number }[]>([])

const firstTap = computed(() => tapBuffer.value.length === 1 ? tapBuffer.value[0] : null)

const overlay = ref<{ op: Operation; angle: number } | null>(null)

const isInGarden = (x: number, y: number): boolean => {
  if (selected.value.length < 2) return false
  const [a, b] = selected.value
  const topX = Math.min(a.x, b.x)
  const topY = Math.min(a.y, b.y)
  const n = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) + 1
  return x >= topX && x < topX + n && y >= topY && y < topY + n
}

const getBaseCellStyle = (value: number): Record<string, string> => {
  const totalValues = (fieldStore.size * fieldStore.size) / 2
  const hue = (value * 47) % 360
  const saturation = 60 + (value % 20)
  let lightness = 85 - Math.floor((value / totalValues) * 30)
  const textLightness = lightness < 65 ? 95 : 15
  return {
    backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    color: `hsl(${hue}, 40%, ${textLightness}%)`,
  }
}

const getCellStyleObject = (value: number, x: number, y: number): Record<string, string> => {
  const base = getBaseCellStyle(value)
  const anim = overlay.value
  const inAnim =
    anim &&
    x >= anim.op.x &&
    x < anim.op.x + anim.op.n &&
    y >= anim.op.y &&
    y < anim.op.y + anim.op.n
  if (isInGarden(x, y) || inAnim) {
    const m = /hsl\((\d+), (\d+)%\, (\d+)%\)/.exec(base.backgroundColor || '')
    if (m) {
      const l = Number(m[3]) - 10
      base.backgroundColor = `hsl(${m[1]}, ${m[2]}%, ${l}%)`
    }
  }
  if (inAnim) base.opacity = '0'
  return base
}

const cellFontSize = computed(() => {
  const s = fieldStore.size
  if (s <= 6) return '1.5rem'
  if (s <= 10) return '1.25rem'
  if (s <= 16) return '1rem'
  if (s <= 20) return '0.875rem'
  return '0.75rem'
})

const overlayStyle = computed(() => {
  if (!overlay.value) return {}
  const cellEl = document.querySelector('.cell') as HTMLElement | null
  if (!cellEl) return {}
  const size = cellEl.offsetWidth
  return {
    top: `${overlay.value.op.y * size}px`,
    left: `${overlay.value.op.x * size}px`,
    width: `${overlay.value.op.n * size}px`,
    height: `${overlay.value.op.n * size}px`,
    transform: `rotate(${overlay.value.angle}deg)`,
    transformOrigin: 'center center',
    transition: `transform ${fieldStore.animationDuration}ms ease-in-out`,
  }
})

const boardStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  transformOrigin: '0 0',
  transition: 'transform 0.05s linear',
}))

async function animateRotation(op: Operation, apply: () => void) {
  overlay.value = { op, angle: 0 }
  await nextTick()
  requestAnimationFrame(() => {
    if (overlay.value) overlay.value.angle = 90
  })
  await new Promise((resolve) => setTimeout(resolve, fieldStore.animationDuration))
  apply()
  await nextTick()
  overlay.value = null
}

onMounted(() => {
  fieldStore.setAnimator(animateRotation)
})
onUnmounted(() => {
  fieldStore.setAnimator(null)
})

const getCellFromTouch = (e: TouchEvent): { x: number; y: number } | null => {
  const target = (e.target as HTMLElement)?.closest('.cell')
  if (!target) return null
  const x = Number(target.dataset.x)
  const y = Number(target.dataset.y)
  return isNaN(x) || isNaN(y) ? null : { x, y }
}

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
      if (tapBuffer.value.length === 2){
        tapBuffer.value = []
        selected.value = []
      }
      tapBuffer.value.push(pos)
      if (tapBuffer.value.length === 2) {
        selected.value = [...tapBuffer.value]
      }
    }
  }

  touchMode.value = 'select'
  moved = false
}

</script>

<template>
  <div
    class="w-full h-[80vh] overflow-hidden touch-none border rounded bg-white dark:bg-neutral-900"
    @touchstart.passive="handleTouchStart"
    @touchmove.passive="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div
      class="select-none origin-top-left inline-block"
      :style="boardStyle"
    >
      <div
        class="grid relative"
        :style="{ gridTemplateColumns: `repeat(${fieldStore.size}, minmax(2.5rem, 1fr))` }"
      >
        <div
          v-if="overlay"
          class="absolute z-50 pointer-events-none border-2 border-red-500"
          :style="overlayStyle"
        />
        <template v-for="(row, y) in fieldStore.field" :key="y">
          <div
            v-for="(cell, x) in row"
            :key="`${y}-${x}`"
            class="cell relative aspect-square border border-gray-300 dark:border-neutral-700 text-center flex items-center justify-center font-bold"
            :data-x="x"
            :data-y="y"
            :style="getCellStyleObject(cell, x, y)"
          >
            {{ cell }}
            <div
    v-if="isInGarden(x, y)"
    class="animated-border"
  />
  <div
  v-if="firstTap && firstTap.x === x && firstTap.y === y"
  class="animated-border border-blue-500"
></div>
          </div>
        </template>
      </div>
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
  border-color: #3b82f6; /* Tailwind's blue-500 */
}

</style>
