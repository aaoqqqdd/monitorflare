<template>
  <div class="status-shell min-h-screen flex flex-col">
    <StatusHeader :loading="loading" :isDark="isDark" :siteSettings="siteSettings" @toggle-theme="toggleTheme" />

    <main class="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
      <!-- 锁屏(私密模式) -->
      <StatusLockScreen v-if="locked" :title="siteSettings.site_title || 'MonitorFlare'" @unlocked="onUnlocked" />

      <template v-else>
      <!-- 英雄状态区 -->
      <HeroBanner v-if="monitors.length > 0" :monitors="monitors" :activeMonitors="activeMonitors"
        :allUp="allUp" :hasRetrying="hasRetrying" :hasDown="hasDown" :hasDegraded="hasDegraded" :avgLatency="avgLatency" :error="error"
        @retry="fetchMonitors" />

      <!-- 加载占位 -->
      <div v-if="loading && monitors.length === 0" class="space-y-2 fade-up-d2">
        <div v-for="i in 4" :key="i" class="mf-skeleton"></div>
      </div>

      <!-- 无监控项 -->
      <div v-if="!loading && monitors.length === 0" class="mf-empty fade-up-d2">
        <svg class="w-9 h-9" fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7"/>
        </svg>
        <p class="mf-mono-label">{{ $t('statusPage.noMonitorsConfigured') }}</p>
      </div>

      <!-- 事件公告 -->
      <div v-if="incidents.length > 0" class="mt-6 space-y-2.5 fade-up">
        <div v-for="inc in incidents" :key="inc.id" class="mf-incident" :data-severity="inc.severity">
          <i class="fas mf-incident-icon" :class="{
            'fa-circle-exclamation': inc.severity === 'critical',
            'fa-triangle-exclamation': inc.severity === 'warning',
            'fa-circle-info': inc.severity === 'info'
          }"></i>
          <div class="flex-1 min-w-0">
            <p class="mf-incident-title">{{ inc.title }}</p>
            <p v-if="inc.description" class="mf-incident-desc">{{ inc.description }}</p>
            <p class="mf-incident-meta font-mono">{{ formatDate(inc.created_at) }}</p>
          </div>
        </div>
      </div>

      <!-- 监控列表 -->
      <div v-if="monitors.length > 0" class="mt-14">
        <div class="mf-section-head">
          <h2 class="mf-section-title">{{ $t('statusPage.serviceStatus') }}</h2>
          <div class="mf-section-stat font-mono">
            <span>{{ $t('statusPage.activeMonitors', { count: activeMonitors.length }) }}</span>
            <span v-if="lastUpdated" class="mf-dot-sep"></span>
            <span v-if="lastUpdated">{{ lastUpdated }}</span>
          </div>
        </div>

        <div class="mt-4">
          <section v-for="section in monitorSections" :key="section.name" class="mf-group">
            <div v-if="monitorSections.length > 1" class="mf-group-head font-mono">
              <span>{{ section.name }}</span>
              <span class="mf-group-count">{{ $t('statusPage.items', { count: section.items.length }) }}</span>
            </div>
            <div class="mf-rows">
              <MonitorCard v-for="(m, idx) in section.items" :key="m.id" :monitor="m" :index="idx" />
            </div>
          </section>
        </div>
      </div>

      <!-- 订阅 / RSS -->
      <div v-if="monitors.length > 0" class="mf-subscribe fade-up-d3">
        <div class="min-w-0">
          <h3 class="mf-mono-label">{{ $t('statusPage.subscribe') }}</h3>
          <p class="mf-subscribe-hint">{{ $t('statusPage.subscribeHint') }}</p>
        </div>
        <form class="mf-subscribe-form" @submit.prevent="subscribe">
          <input v-model="subEmail" type="email" :placeholder="$t('statusPage.emailPlaceholder')" class="mf-input">
          <button type="submit" :disabled="subscribing" class="mf-btn" :aria-label="$t('statusPage.subscribe')">
            <i class="fas" :class="subscribing ? 'fa-circle-notch fa-spin' : 'fa-arrow-right'"></i>
          </button>
        </form>
      </div>
      <div v-if="monitors.length > 0" class="mf-subscribe-foot">
        <span v-if="subMsg" :class="subOk ? 'mf-ok' : 'mf-err'">{{ subMsg }}</span>
        <span v-else></span>
        <a :href="`${API_BASE}/feed.xml`" target="_blank" class="mf-rss font-mono">
          <i class="fas fa-rss"></i> {{ $t('statusPage.rssFeed') }}
        </a>
      </div>
      </template>
    </main>

    <StatusFooter :loading="loading" :refreshing="refreshing" :canLogout="!locked && !!statusToken" @refresh="manualRefresh" @logout="onLogout" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from '../composables/useTheme';
import { API_BASE, fetchT, withRetry, isStatusLocked, statusLogout, STATUS_TOKEN_KEY } from '../utils/api';
import { formatDate } from '../utils/format';
import { getAppTimezone } from '../main';

import StatusHeader from '../components/status/StatusHeader.vue';
import HeroBanner from '../components/status/HeroBanner.vue';
import MonitorCard from '../components/status/MonitorCard.vue';
import StatusFooter from '../components/status/StatusFooter.vue';
import StatusLockScreen from '../components/status/StatusLockScreen.vue';

const { t } = useI18n();
const { isDark, toggleTheme } = useTheme('theme');

const monitors = ref([]);
const loading = ref(false);
const error = ref(null);
const lastUpdated = ref('');
const refreshing = ref(false);
const incidents = ref([]);
const siteSettings = ref({ site_title: 'MonitorFlare', site_description: '', site_logo_url: '' });
const subEmail = ref('');
const subMsg = ref('');
const subOk = ref(false);
const subscribing = ref(false);
const locked = ref(false);
const statusToken = ref(localStorage.getItem(STATUS_TOKEN_KEY) || '');

const activeMonitors = computed(() => monitors.value.filter(m => m.paused !== 1 && m.status !== 'PAUSED'));
const allUp = computed(() => activeMonitors.value.length > 0 && activeMonitors.value.every(m => m.status === 'UP'));
const hasRetrying = computed(() => activeMonitors.value.some(m => m.status === 'RETRYING'));
const hasDown = computed(() => activeMonitors.value.some(m => m.status === 'DOWN'));
const hasDegraded = computed(() => activeMonitors.value.some(m => m.status === 'DEGRADED'));
const avgLatency = computed(() => {
    const active = activeMonitors.value.filter(m => m.latency != null);
    if (active.length === 0) return null;
    return Math.round(active.reduce((sum, m) => sum + m.latency, 0) / active.length);
});
const monitorSections = computed(() => {
    const groups = new Map();
    for (const monitor of monitors.value) {
        const tag = (monitor.tags || '').split(',').map(x => x.trim()).filter(Boolean)[0] || t('statusPage.ungrouped');
        if (!groups.has(tag)) groups.set(tag, []);
        groups.get(tag).push(monitor);
    }
    return [...groups.entries()].map(([name, items]) => ({ name, items }));
});

const fetchMonitors = async () => {
    loading.value = true;
    error.value = null;
    try {
        const res = await withRetry(() => fetchT(`${API_BASE}/monitors/public/details`));
        if (await isStatusLocked(res)) {
            locked.value = true;
            monitors.value = [];
            return;
        }
        if (res.ok) {
            const data = await res.json();
            monitors.value = data.monitors || [];
            lastUpdated.value = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: getAppTimezone() });
        } else {
            let errorMsg = t('statusPage.serverError', { status: res.status });
            try { const d = await res.json(); if (d?.error) errorMsg = t('statusPage.apiError', { error: d.error }); } catch {}
            error.value = errorMsg;
        }
    } catch {
        error.value = t('statusPage.connectionTimeout');
    } finally {
        loading.value = false;
    }
};

const manualRefresh = async () => {
    refreshing.value = true;
    await fetchMonitors();
    setTimeout(() => { refreshing.value = false; }, 700);
};

const fetchIncidents = async () => {
    try {
        const r = await withRetry(() => fetchT(`${API_BASE}/incidents`));
        if (await isStatusLocked(r)) { locked.value = true; return; }
        if (r.ok) incidents.value = await r.json();
    } catch {}
};

const fetchSettings = async () => {
    try {
        const r = await fetchT(`${API_BASE}/settings`);
        if (await isStatusLocked(r)) { locked.value = true; return; }
        if (r.ok) {
            const d = await r.json();
            siteSettings.value = d;
            if (d.site_title) document.title = d.site_title;
            const meta = document.querySelector('meta[name=description]');
            if (meta && d.site_description) meta.content = d.site_description;
        }
    } catch {}
};

const onUnlocked = () => {
    locked.value = false;
    statusToken.value = localStorage.getItem(STATUS_TOKEN_KEY) || '';
    fetchMonitors();
    fetchIncidents();
    fetchSettings();
};

const onLogout = () => {
    statusLogout();
    statusToken.value = '';
    monitors.value = [];
    incidents.value = [];
    locked.value = true;
    window.scrollTo({ top: 0 });
};

const subscribe = async () => {
    if (!subEmail.value || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(subEmail.value)) {
        subOk.value = false;
        subMsg.value = t('statusPage.invalidEmail');
        return;
    }
    subscribing.value = true;
    try {
        const r = await fetchT(`${API_BASE}/api/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: subEmail.value }),
        });
        subOk.value = r.ok;
        if (await isStatusLocked(r)) { locked.value = true; return; }
        subMsg.value = r.ok ? t('statusPage.subscribed') : t('common.actionFailed');
        if (r.ok) subEmail.value = '';
    } catch {
        subOk.value = false;
        subMsg.value = t('common.networkError');
    } finally {
        subscribing.value = false;
    }
};

let _timer;
onMounted(() => {
    fetchMonitors();
    fetchIncidents();
    fetchSettings();
    _timer = setInterval(() => { if (!locked.value) fetchMonitors(); }, 30000);
});
onUnmounted(() => clearInterval(_timer));
</script>

<!-- theme tokens: NON-scoped so `.dark .status-shell` can override on the same element.
     Palette / chrome mirror the "rent / ASSET OPS" console (rent/src/styles.css active :root). -->
<style>
.status-shell {
    /* light — blueprint slate */
    --mf-bg: #edf1f4;
    --mf-surface: #fcfdfe;
    --mf-surface-2: #f4f6f8;
    --mf-line: #cbd3da;
    --mf-line-strong: #aab5bf;
    --mf-ink: #14202b;
    --mf-ink-2: #52606d;
    --mf-ink-muted: #7d8994;
    --mf-graphite: #17212b;
    --mf-graphite-soft: #22303d;
    --mf-primary: #155eef;
    --mf-accent: #f59e0b;
    --mf-up: #16845b;
    --mf-warn: #b76505;
    --mf-down: #c43232;
    --mf-up-bg: #e5f7ef;
    --mf-warn-bg: #fff3d6;
    --mf-down-bg: #fff0ef;
    --mf-radius: 4px;
    --mf-radius-md: 6px;
    --mf-radius-lg: 8px;
    --mf-display: 'Barlow Condensed', 'Noto Sans SC', system-ui, sans-serif;
    --mf-mono: 'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace;
    --mf-shadow-sm: 0 1px 0 rgb(20 32 43 / 0.05);
    --mf-shadow-md: 0 14px 34px rgb(20 32 43 / 0.10);

    color: var(--mf-ink);
    background-color: var(--mf-bg);
    background-image:
        linear-gradient(rgb(20 32 43 / 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgb(20 32 43 / 0.035) 1px, transparent 1px);
    background-size: 32px 32px;
}
.dark .status-shell {
    /* dark — graphite console */
    --mf-bg: #0e161f;
    --mf-surface: #17212b;
    --mf-surface-2: #1e2a36;
    --mf-line: #344250;
    --mf-line-strong: #415160;
    --mf-ink: #edf2f6;
    --mf-ink-2: #9eacb8;
    --mf-ink-muted: #71818d;
    --mf-graphite: #17212b;
    --mf-graphite-soft: #22303d;
    --mf-primary: #4d8dff;
    --mf-accent: #f5a524;
    --mf-up: #3fbf88;
    --mf-warn: #e0a33c;
    --mf-down: #e0655a;
    --mf-up-bg: rgba(63, 191, 136, 0.12);
    --mf-warn-bg: rgba(224, 163, 60, 0.12);
    --mf-down-bg: rgba(224, 101, 90, 0.13);
    --mf-shadow-sm: 0 1px 0 rgb(0 0 0 / 0.3);
    --mf-shadow-md: 0 18px 40px rgb(0 0 0 / 0.36);
    background-image:
        linear-gradient(rgb(198 208 217 / 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgb(198 208 217 / 0.04) 1px, transparent 1px);
}
/* rent uses IBM Plex Mono for every .mono / value; keep it inside the status shell */
.status-shell .font-mono { font-family: var(--mf-mono); }
</style>

<style scoped>
/* ── mono label (rent .section-code) ── */
.mf-mono-label {
    font-family: var(--mf-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--mf-accent);
}

/* ── skeleton ── */
.mf-skeleton {
    height: 78px;
    border-radius: var(--mf-radius);
    border: 1px solid var(--mf-line);
    background: linear-gradient(90deg, transparent, var(--mf-surface-2), transparent);
    background-size: 200% 100%;
    animation: mf-shimmer 1.4s ease-in-out infinite;
}
@keyframes mf-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── empty ── */
.mf-empty {
    text-align: center;
    padding: 80px 24px;
    border: 1px dashed var(--mf-line-strong);
    border-radius: var(--mf-radius-md);
    background: var(--mf-surface);
    color: var(--mf-ink-muted);
}
.mf-empty svg { margin: 0 auto 16px; opacity: 0.7; }
.mf-empty .mf-mono-label { color: var(--mf-ink-muted); }

/* ── incident (rent .review-toolbar) ── */
.mf-incident {
    display: flex;
    gap: 16px;
    padding: 16px 18px;
    border: 1px solid var(--mf-line);
    border-left: 4px solid var(--mf-accent);
    border-radius: var(--mf-radius);
    background: var(--mf-surface-2);
}
.mf-incident[data-severity="critical"] { border-left-color: var(--mf-down); background: var(--mf-down-bg); }
.mf-incident[data-severity="warning"]  { border-left-color: var(--mf-warn); background: var(--mf-warn-bg); }
.mf-incident[data-severity="info"]     { border-left-color: var(--mf-primary); }
.mf-incident-icon { margin-top: 2px; font-size: 15px; }
.mf-incident[data-severity="critical"] .mf-incident-icon { color: var(--mf-down); }
.mf-incident[data-severity="warning"] .mf-incident-icon { color: var(--mf-warn); }
.mf-incident[data-severity="info"] .mf-incident-icon { color: var(--mf-primary); }
.mf-incident-title { font-weight: 600; font-size: 14px; color: var(--mf-ink); }
.mf-incident-desc { font-size: 13px; color: var(--mf-ink-2); margin-top: 4px; line-height: 1.55; }
.mf-incident-meta { font-family: var(--mf-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mf-ink-muted); margin-top: 8px; }

/* ── section head (rent .section-title) ── */
.mf-section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--mf-line);
}
.mf-section-title {
    font-family: var(--mf-display);
    font-weight: 600;
    font-size: 20px;
    line-height: 1.1;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--mf-ink);
}
.mf-section-stat {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--mf-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--mf-ink-muted);
    white-space: nowrap;
}
.mf-dot-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--mf-line-strong); }

/* ── groups ── */
.mf-group + .mf-group { margin-top: 24px; }
.mf-group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--mf-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--mf-accent);
    margin: 22px 0 4px;
}
.mf-group-count { letter-spacing: 0.12em; color: var(--mf-ink-muted); }
.mf-rows { display: flex; flex-direction: column; gap: 10px; }

/* ── subscribe ── */
.mf-subscribe {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
    margin-top: 52px;
    padding: 18px 20px;
    border: 1px solid var(--mf-line);
    border-left: 4px solid var(--mf-accent);
    border-radius: var(--mf-radius);
    background: var(--mf-surface-2);
}
.mf-subscribe-hint { font-size: 13px; color: var(--mf-ink-muted); margin-top: 6px; }
.mf-subscribe-form { display: flex; gap: 8px; }
.mf-input {
    width: 260px;
    height: 40px;
    padding: 0 12px;
    border: 1px solid var(--mf-line-strong);
    border-radius: var(--mf-radius);
    background: var(--mf-surface);
    color: var(--mf-ink);
    font-size: 13px;
    font-family: var(--mf-mono);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.mf-input::placeholder { color: var(--mf-ink-muted); }
.mf-input:focus { border-color: var(--mf-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--mf-primary) 18%, transparent); }
.mf-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex: none;
    border: 0;
    border-radius: var(--mf-radius);
    background: var(--mf-primary);
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    box-shadow: var(--mf-shadow-sm);
    transition: filter 0.15s;
}
.mf-btn:hover { filter: brightness(1.08); }
.mf-btn:disabled { opacity: 0.55; cursor: default; }
.mf-subscribe-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 12px;
    font-size: 11px;
}
.mf-ok { color: var(--mf-up); }
.mf-err { color: var(--mf-down); }
.mf-rss {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: var(--mf-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mf-ink-muted);
    transition: color 0.15s;
}
.mf-rss:hover { color: var(--mf-accent); }
.mf-rss i { color: var(--mf-accent); }

@media (max-width: 720px) {
    .mf-subscribe { gap: 14px; }
    .mf-subscribe-form { width: 100%; }
    .mf-input { flex: 1; width: auto; }
}
</style>
