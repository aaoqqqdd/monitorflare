<template>
  <div class="mf-uptime" :class="compact ? 'is-compact' : ''">
    <div class="mf-uptime-labels font-mono">
      <span>{{ $t('uptimeBar.daysAgo') }}</span>
      <span v-if="!compact && monitor.uptime_30d != null" class="mf-uptime-mid" :class="pctTone(monitor.uptime_30d)">
        {{ $t('uptimeBar.last30d', { pct: monitor.uptime_30d }) }}
      </span>
      <span>{{ $t('uptimeBar.yesterday') }}</span>
    </div>
    <div class="mf-uptime-cells">
      <div v-for="(day, i) in displayDays" :key="i" class="mf-uptime-cell" :class="dayClass(day)">
        <div class="mf-uptime-tip font-mono">
          {{ day.date }} ·
          <span v-if="day.total > 0">{{ ((day.up / day.total) * 100).toFixed(1) }}%</span>
          <span v-else>{{ $t('uptimeBar.noData') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    monitor: { type: Object, required: true },
    compact: { type: Boolean, default: false },
});

const displayDays = computed(() => {
    const stats = props.monitor.daily_stats || [];
    const map = {};
    stats.forEach(s => { map[s.date] = s; });
    const now = Date.now();
    const days = [];
    for (let i = 89; i >= 0; i--) {
        const ds = new Date(now - i * 86400000).toISOString().slice(0, 10);
        const s = map[ds];
        days.push({ date: ds, up: s ? s.up : 0, total: s ? s.total : 0 });
    }
    return days;
});

const dayClass = (day) => {
    if (day.total === 0) return 'c-none';
    const pct = (day.up / day.total) * 100;
    if (pct >= 99.9) return 'c-up';
    if (pct >= 95) return 'c-warn';
    return 'c-down';
};

const pctTone = (pct) => (pct >= 99.9 ? 'tone-up' : pct >= 95 ? 'tone-warn' : 'tone-down');
</script>

<style scoped>
.mf-uptime { position: relative; }
.mf-uptime.is-compact { margin-top: 16px; }
.mf-uptime:not(.is-compact) { margin-top: 14px; }

.mf-uptime-labels {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--mf-ink-muted);
    margin-bottom: 7px;
}
.mf-uptime-mid { letter-spacing: 0.04em; }

.mf-uptime-cells {
    display: grid;
    grid-template-columns: repeat(90, minmax(0, 1fr));
    gap: 2px;
    height: 24px;
}
.is-compact .mf-uptime-cells { height: 26px; }

.mf-uptime-cell {
    position: relative;
    border-radius: 1px;
    transition: transform 0.12s, filter 0.12s;
}
.mf-uptime-cell:hover { transform: scaleY(1.35); filter: brightness(1.12); z-index: 5; }
.mf-uptime-cell.c-up   { background: var(--mf-up); }
.mf-uptime-cell.c-warn { background: var(--mf-warn); }
.mf-uptime-cell.c-down { background: var(--mf-down); }
.mf-uptime-cell.c-none { background: var(--mf-line-strong); }

.mf-uptime-tip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    padding: 5px 9px;
    border-radius: 4px;
    font-size: 10px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.16s;
    z-index: 20;
    background: var(--mf-ink);
    color: var(--mf-bg);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}
.mf-uptime-cell:hover .mf-uptime-tip { opacity: 1; visibility: visible; }
.mf-uptime-cell:nth-child(-n+18) .mf-uptime-tip { left: 0; transform: translateX(0); }
.mf-uptime-cell:nth-last-child(-n+18) .mf-uptime-tip { left: auto; right: 0; transform: translateX(0); }

.tone-up { color: var(--mf-up); }
.tone-warn { color: var(--mf-warn); }
.tone-down { color: var(--mf-down); }

@media (max-width: 640px) {
    .mf-uptime-cells { gap: 1.5px; height: 20px; }
    .is-compact .mf-uptime-cells { height: 20px; }
    .mf-uptime-tip { display: none; }
}
</style>
