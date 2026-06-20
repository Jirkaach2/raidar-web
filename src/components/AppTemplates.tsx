import { Store, ShieldHalf, Bomb, Crown } from 'lucide-react';

/** rusthelp CDN icon by item shortname — the same source the desktop app uses. */
function icon(shortname: string): string {
  return `https://cdn.rusthelp.com/images/256/${shortname.replace(/[._]/g, '-')}.webp`;
}
function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.visibility = 'hidden';
}

/** Recreations of real Raidar app surfaces, used in the marketing showcase. */
export default function AppTemplates() {
  return (
    <div className="tpl-grid">
      {/* New-shops notification toast */}
      <div className="tpl tpl-toast">
        <div className="tpl-cap">Notification · Discord + Overlay</div>
        <div className="tpl-toast-h"><Store size={14} /> NEW SHOPS OPENED</div>
        <div className="tpl-shop">
          <span className="tpl-shop-name">Bandit Surplus</span>
          <span className="tpl-shop-grid">G14</span>
        </div>
        <div className="tpl-order">
          <span className="tpl-order-item"><img src={icon('rifle.ak')} onError={hideOnError} alt="" /> <b>×1</b> Assault Rifle</span>
          <span className="tpl-order-cost"><img src={icon('scrap')} onError={hideOnError} alt="" /> 240</span>
        </div>
        <div className="tpl-order">
          <span className="tpl-order-item"><img src={icon('explosive.timed')} onError={hideOnError} alt="" /> <b>×2</b> C4</span>
          <span className="tpl-order-cost"><img src={icon('scrap')} onError={hideOnError} alt="" /> 500</span>
        </div>
        <div className="tpl-order">
          <span className="tpl-order-item"><img src={icon('metal.refined')} onError={hideOnError} alt="" /> <b>×100</b> HQM</span>
          <span className="tpl-order-cost"><img src={icon('scrap')} onError={hideOnError} alt="" /> 75</span>
        </div>
      </div>

      {/* Team status */}
      <div className="tpl tpl-team">
        <div className="tpl-cap">Live · Team tracker</div>
        <div className="tpl-team-h"><ShieldHalf size={14} /> TEAM · 2/3 ONLINE</div>
        <ul>
          <li><span className="tpl-st on" /> <b>Viktor</b> <span className="tpl-crown"><Crown size={11} /></span> <span className="tpl-grid">F12</span></li>
          <li><span className="tpl-st on" /> <b>Dima</b> <span className="tpl-grid">F12</span></li>
          <li><span className="tpl-st dead" /> <b>Yuri</b> <span className="tpl-tag dead">DEAD</span> <span className="tpl-grid">H9</span></li>
        </ul>
        <div className="tpl-chat">[Discord] viktor: pushing launch, regroup F12</div>
      </div>

      {/* Raid cost */}
      <div className="tpl tpl-raid">
        <div className="tpl-cap">Tool · Raid cost calculator</div>
        <div className="tpl-raid-h">
          <span><Bomb size={14} /> SHEET METAL DOOR</span>
          <span className="tpl-wb">WB2</span>
        </div>
        <div className="tpl-raid-cost">
          <img src={icon('sulfur')} onError={hideOnError} alt="" />
          <span className="tpl-raid-val">1,400</span>
          <span className="tpl-raid-unit">sulfur total</span>
        </div>
        <div className="tpl-raid-parts">
          <span className="tpl-chip"><img src={icon('explosive.satchel')} onError={hideOnError} alt="" /> <b>4×</b> Satchel</span>
          <span className="tpl-chip"><img src={icon('explosive.timed')} onError={hideOnError} alt="" /> <b>1×</b> C4</span>
        </div>
        <div className="tpl-raid-foot"><Crown size={11} /> Best value mix · saves 320 sulfur</div>
      </div>
    </div>
  );
}
