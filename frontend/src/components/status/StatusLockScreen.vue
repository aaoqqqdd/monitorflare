<template>
  <div class="mf-lock">
    <div class="mf-lock-card fade-up">
      <div class="mf-lock-icon">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
        </svg>
      </div>

      <h1 class="mf-lock-title">{{ title }}</h1>
      <p class="mf-lock-hint">{{ $t('statusLock.hint') }}</p>

      <form @submit.prevent="submit" class="mf-lock-form">
        <input v-model="password" type="password" :placeholder="$t('statusLock.passwordPlaceholder')" autocomplete="current-password" class="mf-lock-input">
        <button type="submit" :disabled="loggingIn" class="mf-lock-btn font-mono">
          <svg v-if="loggingIn" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          {{ loggingIn ? $t('statusLock.loggingIn') : $t('statusLock.login') }}
        </button>
      </form>

      <p v-if="errorText" class="mf-lock-error">{{ errorText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { statusLogin } from '../../utils/api';

const props = defineProps({
    title: { type: String, default: 'MonitorFlare' },
});
const emit = defineEmits(['unlocked']);

const { t } = useI18n();
const password = ref('');
const loggingIn = ref(false);
const errorKey = ref('');

const errorText = computed(() => errorKey.value ? t(errorKey.value) : '');

const submit = async () => {
    if (!password.value || loggingIn.value) return;
    loggingIn.value = true;
    errorKey.value = '';
    try {
        const r = await statusLogin(password.value);
        if (r.ok) {
            password.value = '';
            emit('unlocked');
        } else {
            errorKey.value = r.error;
        }
    } catch {
        errorKey.value = 'statusLock.requestFailed';
    } finally {
        loggingIn.value = false;
    }
};
</script>

<style scoped>
.mf-lock { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 64px 0; }
.mf-lock-card {
    width: 100%; max-width: 400px;
    padding: 36px 32px;
    text-align: center;
    border: 1px solid var(--mf-line);
    border-top: 3px solid var(--mf-accent);
    border-radius: var(--mf-radius-md);
    background: var(--mf-surface);
    box-shadow: var(--mf-shadow-sm);
}
.mf-lock-icon {
    width: 56px; height: 56px; margin: 0 auto 18px;
    display: flex; align-items: center; justify-content: center;
    border-radius: var(--mf-radius);
    background: var(--mf-surface-2);
    color: var(--mf-ink-muted);
}
.mf-lock-title {
    font-family: var(--mf-display);
    font-weight: 600; font-size: 24px; letter-spacing: 0.03em; text-transform: uppercase;
    color: var(--mf-ink);
}
.mf-lock-hint { font-size: 13px; color: var(--mf-ink-muted); margin: 6px 0 22px; }
.mf-lock-form { display: flex; flex-direction: column; gap: 10px; }
.mf-lock-input {
    width: 100%; height: 42px; padding: 0 14px;
    border: 1px solid var(--mf-line-strong); border-radius: var(--mf-radius);
    background: var(--mf-bg); color: var(--mf-ink);
    font-size: 13px; font-family: var(--mf-mono); outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.mf-lock-input:focus { border-color: var(--mf-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--mf-primary) 18%, transparent); }
.mf-lock-input::placeholder { color: var(--mf-ink-muted); }
.mf-lock-btn {
    width: 100%; height: 42px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    border: 0;
    border-radius: var(--mf-radius);
    background: var(--mf-primary);
    color: #fff;
    font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer; transition: filter 0.15s;
    box-shadow: var(--mf-shadow-sm);
}
.mf-lock-btn:hover { filter: brightness(1.08); }
.mf-lock-btn:disabled { opacity: 0.6; cursor: default; }
.mf-lock-error { margin-top: 12px; font-size: 12px; color: var(--mf-down); }
</style>
