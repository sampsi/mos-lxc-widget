<template>
  <div>
    <div v-if="loading" class="d-flex justify-center pa-4">
      <v-progress-circular indeterminate size="24" width="2" />
    </div>
    <div v-else-if="error" class="text-center pa-3">
      <v-icon size="32" color="grey" class="mb-2">{{ SOURCE.fallbackIcon }}</v-icon>
      <div class="text-body-2 text-medium-emphasis">
        {{ error === 'forbidden' ? $t(`${T}.forbidden`) : $t(`${T}.load_failed`) }}
      </div>
    </div>
    <div v-else>
      <div class="d-flex align-center mb-2" style="gap: 6px">
        <v-chip size="small" variant="tonal" :color="counts.running === counts.total ? 'green' : 'orange'">
          <v-icon start size="14">{{ SOURCE.fallbackIcon }}</v-icon>
          {{ counts.running }}/{{ counts.total }} {{ $t(`${T}.running`) }}
        </v-chip>
        <v-spacer />
        <v-btn size="x-small" variant="text" icon="mdi-open-in-app" :to="SOURCE.page" :title="$t(`${T}.open_page`)" />
      </div>

      <div v-if="visible.length === 0" class="text-caption text-medium-emphasis text-center pa-2">
        {{ $t(`${T}.empty`) }}
      </div>

      <div v-for="item in visible" :key="item.name" class="gw-row d-flex align-center" :class="{ 'gw-stopped': !item.running }">
        <div class="gw-icon gw-clickable" :title="$t(`${T}.actions`)" @click.stop="openMenu(item)">
          <img v-if="item.icon && !broken[item.name]" :src="item.icon" alt="" width="24" height="24" @error="broken[item.name] = true" />
          <v-icon v-else size="22" color="grey">{{ SOURCE.fallbackIcon }}</v-icon>
          <span class="gw-dot" :class="dotClass(item)" />
        </div>
        <div class="gw-text">
          <div class="text-body-2 gw-name" :title="item.description || item.name">
            <a v-if="item.webui && item.running" :href="item.webui" target="_blank" rel="noopener" class="gw-link">{{ item.name }}</a>
            <span v-else>{{ item.name }}</span>
          </div>
          <div class="text-caption text-medium-emphasis gw-sub">{{ subtitle(item) }}</div>
        </div>
        <v-progress-circular v-if="busy[item.name]" indeterminate size="16" width="2" class="mr-1" />
        <v-menu v-else :model-value="menuOpen === item.name" location="bottom end" @update:model-value="(v) => (menuOpen = v ? item.name : null)">
          <template #activator="{ props }">
            <v-btn v-bind="props" size="x-small" variant="text" icon="mdi-dots-vertical" />
          </template>
          <v-list density="compact">
            <template v-for="(m, i) in SOURCE.menu(item)" :key="i">
              <v-divider v-if="m.divider" />
              <v-list-item v-else-if="m.to" :prepend-icon="m.icon" :title="$t(`${T}.${m.label}`)" :to="m.to" />
              <v-list-item v-else-if="m.href" :prepend-icon="m.icon" :title="$t(`${T}.${m.label}`)" :href="m.href" target="_blank" />
              <v-list-item v-else :prepend-icon="m.icon" :title="$t(`${T}.${m.label}`)" @click="run(item, m, m.confirm ? $t(`${T}.confirm_${m.label}`, { name: item.name }) : null)" />
            </template>
          </v-list>
        </v-menu>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { SOURCE, useGuests, usePolling, loadSettings, DEFAULT_SETTINGS } from './useGuests.js';

const T = SOURCE.i18n;
const { loading, error, items, busy, counts, refresh, act } = useGuests();
const settings = ref({ ...DEFAULT_SETTINGS });
const broken = reactive({});
const poll = usePolling(refresh, 5);

// The icon opens the same menu as the ⋮ button (anchored at the ⋮ button).
const menuOpen = ref(null);
const openMenu = (item) => {
  if (busy.value[item.name]) return;
  menuOpen.value = menuOpen.value === item.name ? null : item.name;
};

const run = (item, m, question) => {
  if (question && !window.confirm(question)) return;
  if (m.handler) m.handler(item);
  else act(item, m.action);
};

const dotClass = (item) => {
  if (item.running) return 'gw-green';
  if (item.state === 'frozen' || item.state === 'paused') return 'gw-blue';
  return 'gw-grey';
};

const subtitle = (item) => {
  const parts = [];
  if (!item.running) parts.push(item.state);
  for (const p of SOURCE.details(item, settings.value.showUsage)) if (p) parts.push(p);
  return parts.join(' · ');
};

const visible = computed(() =>
  items.value.filter((it) => {
    if (settings.value.hidden.includes(it.name)) return false;
    if (!settings.value.showStopped && !it.running) return false;
    return true;
  }),
);

onMounted(async () => {
  settings.value = await loadSettings();
  await refresh();
  poll.start(settings.value.interval);
});

onUnmounted(() => poll.stop());
</script>

<style scoped>
.gw-row {
  gap: 8px;
  padding: 3px 0;
  min-width: 0;
}
.gw-row + .gw-row {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.gw-stopped .gw-icon img,
.gw-stopped .gw-name {
  opacity: 0.55;
}
.gw-icon {
  position: relative;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gw-clickable {
  cursor: pointer;
}
.gw-clickable:hover img {
  transform: scale(1.12);
}
.gw-icon img {
  transition: transform 0.12s;
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
}
.gw-dot {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid rgb(var(--v-theme-surface));
}
.gw-green {
  background: #4caf50;
}
.gw-blue {
  background: #2196f3;
}
.gw-grey {
  background: #9e9e9e;
}
.gw-text {
  flex: 1;
  min-width: 0;
}
.gw-name,
.gw-sub {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}
.gw-link {
  color: inherit;
  text-decoration: none;
}
.gw-link:hover {
  text-decoration: underline;
  color: rgb(var(--v-theme-primary));
}
</style>
