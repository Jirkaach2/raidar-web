import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Map, Siren, ToggleRight, Bot, Bomb, Radar, ShieldCheck,
  Check, ChevronRight, Download, Cpu, Zap, BookOpen, Activity,
  Megaphone, Monitor, Globe, MessageSquare, BellRing, ArrowRight,
} from 'lucide-react';
import { databases, DB_ID, PLANS_COLLECTION_ID, Query, isConfigured, type Plan, type Announcement } from '../lib/appwrite';
import { latestPublished } from '../lib/announcements';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';
import ProductShowcase from '../components/ProductShowcase';
import Partners from '../components/Partners';
import { DOWNLOAD_URL } from '../lib/download';


const FEATURES = [
  { Icon: Map, title: 'Live tactical map', desc: 'Real-time team, monuments, caves, the travelling vendor and every world event — projected on in-game grids with click-through detail panels.' },
  { Icon: Siren, title: 'Base alarms', desc: 'Smart Alarm triggers hit your overlay and Discord the instant your base is touched. Never sleep through a raid again.' },
  { Icon: Zap, title: 'Switch automation', desc: 'Program Smart Switches to react to nightfall, low upkeep, world events or raid alarms — on, off, toggle or pulse, with optional conditions.' },
  { Icon: ToggleRight, title: 'Device control', desc: 'Toggle switches, watch alarms and read TC upkeep plus storage from the app or Discord — even across several servers at once.' },
  { Icon: Bot, title: 'Discord bot', desc: 'Link your server in seconds. Status, team, events and alerts route into dedicated channels with rich embeds and one-tap buttons.' },
  { Icon: Bomb, title: 'Raid planning', desc: 'Raid cost calculator, profit scanner, loadout lab, recycler and price intel — know the cost of every door and the value behind it.' },
];

/** Honest, checkable facts. No invented user counts or uptime figures. */
const PROOF = [
  { k: 'Official Rust+ API', v: 'No game files touched, no injection, no memory reads' },
  { k: 'Code-signed build', v: 'Windows installer with a published SHA-256' },
  { k: 'Four surfaces', v: 'Desktop client, web portal, Discord bot, push daemon' },
  { k: 'Free tier, no card', v: 'Scout plan runs indefinitely on one server' },
];

/** The four surfaces, each with what it is actually for. */
const SURFACES = [
  { Icon: Monitor, name: 'Desktop client', stack: 'Tauri v2 · Rust core · React 19', desc: 'The map, calculators and device panels. Signed Windows build.' },
  { Icon: Globe, name: 'Web portal', stack: 'Appwrite · Stripe', desc: 'Accounts, plans, server allowance and admin — this site.' },
  { Icon: MessageSquare, name: 'Discord bot', stack: 'Per-feature channels', desc: 'Team-wide alerting with embeds and one-tap controls.' },
  { Icon: BellRing, name: 'Push daemon', stack: 'FCM · WebSockets', desc: 'Background raid alerts to mobile and Discord while the app is closed.' },
];

const STEPS = [
  { n: '01', title: 'Download Raidar', desc: 'Grab the signed Windows app and pair it with your Rust+ account — no Steam login juggling.' },
  { n: '02', title: 'Link your Discord', desc: 'Run /link in your server, paste the code into the app, and Raidar builds your channels automatically.' },
  { n: '03', title: 'Dominate the wipe', desc: 'Watch the map, automate your base, and get raid alerts in real time — on desktop and in Discord.' },
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
      {/* ── Hero ──────────────────────────────────────────────
          Copy row on top, product underneath at the FULL container width.

          The previous split put the screenshot in a ~800px right-hand column,
          which downscaled a 1456px capture by 45% and turned the client's own
          11px UI labels into noise — on a page whose entire claim is that the
          UI is real. Stacking gives the capture 1240px, near its native size,
          and the copy row still avoids the centred-funnel shape by keeping the
          headline left and pairing it with the assurance list on the right. */}
      <header className="hero hero--stack">
        <div className="container">
          <div className="hero-top">
            <div className="hero-copy">
              <Link className="hero-pill" to="/changelog">
                <span className="hero-pill-dot" aria-hidden />
                <span className="mono">v1.1.0 shipped</span>
                <ArrowRight size={13} aria-hidden />
              </Link>
              {/* The whole second clause is one nowrap unit. Left to wrap, 390px
                  broke it after "command" and orphaned "center"; wrapping only
                  the accent phrase instead stranded "as a" on a runt line. */}
              <h1 className="reveal reveal-up in-view">
                Your Rust server,<br />
                <span className="nowrap">as a <span>command center</span></span>
              </h1>
              <p className="lead reveal reveal-up in-view" style={{ transitionDelay: '70ms' }}>
                Raidar turns the official Rust+ API into a live tactical map, programmable base
                automation and raid intel — on your desktop and mirrored into your squad's Discord.
              </p>
              <div className="hero-cta reveal reveal-up in-view" style={{ transitionDelay: '140ms' }}>
                {user
                  ? <a className="btn btn-lg" href={DOWNLOAD_URL} target="_blank" rel="noreferrer"><Download size={17} /> Download for Windows</a>
                  : <Link className="btn btn-lg" to="/register"><Download size={17} /> Get Raidar free</Link>}
                <Link className="btn btn-ghost btn-lg" to="/docs">Read the docs <ChevronRight size={16} /></Link>
              </div>
            </div>

            {/* These answer the actual objection for this category — is it a
                cheat, will I get banned, is the binary safe — so they sit level
                with the headline rather than below the fold in tracked caps. */}
            <div className="hero-assure-card reveal reveal-up in-view" style={{ transitionDelay: '210ms' }}>
              <span className="hud-label">// Before you ask</span>
              <ul className="hero-assure">
                <li><ShieldCheck size={16} /> No game files touched — official Rust+ API only</li>
                <li><Cpu size={16} /> Code-signed Windows build, hash published</li>
                <li><Radar size={16} /> Free tier, no card, one server forever</li>
                <li><Activity size={16} /> Live service status, published incidents</li>
              </ul>
              <div className="hero-assure-links">
                <Link to="/security">Security model <ChevronRight size={13} /></Link>
                <Link to="/status">Service status <ChevronRight size={13} /></Link>
              </div>
            </div>
          </div>

          <Reveal variant="rise" delay={120} className="hero-visual">
            <ProductShowcase />
          </Reveal>
        </div>
      </header>

      {/* ── Proof strip: four facts a sceptical reader can verify ── */}
      <section className="proofbar" aria-label="What Raidar is">
        <div className="container proofbar-grid">
          {PROOF.map((p) => (
            <div className="proof" key={p.k}>
              <span className="proof-k">{p.k}</span>
              <span className="proof-v">{p.v}</span>
            </div>
          ))}
        </div>
      </section>

      <Partners />

      {/* ── The four surfaces ───────────────────────────────── */}
      <section className="section" id="product">
        <div className="container">
          <Reveal className="section-head section-head--left">
            <span className="hud-label hud-label--accent">// The product</span>
            <h2 className="section-title">One client, four surfaces</h2>
            <p className="section-sub">
              Raidar ships as a signed Windows desktop client, a web portal for accounts and
              billing, a Discord bot for team-wide alerting, and a background daemon for push.
              All four talk to the same cloud backend.
            </p>
          </Reveal>
          <div className="surfaces">
            {SURFACES.map((s, i) => (
              <Reveal key={s.name} variant="rise" delay={(i % 4) * 70}>
                <div className="surface-card">
                  <div className="surface-ico"><s.Icon size={19} /></div>
                  <h3>{s.name}</h3>
                  <p>{s.desc}</p>
                  <span className="surface-stack mono">{s.stack}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="scope-actions">
            <Link className="btn btn-ghost btn-sm" to="/docs"><BookOpen size={14} /> Documentation</Link>
            <Link className="btn btn-ghost btn-sm" to="/changelog"><Activity size={14} /> Changelog</Link>
            <Link className="btn btn-ghost btn-sm" to="/security"><ShieldCheck size={14} /> Security</Link>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="features">
        <div className="container">
          <Reveal className="section-head section-head--left">
            <span className="hud-label hud-label--accent">// Capabilities</span>
            <h2 className="section-title">Everything you need to dominate</h2>
            <p className="section-sub">One app for map awareness, base automation and team coordination.</p>
          </Reveal>
          <div className="grid">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} variant="rise" delay={(i % 3) * 80}>
                <div className="feature-card">
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
          <Reveal className="section-head section-head--left">
            <span className="hud-label hud-label--accent">// Deployment</span>
            <h2 className="section-title">Up and running in minutes</h2>
            <p className="section-sub">Three steps from download to total map awareness.</p>
          </Reveal>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} variant="rise" delay={i * 100}>
                <li className="step">
                  <span className="step-n mono">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </li>
              </Reveal>
            ))}
          </ol>
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
            <div className="cta-band">
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
              <Link to={`/blog/${latest.slug}`} className="latest-card">
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
