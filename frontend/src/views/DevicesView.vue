<template>
  <div class="devices-view">
    <div class="toolbar">
      <h1>Devices</h1>
      <router-link to="/devices/new" class="btn btn-primary">Add device</router-link>
    </div>
    <div v-if="loading" class="loading">Loading…</div>
    <ul v-else class="device-list">
      <li v-for="d in devices" :key="d.id" class="card device-card">
        <div class="device-info">
          <span class="device-name">{{ d.name }}</span>
          <span class="device-type">{{ d.device_type }}</span>
          <span v-if="d.room" class="device-room">{{ d.room }}</span>
          <span class="device-status" :class="d.is_online ? 'online' : 'offline'">
            {{ d.is_online ? 'Online' : 'Offline' }}
          </span>
        </div>
        <div class="device-actions">
          <button class="btn" @click="toggleOnline(d)">Toggle</button>
        </div>
      </li>
      <li v-if="devices.length === 0" class="empty">No devices. <router-link to="/devices/new">Add one</router-link></li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, type Device } from '@/services/api'

const devices = ref<Device[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get<Device[]>('/api/v1/devices')
    devices.value = data
  } finally {
    loading.value = false
  }
}

async function toggleOnline(d: Device) {
  try {
    await api.patch(`/api/v1/devices/${d.id}`, { is_online: !d.is_online })
    d.is_online = !d.is_online
  } catch {
    // ignore
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.toolbar h1 {
  margin: 0;
}
.device-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.device-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.device-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
}
.device-name {
  font-weight: 600;
}
.device-type, .device-room {
  color: var(--text-muted);
  font-size: 0.9rem;
}
.device-status.online {
  color: var(--accent);
}
.device-status.offline {
  color: var(--text-muted);
}
.empty {
  color: var(--text-muted);
}
</style>
