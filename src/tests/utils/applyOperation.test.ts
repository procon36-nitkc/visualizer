import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFieldStore } from '@/stores/field'
import type { Operation } from '@/types'

describe('useFieldStore.applyOperation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('applies operation clockwise', async () => {
    const store = useFieldStore()
    store.size = 2
    store.field = [
      [1,2],
      [3,4]
    ]
    const op: Operation = { x:0, y:0, n:2 }
    await store.applyOperation(op)
    expect(store.field).toEqual([
      [3,1],
      [4,2]
    ])
    expect(store.history).toHaveLength(1)
    store.undo()
    expect(store.field).toEqual([
      [1,2],
      [3,4]
    ])
    expect(store.history).toHaveLength(0)
  })

  it('awaits animator when animated', async () => {
    const store = useFieldStore()
    store.size = 2
    store.field = [
      [1, 2],
      [3, 4]
    ]
    const op: Operation = { x: 0, y: 0, n: 2 }
    const spy = vi.fn().mockResolvedValue(undefined)
    store.setAnimator(spy)
    await store.applyOperation(op, true, true)
    expect(spy).toHaveBeenCalledWith(op)
    expect(store.field).toEqual([
      [3, 1],
      [4, 2]
    ])
  })
})
