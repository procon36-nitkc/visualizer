import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFieldStore } from '@/stores/field'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('applyOperation', () => {
  it('rotates clockwise', async () => {
    const store = useFieldStore()
    store.size = 2
    store.field = [
      [1,2],
      [3,4],
    ]
    await store.applyOperation({x:0,y:0,n:2}, true, false)
    expect(store.field).toEqual([
      [3,1],
      [4,2],
    ])
  })

  it('rotates counterclockwise', async () => {
    const store = useFieldStore()
    store.size = 2
    store.field = [
      [1,2],
      [3,4],
    ]
    await store.applyOperation({x:0,y:0,n:2}, false, false)
    expect(store.field).toEqual([
      [2,4],
      [1,3],
    ])
  })
})
