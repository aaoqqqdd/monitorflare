<template>
  <article class="mf-row group"
    :class="[
      monitor.paused ? 'is-paused' : '',
      monitor.status === 'DOWN' ? 'is-down' : '',
      (monitor.status === 'RETRYING' || monitor.status === 'DEGRADED') ? 'is-warn' : '',
    ]"
    :style="{ animationDelay: (index * 0.05) + 's' }">

    <div class="mf-row-main">
      <!-- identity -->
      <div class="mf-row-identity min-w-0">
        <div class="mf-row-nameline min-w-0">
          <span class="mf-row-dot" :class="statusTone" aria-hidden="true"></span>
          <router-link :to="`/monitor/${monitor.id}`" :title="$t('monitorCard.viewDetails')" class="mf-row-name">
            {{ monitor.name }}
          </router-link>
          <span class="mf-type" :title="$t('monitorCard.type.' + typeKey)">{{ typeLabel }}</span>
          <svg class="mf-row-go" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        </div>
        <div class="mf-row-sub min-w-0">
          <a :href="linkUrl" target="_blank" rel="noopener" class="mf-row-link" :title="linkUrl">
            {{ displayLink }}<span class="mf-row-link-arrow" aria-hidden="true">↗</span>
          </a>
          <span v-if="monitor.last_check" class="mf-row-check">{{ formatDate(monitor.last_check) }}</span>
          <a v-if="monitor.cert_expiry && sslCheckUrl" :href="sslCheckUrl" target="_blank" rel="noopener"
            class="mf-ssl" :class="expiryTone(monitor.cert_expiry)" :title="$t('monitorCard.sslCheck')">
            <i class="fa-solid fa-lock"></i>SSL {{ formatExpiry(monitor.cert_expiry) }}
          </a>
        </div>
      </div>

      <!-- telemetry -->
      <div class="mf-row-tele">
        <svg v-if="sparkline && !monitor.paused" class="mf-spark" :class="statusTone" viewBox="0 0 120 28" preserveAspectRatio="none" :aria-label="$t('monitorCard.latencyTrend')">
          <path :d="sparkline.area" fill="currentColor" opacity="0.12"/>
          <path :d="sparkline.line" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
          <circle :cx="sparkline.dot.x" :cy="sparkline.dot.y" r="2.4" fill="currentColor"/>
        </svg>
        <span v-if="monitor.latency != null && !monitor.paused" class="mf-chip font-mono">{{ monitor.latency }}ms</span>
        <span class="mf-state font-mono" :class="statusTone">{{ statusLabel }}</span>
        <div v-if="uptime != null && !monitor.paused" class="mf-metric">
          <strong class="font-mono" :class="uptimeTone">{{ uptime.toFixed(2) }}<span class="mf-metric-pct">%</span></strong>
          <span class="mf-metric-label">30d uptime</span>
        </div>
      </div>
    </div>

    <UptimeBar v-if="monitor.daily_stats && monitor.daily_stats.length > 0 && !monitor.paused" :monitor="monitor" compact />
  </article>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatDate, formatExpiry, getDaysRemaining, monitorLink } from '../../utils/format';
import UptimeBar from './UptimeBar.vue';

const props = defineProps({
    monitor: { type: Object, required: true },
    index:   { type: Number, required: true },
});

const { t } = useI18n();

const linkUrl = computed(() => monitorLink(props.monitor));
const displayLink = computed(() => linkUrl.value.replace(/^https?:\/\//i, '').replace(/\/$/, ''));

const uptime = computed(() => {
    const raw = props.monitor.uptime_30d;
    if (raw == null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
});
const uptimeTone = computed(() => {
    if (uptime.value == null || uptime.value >= 99.9) return 'tone-up';
    if (uptime.value >= 95) return 'tone-warn';
    return 'tone-down';
});
const statusTone = computed(() => {
    if (props.monitor.paused) return 'tone-paused';
    if (props.monitor.status === 'UP') return 'tone-up';
    if (props.monitor.status === 'DOWN') return 'tone-down';
    return 'tone-warn';
});
const statusLabel = computed(() => {
    if (props.monitor.paused) return t('status.paused');
    if (props.monitor.status === 'UP') return t('status.up');
    if (props.monitor.status === 'DOWN') return t('status.down');
    if (props.monitor.status === 'DEGRADED') return t('status.degraded');
    return t('status.retrying');
});

const expiryTone = (dateStr) => {
    const days = getDaysRemaining(dateStr);
    if (days == null) return '';
    if (days < 7) return 'tone-down';
    if (days < 30) return 'tone-warn';
    return 'tone-up';
};

const sparkline = computed(() => {
    const lats = props.monitor.recent_latencies;
    if (!lats || lats.length < 3) return null;
    const W = 120, H = 28, P = 2;
    const max = Math.max(...lats), min = Math.min(...lats);
    const range = max - min || 1;
    const pts = lats.map((v, i) => ({
        x: P + (i / (lats.length - 1)) * (W - 2 * P),
        y: H - P - ((v - min) / range) * (H - 2 * P),
    }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const ptStr = pts.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    const area = `M${ptStr[0]} L${ptStr.join(' L')} L${(W - P).toFixed(1)} ${H} L${P} ${H} Z`;
    return { line, area, dot: pts[pts.length - 1] };
});

const typeKey = computed(() => {
    const ty = props.monitor.type || 'http';
    return ty === 'http' && props.monitor.check_ssl === 1 ? 'ssl' : ty;
});
const typeLabel = computed(() => ({
    ssl: 'SSL', http: 'HTTP', dns: 'DNS', port: 'TCP',
}[typeKey.value] || 'HTTP'));

const sslCheckUrl = computed(() => {
    try {
        const host = new URL(props.monitor.url).hostname;
        return host ? `https://csr.plus/check?domain=${encodeURIComponent(host)}` : '';
    } catch { return ''; }
});
</script>

<style scoped>
/* rent .card + left status accent (rent .stat-card::before) */
.mf-row {
    position: relative;
    overflow: hidden;
    padding: 16px 18px 18px;
    background: var(--mf-surface);
    border: 1px solid var(--mf-line);
    border-radius: var(--mf-radius);
    box-shadow: var(--mf-shadow-sm);
    animation: mf-fade-up 0.45s ease-out both;
    transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
}
.mf-row::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: var(--mf-up);
}
.mf-row:hover { box-shadow: var(--mf-shadow-md); transform: translateY(-1px); }
.mf-row.is-warn::before { background: var(--mf-warn); }
.mf-row.is-warn { border-color: color-mix(in srgb, var(--mf-warn) 40%, var(--mf-line)); }
.mf-row.is-down::before { background: var(--mf-down); }
.mf-row.is-down { border-color: color-mix(in srgb, var(--mf-down) 42%, var(--mf-line)); }
.mf-row.is-paused { opacity: 0.55; }
.mf-row.is-paused::before { background: var(--mf-ink-muted); }

.mf-row-main { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }

.mf-row-identity { display: flex; flex-direction: column; gap: 6px; }
.mf-row-nameline { display: flex; align-items: center; gap: 9px; }
.mf-row-dot {
    flex: none; width: 7px; height: 7px; border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 16%, transparent);
}
.mf-row-name {
    min-width: 0; overflow: hidden;
    font-size: 15px; font-weight: 700; letter-spacing: 0.005em;
    color: var(--mf-ink);
    text-overflow: ellipsis; white-space: nowrap;
}
.mf-row-name:hover { color: var(--mf-primary); }
/* rent .badge (neutral) */
.mf-type {
    flex: none;
    font-family: var(--mf-mono);
    font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 2px 7px; border-radius: 999px;
    color: var(--mf-ink-2);
    background: var(--mf-surface-2);
    border: 1px solid var(--mf-line);
}
.mf-row-go {
    width: 12px; height: 12px; flex: none;
    color: var(--mf-ink-muted);
    opacity: 0; transform: translateX(-3px);
    transition: opacity 0.16s, transform 0.16s;
}
.mf-row:hover .mf-row-go { opacity: 1; transform: translateX(0); }

.mf-row-sub {
    display: flex; align-items: center; flex-wrap: wrap; gap: 4px 14px;
    padding-left: 16px;
    font-family: var(--mf-mono);
    font-size: 12px;
}
.mf-row-link { display: inline-flex; align-items: center; gap: 3px; color: var(--mf-ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 340px; }
.mf-row-link:hover { color: var(--mf-primary); }
.mf-row-link-arrow { opacity: 0; transition: opacity 0.15s; }
.mf-row:hover .mf-row-link-arrow { opacity: 0.6; }
.mf-row-check { font-size: 10px; letter-spacing: 0.06em; color: var(--mf-ink-muted); }
.mf-ssl { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; letter-spacing: 0.04em; }
.mf-ssl i { font-size: 9px; }

.mf-row-tele { display: flex; flex: none; align-items: center; gap: 14px; }
.mf-spark { width: 82px; height: 24px; }
/* rent .badge (mono pill, leading dot) */
.mf-chip {
    font-size: 10.5px; padding: 3px 9px; border-radius: 999px;
    color: var(--mf-ink-2);
    background: var(--mf-surface-2);
    border: 1px solid var(--mf-line);
    font-variant-numeric: tabular-nums;
}
.mf-state {
    display: inline-flex; align-items: center; gap: 6px;
    flex: none;
    padding: 3px 10px; border-radius: 999px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: currentColor;
    background: color-mix(in srgb, currentColor 13%, transparent);
}
.mf-state::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.mf-metric { display: grid; gap: 2px; min-width: 60px; text-align: right; }
.mf-metric > strong { font-size: 14px; font-weight: 500; font-variant-numeric: tabular-nums; }
.mf-metric-pct { font-size: 10px; color: var(--mf-ink-muted); margin-left: 1px; }
.mf-metric-label { font-family: var(--mf-display); font-size: 9px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mf-ink-muted); }

.tone-up { color: var(--mf-up); }
.tone-warn { color: var(--mf-warn); }
.tone-down { color: var(--mf-down); }
.tone-paused { color: var(--mf-ink-muted); }

@keyframes mf-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 720px) {
    .mf-row { padding: 14px 14px 16px; }
    .mf-row-main { display: grid; gap: 12px; }
    .mf-row-tele { justify-content: space-between; }
    .mf-spark { display: none; }
    .mf-row-link { max-width: 60vw; }
    .mf-metric { min-width: 0; }
}
@media (prefers-reduced-motion: reduce) {
    .mf-row { animation: none; }
}
</style>
