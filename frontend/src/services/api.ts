import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eco_nexus_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore().clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Types matching backend schemas
export interface User {
  id: number
  email: string
  full_name: string | null
  is_active: boolean
}

export interface Device {
  id: number
  user_id: number
  name: string
  device_type: string
  room: string | null
  is_online: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface Event {
  id: number
  device_id: number
  user_id: number
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}

export interface DashboardSummary {
  devices_total: number
  devices_online: number
  events_today: number
}

export interface EventStats {
  total_events: number
  events_today: number
  by_type: Record<string, number>
}
