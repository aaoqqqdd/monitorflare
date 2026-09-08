<template>
  <div class="mf-hero fade-up">
    <template v-if="!error">
      <div class="mf-hero-band">
        <div class="mf-hero-lead">
          <div class="mf-hero-code font-mono">
            <span>{{ $t('statusHeader.statusPage') }}</span>
            <span class="mf-hero-code-sep">/</span>
            <span>{{ $t('statusPage.lastChecked', { time: nowLabel }) }}</span>
          </div>
          <h1 class="mf-hero-title">{{ cfg.title }}</h1>
          <p class="mf-hero-sub">{{ cfg.subtitle }}</p>
        </div>

        <div class="mf-hero-badge font-mono" :class="cfg.tone">
          <span class="mf-hero-badge-dot"></span>
          <span>{{ cfg.badge }}</span>
        </div>
      </div>

      <div class="mf-hero-stats">
        <div class="mf-stat" data-bar="primary">
          <span class="mf-stat-label">{{ $t('hero.monitors') }}</span>
          <span class="mf-stat-value font-mono">{{ activeMonitors.length }}</span>
        </div>
        <div class="mf-stat" :data-bar="upPct >= 100 ? 'success' : upPct >= 90 ? 'warning' : 'danger'">
          <span class="mf-stat-label">{{ $t('hero.currentUp') }}</span>
          <span class="mf-stat-value font-mono" :class="upPctTone">{{ upPct }}<span class="mf-stat-unit">%</span></span>
        </div>
        <div class="mf-stat" data-bar="primary">
          <span class="mf-stat-label">{{ $t('hero.avgLatency') }}</span>
          <span class="mf-stat-value font-mono">{{ avgLatency != null ? avgLatency : '—' }}<span v-if="avgLatency != null" class="mf-stat-unit">ms</span></span>
        </div>
      </div>
    </template>

    <div v-else class="mf-hero-error">
      <i class="fas fa-triangle-exclamation"></i>
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="mf-hero-retry font-mono">{{ $t('hero.retry') }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
    monitors:       { type: Array,   required: true },
    activeMonitors: { type: Array,   required: true },
    allUp:          { type: Boolean, required: true },
    hasRetrying:    { type: Boolean, required: true },
    hasDown:        { type: Boolean, required: true },
    hasDegraded:    { type: Boolean, default: false },
    avgLatency:     { type: Number,  default: null },
    error:          { type: String,  default: null },
});

defineEmits(['retry']);

const { t } = useI18n();

const STATUS = {
    up:       { tone: 'tone-up',   titleKey: 'hero.allUpTitle',    subtitleKey: 'hero.allUpSubtitle',    badgeKey: 'hero.allUpBadge' },
    retrying: { tone: 'tone-warn', titleKey: 'hero.checkingTitle', subtitleKey: 'hero.checkingSubtitle', badgeKey: 'hero.checkingBadge' },
    degraded: { tone: 'tone-warn', titleKey: 'hero.degradedTitle', subtitleKey: 'hero.degradedSubtitle', badgeKey: 'hero.degradedBadge' },
    down:     { tone: 'tone-down', titleKey: 'hero.downTitle',     subtitleKey: 'hero.downSubtitle',     badgeKey: 'hero.downBadge' },
};

const cfg = computed(() => {
    let base;
    if (props.hasDown) base = STATUS.down;
    else if (props.hasDegraded) base = STATUS.degraded;
    else if (props.hasRetrying) base = STATUS.retrying;
    else base = STATUS.up;
    return { tone: base.tone, title: t(base.titleKey), subtitle: t(base.subtitleKey), badge: t(base.badgeKey) };
});

const upPct = computed(() => {
    const n = props.activeMonitors.length;
    if (!n) return 0;
    return Math.round(props.activeMonitors.filter(m => m.status === 'UP').length / n * 100);
});
const upPctTone = computed(() => (upPct.value >= 100 ? 'tone-up' : upPct.value >= 90 ? 'tone-warn' : 'tone-down'));

const nowLabel = computed(() => new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }));
</script>

<style scoped>
.mf-hero { margin-bottom: 36px; }

/* ── graphite console band (rent .page-header) ── */
.mf-hero-band {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 32px;
    padding: 26px 28px;
    background: var(--mf-graphite);
    border-bottom: 4px solid var(--mf-accent);
    border-radius: var(--mf-radius-md) var(--mf-radius-md) 0 0;
}
.mf-hero-lead { min-width: 0; }
.mf-hero-code {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--mf-accent);
}
.mf-hero-code-sep { color: #5b6b7a; }
.mf-hero-code span:last-child { color: #8da0b1; }
.mf-hero-title {
    margin: 12px 0 0;
    font-family: var(--mf-display);
    font-weight: 600;
    font-size: clamp(1.55rem, 3vw, 2.1rem);
    line-height: 1.08;
    letter-spacing: 0.035em;
    text-transform: uppercase;
    color: #fff;
}
.mf-hero-sub { margin: 8px 0 0; font-size: 14px; line-height: 1.55; color: #b9c4ce; max-width: 520px; }

.mf-hero-badge {
    display: flex; align-items: center; gap: 9px;
    flex: none;
    padding: 7px 14px;
    border-radius: 999px;
    border: 1px solid currentColor;
    font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    white-space: nowrap;
}
.mf-hero-badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 22%, transparent);
}

/* ── stat cards (rent .stat-card) ── */
.mf-hero-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 12px;
    background: var(--mf-surface-2);
    border: 1px solid var(--mf-line);
    border-top: 0;
    border-radius: 0 0 var(--mf-radius-md) var(--mf-radius-md);
}
.mf-stat {
    position: relative;
    overflow: hidden;
    padding: 18px 18px 16px;
    background: var(--mf-surface);
    border: 1px solid var(--mf-line);
    border-radius: var(--mf-radius);
    box-shadow: var(--mf-shadow-sm);
}
.mf-stat::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: var(--mf-primary);
}
.mf-stat[data-bar="success"]::before { background: var(--mf-up); }
.mf-stat[data-bar="warning"]::before { background: var(--mf-warn); }
.mf-stat[data-bar="danger"]::before  { background: var(--mf-down); }
.mf-stat-label {
    display: block;
    font-family: var(--mf-display);
    font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--mf-ink-muted);
}
.mf-stat-value {
    display: block;
    margin-top: 8px;
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--mf-ink);
}
.mf-stat-unit { font-size: 15px; color: var(--mf-ink-muted); margin-left: 2px; }

.tone-up { color: var(--mf-up); }
.tone-warn { color: var(--mf-warn); }
.tone-down { color: var(--mf-down); }

.mf-hero-error {
    display: flex; align-items: center; gap: 16px;
    padding: 16px 18px;
    border: 1px solid var(--mf-line);
    border-left: 4px solid var(--mf-warn);
    border-radius: var(--mf-radius);
    background: var(--mf-warn-bg);
}
.mf-hero-error i { color: var(--mf-warn); font-size: 16px; }
.mf-hero-error p { flex: 1; font-size: 14px; color: var(--mf-ink-2); }
.mf-hero-retry {
    flex: none;
    padding: 8px 14px;
    border-radius: var(--mf-radius);
    border: 1px solid color-mix(in srgb, var(--mf-warn) 45%, transparent);
    background: transparent;
    color: var(--mf-warn);
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer;
}

@media (max-width: 720px) {
    .mf-hero-band { flex-direction: column; gap: 16px; padding: 20px; }
    .mf-hero-stats { grid-template-columns: 1fr; }
    .mf-stat-value { font-size: 22px; }
}
</style>
