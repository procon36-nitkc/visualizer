<script lang="ts" setup>
const isMobile = computed(() => {
  return typeof window !== 'undefined' && window.innerWidth < 768
})
</script>

<template>
  <ClientOnly>
    <GameBoardMobile v-if="isMobile" />
    <GameBoardDesktop v-else />
  </ClientOnly>
</template>
