/*
 * Wildfire Watch standalone mode
 * ------------------------------
 * Raspberry Pi integration point:
 * Set this one variable to your Flask endpoint, for example:
 * const RASPBERRY_PI_API_URL = 'http://192.168.1.42:5000/api/readings';
 *
 * Expected JSON:
 * {
 *   "zones": [
 *     { "id": "A", "temperature": 82, "moisture": 35, "smoke": 12 },
 *     { "id": "B", "temperature": 91, "moisture": 18, "smoke": 75 }
 *   ]
 * }
 *
 * Leave it blank for presentation-ready demo mode. If the Pi is unavailable,
 * the dashboard automatically falls back to demo readings.
 */
const RASPBERRY_PI_API_URL = '';

const DEMO_SNAPSHOTS = [
  [
    { id: 'A', temperature: 86, moisture: 34, smoke: 16 },
    { id: 'B', temperature: 78, moisture: 49, smoke: 8 },
    { id: 'C', temperature: 94, moisture: 27, smoke: 22 },
    { id: 'D', temperature: 81, moisture: 39, smoke: 10 },
  ],
  [
    { id: 'A', temperature: 83, moisture: 37, smoke: 12 },
    { id: 'B', temperature: 76, moisture: 51, smoke: 7 },
    { id: 'C', temperature: 89, moisture: 31, smoke: 17 },
    { id: 'D', temperature: 80, moisture: 41, smoke: 9 },
  ],
  [
    { id: 'A', temperature: 91, moisture: 29, smoke: 19 },
    { id: 'B', temperature: 79, moisture: 46, smoke: 10 },
    { id: 'C', temperature: 96, moisture: 25, smoke: 28 },
    { id: 'D', temperature: 84, moisture: 36, smoke: 14 },
  ],
];

const ICONS = {
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12.8 2.7c.6 3.2-1.1 4.9-2.5 6.5-1.2 1.4-2.3 2.8-1.4 5.2.5 1.3 1.7 2.1 3.1 2.1 2.3 0 4.1-1.9 4.1-4.4 0-.8-.2-1.6-.6-2.4 2.5 1.9 4.1 4.3 4.1 7.1 0 3.9-3.3 6.8-7.5 6.8S4.5 20.7 4.5 16.3c0-3.5 2.1-6.4 5.3-9.1.9-.8 2-2.2 3-4.5Z"/></svg>',
  gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4.5 15.5a7.5 7.5 0 1 1 15 0"/><path d="m12 12 3.8-3.8"/><path d="M6.8 18.5h10.4"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m10.3 3.8-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 11a8 8 0 0 0-14.8-4L3 10"/><path d="M3 5v5h5"/><path d="M4 13a8 8 0 0 0 14.8 4L21 14"/><path d="M21 19v-5h-5"/></svg>',
  thermometer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z"/><path d="M11 5v10"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20.8 3.2C11.5 3.1 5.3 5.9 4.1 12.1c-.8 4.1 2.1 7.5 6 6.8 6.2-1.2 9-7.4 10.7-15.7Z"/><path d="M3 21c3.2-4.8 6.5-7.8 11.2-10.2"/></svg>',
  droplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3.5s6 6.2 6 10.4a6 6 0 0 1-12 0C6 9.7 12 3.5 12 3.5Z"/></svg>',
  wind: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h16a2 2 0 1 1-2 2"/><path d="M3 16h8a3 3 0 1 1-3 3"/></svg>',
  dot: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 8.5a15.5 15.5 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 15.5a6.1 6.1 0 0 1 7 0M12 19h.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
};

const state = {
  demoMode: true,
  snapshotIndex: 0,
  zones: DEMO_SNAPSHOTS[0],
  lastUpdated: new Date(),
  isRefreshing: false,
  connection: 'demo',
};

const $ = (selector) => document.querySelector(selector);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const formatTime = (date) =>
  new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(date);

function icon(name) {
  return ICONS[name] || '';
}

function calculateRisk(zone) {
  const temperatureRisk = clamp(((zone.temperature - 60) / 45) * 35, 0, 35);
  const drynessRisk = clamp(((60 - zone.moisture) / 60) * 35, 0, 35);
  const smokeRisk = clamp((zone.smoke / 40) * 30, 0, 30);
  return Math.round(temperatureRisk + drynessRisk + smokeRisk);
}

function decorateZone(zone) {
  const risk = calculateRisk(zone);
  return { ...zone, risk, level: risk >= 60 ? 'high' : risk >= 35 ? 'moderate' : 'low' };
}

function statusLabel(level) {
  return level === 'moderate' ? 'watch' : level;
}

function renderAlerts(zones) {
  const alerts = [];
  zones.forEach((zone) => {
    if (zone.smoke >= 18) alerts.push({ icon: 'wind', title: `Smoke signal · Zone ${zone.id}`, detail: `${zone.smoke} index · review immediately` });
    if (zone.temperature >= 92) alerts.push({ icon: 'thermometer', title: `High temperature · Zone ${zone.id}`, detail: `${zone.temperature}°F · above 92°F threshold` });
    if (zone.moisture <= 30) alerts.push({ icon: 'droplet', title: `Low moisture · Zone ${zone.id}`, detail: `${zone.moisture}% · below 30% threshold` });
    if (zone.risk >= 60) alerts.push({ icon: 'alert', title: `High zone risk · Zone ${zone.id}`, detail: `${zone.risk}/100 · strongest park signal` });
  });

  $('#alert-count').textContent = alerts.length
    ? `${alerts.length} active signal${alerts.length === 1 ? '' : 's'}`
    : 'No active signals';
  $('#alert-list').innerHTML = alerts.length
    ? alerts.map((alert) => `<div class="alert-item"><div class="alert-icon">${icon(alert.icon)}</div><div><strong>${alert.title}</strong><span>${alert.detail}</span></div></div>`).join('')
    : '<div class="alert-empty"><span>' + icon('info') + '</span><span>All thresholds are currently within the demonstration safe range.</span></div>';

  const alertNav = document.querySelector('[data-target="alerts"] span:last-child');
  if (alertNav) alertNav.textContent = alerts.length ? `Alerts · ${alerts.length}` : 'Alerts';
}

function renderZones(zones) {
  $('#zone-grid').innerHTML = zones.map((zone) => `
    <article class="zone-card ${zone.level}">
      <div class="zone-head">
        <div class="zone-name"><span class="zone-letter">${zone.id}</span>Zone ${zone.id}</div>
        <span class="zone-state ${zone.level}">${statusLabel(zone.level)}</span>
      </div>
      <div class="zone-risk-row"><span class="zone-risk">${zone.risk}</span><span class="zone-risk-label">risk / 100</span></div>
      <div class="risk-track" aria-label="Zone ${zone.id} risk ${zone.risk} out of 100"><div class="risk-fill ${zone.level}" style="width:${zone.risk}%"></div></div>
      <ul class="reading-list">
        <li class="reading"><span class="reading-label">${icon('thermometer')}Temperature</span><strong class="reading-value">${zone.temperature}°F</strong></li>
        <li class="reading"><span class="reading-label">${icon('droplet')}Moisture</span><strong class="reading-value">${zone.moisture}%</strong></li>
        <li class="reading"><span class="reading-label">${icon('wind')}Smoke index</span><strong class="reading-value">${zone.smoke}</strong></li>
      </ul>
      <div class="zone-card-foot">${icon('wifi')}Sensor stream · updated with park scan</div>
    </article>
  `).join('');
}

function render() {
  const zones = state.zones.map(decorateZone);
  const overallRisk = Math.max(...zones.map((zone) => zone.risk));
  const overallLevel = overallRisk >= 60 ? 'high' : overallRisk >= 35 ? 'moderate' : 'low';
  const averageTemperature = Math.round(zones.reduce((sum, zone) => sum + zone.temperature, 0) / zones.length);
  const averageMoisture = Math.round(zones.reduce((sum, zone) => sum + zone.moisture, 0) / zones.length);
  const live = state.connection === 'live';

  $('#overall-risk').textContent = overallRisk;
  $('#overall-status').className = `risk-level${overallLevel === 'moderate' ? ' moderate' : overallLevel === 'low' ? ' safe' : ''}`;
  $('#overall-status-label').textContent = overallLevel === 'high' ? 'Elevated conditions' : overallLevel === 'moderate' ? 'Watch conditions' : 'Low conditions';
  $('#average-temperature').textContent = `${averageTemperature}°F`;
  $('#average-moisture').textContent = `${averageMoisture}%`;
  $('#moisture-meta').innerHTML = `${icon('dot')}<span>${overallRisk >= 60 ? 'Dryness is a factor' : 'Healthy moisture signal'}</span>`;
  $('#last-updated').textContent = formatTime(state.lastUpdated);
  $('#last-scan').textContent = formatTime(state.lastUpdated);
  $('#telemetry-source').textContent = live ? 'RASPBERRY PI' : 'DEMO READINGS';
  $('#source-label').textContent = live ? 'Raspberry Pi live' : state.connection === 'fallback' ? 'Demo fallback' : 'Demo stream';
  $('#source-pill .source-dot').classList.toggle('live', live);
  $('#mode-label').textContent = state.demoMode ? 'Try Pi connection' : 'Return to demo mode';
  $('#mode-button [data-icon]').innerHTML = icon(state.demoMode ? 'wifi' : 'wifi');

  renderAlerts(zones);
  renderZones(zones);
}

function useDemoSnapshot(connection = 'demo') {
  state.snapshotIndex = (state.snapshotIndex + 1) % DEMO_SNAPSHOTS.length;
  state.zones = DEMO_SNAPSHOTS[state.snapshotIndex];
  state.connection = connection;
  state.lastUpdated = new Date();
  render();
}

async function refreshSensors() {
  if (state.isRefreshing) return;
  state.isRefreshing = true;
  $('#refresh-button').disabled = true;
  $('#refresh-label').textContent = 'Refreshing';
  $('[data-icon="refresh"]').classList.add('refresh-spin');

  if (state.demoMode || !RASPBERRY_PI_API_URL) {
    window.setTimeout(() => {
      useDemoSnapshot(state.demoMode ? 'demo' : 'fallback');
      finishRefresh();
    }, 650);
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);
    const response = await fetch(RASPBERRY_PI_API_URL, { signal: controller.signal });
    window.clearTimeout(timeout);
    if (!response.ok) throw new Error(`Pi returned ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload?.zones)) throw new Error('Unexpected sensor format');
    const incoming = payload.zones
      .filter((zone) => ['A', 'B', 'C', 'D'].includes(zone.id))
      .map((zone) => ({ id: zone.id, temperature: Number(zone.temperature), moisture: Number(zone.moisture), smoke: Number(zone.smoke) }));
    if (incoming.length !== 4 || incoming.some((zone) => Object.values(zone).some((value) => Number.isNaN(value)))) throw new Error('Incomplete zone readings');
    state.zones = incoming;
    state.connection = 'live';
    state.lastUpdated = new Date();
    render();
  } catch {
    state.connection = 'fallback';
    useDemoSnapshot('fallback');
  } finally {
    finishRefresh();
  }
}

function finishRefresh() {
  state.isRefreshing = false;
  $('#refresh-button').disabled = false;
  $('#refresh-label').textContent = 'Refresh now';
  $('[data-icon="refresh"]').classList.remove('refresh-spin');
}

function toggleMode() {
  state.demoMode = !state.demoMode;
  if (state.demoMode) {
    state.snapshotIndex = 0;
    state.zones = DEMO_SNAPSHOTS[0];
    state.connection = 'demo';
    state.lastUpdated = new Date();
    render();
  } else {
    refreshSensors();
  }
}

document.querySelectorAll('[data-icon]').forEach((element) => {
  const name = element.dataset.icon;
  element.innerHTML = icon(name);
});
document.querySelectorAll('[data-target]').forEach((button) => {
  button.addEventListener('click', () => {
    document.getElementById(button.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item === button));
  });
});
$('#refresh-button').addEventListener('click', refreshSensors);
$('#mode-button').addEventListener('click', toggleMode);
render();
window.setInterval(() => {
  if (state.demoMode) refreshSensors();
}, 18000);