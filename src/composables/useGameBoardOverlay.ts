import { ref, computed, nextTick, onMounted, onUnmounted, type Ref } from 'vue'
import { useFieldStore } from '@/stores/field'
import type { Operation } from '@/types'

export type BoardOverlay = {
  op: Operation
  angle: number
  cells: number[][]
  opacity: number
}

export const useGameBoardOverlay = (boardRef: Ref<HTMLElement | null>) => {
  const fieldStore = useFieldStore()
  const overlay = ref<BoardOverlay | null>(null)

  const overlayStyle = computed(() => {
    if (!overlay.value) return {}
    const root = boardRef.value
    const cellEl = (root ? root.querySelector('.cell') : document.querySelector('.cell')) as HTMLElement | null
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
      transition: `opacity ${fieldStore.animationDuration / 2}ms ease-in-out`,
    }
  })

  async function animateRotation(op: Operation, apply: () => void) {
    const cells: number[][] = []
    for (let y = 0; y < op.n; y++) {
      cells.push(fieldStore.field[op.y + y].slice(op.x, op.x + op.n))
    }
    overlay.value = { op, angle: 0, cells, opacity: 1 }
    await nextTick()

    const startTime = performance.now()
    const duration = fieldStore.animationDuration

    const animate = (currentTime: number) => {
      if (!overlay.value) return
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      overlay.value.angle = progress * 90
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else if (overlay.value) {
        overlay.value.opacity = 0
      }
    }

    requestAnimationFrame(animate)
    await new Promise((resolve) => setTimeout(resolve, duration))
    apply()
    await new Promise((resolve) =>
      setTimeout(resolve, fieldStore.animationDuration / 2)
    )
    await nextTick()
    overlay.value = null
  }

  onMounted(() => {
    fieldStore.setAnimator(animateRotation)
  })
  onUnmounted(() => {
    fieldStore.setAnimator(null)
  })

  return { overlay, overlayStyle }
}
