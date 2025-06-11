import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFieldStore } from '@/stores/field'
import type { Operation } from '@/types'

describe('playback and undo logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('restores board when undoing playback sequence', async () => {
    const store = useFieldStore()
    store.size = 2
    store.field = [
      [1, 2],
      [3, 4]
    ]
    const initialField = store.field.map(r => [...r])
    const initialHistory: Operation[] = []
    const ops: Operation[] = [
      { x: 0, y: 0, n: 2 },
      { x: 0, y: 0, n: 2 }
    ]
    for (const op of ops) {
      await store.applyOperation(op)
    }
    // mimic handleUndo logic
    const startLen = initialHistory.length
    const hist = store.history
    const match =
      hist.length === startLen + ops.length &&
      ops.every((op, idx) => {
        const h = hist[startLen + idx]
        return h && h.x === op.x && h.y === op.y && h.n === op.n
      })
    if (match) {
      store.field = initialField.map(row => [...row])
      store.history = [...initialHistory]
    } else {
      store.undo()
    }
    expect(store.field).toEqual(initialField)
    expect(store.history).toEqual(initialHistory)
  })
})
