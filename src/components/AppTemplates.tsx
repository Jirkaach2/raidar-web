import {
  Search, ShoppingCart, Bomb, Crown, ToggleRight, Moon, Siren, Power, ChevronRight,
} from 'lucide-react';

/** rusthelp CDN icon by item shortname — the same source the desktop app uses. */
function icon(shortname: string): string {
  return `https://cdn.rusthelp.com/images/256/${shortname.replace(/[._]/g, '-')}.webp`;
}
function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.visibility = 'hidden';
}

const CHIPS = ['WOOD', 'STONE', 'METAL', 'SULFUR', 'SCRAP', 'RIFLE'];

/** Recreations of real Raidar app surfaces, used in the marketing showcase. */
export default function AppTemplates() {
  return (
    <div className="tpl-grid">
      {/* ── Market / shop search ── */}
      <div className="tpl">
        <div className="tpl-cap">Tool · Market search</div>
        <div className="tpl-tabs">
          <span className="tpl-tab active">MARKET SEARCH</span>
          <span className="tpl-tab">BEST SHOPS</span>
        </div>
        <div className="tpl-search"><Search size={13} /> Search items to buy…</div>
        <div className="tpl-chips">
          {CHIPS.map((c) => <span key={c}>{c}</span>)}
        </div>
        <div className="tpl-shopcat"><span className="tpl-shop-grid">T16</span> <span className="tpl-shop-dist"><ShoppingCart size={10} /> 3.1km · NPC Shop</span></div>
        <div className="tpl-order">
          <span className="tpl-order-item"><b>5×</b> <img src={icon('rifle.ak')} onError={hideOnError} alt="" /> Assault Rifle</span>
          <span className="tpl-order-cost">240 <img src={icon('scrap')} onError={hideOnError} alt="" /></span>
        </div>
        <div className="tpl-order">
          <span className="tpl-order-item"><b>2×</b> <img src={icon('explosive.timed')} onError={hideOnError} alt="" /> C4</span>
          <span className="tpl-order-cost">500 <img src={icon('scrap')} onError={hideOnError} alt="" /></span>
        </div>
        <div className="tpl-order">
          <span className="tpl-order-item"><b>100×</b> <img src={icon('metal.refined')} onError={hideOnError} alt="" /> HQM</span>
          <span className="tpl-order-cost">75 <img src={icon('scrap')} onError={hideOnError} alt="" /></span>
        </div>
      </div>

      {/* ── Raid cost ── */}
      <div className="tpl">
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
        <div className="tpl-bars">
          <div className="tpl-bar"><span style={{ width: '100%' }} /></div>
          <div className="tpl-bar"><span style={{ width: '64%' }} /></div>
          <div className="tpl-bar"><span style={{ width: '38%' }} /></div>
        </div>
        <div className="tpl-raid-foot"><Crown size={11} /> Best value mix · saves 320 sulfur</div>
      </div>

      {/* ── Devices + automation ── */}
      <div className="tpl">
        <div className="tpl-cap">Panel · Smart devices</div>
        <div className="tpl-dev-h"><ToggleRight size={14} /> SMART DEVICES</div>
        <div className="tpl-dev"><span>Base Lights</span><span className="tpl-toggle on">ON</span></div>
        <div className="tpl-dev"><span>Turret Power</span><span className="tpl-toggle on">ON</span></div>
        <div className="tpl-dev tc">
          <div className="tpl-dev-top"><span>Tool Cupboard</span><span className="tpl-upkeep">2d 4h left</span></div>
          <div className="tpl-dev-bar"><span style={{ width: '72%' }} /></div>
          <small>TC STORAGE · 22/30 SLOTS</small>
        </div>
        <div className="tpl-auto">
          <span className="tpl-auto-ic"><Moon size={11} /></span>
          <div><b>Base Lights</b><small>nightfall <ChevronRight size={8} /> ON</small></div>
          <span className="tpl-auto-on"><Power size={10} /></span>
        </div>
        <div className="tpl-auto">
          <span className="tpl-auto-ic"><Siren size={11} /></span>
          <div><b>Raid Siren</b><small>alarm <ChevronRight size={8} /> pulse 30s</small></div>
          <span className="tpl-auto-on"><Power size={10} /></span>
        </div>
      </div>
    </div>
  );
}
