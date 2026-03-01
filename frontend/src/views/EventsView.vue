<template>
  <div class="events-view">
    <h1>Events</h1>
    <p class="muted">10K+ events daily — stream and filter</p>
    <div class="card stats-bar">
      <span><strong>{{ stats.total_events }}</strong> total</span>
      <span><strong>{{ stats.events_today }}</strong> today</span>
    </div>
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else class="event-table-wrap card">
      <table class="event-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Device</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in events" :key="e.id">
            <td>{{ e.id }}</td>
            <td>{{ e.event_type }}</td>
            <td>#{{ e.device_id }}</td>
            <td>{{ formatDate(e.created_at) }}</td>
          </tr>
          <tr v-if="events.length === 0">
            <td colspan="4" class="muted">No events yet</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, type Event, type EventStats } from '@/services/api'

const events = ref<Event[]>([])
const stats = ref<EventStats>({ total_events: 0, events_today: 0, by_type: {} })
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const [evRes, stRes] = await Promise.all([
      api.get<Event[]>('/api/v1/events?limit=100'),
      api.get<EventStats>('/api/v1/events/stats'),
    ])
    events.value = evRes.data
    stats.value = stRes.data
  } finally {
    loading.value = false
  }
}

function formatDate(s: string) {
  return new Date(s).toLocaleString()
}

onMounted(load)
</script>

<style scoped>
.events-view h1 {
  margin: 0 0 0.25rem;
}
.muted {
  color: var(--text-muted);
  margin: 0 0 1rem;
}
.stats-bar {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}
.event-table-wrap {
  overflow-x: auto;
}
.event-table {
  width: 100%;
  border-collapse: collapse;
}
.event-table th,
.event-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.event-table th {
  color: var(--text-muted);
  font-weight: 500;
}
</style>
