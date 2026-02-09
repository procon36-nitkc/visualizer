import { computed, type Ref } from 'vue'
import { useFieldStore } from '@/stores/field'
import { useSelectionGeometry } from '@/composables/useSelectionGeometry'
import type { Position } from '@/types'

type CellStyleOptions = {
  inGardenLightnessDelta?: number
}

export const useGameBoardCellStyles = (
  selected: Ref<Position[]>,
  options: CellStyleOptions = {}
) => {
  const fieldStore = useFieldStore()
  const { isInGarden } = useSelectionGeometry(selected)
  const inGardenLightnessDelta = options.inGardenLightnessDelta ?? 30

  const getBaseCellStyle = (value: number): Record<string, string> => {
    const totalValues = (fieldStore.size * fieldStore.size) / 2
    const hue = (value * 47) % 360
    const saturation = (value % 15) + 20
    const lightness = 95 - Math.floor((value / totalValues) * 15)
    const textLightness = lightness < 65 ? 95 : 15

    return {
      backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      color: `hsl(${hue}, 40%, ${textLightness}%)`,
    }
  }

  const getCellStyleObject = (
    value: number,
    x: number,
    y: number
  ): Record<string, string> => {
    const base = getBaseCellStyle(value)
    if (isInGarden(x, y)) {
      const m = /hsl\((\d+), (\d+)%\, (\d+)%\)/.exec(base.backgroundColor || '')
      if (m) {
        const l = Number(m[3]) - inGardenLightnessDelta
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

  return { isInGarden, getBaseCellStyle, getCellStyleObject, cellFontSize }
}
