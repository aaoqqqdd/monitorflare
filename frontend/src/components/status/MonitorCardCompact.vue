<template>
  <router-link :to="`/monitor/${monitor.id}`"
    class="glass-card monitor-card monitor-card-compact rounded-xl px-4 py-3 block group"
    :class="[
      monitor.paused ? 'opacity-50 monitor-status-paused' : '',
      monitor.status === 'UP' && !monitor.paused ? 'monitor-status-up' : '',
      monitor.status === 'DOWN' ? 'monitor-status-down' : '',
      monitor.status === 'RETRYING' ? 'monitor-status-retrying' : '',
      monitor.status === 'DEGRADED' ? 'monitor-status-degraded' : '',
    ]"
    :style="{ animationDelay: (index * 0.05) + 's' }">

    <div class="flex items-center gap-2 min-w-0">
      <div class="relative shrink-0">
        <div class="w-2.5 h-2.5 rounded-full"
          :class="{
            'bg-emerald-400': monitor.status === 'UP' && !monitor.paused,
            'bg-red-400': monitor.status === 'DOWN',
            'bg-yellow-400': monitor.status === 'RETRYING',
            'bg-amber-400': monitor.status === 'DEGRADED',
            'bg-slate-400 dark:bg-slate-600': monitor.paused,
          }"></div>
        <div v-if="monitor.status === 'UP' && !monitor.paused" class="absolute inset-0 rounded-full bg-emerald-400/40 pulse-dot"></div>
      </div>

      <h3 class="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">{{ monitor.name }}</h3>

      <span class="type-badge shrink-0" :title="$t('monitorCard.type.' + typeKey)">
        <span class="type-badge-icon"><i :class="typeIcon"></i></span>
        <span class="type-badge-label">{{ typeLabel }}</span>
      </span>

      <span class="ml-auto shrink-0 inline-flex justify-center px-2 py-0.5 rounded-md text-[10px] font-bold border"
        :class="statusBadgeClass(monitor.status, monitor.paused)">
        {{ statusLabel }}
      </span>
    </div>

    <div class="mt-2 pl-4.5 flex items-center gap-2 min-w-0">
      <a :href="linkUrl" target="_blank" rel="noopener" @click.stop
        class="text-[11px] font-mono text-slate-500 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate">
        {{ linkUrl }}
      </a>
      <span class="ml-auto shrink-0 text-[10px] font-mono text-slate-400 dark:text-slate-600">{{ formatDate(monitor.last_check) }}</span>
    </div>

    <div v-if="!monitor.paused" class="mt-2 pl-4.5 flex flex-wrap items-center gap-1.5">
      <span v-if="monitor.latency != null"
        class="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-medium border"
        :class="latencyClass(monitor.latency)">
        <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>
        {{ monitor.latency }}ms
      </span>
      <span v-if="monitor.uptime_24h != null"
        class="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border"
        :class="monitor.uptime_24h >= 99.9 ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : monitor.uptime_24h >= 95 ? 'text-yellow-600 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-400/20' : 'text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'">
        24h {{ monitor.uptime_24h }}%
      </span>
    </div>

    <div v-if="days.length > 0 && !monitor.paused" class="mt-2.5 pl-4.5">
      <div class="flex gap-[1.5px] items-end">
        <div v-for="(day, i) in days" :key="i"
          class="flex-1 rounded-[1.5px]" style="height:14px"
          :class="dayColorClass(day)"></div>
      </div>
      <div class="flex justify-between items-center mt-1">
        <span class="text-[9px] font-mono text-slate-400/60 dark:text-slate-600/60">{{ $t('monitorCardCompact.daysAgo', { n: days.length }) }}</span>
        <span v-if="monitor.uptime_30d != null" class="text-[10px] font-mono font-semibold"
          :class="monitor.uptime_30d >= 99.9 ? 'text-emerald-500' : monitor.uptime_30d >= 95 ? 'text-yellow-500' : 'text-red-500'">
          {{ $t('uptimeBar.last30d', { pct: monitor.uptime_30d }) }}
        </span>
        <span class="text-[9px] font-mono text-slate-400/60 dark:text-slate-600/60">{{ $t('uptimeBar.yesterday') }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue';
import { formatDate, latencyClass, statusBadgeClass, monitorLink } from '../../utils/format';
import { useI18n } from 'vue-i18n';

const props = defineProps({
    monitor: { type: Object, required: true },
    index:   { type: Number, required: true },
    span:    { type: Number, default: 30 },
});

const { t } = useI18n();

const linkUrl = computed(() => monitorLink(props.monitor));

const statusLabel = computed(() => {
    if (props.monitor.paused) return t('status.paused');
    return {
        UP: t('status.up'),
        DOWN: t('status.down'),
        DEGRADED: t('status.degraded'),
    }[props.monitor.status] || t('status.retrying');
});

const typeKey = computed(() => {
    const ty = props.monitor.type || 'http';
    return ty === 'http' && props.monitor.check_ssl === 1 ? 'ssl' : ty;
});

const typeIcon = computed(() => ({
    ssl: 'fa-brands fa-expeditedssl',
    http: 'fa-solid fa-fingerprint',
    dns: 'fa-solid fa-globe',
    port: 'fa-solid fa-server',
}[typeKey.value] || 'fa-solid fa-fingerprint'));

const typeLabel = computed(() => ({
    ssl: 'SSL',
    http: 'HTTP/HTTPS',
    dns: 'DNS',
    port: 'TCP',
}[typeKey.value] || 'HTTP/HTTPS'));

const days = computed(() => {
    const stats = props.monitor.daily_stats || [];
    if (stats.length === 0) return [];
    const map = {};
    stats.forEach(s => { map[s.date] = s; });
    const now = Date.now();
    const out = [];
    for (let i = props.span - 1; i >= 0; i--) {
        const ds = new Date(now - i * 86400000).toISOString().slice(0, 10);
        const s = map[ds];
        out.push({ date: ds, up: s ? s.up : 0, total: s ? s.total : 0 });
    }
    return out;
});

const dayColorClass = (day) => {
    if (day.total === 0) return 'bg-slate-200/80 dark:bg-slate-800/60';
    const pct = (day.up / day.total) * 100;
    if (pct >= 99.9) return 'bg-emerald-400 dark:bg-emerald-500';
    if (pct >= 95)   return 'bg-yellow-400 dark:bg-yellow-500';
    return 'bg-red-400 dark:bg-red-500';
};
</script>

<style scoped>
.pl-4\.5 { padding-left: 1.125rem; }
.monitor-card-compact:hover .type-badge-label { background: #10b981; }
</style>
