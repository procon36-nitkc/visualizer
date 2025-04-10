<script lang="ts" setup>
const isMobile = computed(() => {
  return typeof window !== 'undefined' && window.innerWidth < 768
})

const selected = defineModel<{ x: number; y: number }[]>('selected')
</script>

<template>
  <ClientOnly>
    <GameBoardMobile v-if="isMobile" v-model:selected="selected" />
    <GameBoardDesktop v-else v-model:selected="selected" />
  </ClientOnly>
</template>