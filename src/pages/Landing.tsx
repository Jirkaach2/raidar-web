import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { databases, DB_ID, PLANS_COLLECTION_ID, Query, isConfigured, type Plan } from '../lib/appwrite';

const FEATURES = [
  { ico: '🗺️', title: 'Live Tactical Map', desc: 'Real-time map with your team, events, monuments, caves and the travelling vendor — projected exactly like in-game grids.' },
  { ico: '🚨', title: 'Base Alarms', desc: 'Smart Alarm triggers hit your overlay and Discord the instant your base is touched.' },
  { ico: '🎛️', title: 'Device Control', desc: 'Toggle Smart Switches from the app or straight from Discord with one-tap buttons.' },
  { ico: '🤖', title: 'Discord Bot', desc: 'Link your server in seconds — status, team, events and alerts routed into dedicated channels.' },
  { ico: '💰', title: 'Shop & Price Intel', desc: 'Track vending machines, watch prices, and see which shops earn the most — live.' },
  { ico: '🧨', title: 'Raid Planning', desc: 'Raid cost calculator, loot tables, and event timers so you’re always a step ahead.' },
];

const STEPS = [
  { n: '01', title: 'Download Raidar', desc: 'Grab the desktop app for Windows and pair it with your Rust+ account — no Steam login juggling.' },
  { n: '02', title: 'Link your Discord', desc: 'Run /link in your server, paste the code into the app, and Raidar builds your channels automatically.' },
  { n: '03', title: 'Dominate the wipe', desc: 'Watch the map, control devices, and get raid alerts in real time — on desktop and in Discord.' },
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
      .then((res) => {
        if (res.documents.length) setPlans(res.documents);
      })
      .catch(() => {/* keep fallback */});
  }, []);

  return (
    <>
      <header className="hero">
        <div className="container">
          <div className="kicker">Rust Intelligence App</div>
          <h1>Win the wipe with <span>Raidar</span></h1>
          <p>
            A tactical overlay and Discord companion for Rust+. Live map, base alarms, device control,
            shop intel and raid planning — on your desktop and in your team’s server.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-lg" to="/register">Start free</Link>
            <Link className="btn btn-ghost btn-lg" to="/docs">Read the docs</Link>
          </div>
          <div className="hero-banner">
            <img src="/raidar-banner.png" alt="Raidar tactical overlay" />
          </div>
        </div>
      </header>

      <section className="section" id="features">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Everything you need to dominate</h2>
            <p className="section-sub">One app for map awareness, base defense and team coordination.</p>
          </div>
          <div className="grid">
            {FEATURES.map((f) => (
              <div className="card" key={f.title}>
                <div className="ico">{f.ico}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="how">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Up and running in minutes</h2>
            <p className="section-sub">Three steps from download to total map awareness.</p>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step" key={s.n}>
                <div className="step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="container">
          <div className="section-head">
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
                  {(p.features || []).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link className={`btn ${p.popular ? '' : 'btn-ghost'}`} to="/register" style={{ width: '100%', justifyContent: 'center' }}>
                  {p.price === 0 ? 'Get started' : `Choose ${p.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <h2>Get Raidar</h2>
            <p>Free to start, built for Rust. Download the desktop app and link your server today.</p>
            <div className="hero-cta">
              <Link className="btn btn-lg" to="/register">Create your account</Link>
              <Link className="btn btn-ghost btn-lg" to="/docs#discord-bot">Set up the Discord bot</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
