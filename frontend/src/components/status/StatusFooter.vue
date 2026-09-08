<template>
  <footer class="mf-footer">
    <div class="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="mf-footer-copy">
        &copy; {{ new Date().getFullYear() }}
        <a :href="footerUrl" target="_blank">{{ footerAuthor }}</a>. {{ $t('footer.allRightsReserved') }}
      </p>

      <div class="mf-footer-links font-mono">
        <a href="https://monitorflare.csr.plus/" target="_blank" rel="noopener">{{ $t('footer.poweredByText', { name: 'MonitorFlare' }) }}</a>
        <a href="https://github.com/nianshu2022/Uptime-Monitor" target="_blank" rel="noopener">{{ $t('footer.credit') }}</a>
        <a href="https://github.com/xusteve/MonitorFlare" target="_blank" rel="noopener" :title="$t('footer.github')" :aria-label="$t('footer.github')">
          <i class="fa-brands fa-github"></i>
        </a>
      </div>

      <div class="mf-footer-actions font-mono">
        <button @click="$emit('refresh')" :disabled="loading" :title="$t('footer.refresh')">
          <svg :class="{ 'refresh-spin': refreshing }" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183"/></svg>
          {{ $t('footer.refresh') }}
        </button>
        <span>{{ $t('footer.cloudflareEdge') }}</span>
        <router-link to="/admin">{{ $t('footer.admin') }}</router-link>
        <button v-if="canLogout" @click="$emit('logout')" class="mf-footer-logout" :title="$t('statusLock.logout')">
          {{ $t('statusLock.logout') }}
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup>
defineProps({
    loading: Boolean,
    refreshing: Boolean,
    canLogout: Boolean,
});
defineEmits(['refresh', 'logout']);

const footerAuthor = import.meta.env.VITE_FOOTER_AUTHOR || 'MonitorFlare';
const footerUrl = import.meta.env.VITE_FOOTER_URL || '#';
</script>

<style scoped>
.mf-footer {
    margin-top: 48px;
    padding: 26px 0;
    border-top: 1px solid var(--mf-line);
}
.mf-footer-copy { font-size: 11px; color: var(--mf-ink-muted); }
.mf-footer-copy a { color: var(--mf-ink-2); }
.mf-footer-copy a:hover { color: var(--mf-ink); }

.mf-footer-links,
.mf-footer-actions {
    display: flex; align-items: center; gap: 18px;
    font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
}
.mf-footer-links a,
.mf-footer-actions button,
.mf-footer-actions span,
.mf-footer-actions a {
    display: inline-flex; align-items: center; gap: 6px;
    color: var(--mf-ink-muted);
    background: none; border: 0; cursor: pointer;
    transition: color 0.18s;
}
.mf-footer-links a:hover,
.mf-footer-actions button:hover,
.mf-footer-actions a:hover { color: var(--mf-primary); }
.mf-footer-actions button:disabled { opacity: 0.4; cursor: default; }
.mf-footer-actions .mf-footer-logout:hover { color: var(--mf-down); }

@media (max-width: 640px) {
    .mf-footer-links, .mf-footer-actions { flex-wrap: wrap; justify-content: center; gap: 12px 16px; }
}
</style>
