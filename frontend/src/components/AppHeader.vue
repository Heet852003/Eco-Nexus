<template>
  <header class="header">
    <router-link to="/dashboard" class="logo">Eco-Nexus</router-link>
    <nav class="nav">
      <router-link to="/dashboard">Dashboard</router-link>
      <router-link to="/devices">Devices</router-link>
      <router-link to="/events">Events</router-link>
      <router-link to="/automation">Automation</router-link>
      <button class="btn" @click="logout">Logout</button>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
}
.logo {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--accent);
}
.nav {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.nav a {
  color: var(--text-muted);
}
.nav a.router-link-active {
  color: var(--text);
}
</style>
