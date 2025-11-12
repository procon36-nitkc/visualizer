<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useFieldStore } from '@/stores/field'
import type { Operation } from '@/types'

// ===== 型定義 =====
type Position = { x: number; y: number }

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
    minDistance: 2,     // この距離以下で最大透明度
    maxDistance: 6,     // この距離以上で最小透明度
  }
} as const

const fieldStore = useFieldStore()
const selected = defineModel<{ x: number; y: number }[]>('selected')
const boardRef = ref<HTMLElement | null>(null)

const overlay = ref<{ op: Operation; angle: number; cells: number[][]; opacity: number } | null>(null)

const OPACITY_TRANSITION_DURATION = 25 // ms
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
  const { min, max, minDistance, maxDistance } = PAIR_VISUALIZATION_CONFIG.opacity
  
  // 最小距離以下の場合は最大透明度
  if (distance <= minDistance) {
    return max
  }
  
  // 最大距離以上の場合は最小透明度
  if (distance >= maxDistance) {
    return min
  }
  
  // 中間の場合は線形補間
  const range = maxDistance - minDistance
  const progress = (distance - minDistance) / range
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
    transition: `opacity ${fieldStore.animationDuration/2}ms ease-in-out`,
  }
})

// ===== アニメーション制御 =====
/**
 * 回転アニメーションを実行
 * - angleを0から90まで線形に更新（requestAnimationFrameループ）
 * - CSS transitionは使用せず、JavaScriptで完全制御
 */
async function animateRotation(op: Operation, apply: () => void) {
  const cells: number[][] = []
  for (let y = 0; y < op.n; y++) {
    cells.push(fieldStore.field[op.y + y].slice(op.x, op.x + op.n))
  }
  overlay.value = { op, angle: 0, cells, opacity: 1 }
  await nextTick()
  
  // angleを段階的に更新してスムーズなアニメーションを実現（線形移動）
  const startTime = performance.now()
  const duration = fieldStore.animationDuration
  
  const animate = (currentTime: number) => {
    if (!overlay.value) return
    
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // 線形補間（ease-in-outなし）
    overlay.value.angle = progress * 90
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // アニメーション完了
      if (overlay.value) {
        overlay.value.opacity = 0
      }
    }
  }
  
  requestAnimationFrame(animate)
  
  await new Promise((resolve) => setTimeout(resolve, duration))
  apply()
  await new Promise((resolve) => setTimeout(resolve, fieldStore.animationDuration/2)) // opacity transition time
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
      class="grid select-none relative w-fit"
      :style="{ 
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        gridTemplateColumns: `repeat(${fieldStore.size}, minmax(2.5rem, 1fr))`
      }"
    >
      <!-- ペアを結ぶ線のSVGオーバーレイ -->
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
            :stroke="pair.isAdjacent ? '#22c55e' : '#ef4444'"
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
            :fill="pair.isAdjacent ? '#22c55e' : '#ef4444'"
            :fill-opacity="getPairOpacity(pair)"
            style="transition: r 0.3s ease-in-out, fill 0.3s ease-in-out, fill-opacity 0.3s ease-in-out;"
          />
          <circle
            :cx="getCellCenter(pair.positions[1]).x"
            :cy="getCellCenter(pair.positions[1]).y"
            :r="pair.isAdjacent ? 0.3 : 0.1"
            :fill="pair.isAdjacent ? '#22c55e' : '#ef4444'"
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
              :stroke="pair.isAdjacent ? '#22c55e' : '#ef4444'"
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
              :fill="pair.isAdjacent ? '#22c55e' : '#ef4444'"
              :fill-opacity="getPairOpacity(pair)"
              style="transition: r 0.3s ease-in-out, fill 0.3s ease-in-out, fill-opacity 0.3s ease-in-out;"
            />
            <circle
              :cx="getCellCenter(pair.positions[1]).x"
              :cy="getCellCenter(pair.positions[1]).y"
              :r="pair.isAdjacent ? 0.3 : 0.1"
              :fill="pair.isAdjacent ? '#22c55e' : '#ef4444'"
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
            :fill="pairPoint.pair.isAdjacent ? '#22c55e' : '#ef4444'"
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
              :fill="pairPoint.pair.isAdjacent ? '#22c55e' : '#ef4444'"
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
            :stroke="pairPoint.pair.isAdjacent ? '#22c55e' : '#ef4444'"
            :stroke-width="(pairPoint.pair.isAdjacent ? 0.16 : 0.08)"
            stroke-linecap="round"
            :stroke-opacity="pairPoint.currentOpacity"
          />
        </g>
      </svg>
      
      <div
        v-if="overlay"
        class="absolute z-20 pointer-events-none grid border-2 border-red-500"
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
