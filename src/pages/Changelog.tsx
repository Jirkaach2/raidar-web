import { Sparkles, Wrench, ShieldCheck, Package, Download } from 'lucide-react';
import { RELEASES, TOTAL_BUILDS, type Release } from '../lib/releases';
import { DOWNLOAD_URL } from '../lib/download';



const KIND_META: Record<Release['kind'], { label: string; Icon: typeof Sparkles }> = {
  feature: { label: 'Feature', Icon: Sparkles },
  fix: { label: 'Fix', Icon: Wrench },
  security: { label: 'Security', Icon: ShieldCheck },
  release: { label: 'Release', Icon: Package },
};

export default function Changelog() {
  return (
    <div className="container doc-page">
      <header className="doc-head">
        <span className="hud-label hud-label--accent">// Release history</span>
        <h1>Changelog</h1>
        <p className="lead">
          Every published build of the Raidar desktop client. {TOTAL_BUILDS} releases shipped
          to date; each one ships a code-signed Windows installer whose SHA-256 is published
          on the <a href="/status">status page</a> and submitted to multi-engine malware scanners.
        </p>
        <a className="btn btn-sm" href={DOWNLOAD_URL} target="_blank" rel="noreferrer">
          <Download size={14} /> Latest release
        </a>
      </header>

      <ol className="changelog">
        {RELEASES.map((r) => {
          const { label, Icon } = KIND_META[r.kind];
          return (
            <li className="changelog-entry" key={r.version}>
              <div className="changelog-meta">
                <span className="changelog-version mono">v{r.version}</span>
                <span className={`changelog-kind changelog-kind--${r.kind}`}>
                  <Icon size={11} aria-hidden /> {label}
                </span>
              </div>
              <ul className="changelog-notes">
                {r.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </li>
          );
        })}
      </ol>

      <p className="doc-foot muted">
        Patch releases that only re-signed the installer or bumped the published hash are
        folded into the entries above.
      </p>
    </div>
  );
}
