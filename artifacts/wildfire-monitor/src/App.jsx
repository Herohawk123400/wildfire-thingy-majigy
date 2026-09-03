import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Cloud,
  Droplets,
  Flame,
  Gauge,
  Info,
  Leaf,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  ThermometerSun,
  Wifi,
  WifiOff,
  Wind,
} from 'lucide-react';

// Raspberry Pi integration point:
// Set this one variable to the Flask endpoint, for example:
// const RASPBERRY_PI_API_URL = 'http://192.168.1.42:5000/api/readings';
// Expected JSON: { zones: [{ id: 'A', temperature: 82, moisture: 35, smoke: 12 }] }
// The dashboard calculates risk locally. Leave blank to run presentation-ready demo mode.
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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function calculateRisk(zone) {
  const temperatureRisk = clamp(((zone.temperature - 60) / 45) * 35, 0, 35);
  const drynessRisk = clamp(((60 - zone.moisture) / 60) * 35, 0, 35);
  const smokeRisk = clamp((zone.smoke / 40) * 30, 0, 30);
  return Math.round(temperatureRisk + drynessRisk + smokeRisk);
}

function decorateZone(zone) {
  const risk = calculateRisk(zone);
  const level = risk >= 60 ? 'high' : risk >= 35 ? 'moderate' : 'low';
  return { ...zone, risk, level };
}

function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function NavItem({ icon: Icon, label, active, target, onClick }) {
  return (
    <button
      className={`nav-item${active ? ' active' : ''}`}
      data-testid={`button-nav-${target}`}
      type="button"
      onClick={onClick}
    >
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function RiskSummary({ zones }) {
  const overallRisk = Math.max(...zones.map((zone) => zone.risk));
  const highCount = zones.filter((zone) => zone.level === 'high').length;
  const moderateCount = zones.filter((zone) => zone.level === 'moderate').length;
  const statusLabel = overallRisk >= 60 ? 'Elevated conditions' : overallRisk >= 35 ? 'Watch conditions' : 'Low conditions';
  return (
    <div className="summary-card" data-testid="card-overall-risk">
      <p className="card-kicker">Overall park risk estimate</p>
      <div className="summary-row">
        <div>
          <div className="risk-big" data-testid="text-overall-risk">
            {overallRisk}
            <small>/ 100</small>
          </div>
          <div className={`risk-level ${overallRisk >= 60 ? '' : overallRisk >= 35 ? 'moderate' : 'safe'}`}>
            <span className="level-dot" />
            {statusLabel}
          </div>
        </div>
        <p className="summary-copy">
          Highest reading across four monitored zones. Use the signal, then review each zone below.
        </p>
      </div>
      <span className="sr-only">
        {highCount} high-risk zones and {moderateCount} watch zones.
      </span>
    </div>
  );
}

function MetricCard({ icon: Icon, value, label, meta, safe = false, testId }) {
  return (
    <div className="metric-card" data-testid={testId}>
      <div className={`metric-icon${safe ? ' safe' : ''}`}><Icon aria-hidden="true" /></div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-meta"><CircleDot aria-hidden="true" size={10} />{meta}</div>
    </div>
  );
}

function AlertItem({ icon: Icon, title, detail, testId }) {
  return (
    <div className="alert-item" data-testid={testId}>
      <div className="alert-icon"><Icon aria-hidden="true" /></div>
      <div><strong>{title}</strong><span>{detail}</span></div>
    </div>
  );
}

function ZoneCard({ zone }) {
  return (
    <article className={`zone-card ${zone.level}`} data-testid={`card-zone-${zone.id}`}>
      <div className="zone-head">
        <div className="zone-name"><span className="zone-letter">{zone.id}</span>Zone {zone.id}</div>
        <span className={`zone-state ${zone.level}`} data-testid={`status-zone-${zone.id}`}>{zone.level === 'moderate' ? 'watch' : zone.level}</span>
      </div>
      <div className="zone-risk-row">
        <span className="zone-risk" data-testid={`text-risk-zone-${zone.id}`}>{zone.risk}</span>
        <span className="zone-risk-label">risk / 100</span>
      </div>
      <div className="risk-track" aria-label={`Zone ${zone.id} risk ${zone.risk} out of 100`}>
        <div className={`risk-fill ${zone.level}`} style={{ width: `${zone.risk}%` }} />
      </div>
      <ul className="reading-list">
        <li className="reading">
          <span className="reading-label"><ThermometerSun aria-hidden="true" />Temperature</span>
          <strong className="reading-value" data-testid={`text-temperature-${zone.id}`}>{zone.temperature}°F</strong>
        </li>
        <li className="reading">
          <span className="reading-label"><Droplets aria-hidden="true" />Moisture</span>
          <strong className="reading-value" data-testid={`text-moisture-${zone.id}`}>{zone.moisture}%</strong>
        </li>
        <li className="reading">
          <span className="reading-label"><Cloud aria-hidden="true" />Smoke index</span>
          <strong className="reading-value" data-testid={`text-smoke-${zone.id}`}>{zone.smoke}</strong>
        </li>
      </ul>
      <div className="zone-card-foot"><Wifi aria-hidden="true" size={11} />Sensor stream · updated with park scan</div>
    </article>
  );
}

function App() {
  const [demoMode, setDemoMode] = useState(true);
  const [snapshotIndex, setSnapshotIndex] = useState(0);
  const [rawZones, setRawZones] = useState(DEMO_SNAPSHOTS[0]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionState, setConnectionState] = useState('demo');
  const [activeNav, setActiveNav] = useState('overview');

  const zones = useMemo(() => rawZones.map(decorateZone), [rawZones]);
  const alerts = useMemo(() => {
    const items = [];
    zones.forEach((zone) => {
      if (zone.smoke >= 18) items.push({ key: `smoke-${zone.id}`, icon: Wind, title: `Smoke signal · Zone ${zone.id}`, detail: `${zone.smoke} index · review immediately` });
      if (zone.temperature >= 92) items.push({ key: `temp-${zone.id}`, icon: ThermometerSun, title: `High temperature · Zone ${zone.id}`, detail: `${zone.temperature}°F · above 92°F threshold` });
      if (zone.moisture <= 30) items.push({ key: `moisture-${zone.id}`, icon: Droplets, title: `Low moisture · Zone ${zone.id}`, detail: `${zone.moisture}% · below 30% threshold` });
      if (zone.risk >= 60) items.push({ key: `risk-${zone.id}`, icon: AlertTriangle, title: `High zone risk · Zone ${zone.id}`, detail: `${zone.risk}/100 · strongest park signal` });
    });
    return items;
  }, [zones]);
  const overallRisk = Math.max(...zones.map((zone) => zone.risk));
  const averageTemperature = Math.round(zones.reduce((sum, zone) => sum + zone.temperature, 0) / zones.length);
  const averageMoisture = Math.round(zones.reduce((sum, zone) => sum + zone.moisture, 0) / zones.length);

  const useDemoSnapshot = useCallback((source = 'demo') => {
    const nextIndex = (snapshotIndex + 1) % DEMO_SNAPSHOTS.length;
    setSnapshotIndex(nextIndex);
    setRawZones(DEMO_SNAPSHOTS[nextIndex]);
    setConnectionState(source);
    setLastUpdated(new Date());
  }, [snapshotIndex]);

  const refreshSensors = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    if (demoMode || !RASPBERRY_PI_API_URL) {
      window.setTimeout(() => {
        useDemoSnapshot(demoMode ? 'demo' : 'fallback');
        setIsRefreshing(false);
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
      const incoming = payload.zones.filter((zone) => ['A', 'B', 'C', 'D'].includes(zone.id)).map((zone) => ({
        id: zone.id,
        temperature: Number(zone.temperature),
        moisture: Number(zone.moisture),
        smoke: Number(zone.smoke),
      }));
      if (incoming.length !== 4 || incoming.some((zone) => Object.values(zone).some((value) => Number.isNaN(value)))) throw new Error('Incomplete zone readings');
      setRawZones(incoming);
      setConnectionState('live');
      setLastUpdated(new Date());
    } catch {
      setConnectionState('fallback');
      useDemoSnapshot('fallback');
    } finally {
      setIsRefreshing(false);
    }
  }, [demoMode, isRefreshing, useDemoSnapshot]);

  useEffect(() => {
    if (!demoMode) return undefined;
    const timer = window.setInterval(() => {
      refreshSensors();
    }, 18000);
    return () => window.clearInterval(timer);
  }, [demoMode, refreshSensors]);

  const jumpTo = (section) => {
    setActiveNav(section);
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleMode = () => {
    const nextMode = !demoMode;
    setDemoMode(nextMode);
    if (nextMode) {
      setConnectionState('demo');
      setSnapshotIndex(0);
      setRawZones(DEMO_SNAPSHOTS[0]);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    if (demoMode) return undefined;
    const request = window.setTimeout(() => refreshSensors(), 0);
    return () => window.clearTimeout(request);
  }, [demoMode]);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark"><Flame aria-hidden="true" size={19} /></div>
          <div className="brand-copy"><strong>Wildfire Watch</strong><span>FLL field system</span></div>
        </div>
        <div className="nav-label">Command view</div>
        <nav className="nav-list">
          <NavItem icon={Gauge} label="Overview" target="overview" active={activeNav === 'overview'} onClick={() => jumpTo('overview')} />
          <NavItem icon={MapPinned} label="Park zones" target="zones" active={activeNav === 'zones'} onClick={() => jumpTo('zones')} />
          <NavItem icon={AlertTriangle} label={`Alerts${alerts.length ? ` · ${alerts.length}` : ''}`} target="alerts" active={activeNav === 'alerts'} onClick={() => jumpTo('alerts')} />
          <NavItem icon={BarChart3} label="Method" target="method" active={activeNav === 'method'} onClick={() => jumpTo('method')} />
        </nav>
        <div className="sidebar-foot">
          <p>Built for explanation</p>
          <strong>Team Emberline · FLL 2025</strong>
          <span>Read the signal. Explain the choice. Keep people moving safely.</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb"><b>Operations</b> / Park conditions / Live board</div>
          <div className="topbar-actions">
            <div className="source-pill" data-testid="status-data-source">
              <span className={`source-dot${connectionState === 'live' ? ' live' : ''}`} />
              {connectionState === 'live' ? 'Raspberry Pi live' : connectionState === 'fallback' ? 'Demo fallback' : 'Demo stream'}
            </div>
            <button className="button primary" data-testid="button-refresh-now" type="button" onClick={refreshSensors} disabled={isRefreshing}>
              <RefreshCw aria-hidden="true" className={isRefreshing ? 'refresh-spin' : ''} />
              {isRefreshing ? 'Refreshing' : 'Refresh now'}
            </button>
          </div>
        </header>

        <div className="content">
          <section className="hero" id="overview">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" />Environmental intelligence</p>
              <h1>Know the park.<br /><em>Move with clarity.</em></h1>
              <p className="hero-sub">A clear read on heat, moisture, and smoke across <strong>Juniper Ridge Park</strong> — designed to make a fast safety conversation easier for students, mentors, and judges.</p>
            </div>
            <div className="hero-note">
              <div className="hero-note-top">
                <span className="hero-note-label">Monitoring status</span>
                <span className="status-signal"><span />Active</span>
              </div>
              <h2>All zones reporting</h2>
              <p>Four sensor channels are being checked every 18 seconds. Signals below are intentionally easy to scan from across a pit table.</p>
            </div>
          </section>

          <section className="summary-grid" aria-label="Park summary">
            <RiskSummary zones={zones} />
            <MetricCard icon={ThermometerSun} value={`${averageTemperature}°F`} label="Park temperature average" meta="4 sensors online" testId="card-temperature-average" />
            <MetricCard icon={Leaf} value={`${averageMoisture}%`} label="Park moisture average" meta={overallRisk >= 60 ? 'Dryness is a factor' : 'Healthy moisture signal'} safe={overallRisk < 60} testId="card-moisture-average" />
          </section>

          <section className="alerts-panel" id="alerts" aria-labelledby="alerts-title">
            <div className="section-heading">
              <div><h2 id="alerts-title">Safety signals</h2><p>Thresholds needing a closer look, not a prediction.</p></div>
              <span className="source-pill" data-testid="text-alert-count">{alerts.length ? `${alerts.length} active signal${alerts.length === 1 ? '' : 's'}` : 'No active signals'}</span>
            </div>
            {alerts.length ? (
              <div className="alert-list">
                {alerts.map((alert) => (
                  <AlertItem
                    key={alert.key}
                    icon={alert.icon}
                    title={alert.title}
                    detail={alert.detail}
                    testId={`alert-${alert.key}`}
                  />
                ))}
              </div>
            ) : (
              <div className="alert-empty" data-testid="status-alerts-clear"><CheckCircle2 aria-hidden="true" size={17} /><span>All thresholds are currently within the demonstration safe range.</span></div>
            )}
          </section>

          <section className="zones-section" id="zones" aria-labelledby="zones-title">
            <div className="zones-header">
              <div><h2 id="zones-title">Park zone readings</h2><p>Live inputs and the locally calculated risk score for each area.</p></div>
              <span className="card-kicker" data-testid="text-last-updated">Updated {formatTime(lastUpdated)}</span>
            </div>
            <div className="zone-grid">
              {zones.map((zone) => <ZoneCard key={zone.id} zone={zone} />)}
            </div>
          </section>

          <section className="bottom-grid" id="method">
            <div className="method-card">
              <h2>How the estimate works</h2>
              <p>Wildfire Watch combines three readable signals into one educational score. A higher number means more conditions deserve attention; it does not declare that a fire exists.</p>
              <details>
                <summary>View the transparent calculation <ChevronDown aria-hidden="true" size={13} /></summary>
                <div className="formula">temperature contribution · 35 points<br />dryness contribution · 35 points<br />smoke contribution · 30 points<br /><strong>score = temperature + dryness + smoke, capped at 100</strong></div>
              </details>
            </div>
            <div className="monitor-card">
              <h2>Board telemetry</h2>
              <div className="monitor-row"><span>Data source</span><strong>{connectionState === 'live' ? 'RASPBERRY PI' : 'DEMO READINGS'}</strong></div>
              <div className="monitor-row"><span>Refresh cadence</span><strong>18 SECONDS</strong></div>
              <div className="monitor-row"><span>Last scan</span><strong data-testid="text-last-scan">{formatTime(lastUpdated)}</strong></div>
              <button className="button" data-testid="button-demo-toggle" type="button" onClick={toggleMode}>
                {demoMode ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
                {demoMode ? 'Try Pi connection' : 'Return to demo mode'}
              </button>
            </div>
          </section>

          <footer className="footer-note" data-testid="text-disclaimer">
            <Info aria-hidden="true" />
            <span><strong>Educational demonstration only.</strong> This risk estimate is not a real wildfire prediction system, emergency notification service, or substitute for local authorities.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;