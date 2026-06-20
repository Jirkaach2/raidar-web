import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Map, Siren, ToggleRight, Bot, Bomb, Radar, ShieldCheck,
  Check, ChevronRight, Download, Wifi, Cpu, Zap,
} from 'lucide-react';
import { databases, DB_ID, PLANS_COLLECTION_ID, Query, isConfigured, type Plan } from '../lib/appwrite';
import Reveal from '../components/Reveal';
import AppWindow from '../components/AppWindow';
import AppTemplates from '../components/AppTemplates';

const FEATURES = [
  { Icon: Map, title: 'Live Tactical Map', desc: 'Real-time team, monuments, caves, the travelling vendor and every world event — projected on in-game grids with click-through detail panels.' },
  { Icon: Siren, title: 'Base Alarms', desc: 'Smart Alarm triggers hit your overlay and Discord the instant your base is touched. Never sleep through a raid again.' },
  { Icon: Zap, title: 'Switch Automation', desc: 'Program Smart Switches to react to nightfall, low upkeep, world events or raid alarms — turn on, off, toggle or pulse, with optional conditions.' },
  { Icon: ToggleRight, title: 'Device Control', desc: 'Toggle switches, watch alarms and read TC upkeep + storage from the app or Discord — even across multiple servers at once.' },
  { Icon: Bot, title: 'Discord Bot', desc: 'Link your server in seconds — status, team, events and alerts routed into dedicated channels with rich embeds and one-tap buttons.' },
  { Icon: Bomb, title: 'Raid Planning', desc: 'Raid cost calculator, profit scanner, loadout lab, recycler and price intel — know the cost of every door and the value behind it.' },
];

const STEPS = [
  { n: 'STEP 01', title: 'Download Raidar', desc: 'Grab the desktop app for Windows and pair it with your Rust+ account — no Steam login juggling.' },
  { n: 'STEP 02', title: 'Link your Discord', desc: 'Run /link in your server, paste the code into the app, and Raidar builds your channels automatically.' },
  { n: 'STEP 03', title: 'Dominate the wipe', desc: 'Watch the map, automate your base, and get raid alerts in real time — on desktop and in Discord.' },
];

const FALLBACK_PLANS: Array<Pick<Plan, 'name' | 'price' | 'tagline' | 'features' | 'popular'>> = [
  { name: 'Scout', price: 0, tagline: 'For solo players getting started', popular: false, features: ['Live tactical map', '1 linked server', 'Base alarms', 'Discord bot (single channel)'] },
  { name: 'Raider', price: 5, tagline: 'For active teams', popular: true, features: ['Everything in Scout', 'Up to 3 linked servers', 'Per-feature Discord channels', 'Switch automation', 'Device control panel', 'Shop & price intel'] },
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
          <div className="hero-kicker reveal reveal-fade in-view">
            <span className="dot" />
            <span className="hud-label hud-label--accent">Rust Intelligence App</span>
          </div>
          <h1 className="reveal reveal-up in-view">Win the wipe<br />with <span>Raidar</span></h1>
          <p className="lead reveal reveal-up in-view" style={{ transitionDelay: '80ms' }}>
            A tactical overlay and Discord companion for Rust+. Live map, base alarms, programmable
            switches, shop intel and raid planning — on your desktop and in your team's server.
          </p>
          <div className="hero-cta reveal reveal-up in-view" style={{ transitionDelay: '160ms' }}>
            <Link className="btn btn-lg" to="/register"><Download size={17} /> Start free</Link>
            <Link className="btn btn-ghost btn-lg" to="/docs">Read the docs <ChevronRight size={16} /></Link>
          </div>
          <div className="trust reveal reveal-up in-view" style={{ transitionDelay: '240ms' }}>
            <span><Radar size={14} /> Live Rust+ sync</span>
            <span><Wifi size={14} /> Instant alerts</span>
            <span><ShieldCheck size={14} /> Per-member device control</span>
            <span><Cpu size={14} /> No game files touched</span>
          </div>
          <Reveal variant="scale" delay={120} className="hero-app">
            <AppWindow />
          </Reveal>
        </div>
      </header>

      <section className="section" id="features">
        <div className="container">
          <Reveal className="section-head">
            <span className="hud-label hud-label--accent">// Capabilities</span>
            <h2 className="section-title">Everything you need to dominate</h2>
            <p className="section-sub">One app for map awareness, base automation and team coordination.</p>
          </Reveal>
          <div className="grid">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} variant="up" delay={(i % 3) * 90}>
                <div className="feature-card bracketed">
                  <div className="feature-ico"><Icon /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="templates">
        <div className="container">
          <Reveal className="section-head">
            <span className="hud-label hud-label--accent">// Straight from the app</span>
            <h2 className="section-title">Built like a command center</h2>
            <p className="section-sub">Real Raidar surfaces — notifications, team tracking and raid math, all in one tactical HUD.</p>
          </Reveal>
          <Reveal variant="up">
            <AppTemplates />
          </Reveal>
        </div>
      </section>

      <section className="section" id="how">
        <div className="container">
          <Reveal className="section-head">
            <span className="hud-label hud-label--accent">// Deployment</span>
            <h2 className="section-title">Up and running in minutes</h2>
            <p className="section-sub">Three steps from download to total map awareness.</p>
          </Reveal>
          <div className="steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} variant="up" delay={i * 110}>
                <div className="step bracketed">
                  <div className="step-n">{s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  {i < STEPS.length - 1 && <ChevronRight className="step-line" size={20} />}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="pricing">
        <div className="container">
          <Reveal className="section-head">
            <span className="hud-label hud-label--accent">// Pricing</span>
            <h2 className="section-title">Plans for every squad</h2>
            <p className="section-sub">Start free, upgrade when your clan grows. Cancel anytime.</p>
          </Reveal>
          <div className="pricing-grid">
            {plans.map((p, i) => (
              <Reveal key={p.name} variant="up" delay={i * 90}>
                <div className={`price-card ${p.popular ? 'popular' : ''}`}>
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal variant="scale">
            <div className="cta-band bracketed">
              <h2>Get Raidar</h2>
              <p>Free to start, built for Rust. Download the desktop app and link your server today.</p>
              <div className="hero-cta">
                <Link className="btn btn-lg" to="/register"><Download size={17} /> Create your account</Link>
                <Link className="btn btn-ghost btn-lg" to="/docs#discord-bot">Set up the Discord bot</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
