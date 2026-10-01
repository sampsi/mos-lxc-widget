# MOS LXC Widget

A [MOS](https://mos-official.net/) plugin that adds a **LXC containers widget to the dashboard**.

- every LXC container with its distribution icon (or custom icon) and a status dot
  (green = running, blue = frozen, grey = stopped)
- LAN IP address, CPU and memory usage
- click the name to open its web UI (if set in MOS)
- menu (click the icon or ⋮): web UI, start, stop, restart, freeze / unfreeze, backups,
  open the MOS LXC page
- plugin page (Plugins → LXC Widget): refresh interval, show/hide stopped ones and CPU/memory,
  choose which ones are shown

The widget only uses the MOS API (`/api/v1/lxc/...`, the same endpoints as the MOS pages) with the
logged-in user's token, so it needs an admin account. Nothing runs on the server side.

## Install

MOS Hub → Plugins → **LXC-Widget**. Move the card on the dashboard by its ⋮⋮ handle; the
button at the bottom right toggles which cards are visible.

## Build

The GitHub Actions workflow builds the plugin and packages it as
`lxc-widget-<version>-1+mos-plugin_all.deb` when a tag is pushed:

```bash
git tag 0.1.0 && git push origin 0.1.0
```

Local build without Node installed:

```bash
docker run --rm -u $(id -u):$(id -g) -e HOME=/tmp -v $PWD/page:/app -w /app node:22-alpine \
  sh -c "npm install && npm run build"
```

`page/src/Widget.vue`, `Plugin.vue`, `useGuests.js`, `api.js` and `format.js` are shared with the
sibling widget (LXC / VM); only `page/src/source.js` and the locales differ.

## License

GPL-3.0
