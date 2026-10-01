<template>
  <div style="margin-bottom: 80px">
    <h2 class="mb-4">{{ $t(`${T}.title`) }}</h2>
    <v-skeleton-loader v-if="loading" :loading="true" type="card" />
    <template v-else>
      <v-card class="mb-4 pa-0">
        <v-card-title>{{ $t(`${T}.settings`) }}</v-card-title>
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.interval"
                type="number"
                min="2"
                :label="$t(`${T}.interval`)"
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-switch v-model="form.showStopped" :label="$t(`${T}.show_stopped`)" color="primary" density="compact" hide-details />
            </v-col>
            <v-col cols="12" md="4">
              <v-switch v-model="form.showUsage" :label="$t(`${T}.show_usage`)" color="primary" density="compact" hide-details />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="mb-4 pa-0">
        <v-card-title>{{ $t(`${T}.shown_in_widget`) }}</v-card-title>
        <v-card-text class="pa-4">
          <div v-if="error" class="text-body-2 text-medium-emphasis">
            {{ error === 'forbidden' ? $t(`${T}.forbidden`) : $t(`${T}.load_failed`) }}
          </div>
          <div v-else-if="items.length === 0" class="text-body-2 text-medium-emphasis">{{ $t(`${T}.empty`) }}</div>
          <div v-for="item in items" :key="item.name" class="d-flex align-center" style="gap: 10px; min-height: 40px">
            <div style="flex: 0 0 auto">
              <v-checkbox-btn :model-value="!form.hidden.includes(item.name)" color="primary" @update:model-value="toggle(item.name, $event)" />
            </div>
            <img v-if="item.icon && !broken[item.name]" :src="item.icon" alt="" width="24" height="24" style="object-fit: contain" @error="broken[item.name] = true" />
            <v-icon v-else size="22" color="grey">{{ SOURCE.fallbackIcon }}</v-icon>
            <span class="text-body-2">{{ item.name }}</span>
            <v-spacer />
            <span class="text-caption text-medium-emphasis">{{ item.state }}</span>
          </div>
        </v-card-text>
      </v-card>

      <div class="d-flex align-center" style="gap: 12px">
        <v-btn color="primary" :loading="saving" prepend-icon="mdi-content-save" @click="save">{{ $t(`${T}.save`) }}</v-btn>
        <span v-if="saved" class="text-body-2 text-success">{{ $t(`${T}.saved`) }}</span>
        <span v-if="saveFailed" class="text-body-2 text-error">{{ $t(`${T}.save_failed`) }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { SOURCE, useGuests, loadSettings, saveSettings, DEFAULT_SETTINGS } from './useGuests.js';

const T = SOURCE.i18n;
const { loading, error, items, refresh } = useGuests();
const form = ref({ ...DEFAULT_SETTINGS });
const broken = reactive({});
const saving = ref(false);
const saved = ref(false);
const saveFailed = ref(false);

const toggle = (name, show) => {
  const hidden = new Set(form.value.hidden);
  if (show) hidden.delete(name);
  else hidden.add(name);
  form.value.hidden = [...hidden];
};

const save = async () => {
  saving.value = true;
  saved.value = false;
  saveFailed.value = false;
  const s = {
    interval: Math.max(2, Number(form.value.interval) || DEFAULT_SETTINGS.interval),
    showStopped: !!form.value.showStopped,
    showUsage: !!form.value.showUsage,
    hidden: form.value.hidden,
  };
  const ok = await saveSettings(s);
  form.value = { ...s };
  saving.value = false;
  saved.value = ok;
  saveFailed.value = !ok;
};

onMounted(async () => {
  form.value = await loadSettings();
  await refresh();
});
</script>
