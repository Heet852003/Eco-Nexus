<template>
  <div class="form-view">
    <h1>Add device</h1>
    <form @submit.prevent="submit" class="card form-card">
      <label>Name</label>
      <input v-model="name" class="input" required />
      <label>Type</label>
      <select v-model="deviceType" class="input">
        <option value="thermostat">Thermostat</option>
        <option value="light">Light</option>
        <option value="sensor">Sensor</option>
        <option value="plug">Plug</option>
        <option value="lock">Lock</option>
        <option value="other">Other</option>
      </select>
      <label>Room (optional)</label>
      <input v-model="room" class="input" />
      <p v-if="error" class="error">{{ error }}</p>
      <div class="actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">Create</button>
        <router-link to="/devices" class="btn">Cancel</router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'

const router = useRouter()
const name = ref('')
const deviceType = ref('thermostat')
const room = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await api.post('/api/v1/devices', {
      name: name.value,
      device_type: deviceType.value,
      room: room.value || null,
    })
    router.push('/devices')
  } catch (e) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err?.response?.data?.detail ?? 'Failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-view h1 {
  margin: 0 0 1rem;
}
.form-card {
  max-width: 420px;
}
.form-card label {
  display: block;
  margin: 1rem 0 0.25rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}
.form-card .input {
  margin: 0;
}
.form-card select.input {
  cursor: pointer;
}
.error {
  color: var(--danger);
  margin-top: 1rem;
}
.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
