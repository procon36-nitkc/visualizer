import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFieldStore } from '@/stores/field'
import { applyRotation } from '@/utils/rotation'
import type { Operation } from '@/types'

function createSeededRandom(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const generatedSeed = Math.floor(Math.random() * 0xffffffff);

console.log(`Generated seed: ${generatedSeed}`); // For debugging purposes

const random = createSeededRandom(generatedSeed);

function generateSequentialField(size: number): number[][] {
  const field: number[][] = []
  let counter = 1
  for (let y = 0; y < size; y++) {
    const row: number[] = []
    for (let x = 0; x < size; x++) {
      row.push(counter++)
    }
    field.push(row)
  }
  return field
}

function randomEven(min: number, max: number): number {
  const range = Math.floor((max - min) / 2) + 1
  return min + Math.floor(random() * range) * 2
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('playback undo', () => {
  it('restores field after undoing 100-playback on 24x24', async () => {
    const store = useFieldStore()
    store.size = 24
    store.field = generateSequentialField(store.size)
    const original = store.field.map(row => [...row])

    const ops: Operation[] = []
    for (let i = 0; i < 100; i++) {
      const n = randomEven(2, store.size)
      const x = Math.floor(random() * (store.size - n + 1))
      const y = Math.floor(random() * (store.size - n + 1))
      ops.push({ x, y, n })
    }

    store.animationDuration = 0
    await store.startPlayback(ops)
    store.undo()

    expect(store.field).toEqual(original)
  })

  it('undoes user operations separately from playback batch', async () => {
    const store = useFieldStore()
    store.size = 4
    store.field = generateSequentialField(store.size)
    const original = store.field.map(r => [...r])

    const ops: Operation[] = [
      { x: 0, y: 0, n: 2 },
      { x: 2, y: 2, n: 2 },
    ]

    store.animationDuration = 0
    await store.startPlayback(ops)

    // apply a manual operation after playback
    store.rotate(0, 0, 2)

    // first undo should remove the manual rotation only
    store.undo()

    let expected = applyRotation(original, ops[0].x, ops[0].y, ops[0].n, true)
    expected = applyRotation(expected, ops[1].x, ops[1].y, ops[1].n, true)
    expect(store.field).toEqual(expected)
    expect(store.history.length).toBe(ops.length)

    // second undo should remove all playback operations
    store.undo()
    expect(store.field).toEqual(original)
    expect(store.history.length).toBe(0)
  })
})
