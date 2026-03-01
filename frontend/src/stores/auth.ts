import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'

const TOKEN_KEY = 'eco_nexus_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))

  const isAuthenticated = computed(() => !!token.value)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem(TOKEN_KEY, t)
  }

  function clearToken() {
    token.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  function restoreToken() {
    token.value = localStorage.getItem(TOKEN_KEY)
  }

  async function login(email: string, password: string) {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const { data } = await api.post<{ access_token: string }>('/api/v1/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    setToken(data.access_token)
  }

  async function register(email: string, password: string, fullName?: string) {
    await api.post('/api/v1/auth/register', { email, password, full_name: fullName })
  }

  async function logout() {
    clearToken()
  }

  return { token, isAuthenticated, setToken, clearToken, restoreToken, login, register, logout }
})
