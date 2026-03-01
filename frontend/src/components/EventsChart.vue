<template>
  <div class="chart-wrap">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  Chart,
  registerables,
  type ChartConfiguration,
} from 'chart.js'
import type { EventStats } from '@/services/api'

Chart.register(...registerables)

const props = defineProps<{ stats: EventStats }>()
const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function render() {
  if (!canvas.value || !props.stats.by_type) return
  const labels = Object.keys(props.stats.by_type)
  const data = Object.values(props.stats.by_type)
  const config: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#3fb950',
          '#58a6ff',
          '#d29922',
          '#bc8cff',
          '#f85149',
        ].slice(0, data.length),
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  }
  if (chart) chart.destroy()
  chart = new Chart(canvas.value, config)
}

watch(() => props.stats, render, { deep: true })
onMounted(render)
</script>

<style scoped>
.chart-wrap {
  height: 220px;
  position: relative;
}
</style>
