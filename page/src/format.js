// Small formatting helpers for the subtitle line.
export const formatBytes = (b) => {
  if (!b) return null;
  const u = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let i = 0;
  let v = b;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v >= 10 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${u[i]}`;
};

export const formatCpu = (c) => (c == null ? null : `CPU ${c < 10 ? c.toFixed(1) : c.toFixed(0)} %`);
