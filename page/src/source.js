// LXC specifics:
//   GET  /api/v1/lxc/containers              list (state, distribution, webui, custom_icon …)
//   GET  /api/v1/lxc/mos/containers          MOS order (index)
//   GET  /api/v1/lxc/containers/usage        cpu, memory, LAN ipv4 (docker bridges filtered out)
//   POST /api/v1/lxc/containers/<name>/<start|stop|restart|freeze|unfreeze>
import { formatBytes, formatCpu } from './format.js';

export const SOURCE = {
  plugin: 'lxc-widget',
  i18n: 'plugin_lxc_widget',
  page: '/lxc',
  fallbackIcon: 'mdi-cube-outline',

  async load(getJson) {
    const [list, order, usage] = await Promise.all([
      getJson('/api/v1/lxc/containers'),
      getJson('/api/v1/lxc/mos/containers').catch(() => []),
      getJson('/api/v1/lxc/containers/usage').catch(() => []),
    ]);
    const idx = Object.fromEntries((order || []).map((o) => [o.name, o.index]));
    const use = Object.fromEntries((usage || []).map((u) => [u.name, u]));
    return (list || [])
      .map((c) => {
        const u = use[c.name] || {};
        const ip = u.network?.ipv4?.[0] || c.ipv4?.[0] || null;
        return {
          name: c.name,
          state: c.state,
          running: c.state === 'running',
          description: c.description,
          icon: c.custom_icon ? `/lxc_custom/${c.name}.png` : c.distribution ? `/os_icons/${c.distribution}.png` : null,
          ip,
          webui: c.webui ? c.webui.replace(/\[(ADDRESS|IP)\]/g, ip || window.location.hostname) : null,
          cpu: u.cpu?.usage ?? null,
          mem: u.memory?.bytes ?? null,
          order: idx[c.name] ?? 9999,
        };
      })
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  },

  details(item, showUsage) {
    return [item.ip, showUsage && item.running ? formatCpu(item.cpu) : null, showUsage && item.running ? formatBytes(item.mem) : null];
  },

  actionUrl(item, action) {
    return `/api/v1/lxc/containers/${encodeURIComponent(item.name)}/${action}`;
  },

  menu(item) {
    const m = [];
    if (item.webui && item.running) m.push({ icon: 'mdi-web', label: 'webui', href: item.webui });
    if (item.state === 'frozen') m.push({ icon: 'mdi-play', label: 'unfreeze', action: 'unfreeze' });
    else if (!item.running) m.push({ icon: 'mdi-play', label: 'start', action: 'start' });
    if (item.running) {
      m.push({ icon: 'mdi-restart', label: 'restart', action: 'restart' });
      m.push({ icon: 'mdi-stop', label: 'stop', action: 'stop' });
      m.push({ icon: 'mdi-snowflake', label: 'freeze', action: 'freeze' });
    }
    m.push({ divider: true });
    m.push({ icon: 'mdi-backup-restore', label: 'backups', to: `/lxc/backups/${encodeURIComponent(item.name)}` });
    m.push({ icon: 'mdi-pencil', label: 'open_page', to: '/lxc' });
    return m;
  },
};
