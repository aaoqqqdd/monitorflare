<template>
  <header class="mf-header sticky top-0 z-40">
    <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-2">
      <router-link to="/" class="flex items-center gap-3 group min-w-0">
        <div class="mf-logo shrink-0">
          <img v-if="siteSettings.site_logo_url" :src="siteSettings.site_logo_url" alt="Logo" class="w-full h-full rounded-[7px] object-contain" @error="siteSettings.site_logo_url = '/logo.svg'">
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2.5 7 5-14L19 12h2"/></svg>
        </div>
        <div class="min-w-0 leading-tight">
          <span class="mf-header-title truncate block max-w-[120px] sm:max-w-none">{{ siteSettings.site_title || 'MonitorFlare' }}</span>
          <p class="mf-header-sub hidden sm:block truncate max-w-[240px]">{{ siteSettings.site_description || $t('statusHeader.statusPage') }}</p>
        </div>
      </router-link>

      <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div class="mf-live">
          <template v-if="!loading">
            <span class="mf-live-dot"></span>
            <span class="mf-live-ring"></span>
          </template>
          <svg v-else class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <span class="hidden sm:inline mf-live-text">{{ loading ? $t('statusHeader.syncing') : $t('statusHeader.live') }}</span>
        </div>

        <div class="relative">
          <button @click="langOpen = !langOpen" class="mf-icon-btn gap-1 px-1.5 sm:px-2.5 w-auto">
            <i class="fas fa-globe text-[11px]"></i>
            <span class="hidden sm:inline text-[11px] font-medium">{{ $t('languages.' + locale) }}</span>
            <i class="fas fa-chevron-down text-[8px]"></i>
          </button>
          <div v-if="langOpen" class="mf-lang-menu">
            <button v-for="l in langList" :key="l" @click="changeLang(l)" class="mf-lang-item" :class="{ 'is-active': l === locale }">
              {{ $t('languages.' + l) }}
              <i v-if="l === locale" class="fas fa-check text-[9px]"></i>
            </button>
          </div>
        </div>

        <button @click="$emit('toggle-theme')" class="mf-icon-btn" :title="'Theme'">
          <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
          </svg>
        </button>

        <router-link to="/admin" class="mf-icon-btn" :title="$t('statusHeader.admin')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"/>
          </svg>
        </router-link>

        <a href="https://github.com/xusteve/MonitorFlare" target="_blank" rel="noopener" :title="$t('footer.github')" :aria-label="$t('footer.github')" class="mf-icon-btn">
          <i class="fa-brands fa-github text-[15px]"></i>
        </a>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { setAppLanguage } from '../../main';

defineProps({
    loading: Boolean,
    isDark: Boolean,
    siteSettings: Object,
});
defineEmits(['toggle-theme']);

const { locale } = useI18n();
const langOpen = ref(false);
const langList = ['en', 'zh', 'zh-tw', 'ja', 'ko', 'de', 'fr', 'it', 'es'];

const changeLang = (l) => {
    setAppLanguage(l);
    locale.value = l;
    langOpen.value = false;
};
</script>

<style scoped>
/* graphite console header — rent .identity-strip / .page-header signature */
.mf-header {
    background: var(--mf-graphite);
    border-bottom: 3px solid var(--mf-accent);
    color: #edf2f6;
}
.mf-logo {
    width: 30px; height: 30px; border-radius: var(--mf-radius);
    display: flex; align-items: center; justify-content: center;
    background: var(--mf-primary);
    color: #fff;
}
.mf-header-title {
    font-family: var(--mf-display);
    font-weight: 700; font-size: 16px; letter-spacing: 0.06em; text-transform: uppercase;
    color: #fff;
}
.mf-header-sub {
    font-family: var(--mf-mono);
    font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
    color: #8da0b1; margin-top: 1px;
}

.mf-live {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px; border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    color: var(--mf-up);
}
.mf-live-dot { position: relative; width: 6px; height: 6px; border-radius: 50%; background: var(--mf-up); }
.mf-live-ring {
    position: absolute; width: 6px; height: 6px; border-radius: 50%;
    background: color-mix(in srgb, var(--mf-up) 40%, transparent);
    animation: mf-ping 2s ease-out infinite;
}
@keyframes mf-ping { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(3); opacity: 0; } }
.mf-live-text { font-family: var(--mf-mono); font-size: 10px; letter-spacing: 0.16em; color: #b9c4ce; }

.mf-icon-btn {
    height: 34px; min-width: 34px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: var(--mf-radius); border: 1px solid transparent;
    color: #93a4b3;
    transition: color 0.15s, background 0.15s, border-color 0.15s;
    cursor: pointer;
}
.mf-icon-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.14); }

.mf-lang-menu {
    position: absolute; right: 0; margin-top: 8px; width: 168px;
    border: 1px solid var(--mf-line); border-radius: var(--mf-radius-md);
    background: var(--mf-surface);
    box-shadow: var(--mf-shadow-md);
    overflow: hidden; z-index: 50;
}
.mf-lang-item {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 9px 14px; font-size: 12px; color: var(--mf-ink-2);
    cursor: pointer; transition: background 0.15s;
}
.mf-lang-item:hover { background: var(--mf-surface-2); }
.mf-lang-item.is-active { color: var(--mf-primary); font-weight: 700; }
</style>
