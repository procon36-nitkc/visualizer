import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFieldStore } from '@/stores/field'

// tests for exportHistoryAsOps

describe('useFieldStore.exportHistoryAsOps', () => {
  let store: ReturnType<typeof useFieldStore>
  beforeEach(() => {
    setActivePinia(createPinia())
    store = useFieldStore()
    store.size = 2
    store.field = [
      [1, 2],
      [3, 4]
    ]
  })

  it('reduces identical operations modulo four', () => {
    for (let i = 0; i < 5; i++) {
      store.rotate(0, 0, 2)
    }
    expect(store.history).toHaveLength(5)
    expect(store.exportHistoryAsOps).toEqual({ ops: [{ x: 0, y: 0, n: 2 }] })
  })

  it('handles multiple sequences of operations', () => {
    store.rotate(0, 0, 2)
    for (let i = 0; i < 4; i++) {
      store.rotate(1, 0, 2)
    }
    store.rotate(0, 0, 2)
    expect(store.exportHistoryAsOps).toEqual({ ops: [{ x: 0, y: 0, n: 2 }, { x: 0, y: 0, n: 2 }] })
  })
})
