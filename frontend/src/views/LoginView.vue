<template>
  <div class="auth-page">
    <div class="auth-card card">
      <h1>Eco-Nexus</h1>
      <p class="subtitle">IoT & SmartHome</p>
      <form @submit.prevent="submit" class="form">
        <input v-model="email" type="email" class="input" placeholder="Email" required />
        <input v-model="password" type="password" class="input" placeholder="Password" required />
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn btn-primary" :disabled="loading">Sign in</button>
      </form>
      <p class="footer">Don't have an account? <router-link to="/register">Register</router-link></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    router.push('/dashboard')
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}
.auth-card {
  width: 100%;
  max-width: 380px;
}
.auth-card h1 {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
}
.subtitle {
  color: var(--text-muted);
  margin: 0 0 1.5rem;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.error {
  color: var(--danger);
  font-size: 0.9rem;
  margin: 0;
}
.footer {
  margin-top: 1rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
