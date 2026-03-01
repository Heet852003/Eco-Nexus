<template>
  <div class="app">
    <AppHeader v-if="authStore.token" />
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
authStore.restoreToken()
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main {
  flex: 1;
  padding: 1.5rem;
}
</style>
