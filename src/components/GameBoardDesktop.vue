<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useFieldStore } from '@/stores/field'
import type { Operation } from '@/types'

const fieldStore = useFieldStore()
const selected = defineModel<{ x: number; y: number }[]>('selected')
const boardRef = ref<HTMLElement | null>(null)

const overlay = ref<{ op: Operation; angle: number; cells: number[][]; opacity: number } | null>(null)

const OPACITY_TRANSITION_DURATION = 100 // ms
const scale = ref(1)

const isDragging = ref(false)
const dragStart = ref<{ x: number; y: number } | null>(null)

function getCellFromEvent(e: Event): { x: number; y: number } | null {
  const target = (e.target as HTMLElement)?.closest('.cell')
  if (!target) return null
  const x = Number(target.dataset.x)
  const y = Number(target.dataset.y)
  if (isNaN(x) || isNaN(y)) return null
  return { x, y }
}

const handleMouseDown = (e: MouseEvent) => {
  const pos = getCellFromEvent(e)
  if (!pos) return
  selected.value = [pos]
  dragStart.value = pos
  isDragging.value = true
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !dragStart.value) return
  const pos = getCellFromEvent(e)
  if (pos) {
    selected.value = [dragStart.value, pos]
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  dragStart.value = null
}

const topLeft = computed(() => {
  if (selected.value.length < 2) return null
  const [a, b] = selected.value
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
  }
})

const squareSize = computed(() => {
  if (selected.value.length < 2) return 0
  const [a, b] = selected.value
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) + 1
})

const selectionStyle = computed(() => {
  const size = squareSize.value
  if (!topLeft.value || !size) return {}
  return {
    top: '0',
    left: '0',
    width: `calc(${size}00% + 2 * ${size}px)`,
    height: `calc(${size}00% + 2 * ${size}px)`,
  }
})

const isTopLeftCorner = (x: number, y: number) => {
  return topLeft.value?.x === x && topLeft.value?.y === y
}

const getCellClass = (x: number, y: number) => {
  if (selected.value.length < 2) return ''
  const [a, b] = selected.value
  const x0 = Math.min(a.x, b.x)
  const x1 = Math.max(a.x, b.x)
  const y0 = Math.min(a.y, b.y)
  const y1 = Math.max(a.y, b.y)

  if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
    return 'border-green-500 ring-2 ring-green-300'
  }

  return ''
}

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

  if (isInGarden(x, y)) {
    const m = /hsl\((\d+), (\d+)%\, (\d+)%\)/.exec(base.backgroundColor || '')
    if (m) {
      const l = Number(m[3]) - 30
      base.backgroundColor = `hsl(${m[1]}, ${m[2]}%, ${l}%)`
    }
  }
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
  if (!overlay.value || !boardRef.value) return {}
  const cellEl = boardRef.value.querySelector('.cell') as HTMLElement | null
  if (!cellEl) return {}
  const size = cellEl.offsetWidth
  return {
    top: `${overlay.value.op.y * size}px`,
    left: `${overlay.value.op.x * size}px`,
    width: `${overlay.value.op.n * size}px`,
    height: `${overlay.value.op.n * size}px`,
    transform: `rotate(${overlay.value.angle}deg)`,
    transformOrigin: 'center center',
    opacity: `${overlay.value.opacity}`,
    transition: `transform ${fieldStore.animationDuration}ms ease-in-out, opacity ${OPACITY_TRANSITION_DURATION}ms ease-in-out`,
  }
})

async function animateRotation(op: Operation, apply: () => void) {
  const cells: number[][] = []
  for (let y = 0; y < op.n; y++) {
    cells.push(fieldStore.field[op.y + y].slice(op.x, op.x + op.n))
  }
  overlay.value = { op, angle: 0, cells, opacity: 1 }
  await nextTick()
  requestAnimationFrame(() => {
    if (overlay.value) {
      overlay.value.angle = 90
    }
  })
  await new Promise((resolve) => setTimeout(resolve, fieldStore.animationDuration)).then(() => {
    if (overlay.value) {
      overlay.value.opacity = 0
    }
  })
  apply()
  await new Promise((resolve) => setTimeout(resolve, OPACITY_TRANSITION_DURATION)) // opacity transition time
  await nextTick()
  overlay.value = null
}

onMounted(() => {
  fieldStore.setAnimator(animateRotation)
})
onUnmounted(() => {
  fieldStore.setAnimator(null)
})
</script>

<template>
  <div
    ref="boardRef"
    class="overflow-auto max-h-[90vh] border rounded bg-white dark:bg-neutral-900 p-2"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <div
      class="grid select-none relative"
      :style="{ transform: `scale(${scale})`,
        transformOrigin: 'center center',
        gridTemplateColumns: `repeat(${fieldStore.size}, minmax(2.5rem, 1fr))` }"
    >
      <div
        v-if="overlay"
        class="absolute z-50 pointer-events-none grid border-2 border-red-500"
        :style="{ ...overlayStyle, gridTemplateColumns: `repeat(${overlay.op.n}, minmax(2.5rem, 1fr))` }"
      >
        <template v-for="(row, oy) in overlay.cells" :key="`o-${oy}`">
          <div
            v-for="(cell, ox) in row"
            :key="`o-${oy}-${ox}`"
            class="cell relative aspect-square border border-gray-300 dark:border-neutral-700 text-center flex items-center justify-center font-bold"
            :style="{ ...getBaseCellStyle(cell), fontSize: cellFontSize }"
          >
          </div>
        </template>
      </div>
      <template v-for="(row, y) in fieldStore.field" :key="y">
        <div
          v-for="(cell, x) in row"
          :key="`${y}-${x}`"
          class="cell relative aspect-square border border-gray-300 dark:border-neutral-700
            text-center flex items-center justify-center cursor-pointer font-bold transition-all duration-100 ease-in-out"
          :data-x="x"
          :data-y="y"
          :class="getCellClass(x, y)"
          :style="{ ...getCellStyleObject(cell, x, y), fontSize: cellFontSize }"
        >
          {{ cell }}
          <div
            v-if="isTopLeftCorner(x, y)"
            class="absolute border-2 border-green-500 pointer-events-none z-10"
            :style="selectionStyle"
          />
        </div>
      </template>
    </div>
  </div>
  <div class="flex items-center gap-2 mb-2">
    <label class="text-sm w-16">ズーム</label>
    <input
      type="range"
      min="0.5"
      max="2"
      step="0.01"
      v-model.number="scale"
      class="w-full"
    />
    <span class="text-sm w-10 text-right">{{ (scale * 100).toFixed(0) }}%</span>
  </div>
</template>
