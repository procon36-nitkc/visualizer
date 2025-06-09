import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFieldStore } from '@/stores/field'
import type { OperationWithDir } from '@/types'

describe('useFieldStore.applyOperation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('applies clockwise operation', async () => {
    const store = useFieldStore()
    store.size = 2
    store.field = [
      [1,2],
      [3,4]
    ]
    const op: OperationWithDir = { x:0, y:0, n:2, clockwise: true }
    await store.applyOperation(op)
    expect(store.field).toEqual([
      [3,1],
      [4,2]
    ])
  })

  it('applies counterclockwise operation', async () => {
    const store = useFieldStore()
    store.size = 2
    store.field = [
      [1,2],
      [3,4]
    ]
    const op: OperationWithDir = { x:0, y:0, n:2, clockwise: false }
    await store.applyOperation(op)
    expect(store.field).toEqual([
      [2,4],
      [1,3]
    ])
  })
})
