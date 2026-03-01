<template>
  <div class="automation-view">
    <h1>Automation</h1>
    <p class="muted">Rules and schedules (UI placeholder — extend via API)</p>
    <div class="card">
      <h3>Coming soon</h3>
      <p>Define triggers (e.g. time, sensor threshold) and actions (e.g. turn on light, set thermostat). Backend can expose <code>/api/v1/automation</code> for rules CRUD and execution.</p>
    </div>
  </div>
</template>

<style scoped>
.automation-view h1 {
  margin: 0 0 0.25rem;
}
.muted {
  color: var(--text-muted);
  margin: 0 0 1rem;
}
.card h3 {
  margin: 0 0 0.5rem;
}
.card code {
  background: var(--bg);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9rem;
}
</style>
