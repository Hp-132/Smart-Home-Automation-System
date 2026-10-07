import { api } from './api.js';
import { House, ROOMS, colorToCss, LIGHT_COLORS } from './house.js';
import { icon } from './icons.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ROOM_ICONS = { living: 'living', kitchen: 'kitchen', garage: 'garage', bedroom: 'bedroom', bathroom: 'bathroom', outdoor: 'outdoor' };
const COLOR_PRESETS = ['white', 'warm white', 'cool white', 'amber', 'coral', 'rose', 'violet', 'blue', 'teal', 'green'];
const POLL_MS = 4000;

const state = {
  rooms: [],
  devices: new Map(),
  routines: [],
  room: 'all',
  selected: null,
  pending: new Set(),
  runningRoutine: null,
  errors: new Map(),      // deviceId -> last error text
  messages: new Map(),    // deviceId -> last backend message
  connection: 'connecting',
  scene: (() => { const h = new Date().getHours(); return h >= 18 || h < 6 ? 'evening' : 'day'; })(),
  loaded: false,
};

// ------------------------------------------------------------------ house
const house = new House($('#house'), {
  onDevice: (id, source) => onHouseDevice(id, source),
  onRoom: (id) => setRoom(id),
});
house.setScene(state.scene);

function onHouseDevice(id, source) {
  const d = state.devices.get(id);
  if (!d) return;
  const quick = source === 'house' && (d.type === 'light' || d.type === 'curtains');
  if (quick) {
    toggleDevice(id);
    select(id, { scroll: true });
    return;
  }
  if (state.room !== d.room) setRoom(d.room, { keepSelection: true });
  select(id, { scroll: true });
}

// ------------------------------------------------------------------ helpers
function primaryToggle(d) {
  return (d.capabilities || []).find((c) => c.kind === 'toggle');
}

function statusText(d) {
  if (!d.available) return 'Not responding';
  const s = d.state;
  switch (d.type) {
    case 'light': return s.on ? `On · ${s.brightness}% · ${s.color}` : 'Off';
    case 'curtains': return s.open ? 'Open' : 'Closed';
    case 'ac': return s.on ? `Cooling · set to ${fmt(s.temperature)}°C` : `Off · set to ${fmt(s.temperature)}°C`;
    case 'heater': return s.on ? `Heating · set to ${fmt(s.temperature)}°C` : `Off · set to ${fmt(s.temperature)}°C`;
    case 'tv': return s.on ? `On · channel ${s.channel} · volume ${s.volume}` : 'Off';
    case 'music': return s.playing ? 'Playing' : 'Paused';
    case 'vacuum': return `${s.cleaning ? 'Cleaning' : 'Docked'} · battery ${s.battery}%`;
    case 'fridge': return s.on ? `Running · ${s.temperature}°C` : 'Off';
    case 'smoke': return s.alarmSounding ? 'Alarm sounding' : s.armed ? 'Armed · no smoke reported' : 'Off';
    case 'garageDoor': return (s.open ? 'Open' : 'Closed') + (s.scheduledOpening ? ` · opening logged for ${s.scheduledOpening}` : '');
    case 'energy': return s.on ? (s.powerSaving ? 'On · power saving' : 'On') : (s.powerSaving ? 'Off · power saving set' : 'Off');
    case 'lock': return s.locked ? 'Locked' : 'Unlocked';
    case 'camera': return s.on ? 'On' : 'Off';
    case 'sprinkler': return s.on ? `Watering${s.scheduleMinutes ? ` · timer ${s.scheduleMinutes} min` : ''}` : `Off${s.scheduleMinutes ? ` · timer ${s.scheduleMinutes} min` : ''}`;
    default: return d.active ? 'On' : 'Off';
  }
}

function isHighlighted(d) {
  if (d.type === 'lock') return !d.state.locked; // unlocked needs attention
  return !!d.active;
}

function fmt(n) { return Number.isInteger(n) ? String(n) : Number(n).toFixed(1); }
function roomName(id) { return id === 'all' ? 'Whole house' : (state.rooms.find((r) => r.id === id)?.name || id); }
function humanAction(a) { return a.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).toLowerCase().replace(/^./, (c) => c.toUpperCase()); }
function devicesIn(room) { return [...state.devices.values()].filter((d) => room === 'all' || d.room === room); }

// ------------------------------------------------------------------ commands
async function sendCommand(id, action, value) {
  const d = state.devices.get(id);
  if (!d || state.pending.has(id)) return;
  if (state.connection === 'offline') {
    toast('The server is unreachable, so the command was not sent.', 'error');
    return;
  }
  state.pending.add(id);
  state.errors.delete(id);
  house.setPending(id, true);
  renderCard(id);
  try {
    const res = await api.command(id, action, value);
    state.devices.set(id, res.device);
    const msg = (res.messages || []).join(' ');
    if (msg) state.messages.set(id, msg);
    house.update([res.device]);
    toast(`${res.device.name}: ${msg || statusText(res.device)}`, 'ok', 2200);
  } catch (e) {
    state.errors.set(id, e.message);
    toast(`${d.name}: ${e.message}`, 'error', 5000);
    if (e.network) setConnection('offline');
    // Re-read the real state so the UI never shows an action that did not happen.
    refresh().catch(() => {});
  } finally {
    state.pending.delete(id);
    house.setPending(id, false);
    renderAll();
    loadActivity();
  }
}

function toggleDevice(id) {
  const d = state.devices.get(id);
  const t = d && primaryToggle(d);
  if (!t) return;
  sendCommand(id, d.state[t.stateKey] ? t.offAction : t.onAction);
}

async function runRoutine(id) {
  if (state.runningRoutine) return;
  if (state.connection === 'offline') { toast('The server is unreachable, so the routine was not run.', 'error'); return; }
  state.runningRoutine = id;
  renderRoutines();
  try {
    const res = await api.routine(id);
    (res.devices || []).forEach((d) => state.devices.set(d.id, d));
    house.update(res.devices || []);
    if (res.commandsFailed) {
      const failed = res.results.filter((r) => !r.ok).map((r) => `${r.deviceName} (${r.error})`).join(', ');
      toast(`${res.name}: ${res.commandsSent} sent, ${res.commandsFailed} failed — ${failed}`, 'error', 7000);
    } else if (res.commandsSent === 0) {
      toast(`${res.name}: everything was already set.`, 'ok');
    } else {
      toast(`${res.name}: ${res.commandsSent} command${res.commandsSent === 1 ? '' : 's'} sent to the backend.`, 'ok');
    }
  } catch (e) {
    toast(`Routine failed: ${e.message}`, 'error', 5000);
    if (e.network) setConnection('offline');
  } finally {
    state.runningRoutine = null;
    renderAll();
    loadActivity();
  }
}

// ------------------------------------------------------------------ selection
function setRoom(id, { keepSelection = false } = {}) {
  state.room = id;
  if (!keepSelection && state.selected && id !== 'all' && state.devices.get(state.selected)?.room !== id) select(null);
  house.setFocus(id);
  renderNav();
  renderPanel();
  renderHeader();
}

function select(id, { scroll = false } = {}) {
  state.selected = state.selected === id && !scroll ? null : id;
  house.setSelected(state.selected);
  renderPanel();
  if (state.selected && scroll) {
    const el = document.querySelector(`.device-card[data-id="${state.selected}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ------------------------------------------------------------------ rendering
function renderAll() {
  renderNav();
  renderStats();
  renderPanel();
  renderRoutines();
  renderHeader();
}

function renderHeader() {
  $('#view-title').textContent = roomName(state.room);
  const back = $('#back-btn');
  back.hidden = state.room === 'all';
  back.innerHTML = `${icon('back')}<span>Whole house</span>`;
  const ds = devicesIn(state.room);
  const on = ds.filter((d) => d.powered && d.active).length;
  $('#stage-caption').textContent = state.room === 'all'
    ? 'Tap a room to step inside'
    : `${ds.length} device${ds.length === 1 ? '' : 's'} · ${on} switched on`;
}

function renderNav() {
  const nav = $('#rooms-nav');
  const items = [{ id: 'all', name: 'Whole house' }, ...state.rooms];
  nav.innerHTML = items.map((r) => {
    const ds = devicesIn(r.id);
    const on = ds.filter((d) => d.powered && d.active).length;
    return `<button type="button" class="nav-item${state.room === r.id ? ' is-active' : ''}" data-room="${r.id}" aria-current="${state.room === r.id ? 'page' : 'false'}">
      <span class="nav-icon">${icon(r.id === 'all' ? 'home' : ROOM_ICONS[r.id])}</span>
      <span class="nav-name">${esc(r.name)}</span>
      <span class="nav-count${on ? ' has-on' : ''}" title="${on} of ${ds.length} on">${on ? `${on} on` : ds.length}</span>
    </button>`;
  }).join('');
}

function renderStats() {
  const all = [...state.devices.values()];
  const powered = all.filter((d) => d.powered);
  const on = powered.filter((d) => d.active).length;
  const avail = all.filter((d) => d.available).length;
  const lock = all.find((d) => d.type === 'lock');
  const garage = all.find((d) => d.type === 'garageDoor');
  const cam = all.find((d) => d.type === 'camera');
  const issues = [];
  if (lock && !lock.state.locked) issues.push('Front door unlocked');
  if (garage && garage.state.open) issues.push('Garage open');
  if (cam && !cam.state.on) issues.push('Camera off');
  const secure = issues.length === 0;
  const online = state.connection === 'online';
  $('#stats').innerHTML = `
    <div class="stat"><span class="stat-icon">${icon('grid')}</span><div><span class="stat-label">Devices</span><strong class="stat-value">${all.length}</strong><span class="stat-sub">${state.rooms.length} rooms</span></div></div>
    <div class="stat${on ? ' is-warm' : ''}"><span class="stat-icon">${icon('power')}</span><div><span class="stat-label">Switched on</span><strong class="stat-value">${on}<small> / ${powered.length}</small></strong><span class="stat-sub">powered devices</span></div></div>
    <div class="stat${avail < all.length || !online ? ' is-bad' : ''}"><span class="stat-icon">${icon(online ? 'wifi' : 'wifiOff')}</span><div><span class="stat-label">Responding</span><strong class="stat-value">${online ? avail : '—'}<small> / ${all.length}</small></strong><span class="stat-sub">${online ? 'backend connected' : 'backend unreachable'}</span></div></div>
    <div class="stat${secure ? ' is-good' : ' is-bad'}"><span class="stat-icon">${icon(secure ? 'shield' : 'alert')}</span><div><span class="stat-label">Security</span><strong class="stat-value">${secure ? 'Secure' : 'Check'}</strong><span class="stat-sub">${secure ? 'Door locked · garage closed' : esc(issues.join(' · '))}</span></div></div>`;
}

function renderRoutines() {
  const icons = { 'all-lights-off': 'lightsOff', night: 'moon', away: 'away' };
  $('#routines').innerHTML = state.routines.map((r) => `
    <button type="button" class="routine${state.runningRoutine === r.id ? ' is-running' : ''}" data-routine="${r.id}" ${state.runningRoutine || state.connection === 'offline' ? 'disabled' : ''} title="${esc(r.description)}">
      <span class="routine-icon">${state.runningRoutine === r.id ? '<span class="spinner sm"></span>' : icon(icons[r.id] || 'layers')}</span>
      <span class="routine-text"><strong>${esc(r.name)}</strong><span>${esc(r.description)}</span></span>
    </button>`).join('');
}

function renderPanel() {
  const list = $('#device-list');
  const ds = devicesIn(state.room);
  $('#panel-title').textContent = state.room === 'all' ? 'All rooms' : roomName(state.room);
  $('#panel-eyebrow').textContent = state.room === 'all' ? 'Devices' : 'Room devices';
  const on = ds.filter((d) => d.powered && d.active).length;
  $('#panel-count').textContent = `${on} on · ${ds.length} total`;
  if (!state.loaded) return;

  // Don't re-render under the user's finger while they drag a slider or type a value.
  const active = document.activeElement;
  if (active && active.matches && active.matches('.device-list input')) { state.panelDirty = true; return; }
  state.panelDirty = false;

  let html = '';
  if (state.room === 'all') {
    for (const r of state.rooms) {
      const rd = ds.filter((d) => d.room === r.id);
      html += `<div class="group"><button type="button" class="group-head" data-room="${r.id}"><span>${icon(ROOM_ICONS[r.id])}</span>${esc(r.name)}<span class="group-go">${icon('chevron')}</span></button>`;
      html += rd.map(cardHTML).join('') + '</div>';
    }
  } else {
    html = ds.map(cardHTML).join('');
  }
  list.innerHTML = html;
}

function renderCard(id) {
  const el = document.querySelector(`.device-card[data-id="${id}"]`);
  const d = state.devices.get(id);
  if (el && d) el.outerHTML = cardHTML(d);
}

function cardHTML(d) {
  const t = primaryToggle(d);
  const pending = state.pending.has(d.id);
  const selected = state.selected === d.id;
  const offline = !d.available || state.connection === 'offline';
  const hl = isHighlighted(d);
  const err = state.errors.get(d.id);
  const on = t ? !!d.state[t.stateKey] : false;
  const lightColor = d.type === 'light' ? `style="--dc:${colorToCss(d.state.color)}"` : '';
  return `<article class="device-card${hl ? ' is-on' : ''}${selected ? ' is-selected' : ''}${pending ? ' is-pending' : ''}${!d.available ? ' is-offline' : ''} t-${d.type}" data-id="${d.id}" ${lightColor}>
    <div class="dc-head">
      <button type="button" class="dc-main" data-select="${d.id}" aria-expanded="${selected}">
        <span class="dc-icon">${icon(d.type, d.state)}</span>
        <span class="dc-text"><span class="dc-name">${esc(d.name)}</span><span class="dc-status">${pending ? 'Sending…' : esc(statusText(d))}</span></span>
      </button>
      ${t ? `<button type="button" class="switch${on ? ' is-on' : ''}" role="switch" aria-checked="${on}" aria-label="${esc(t.label)} ${esc(d.name)}" data-toggle="${d.id}" ${pending || offline ? 'disabled' : ''}><span class="knob">${pending ? '<span class="spinner xs"></span>' : ''}</span></button>` : ''}
    </div>
    ${err ? `<p class="dc-error">${icon('alert')}<span>${esc(err)}</span></p>` : ''}
    ${selected ? `<div class="dc-body">${controlsHTML(d, pending || offline)}${bodyNotes(d)}</div>` : ''}
  </article>`;
}

function controlsHTML(d, disabled) {
  const dis = disabled ? 'disabled' : '';
  const caps = d.capabilities || [];
  const t = primaryToggle(d);
  let out = '';
  let buttons = '';
  for (const c of caps) {
    if (c === t) continue;
    const v = d.state[c.stateKey];
    if (c.kind === 'toggle') {
      const on = !!v;
      out += `<div class="ctl ctl-row"><span class="ctl-label">${esc(c.label)}</span>
        <button type="button" class="switch sm${on ? ' is-on' : ''}" role="switch" aria-checked="${on}" aria-label="${esc(c.label)}" data-cmd="${d.id}" data-action="${on ? c.offAction : c.onAction}" ${dis}><span class="knob"></span></button></div>`;
    } else if (c.kind === 'range') {
      out += `<div class="ctl"><div class="ctl-top"><label class="ctl-label" for="r-${d.id}-${c.action}">${esc(c.label)}</label><output class="ctl-val" id="o-${d.id}-${c.action}">${fmt(v)}${esc(c.unit)}</output></div>
        <input type="range" id="r-${d.id}-${c.action}" min="${c.min}" max="${c.max}" step="${c.step}" value="${v}" data-range="${d.id}" data-action="${c.action}" data-unit="${esc(c.unit)}" ${dis}
          style="--p:${(((v - c.min) / (c.max - c.min)) * 100).toFixed(1)}%">
        <div class="ctl-scale"><span>${c.min}${esc(c.unit)}</span><span>${c.max}${esc(c.unit)}</span></div></div>`;
    } else if (c.kind === 'number') {
      out += `<div class="ctl ctl-row"><span class="ctl-label">${esc(c.label)}</span>
        <div class="stepper"><button type="button" data-cmd="${d.id}" data-action="${c.action}" data-value="${Math.max(c.min, v - 1)}" aria-label="Previous ${esc(c.label)}" ${dis || v <= c.min ? 'disabled' : ''}>−</button>
        <input type="number" inputmode="numeric" min="${c.min}" max="${c.max}" value="${v}" data-number="${d.id}" data-action="${c.action}" aria-label="${esc(c.label)}" ${dis}>
        <button type="button" data-cmd="${d.id}" data-action="${c.action}" data-value="${Math.min(c.max, v + 1)}" aria-label="Next ${esc(c.label)}" ${dis || v >= c.max ? 'disabled' : ''}>+</button></div></div>`;
    } else if (c.kind === 'color') {
      const cur = String(v || '').toLowerCase();
      out += `<div class="ctl"><div class="ctl-top"><span class="ctl-label">${esc(c.label)}</span><span class="ctl-val">${esc(v)}</span></div>
        <div class="swatches">${COLOR_PRESETS.map((n) => `<button type="button" class="swatch${cur === n ? ' is-active' : ''}" style="--sw:${LIGHT_COLORS[n]}" title="${n}" aria-label="${n}" aria-pressed="${cur === n}" data-cmd="${d.id}" data-action="${c.action}" data-value="${n}" ${dis}></button>`).join('')}</div>
        ${c.note ? `<p class="ctl-note">${esc(c.note)}</p>` : ''}</div>`;
    } else if (c.kind === 'button') {
      buttons += `<button type="button" class="btn-sec" data-cmd="${d.id}" data-action="${c.action}" ${dis}>${d.type === 'music' ? icon(c.action === 'nextTrack' ? 'next' : 'prev') : ''}${esc(c.label)}</button>`;
    } else if (c.kind === 'time') {
      out += `<div class="ctl"><div class="ctl-top"><span class="ctl-label">${esc(c.label)}</span>${v ? `<span class="ctl-val">${esc(v)}</span>` : ''}</div>
        <div class="time-row"><input type="time" value="${v || '07:30'}" data-time="${d.id}" aria-label="${esc(c.label)}" ${dis}><button type="button" class="btn-sec" data-schedule="${d.id}" data-action="${c.action}" ${dis}>${icon('clock')}Save</button></div>
        ${c.note ? `<p class="ctl-note">${esc(c.note)}</p>` : ''}</div>`;
    }
  }
  return out + (buttons ? `<div class="btn-row">${buttons}</div>` : '');
}

function bodyNotes(d) {
  let note = '';
  if (d.type === 'vacuum') note = 'Battery is the value reported by SmartVacuum.getBatteryStatus(); the simulator always reports 75%.';
  if (d.type === 'smoke') note = 'The simulator never reports smoke. "Test alarm" only sounds while the detector is on.';
  if (d.type === 'music') note = 'Track changes are logged by MusicSystem; the simulator does not track song titles.';
  if (d.type === 'curtains') note = 'The curtain device supports fully open or fully closed only.';
  if (d.type === 'fridge') note = 'Note: the existing Refrigerator class prints a "door left open" alert for temperatures above 5°C.';
  const msg = state.messages.get(d.id);
  return `${msg ? `<p class="dc-msg"><span>Backend</span>${esc(msg)}</p>` : ''}${note ? `<p class="ctl-note">${esc(note)}</p>` : ''}`;
}

// activity
async function loadActivity() {
  try {
    const { activity } = await api.activity();
    renderActivity(activity);
  } catch { /* connection state handled by refresh */ }
}

function renderActivity(items) {
  const el = $('#activity');
  if (!items.length) {
    el.innerHTML = `<li class="empty">No commands yet. Switch something on to see the backend's response here.</li>`;
    return;
  }
  el.innerHTML = items.slice(0, 8).map((a) => {
    const t = new Date(a.time);
    const time = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const src = a.source && a.source.startsWith('routine:') ? `<span class="tag">${esc(a.source.slice(8).replace(/-/g, ' '))}</span>` : '';
    return `<li class="${a.ok ? '' : 'is-error'}"><span class="a-dot"></span><div class="a-main"><strong>${esc(a.deviceName)}</strong> <span class="muted">${esc(humanAction(a.action))}</span> ${src}
      <span class="a-msg">${esc((a.messages || []).join(' ') || '—')}</span></div><time>${time}</time></li>`;
  }).join('');
}

// toasts
function toast(text, kind = 'ok', ms = 3000) {
  const box = $('#toasts');
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  t.innerHTML = `<span class="toast-icon">${icon(kind === 'error' ? 'alert' : 'check')}</span><span>${esc(text)}</span>`;
  box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, ms);
}

function setConnection(c) {
  if (state.connection === c) return;
  state.connection = c;
  const el = $('#conn');
  el.dataset.state = c;
  el.querySelector('.conn-text').textContent = c === 'online' ? 'Backend connected' : c === 'offline' ? 'Backend unreachable' : 'Connecting…';
  $('#offline-banner').hidden = c !== 'offline';
  document.body.classList.toggle('is-offline', c === 'offline');
  renderAll();
}

// ------------------------------------------------------------------ data
async function refresh() {
  const home = await api.home();
  state.rooms = home.rooms;
  state.routines = home.routines;
  for (const d of home.devices) {
    if (!state.pending.has(d.id)) state.devices.set(d.id, d);
  }
  house.update(home.devices.filter((d) => !state.pending.has(d.id)));
  if (!state.loaded) {
    state.loaded = true;
    $('#app').dataset.loading = 'false';
    $('#stage-loading').hidden = true;
  }
  setConnection('online');
  renderAll();
}

async function poll() {
  try {
    await refresh();
    await loadActivity();
  } catch (e) {
    setConnection('offline');
    if (!state.loaded) {
      $('#stage-loading').innerHTML = `<div class="load-error">${icon('wifiOff')}<strong>Can't reach the smart home server</strong><span>${esc(e.message)} Start it with <code>java -cp out smarthome.web.SmartHomeServer</code>. Retrying…</span></div>`;
    }
  } finally {
    setTimeout(poll, POLL_MS);
  }
}

// ------------------------------------------------------------------ events
document.addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t || t.disabled) return;
  if (t.dataset.room) return setRoom(t.dataset.room);
  if (t.dataset.toggle) return toggleDevice(t.dataset.toggle);
  if (t.dataset.select) {
    return select(t.dataset.select);
  }
  if (t.dataset.routine) return runRoutine(t.dataset.routine);
  if (t.dataset.cmd) {
    const v = t.dataset.value;
    const num = v !== undefined && v !== '' && !isNaN(Number(v)) ? Number(v) : v;
    return sendCommand(t.dataset.cmd, t.dataset.action, num);
  }
  if (t.dataset.schedule) {
    const input = document.querySelector(`[data-time="${t.dataset.schedule}"]`);
    const [h, m] = (input?.value || '').split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return toast('Pick a time first.', 'error');
    return sendCommand(t.dataset.schedule, t.dataset.action, { hour: h, minute: m });
  }
  if (t.dataset.scene) {
    state.scene = t.dataset.scene;
    house.setScene(state.scene);
    renderSceneToggle();
  }
});

document.addEventListener('input', (e) => {
  const r = e.target.closest('[data-range]');
  if (!r) return;
  const out = document.getElementById(`o-${r.dataset.range}-${r.dataset.action}`);
  if (out) out.textContent = `${fmt(Number(r.value))}${r.dataset.unit}`;
  r.style.setProperty('--p', `${(((r.value - r.min) / (r.max - r.min)) * 100).toFixed(1)}%`);
});

document.addEventListener('change', (e) => {
  const r = e.target.closest('[data-range]');
  if (r) { r.blur(); return sendCommand(r.dataset.range, r.dataset.action, Number(r.value)); }
  const n = e.target.closest('[data-number]');
  if (n) {
    const v = Number(n.value);
    if (!Number.isInteger(v) || v < Number(n.min) || v > Number(n.max)) { toast(`Enter a whole number from ${n.min} to ${n.max}.`, 'error'); return renderCard(n.dataset.number); }
    n.blur();
    return sendCommand(n.dataset.number, n.dataset.action, v);
  }
});

$('#device-list').addEventListener('focusout', () => {
  setTimeout(() => { if (state.panelDirty) renderPanel(); }, 0);
});

$('#back-btn').addEventListener('click', () => setRoom('all'));

// tooltip over devices in the house
const tip = $('#tooltip');
$('#house').addEventListener('pointermove', (e) => {
  const dev = e.target.closest('.dev, .pin');
  if (!dev || e.pointerType === 'touch') { tip.hidden = true; return; }
  const d = state.devices.get(dev.dataset.dev);
  if (!d) return;
  const quick = dev.classList.contains('dev') && (d.type === 'light' || d.type === 'curtains');
  tip.innerHTML = `<strong>${esc(d.name)}</strong><span>${esc(statusText(d))}</span><em>${quick ? `Click to ${primaryToggle(d) && d.state[primaryToggle(d).stateKey] ? (d.type === 'curtains' ? 'close' : 'switch off') : (d.type === 'curtains' ? 'open' : 'switch on')}` : 'Click for controls'}</em>`;
  const box = $('.stage-canvas').getBoundingClientRect();
  tip.hidden = false;
  const x = Math.min(e.clientX - box.left + 14, box.width - tip.offsetWidth - 8);
  const y = Math.max(8, e.clientY - box.top - tip.offsetHeight - 12);
  tip.style.transform = `translate(${x}px, ${y}px)`;
});
$('#house').addEventListener('pointerleave', () => { tip.hidden = true; });

// theme
function currentTheme() {
  return document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
function renderThemeBtn() {
  const dark = currentTheme() === 'dark';
  $('#theme-toggle').innerHTML = icon(dark ? 'sun' : 'moon');
  $('#theme-toggle').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}
$('#theme-toggle').addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('sh-theme', next); } catch { /* storage unavailable */ }
  renderThemeBtn();
});

function renderSceneToggle() {
  document.querySelectorAll('#scene-toggle button').forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', on);
    b.innerHTML = `${icon(b.dataset.scene === 'day' ? 'sun' : 'moon')}<span>${b.dataset.scene === 'day' ? 'Day' : 'Evening'}</span>`;
  });
}

let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => house.refit(), 150); });

// ------------------------------------------------------------------ start
$('#today').textContent = new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
renderThemeBtn();
renderSceneToggle();
renderHeader();
poll();

// expose for debugging in the browser console
window.__smarthome = { state, house };
void ROOMS;
