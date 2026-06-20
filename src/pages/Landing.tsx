import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Map, Siren, ToggleRight, Bot, DollarSign, Bomb, Radar, ShieldCheck,
  Check, ChevronRight, Download, Activity, Wifi,
} from 'lucide-react';
import { databases, DB_ID, PLANS_COLLECTION_ID, Query, isConfigured, type Plan } from '../lib/appwrite';

const FEATURES = [
  { Icon: Map, title: 'Live Tactical Map', desc: 'Real-time positions for your team, monuments, caves, the travelling vendor and active events — projected on in-game grids.' },
  { Icon: Siren, title: 'Base Alarms', desc: 'Smart Alarm triggers hit your overlay and Discord the instant your base is touched. Never sleep through a raid again.' },
  { Icon: ToggleRight, title: 'Device Control', desc: 'Toggle Smart Switches from the app or straight from Discord with one-tap buttons. Run your base remotely.' },
  { Icon: Bot, title: 'Discord Bot', desc: 'Link your server in seconds — status, team, events and alerts routed into dedicated channels with rich embeds.' },
  { Icon: DollarSign, title: 'Shop & Price Intel', desc: 'Track vending machines, watch prices, and see which shops earn the most across the map — live.' },
  { Icon: Bomb, title: 'Raid Planning', desc: 'Raid cost calculator, loot tables and event timers so you always know the price of the door and the value behind it.' },
];

const SHOWCASE = [
  { img: '/images/markers/cargo.png', label: 'Cargo Ship' },
  { img: '/images/markers/patrol_heli_full.png', label: 'Patrol Heli' },
  { img: '/images/markers/locked_crate.webp', label: 'Locked Crate' },
  { img: '/images/markers/chinook_full.png', label: 'Chinook' },
  { img: '/images/monuments/launch_site.jpg', label: 'Launch Site' },
  { img: '/images/monuments/oil_rig_large.webp', label: 'Large Oil Rig' },
  { img: '/images/markers/travelling-vendor.png', label: 'Travelling Vendor' },
  { img: '/images/monuments/giant_excavator.webp', label: 'Excavator' },
];

const STEPS = [
  { n: 'STEP 01', title: 'Download Raidar', desc: 'Grab the desktop app for Windows and pair it with your Rust+ account — no Steam login juggling.' },
  { n: 'STEP 02', title: 'Link your Discord', desc: 'Run /link in your server, paste the code into the app, and Raidar builds your channels automatically.' },
  { n: 'STEP 03', title: 'Dominate the wipe', desc: 'Watch the map, control devices, and get raid alerts in real time — on desktop and in Discord.' },
];

const FALLBACK_PLANS: Array<Pick<Plan, 'name' | 'price' | 'tagline' | 'features' | 'popular'>> = [
  { name: 'Scout', price: 0, tagline: 'For solo players getting started', popular: false, features: ['Live tactical map', '1 linked server', 'Base alarms', 'Discord bot (single channel)'] },
  { name: 'Raider', price: 5, tagline: 'For active teams', popular: true, features: ['Everything in Scout', 'Up to 3 linked servers', 'Per-feature Discord channels', 'Device control panel', 'Shop & price intel'] },
  { name: 'Clan', price: 12, tagline: 'For large groups & multi-server', popular: false, features: ['Everything in Raider', 'Unlimited linked servers', 'Priority event routing', 'Member device whitelisting', 'Priority support'] },
];

export default function Landing() {
  const [plans, setPlans] = useState(FALLBACK_PLANS);

  useEffect(() => {
    if (!isConfigured) return;
    databases
      .listDocuments<Plan>(DB_ID, PLANS_COLLECTION_ID, [Query.orderAsc('order'), Query.limit(12)])
      .then((res) => { if (res.documents.length) setPlans(res.documents); })
      .catch(() => {/* keep fallback */});
  }, []);

  return (
    <>
      <header className="hero">
        <div className="container">
          <div className="hero-kicker">
            <span className="dot" />
            <span className="hud-label hud-label--accent">Rust Intelligence App</span>
          </div>
          <h1>Win the wipe<br />with <span>Raidar</span></h1>
          <p className="lead">
            A tactical overlay and Discord companion for Rust+. Live map, base alarms, device control,
            shop intel and raid planning — on your desktop and in your team's server.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-lg" to="/register"><Download size={17} /> Start free</Link>
            <Link className="btn btn-ghost btn-lg" to="/docs">Read the docs <ChevronRight size={16} /></Link>
          </div>
          <div className="trust">
            <span><Radar size={14} /> Live Rust+ sync</span>
            <span><Wifi size={14} /> Instant alerts</span>
            <span><ShieldCheck size={14} /> Per-member device control</span>
            <span><Activity size={14} /> No game files touched</span>
          </div>
          <div className="hero-shot bracketed">
            <img src="/raidar-banner.png" alt="Raidar tactical overlay" />
          </div>
        </div>
      </header>

      <section className="section" id="features">
        <div className="container">
          <div className="section-head">
            <span className="hud-label hud-label--accent">// Capabilities</span>
            <h2 className="section-title">Everything you need to dominate</h2>
            <p className="section-sub">One app for map awareness, base defense and team coordination.</p>
          </div>
          <div className="grid">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div className="feature-card bracketed" key={title}>
                <div className="feature-ico"><Icon /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="intel">
        <div className="container">
          <div className="section-head">
            <span className="hud-label hud-label--accent">// Tracked in real time</span>
            <h2 className="section-title">Every event on the map</h2>
            <p className="section-sub">Raidar watches the things that decide wipes — and tells you the moment they move.</p>
          </div>
          <div className="showcase">
            {SHOWCASE.map((s) => (
              <figure className="shot" key={s.label}>
                <img src={s.img} alt={s.label} loading="lazy" />
                <figcaption>{s.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="container">
          <div className="section-head">
            <span className="hud-label hud-label--accent">// Deployment</span>
            <h2 className="section-title">Up and running in minutes</h2>
            <p className="section-sub">Three steps from download to total map awareness.</p>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step bracketed" key={s.n}>
                <div className="step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < STEPS.length - 1 && <ChevronRight className="step-line" size={20} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="pricing">
        <div className="container">
          <div className="section-head">
            <span className="hud-label hud-label--accent">// Pricing</span>
            <h2 className="section-title">Plans for every squad</h2>
            <p className="section-sub">Start free, upgrade when your clan grows. Cancel anytime.</p>
          </div>
          <div className="pricing-grid">
            {plans.map((p) => (
              <div className={`price-card ${p.popular ? 'popular' : ''}`} key={p.name}>
                {p.popular && <div className="price-badge">Most popular</div>}
                <h3>{p.name}</h3>
                {p.tagline && <p className="price-tagline">{p.tagline}</p>}
                <div className="price">
                  {p.price === 0 ? <span className="price-amt">Free</span> : <><span className="price-amt">${p.price}</span><span className="price-per">/mo</span></>}
                </div>
                <ul className="price-features">
                  {(p.features || []).map((f) => <li key={f}><Check /> {f}</li>)}
                </ul>
                <Link className={`btn ${p.popular ? '' : 'btn-ghost'}`} to="/register" style={{ width: '100%' }}>
                  {p.price === 0 ? 'Get started' : `Choose ${p.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band bracketed">
            <h2>Get Raidar</h2>
            <p>Free to start, built for Rust. Download the desktop app and link your server today.</p>
            <div className="hero-cta">
              <Link className="btn btn-lg" to="/register"><Download size={17} /> Create your account</Link>
              <Link className="btn btn-ghost btn-lg" to="/docs#discord-bot">Set up the Discord bot</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
