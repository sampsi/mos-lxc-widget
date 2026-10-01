// Generic data layer shared by the widget and the plugin page.
// Everything specific to LXC / VMs lives in ./source.js.
import { ref, computed } from 'vue';
import { SOURCE } from './source.js';
import { authHeaders, getJson } from './api.js';

export { SOURCE };

export const DEFAULT_SETTINGS = {
  interval: 5,
  showStopped: true,
  showUsage: true,
  hidden: [],
};

export async function loadSettings() {
  try {
    const data = await getJson(`/api/v1/mos/plugins/settings/${SOURCE.plugin}`);
    return { ...DEFAULT_SETTINGS, ...data, hidden: Array.isArray(data?.hidden) ? data.hidden : [] };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings) {
  const res = await fetch(`/api/v1/mos/plugins/settings/${SOURCE.plugin}`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return res.ok;
}

export function useGuests() {
  const loading = ref(true);
  const error = ref(null); // null | 'forbidden' | 'failed'
  const items = ref([]);
  const busy = ref({});

  const refresh = async () => {
    try {
      items.value = await SOURCE.load(getJson);
      error.value = null;
    } catch (e) {
      error.value = e.status === 403 ? 'forbidden' : 'failed';
    } finally {
      loading.value = false;
    }
  };

  const act = async (item, action) => {
    busy.value = { ...busy.value, [item.name]: action };
    try {
      await fetch(SOURCE.actionUrl(item, action), { method: 'POST', headers: authHeaders() });
    } catch {
      // the next refresh shows the real state
    } finally {
      const b = { ...busy.value };
      delete b[item.name];
      busy.value = b;
      await refresh();
    }
  };

  const counts = computed(() => ({
    running: items.value.filter((i) => i.running).length,
    total: items.value.length,
  }));

  return { loading, error, items, busy, counts, refresh, act };
}

// Poll while the page is visible; pauses in background tabs.
export function usePolling(fn, seconds) {
  let timer = null;
  const tick = () => {
    if (!document.hidden) fn();
  };
  const onVisible = () => {
    if (!document.hidden) fn();
  };
  return {
    start(sec = seconds) {
      this.stop();
      timer = setInterval(tick, Math.max(2, Number(sec) || 5) * 1000);
      document.addEventListener('visibilitychange', onVisible);
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      document.removeEventListener('visibilitychange', onVisible);
    },
  };
}
