import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Map, Siren, ToggleRight, Bot, Bomb, Radar, ShieldCheck,
  Check, ChevronRight, Download, Wifi, Cpu, Zap, BookOpen, Activity,
  Megaphone,
} from 'lucide-react';
import { databases, DB_ID, PLANS_COLLECTION_ID, Query, isConfigured, type Plan, type Announcement } from '../lib/appwrite';
import { latestPublished } from '../lib/announcements';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';
import ProductShowcase from '../components/ProductShowcase';
import Partners from '../components/Partners';
import { DOWNLOAD_URL } from '../lib/download';


const FEATURES = [
  { Icon: Map, title: 'Live Tactical Map', desc: 'Real-time team, monuments, caves, the travelling vendor and every world event — projected on in-game grids with click-through detail panels.' },
  { Icon: Siren, title: 'Base Alarms', desc: 'Smart Alarm triggers hit your overlay and Discord the instant your base is touched. Never sleep through a raid again.' },
  { Icon: Zap, title: 'Switch Automation', desc: 'Program Smart Switches to react to nightfall, low upkeep, world events or raid alarms — turn on, off, toggle or pulse, with optional conditions.' },
  { Icon: ToggleRight, title: 'Device Control', desc: 'Toggle switches, watch alarms and read TC upkeep + storage from the app or Discord — even across multiple servers at once.' },
  { Icon: Bot, title: 'Discord Bot', desc: 'Link your server in seconds — status, team, events and alerts routed into dedicated channels with rich embeds and one-tap buttons.' },
  { Icon: Bomb, title: 'Raid Planning', desc: 'Raid cost calculator, profit scanner, loadout lab, recycler and price intel — know the cost of every door and the value behind it.' },
];

/** What the product is built on. Concrete stack, no marketing adjectives. */
const STACK = [
  { k: 'Client', v: 'Tauri v2 · Rust · React 19' },
  { k: 'Backend', v: 'Appwrite · WebSockets' },
  { k: 'Integrations', v: 'Rust+ API · Discord · FCM' },
  { k: 'Platform', v: 'Windows, signed installer' },
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
  const { user } = useAuth();
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [latest, setLatest] = useState<Announcement | null>(null);

  useEffect(() => {
    latestPublished().then(setLatest).catch(() => setLatest(null));
  }, []);

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
            <span className="hud-label hud-label--accent">Raidar · Tactical Gaming Intelligence</span>
          </div>
          <h1 className="reveal reveal-up in-view">
            Real-time intelligence<br />for <span>survival games</span>
          </h1>
          <p className="lead reveal reveal-up in-view" style={{ transitionDelay: '70ms' }}>
            Raidar is a desktop intelligence client and cloud telemetry platform for competitive
            multiplayer survival games. It turns the Rust+ companion API into a live tactical map,
            programmable base automation, market intel and raid planning — mirrored into Discord
            for your whole squad.
          </p>
          <div className="hero-cta reveal reveal-up in-view" style={{ transitionDelay: '140ms' }}>
            {user
              ? <a className="btn btn-lg" href={DOWNLOAD_URL} target="_blank" rel="noreferrer"><Download size={17} /> Download Raidar</a>
              : <Link className="btn btn-lg" to="/register"><Download size={17} /> Start free</Link>}
            <Link className="btn btn-ghost btn-lg" to="/docs">Read the docs <ChevronRight size={16} /></Link>
          </div>
          <div className="trust reveal reveal-up in-view" style={{ transitionDelay: '210ms' }}>
            <span><Radar size={14} /> Live Rust+ sync</span>
            <span><Wifi size={14} /> Instant alerts</span>
            <span><ShieldCheck size={14} /> No game files touched</span>
            <span><Cpu size={14} /> Signed Windows build</span>
          </div>

          <Reveal variant="rise" delay={120} className="hero-app">
            <ProductShowcase />
          </Reveal>
        </div>
      </header>

      <Partners />

      {/* ── What it is: scope, stated plainly ───────────────── */}
      <section className="section" id="product">
        <div className="container">
          <div className="scope">
            <Reveal className="scope-copy">
              <span className="hud-label hud-label--accent">// The product</span>
              <h2 className="section-title">One client, four surfaces</h2>
              <p className="section-sub">
                Raidar ships as a signed Windows desktop client, a web portal for accounts and
                billing, a Discord bot for team-wide alerting, and a background notification
                daemon for push. All four talk to the same cloud backend.
              </p>
              <ul className="scope-list">
                <li><Check /> Desktop client — Tauri v2 shell over a Rust core, React 19 UI</li>
                <li><Check /> Web portal — accounts, plans, server allowance, admin</li>
                <li><Check /> Discord bot — per-feature channels, embeds, one-tap controls</li>
                <li><Check /> Push daemon — mobile and Discord raid alerts</li>
              </ul>
              <div className="scope-actions">
                <Link className="btn btn-ghost btn-sm" to="/docs"><BookOpen size={14} /> Documentation</Link>
                <Link className="btn btn-ghost btn-sm" to="/changelog"><Activity size={14} /> Changelog</Link>
                <Link className="btn btn-ghost btn-sm" to="/security"><ShieldCheck size={14} /> Security</Link>
              </div>
            </Reveal>
            <Reveal variant="rise" delay={100} className="scope-stack">
              <div className="stack-card bracketed">
                <span className="hud-label">// Stack</span>
                <dl className="stack-list">
                  {STACK.map((s) => (
                    <div className="stack-row" key={s.k}>
                      <dt>{s.k}</dt>
                      <dd className="mono">{s.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="features">
        <div className="container">
          <Reveal className="section-head">
            <span className="hud-label hud-label--accent">// Capabilities</span>
            <h2 className="section-title">Everything you need to dominate</h2>
            <p className="section-sub">One app for map awareness, base automation and team coordination.</p>
          </Reveal>
          <div className="grid">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} variant="rise" delay={(i % 3) * 80}>
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

      <section className="section" id="how">
        <div className="container">
          <Reveal className="section-head">
            <span className="hud-label hud-label--accent">// Deployment</span>
            <h2 className="section-title">Up and running in minutes</h2>
            <p className="section-sub">Three steps from download to total map awareness.</p>
          </Reveal>
          <div className="steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} variant="rise" delay={i * 100}>
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
              <Reveal key={p.name} variant="rise" delay={i * 80}>
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
                  <Link className={`btn ${p.popular ? '' : 'btn-ghost'}`} to={user ? '/dashboard' : '/register'} style={{ width: '100%' }}>
                    {user ? 'Manage plan' : p.price === 0 ? 'Get started' : `Choose ${p.name}`}
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
                {user
                  ? <a className="btn btn-lg" href={DOWNLOAD_URL} target="_blank" rel="noreferrer"><Download size={17} /> Download Raidar</a>
                  : <Link className="btn btn-lg" to="/register"><Download size={17} /> Create your account</Link>}
                <Link className="btn btn-ghost btn-lg" to="/docs#discord-bot">Set up the Discord bot</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {latest && (
        <section className="section section-alt" id="latest">
          <div className="container">
            <Reveal className="section-head">
              <span className="hud-label hud-label--accent">// Latest from Raidar</span>
              <h2 className="section-title">{latest.type === 'blog' ? 'From the blog' : 'Latest announcement'}</h2>
            </Reveal>
            <Reveal variant="rise">
              <Link to={`/blog/${latest.slug}`} className="latest-card bracketed">
                {latest.coverImage && <div className="latest-cover"><img src={latest.coverImage} alt="" loading="lazy" decoding="async" /></div>}
                <div className="latest-body">
                  <div className="blog-card-meta">
                    <span className="blog-tag"><Megaphone size={12} /> {latest.type === 'blog' ? 'Blog' : 'Announcement'}</span>
                    <span className="blog-date mono">{new Date(latest.$createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3>{latest.title}</h3>
                  {latest.excerpt && <p className="muted">{latest.excerpt}</p>}
                  <span className="blog-readmore">Read more →</span>
                </div>
              </Link>
              <div style={{ textAlign: 'center', marginTop: 22 }}>
                <Link className="btn btn-ghost btn-sm" to="/blog">View all posts</Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
