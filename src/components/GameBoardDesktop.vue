<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFieldStore } from '@/stores/field'
import { useGameUiStore } from '@/stores/gameUi'
import { useGameBoardCellStyles } from '@/composables/useGameBoardCellStyles'
import { useGameBoardOverlay } from '@/composables/useGameBoardOverlay'
import { useSelectionGeometry } from '@/composables/useSelectionGeometry'
import { getCellPositionFromTarget } from '@/utils/boardCellPosition'
import type { Position } from '@/types'
import { storeToRefs } from 'pinia'

interface PairInfo {
  value: number
  positions: [Position, Position]
  isAdjacent: boolean
}

interface PairClassification {
  bothOutside: PairInfo[]
  bothInside: PairInfo[]
  partial: PairInfo[]
}

interface PartialPairPoint {
  pair: PairInfo
  insidePoint: Position
  outsidePoint: Position
  insidePointRotated: Position
  currentDistance: number
  currentOpacity: number
}

// ===== 定数 =====
// ペアビジュアライゼーション設定
const PAIR_VISUALIZATION_CONFIG = {
  opacity: {
    min: 0.0,           // 最小透明度（遠い場合）
    max: 0.8,           // 最大透明度（近い場合）
  },
  color: {
    adjacent: '#147637', // 隣接ペアの色（緑）
    nonAdjacent: '#ef4444' // 非隣接ペアの色（赤）
  }
} as const

const fieldStore = useFieldStore()
const gameUiStore = useGameUiStore()
const { selected, pairMinDistance, pairMaxDistance } = storeToRefs(gameUiStore)
const boardRef = ref<HTMLElement | null>(null)
const { getBaseCellStyle, getCellStyleObject, cellFontSize } = useGameBoardCellStyles(selected, {
  inGardenLightnessDelta: 30,
})
const { overlay, overlayStyle } = useGameBoardOverlay(boardRef)
const { topLeft, squareSize, isInSelectionRect } = useSelectionGeometry(selected)

const scale = ref(1)

const isDragging = ref(false)
const dragStart = ref<Position | null>(null)

function getCellFromEvent(e: Event): Position | null {
  return getCellPositionFromTarget(e.target)
}

const handleMouseDown = (e: MouseEvent) => {
  const pos = getCellFromEvent(e)
  if (!pos) return
  gameUiStore.setSelected([pos])
  dragStart.value = pos
  isDragging.value = true
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !dragStart.value) return
  const pos = getCellFromEvent(e)
  if (pos) {
    gameUiStore.setSelected([dragStart.value, pos])
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  dragStart.value = null
}

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
  if (isInSelectionRect(x, y)) {
    return 'border-green-500 ring-2 ring-green-300'
  }

  return ''
}

// ===== ペア検出とメトリクス計算 =====
/**
 * フィールド内の全ペアを検出
 * @returns 検出されたペア情報の配列（隣接状態を含む）
 */
const detectPairs = (): PairInfo[] => {
  const pairs: PairInfo[] = []
  const seen = new Map<number, Position[]>()
  
  // 全セルをスキャンしてペアを検出
  fieldStore.field.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!seen.has(value)) {
        seen.set(value, [])
      }
      seen.get(value)!.push({ x, y })
    })
  })
  
  // ペアになっているものを抽出
  seen.forEach((positions, value) => {
    if (positions.length === 2) {
      const [pos1, pos2] = positions
      const isAdjacent = checkAdjacent(pos1, pos2)
      pairs.push({ value, positions: [pos1, pos2], isAdjacent })
    }
  })
  
  return pairs
}

/**
 * 2つの位置が隣接しているかチェック（縦または横に隣り合っているか）
 */
const checkAdjacent = (pos1: Position, pos2: Position): boolean => {
  const dx = Math.abs(pos1.x - pos2.x)
  const dy = Math.abs(pos1.y - pos2.y)
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
}

/**
 * 2点間のマンハッタン距離を計算
 */
const calculateManhattanDistance = (point1: Position, point2: Position): number => {
  const dx = Math.abs(point1.x - point2.x)
  const dy = Math.abs(point1.y - point2.y)
  return dx + dy
}

// ペア間のマンハッタン距離を計算
const getPairDistance = (pair: PairInfo): number => {
  return calculateManhattanDistance(pair.positions[0], pair.positions[1])
}

/**
 * 距離から透明度を計算（線形補間）
 * - minDistance以下: 最大透明度
 * - maxDistance以上: 最小透明度
 * - 中間: 線形補間
 */
const calculateOpacityFromDistance = (distance: number): number => {
  const { min, max } = PAIR_VISUALIZATION_CONFIG.opacity
  
  // 最小距離以下の場合は最大透明度
  if (distance <= pairMinDistance.value) {
    return max
  }
  
  // 最大距離以上の場合は最小透明度
  if (distance >= pairMaxDistance.value) {
    return min
  }
  
  // 中間の場合は線形補間
  const range = pairMaxDistance.value - pairMinDistance.value
  if (range <= 0) return max
  const progress = (distance - pairMinDistance.value) / range
  return max - (max - min) * progress
}

// ペアの距離に応じた透明度を計算
const getPairOpacity = (pair: PairInfo): number => {
  const distance = getPairDistance(pair)
  return calculateOpacityFromDistance(distance)
}

// ペア情報をリアクティブに計算
// アニメーション中のペア情報をキャッシュ
const cachedPairs = ref<PairInfo[] | null>(null)

const pairs = computed(() => {
  // overlayがある場合、キャッシュがあればそれを返す
  if (overlay.value && cachedPairs.value) {
    return cachedPairs.value
  }
  
  const result = detectPairs()
  
  // overlayがある場合はキャッシュに保存
  if (overlay.value) {
    cachedPairs.value = result
  } else {
    // overlayがない場合はキャッシュをクリア
    cachedPairs.value = null
  }
  
  return result
})

// セルが範囲内かチェック
const isInOverlayRange = (pos: { x: number; y: number }): boolean => {
  if (!overlay.value) return false
  const op = overlay.value.op
  return pos.x >= op.x && pos.x < op.x + op.n &&
         pos.y >= op.y && pos.y < op.y + op.n
}

// アニメーション中のペア分類をキャッシュ
const cachedClassification = ref<PairClassification | null>(null)

const classifyPairs = computed((): PairClassification => {
  // overlayがある場合、キャッシュがあればそれを返す
  if (overlay.value && cachedClassification.value) {
    return cachedClassification.value
  }
  
  // 分類を計算
  const bothOutside: PairInfo[] = []
  const bothInside: PairInfo[] = []
  const partial: PairInfo[] = []
  
  pairs.value.forEach(pair => {
    const pos1InRange = isInOverlayRange(pair.positions[0])
    const pos2InRange = isInOverlayRange(pair.positions[1])
    
    if (!pos1InRange && !pos2InRange) {
      bothOutside.push(pair)
    } else if (pos1InRange && pos2InRange) {
      bothInside.push(pair)
    } else {
      partial.push(pair)
    }
  })
  
  const result = { bothOutside, bothInside, partial }
  
  // overlayがある場合はキャッシュに保存
  if (overlay.value) {
    cachedClassification.value = result
  } else {
    // overlayがない場合はキャッシュをクリア
    cachedClassification.value = null
  }
  
  return result
})

// ===== 回転座標計算 =====
// 回転後の座標を計算（SVG transformと同じ回転行列を使用）
const getRotatedCellPosition = (pos: Position): Position => {
  if (!overlay.value) return pos
  
  const op = overlay.value.op
  const angle = overlay.value.angle
  
  // セルの中心座標（viewBox座標系: セル単位）
  const centerX = op.x + op.n / 2
  const centerY = op.y + op.n / 2
  
  // 点の座標（viewBox座標系: セル単位）
  const pointX = pos.x + 0.5
  const pointY = pos.y + 0.5
  
  // 回転中心からの相対位置
  const relX = pointX - centerX
  const relY = pointY - centerY
  
  // 回転（ラジアンに変換）
  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  
  // 回転変換後の相対位置
  const rotatedRelX = relX * cos - relY * sin
  const rotatedRelY = relX * sin + relY * cos
  
  // viewBox座標系での絶対位置に戻す
  const rotatedX = centerX + rotatedRelX
  const rotatedY = centerY + rotatedRelY
  
  // セル座標に変換（getCellCenterで使用するため）
  return {
    x: rotatedX - 0.5,
    y: rotatedY - 0.5
  }
}

// ===== ヘルパー関数: 部分的なペアの処理 =====
// 部分的なペアの点を分類（範囲内/範囲外）
const classifyPartialPairPoints = (pair: PairInfo) => {
  const pos1InRange = isInOverlayRange(pair.positions[0])
  const insidePoint = pos1InRange ? pair.positions[0] : pair.positions[1]
  const outsidePoint = pos1InRange ? pair.positions[1] : pair.positions[0]
  return { insidePoint, outsidePoint }
}

// 部分的なペアの現在の距離と透明度を計算
const calculatePartialPairMetrics = (
  insidePointRotated: { x: number; y: number },
  outsidePoint: { x: number; y: number }
) => {
  const currentDistance = calculateManhattanDistance(insidePointRotated, outsidePoint)
  const currentOpacity = calculateOpacityFromDistance(currentDistance)
  return { currentDistance, currentOpacity }
}

// ===== リアクティブ computed プロパティ =====
const partialPairPoints = computed((): PartialPairPoint[] => {
  // overlay.valueとangleを明示的に参照してリアクティビティを確保
  const currentOverlay = overlay.value
  const currentAngle = currentOverlay?.angle ?? 0
  
  // angleを使用することで、angleの変更を確実に検知
  if (!currentOverlay || currentAngle === undefined) {
    return classifyPairs.value.partial.map(pair => {
      const { insidePoint, outsidePoint } = classifyPartialPairPoints(pair)
      const distance = getPairDistance(pair)
      return {
        pair,
        insidePoint,
        outsidePoint,
        insidePointRotated: insidePoint,
        currentDistance: distance,
        currentOpacity: calculateOpacityFromDistance(distance)
      }
    })
  }
  
  return classifyPairs.value.partial.map(pair => {
    const { insidePoint, outsidePoint } = classifyPartialPairPoints(pair)
    
    // 範囲内の点の回転後座標を計算（angleの変更を反映）
    const insidePointRotated = getRotatedCellPosition(insidePoint)
    
    // 回転後の座標を使って現在の距離と透明度を計算
    const { currentDistance, currentOpacity } = calculatePartialPairMetrics(
      insidePointRotated,
      outsidePoint
    )
    
    return {
      pair,
      insidePoint,
      outsidePoint,
      insidePointRotated,
      currentDistance,
      currentOpacity
    }
  })
})

// overlay範囲の中心座標とtransformを計算
const overlayTransform = computed(() => {
  if (!overlay.value) return ''
  const op = overlay.value.op
  
  // 回転の中心座標（viewBox座標系: セル単位）
  const centerX = op.x + op.n / 2
  const centerY = op.y + op.n / 2
  
  return `rotate(${overlay.value.angle} ${centerX} ${centerY})`
})

// セルの中心座標を計算（viewBox座標系: 0-size）
const getCellCenter = (pos: { x: number; y: number }): { x: number; y: number } => {
  return {
    x: pos.x + 0.5,
    y: pos.y + 0.5,
  }
}

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
    <GameBoardGridBase
      board-class="grid select-none relative w-fit"
      :board-style="{ transform: `scale(${scale})`, transformOrigin: 'center center' }"
      :field="fieldStore.field"
      :size="fieldStore.size"
      :overlay="overlay"
      :overlay-style="overlayStyle"
      :cell-font-size="cellFontSize"
      cell-class-name="cursor-pointer transition-all duration-100 ease-in-out"
      :get-base-cell-style="getBaseCellStyle"
      :get-cell-style-object="getCellStyleObject"
      :get-cell-class="getCellClass"
    >
      <template #background-layer>
        <svg
          class="absolute inset-0 pointer-events-none z-30 w-full h-full"
          :viewBox="`0 0 ${fieldStore.size} ${fieldStore.size}`"
          preserveAspectRatio="none"
          style="overflow: visible;"
        >
        <!-- 両方が範囲外のペア（通常表示） -->
        <g v-for="pair in classifyPairs.bothOutside" :key="`pair-outside-${pair.value}`">
          <!-- 線 -->
          <line
            :x1="getCellCenter(pair.positions[0]).x"
            :y1="getCellCenter(pair.positions[0]).y"
            :x2="getCellCenter(pair.positions[1]).x"
            :y2="getCellCenter(pair.positions[1]).y"
            :stroke="pair.isAdjacent ? PAIR_VISUALIZATION_CONFIG.color.adjacent : PAIR_VISUALIZATION_CONFIG.color.nonAdjacent"
            :stroke-width="(pair.isAdjacent ? 0.16 : 0.08)"
            stroke-linecap="round"
            :stroke-opacity="getPairOpacity(pair)"
            style="transition: stroke 0.3s ease-in-out, stroke-width 0.3s ease-in-out, stroke-opacity 0.3s ease-in-out;"
          />
          <!-- 端点の丸 -->
          <circle
            :cx="getCellCenter(pair.positions[0]).x"
            :cy="getCellCenter(pair.positions[0]).y"
            :r="pair.isAdjacent ? 0.3 : 0.1"
            :fill="pair.isAdjacent ? PAIR_VISUALIZATION_CONFIG.color.adjacent : PAIR_VISUALIZATION_CONFIG.color.nonAdjacent"
            :fill-opacity="getPairOpacity(pair)"
            style="transition: r 0.3s ease-in-out, fill 0.3s ease-in-out, fill-opacity 0.3s ease-in-out;"
          />
          <circle
            :cx="getCellCenter(pair.positions[1]).x"
            :cy="getCellCenter(pair.positions[1]).y"
            :r="pair.isAdjacent ? 0.3 : 0.1"
            :fill="pair.isAdjacent ? PAIR_VISUALIZATION_CONFIG.color.adjacent : PAIR_VISUALIZATION_CONFIG.color.nonAdjacent"
            :fill-opacity="getPairOpacity(pair)"
            style="transition: r 0.3s ease-in-out, fill 0.3s ease-in-out, fill-opacity 0.3s ease-in-out;"
          />
        </g>
        
        <!-- 両方が範囲内のペア（回転アニメーション追従） -->
        <g 
          :transform="overlayTransform"
        >
          <g v-for="pair in classifyPairs.bothInside" :key="`pair-inside-${pair.value}`">
            <!-- 線 -->
            <line
              :x1="getCellCenter(pair.positions[0]).x"
              :y1="getCellCenter(pair.positions[0]).y"
              :x2="getCellCenter(pair.positions[1]).x"
              :y2="getCellCenter(pair.positions[1]).y"
              :stroke="pair.isAdjacent ? PAIR_VISUALIZATION_CONFIG.color.adjacent : PAIR_VISUALIZATION_CONFIG.color.nonAdjacent"
              :stroke-width="(pair.isAdjacent ? 0.16 : 0.08)"
              stroke-linecap="round"
              :stroke-opacity="getPairOpacity(pair)"
              style="transition: stroke 0.3s ease-in-out, stroke-width 0.3s ease-in-out, stroke-opacity 0.3s ease-in-out;"
            />
            <!-- 端点の丸 -->
            <circle
              :cx="getCellCenter(pair.positions[0]).x"
              :cy="getCellCenter(pair.positions[0]).y"
              :r="pair.isAdjacent ? 0.3 : 0.1"
              :fill="pair.isAdjacent ? PAIR_VISUALIZATION_CONFIG.color.adjacent : PAIR_VISUALIZATION_CONFIG.color.nonAdjacent"
              :fill-opacity="getPairOpacity(pair)"
              style="transition: r 0.3s ease-in-out, fill 0.3s ease-in-out, fill-opacity 0.3s ease-in-out;"
            />
            <circle
              :cx="getCellCenter(pair.positions[1]).x"
              :cy="getCellCenter(pair.positions[1]).y"
              :r="pair.isAdjacent ? 0.3 : 0.1"
              :fill="pair.isAdjacent ? PAIR_VISUALIZATION_CONFIG.color.adjacent : PAIR_VISUALIZATION_CONFIG.color.nonAdjacent"
              :fill-opacity="getPairOpacity(pair)"
              style="transition: r 0.3s ease-in-out, fill 0.3s ease-in-out, fill-opacity 0.3s ease-in-out;"
            />
          </g>
        </g>
        
        <!-- 片方だけ範囲内のペア: 範囲外の点 -->
        <g v-for="pairPoint in partialPairPoints" :key="`pair-partial-outside-${pairPoint.pair.value}`">
          <!-- 範囲外の点の丸 -->
          <circle
            :cx="getCellCenter(pairPoint.outsidePoint).x"
            :cy="getCellCenter(pairPoint.outsidePoint).y"
            :r="pairPoint.pair.isAdjacent ? 0.3 : 0.1"
            :fill="pairPoint.pair.isAdjacent ? PAIR_VISUALIZATION_CONFIG.color.adjacent : PAIR_VISUALIZATION_CONFIG.color.nonAdjacent"
            :fill-opacity="pairPoint.currentOpacity"
          />
        </g>
        
        <!-- 片方だけ範囲内のペア: 範囲内の点と線（回転グループ） -->
        <g 
          :transform="overlayTransform"
        >
          <g v-for="pairPoint in partialPairPoints" :key="`pair-partial-inside-${pairPoint.pair.value}`">
            <!-- 範囲内の点の丸 -->
            <circle
              :cx="getCellCenter(pairPoint.insidePoint).x"
              :cy="getCellCenter(pairPoint.insidePoint).y"
              :r="pairPoint.pair.isAdjacent ? 0.3 : 0.1"
              :fill="pairPoint.pair.isAdjacent ? PAIR_VISUALIZATION_CONFIG.color.adjacent : PAIR_VISUALIZATION_CONFIG.color.nonAdjacent"
              :fill-opacity="pairPoint.currentOpacity"
            />
          </g>
        </g>
        
        <!-- 片方だけ範囲内のペア: 線（範囲外の点から回転後の点へ） -->
        <g v-for="pairPoint in partialPairPoints" :key="`pair-partial-line-${pairPoint.pair.value}`">
          <line
            :x1="getCellCenter(pairPoint.outsidePoint).x"
            :y1="getCellCenter(pairPoint.outsidePoint).y"
            :x2="getCellCenter(pairPoint.insidePointRotated).x"
            :y2="getCellCenter(pairPoint.insidePointRotated).y"
            :stroke="pairPoint.pair.isAdjacent ? PAIR_VISUALIZATION_CONFIG.color.adjacent : PAIR_VISUALIZATION_CONFIG.color.nonAdjacent"
            :stroke-width="(pairPoint.pair.isAdjacent ? 0.16 : 0.08)"
            stroke-linecap="round"
            :stroke-opacity="pairPoint.currentOpacity"
          />
        </g>
      </svg>
      </template>
      <template #cell-overlay="{ x, y }">
          <div
            v-if="isTopLeftCorner(x, y)"
            class="absolute border-2 border-green-500 pointer-events-none z-10"
            :style="selectionStyle"
          />
      </template>
    </GameBoardGridBase>
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
