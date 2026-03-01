<template>
  <div class="dashboard">
    <h1>Dashboard</h1>
    <p class="muted">Real-time overview — 10K+ events daily</p>
    <div v-if="loading" class="loading">Loading…</div>
    <template v-else>
      <div class="stats">
        <div class="card stat-card">
          <span class="stat-value">{{ summary.devices_total }}</span>
          <span class="stat-label">Devices</span>
        </div>
        <div class="card stat-card">
          <span class="stat-value">{{ summary.devices_online }}</span>
          <span class="stat-label">Online</span>
        </div>
        <div class="card stat-card">
          <span class="stat-value">{{ summary.events_today }}</span>
          <span class="stat-label">Events today</span>
        </div>
      </div>
      <div class="grid">
        <div class="card chart-card">
          <h3>Events by type</h3>
          <EventsChart :stats="eventStats" />
        </div>
        <div class="card">
          <h3>Recent activity</h3>
          <ul class="event-list">
            <li v-for="e in recentEvents" :key="e.id" class="event-item">
              <span class="event-type">{{ e.event_type }}</span>
              <span class="event-meta">Device #{{ e.device_id }} · {{ formatDate(e.created_at) }}</span>
            </li>
            <li v-if="recentEvents.length === 0" class="event-item muted">No recent events</li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, type DashboardSummary, type EventStats, type Event } from '@/services/api'
import EventsChart from '@/components/EventsChart.vue'

const summary = ref<DashboardSummary>({ devices_total: 0, devices_online: 0, events_today: 0 })
const eventStats = ref<EventStats>({ total_events: 0, events_today: 0, by_type: {} })
const recentEvents = ref<Event[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const [sumRes, statsRes, eventsRes] = await Promise.all([
      api.get<DashboardSummary>('/api/v1/dashboard/summary'),
      api.get<EventStats>('/api/v1/events/stats'),
      api.get<Event[]>('/api/v1/events?limit=10'),
    ])
    summary.value = sumRes.data
    eventStats.value = statsRes.data
    recentEvents.value = eventsRes.data
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
.dashboard h1 {
  margin: 0 0 0.25rem;
}
.muted {
  color: var(--text-muted);
  margin: 0 0 1.5rem;
}
.loading {
  color: var(--text-muted);
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  text-align: center;
}
.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
}
.stat-label {
  font-size: 0.9rem;
  color: var(--text-muted);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}
.chart-card h3,
.card h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
}
.event-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.event-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}
.event-item.muted {
  color: var(--text-muted);
}
.event-type {
  font-weight: 500;
  margin-right: 0.5rem;
}
.event-meta {
  color: var(--text-muted);
}
</style>
