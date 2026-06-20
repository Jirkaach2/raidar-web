import { Siren, ToggleRight, Moon, Power, ChevronRight, Ship, Plane } from 'lucide-react';
import Logo from './Logo';

/**
 * A faithful, lightweight recreation of the Raidar desktop app UI — used as the
 * hero centerpiece in place of a static screenshot. Mirrors the app's titlebar,
 * live tactical map, device + automation cards and a raid-alarm toast.
 */
export default function AppWindow() {
  return (
    <div className="aw bracketed">
      {/* Titlebar */}
      <div className="aw-bar">
        <div className="aw-bar-left">
          <span className="aw-bar-logo"><Logo size={15} /></span>
          <span className="aw-bar-title">RAIDAR</span>
          <span className="aw-bar-ver">v1.0.0</span>
        </div>
        <div className="aw-bar-right">
          <span className="aw-conn"><i /> CONNECTED</span>
          <span className="aw-dot" /><span className="aw-dot" /><span className="aw-dot" />
        </div>
      </div>

      <div className="aw-body">
        {/* Live tactical map */}
        <div className="aw-map">
          <div className="aw-grid-labels">
            <span>A7</span><span>B7</span><span>C7</span><span>D7</span>
          </div>
          <div className="aw-sweep" />
          {/* event markers */}
          <figure className="aw-marker" style={{ left: '22%', top: '34%' }}>
            <img src="/images/markers/cargo.png" alt="" />
            <span className="aw-ping" />
          </figure>
          <figure className="aw-marker aw-marker--sm" style={{ left: '64%', top: '24%' }}>
            <img src="/images/markers/patrol_heli_full.png" alt="" />
            <span className="aw-ping aw-ping--danger" />
          </figure>
          {/* team blips */}
          <span className="aw-blip aw-blip--online" style={{ left: '48%', top: '58%' }} data-g="F12" />
          <span className="aw-blip aw-blip--online" style={{ left: '53%', top: '62%' }} />
          <span className="aw-blip aw-blip--dead" style={{ left: '38%', top: '70%' }} />
          {/* HUD readout */}
          <div className="aw-readout">
            <span><b>POP</b> 187 / 200</span>
            <span><b>TIME</b> 19:42</span>
            <span className="aw-readout-ev"><Ship size={11} /> Cargo · D7</span>
            <span className="aw-readout-ev danger"><Plane size={11} /> Heli · inbound</span>
          </div>
        </div>

        {/* Side rail */}
        <div className="aw-side">
          <div className="aw-card">
            <div className="aw-card-h"><ToggleRight size={13} /> SMART SWITCH</div>
            <div className="aw-switch">
              <span>Base Lights</span>
              <span className="aw-toggle on">ON</span>
            </div>
            <div className="aw-switch">
              <span>Turret Power</span>
              <span className="aw-toggle on">ON</span>
            </div>
            <div className="aw-switch">
              <span>Furnace Bank</span>
              <span className="aw-toggle off">OFF</span>
            </div>
          </div>

          <div className="aw-card">
            <div className="aw-card-h"><Power size={13} /> AUTOMATION</div>
            <div className="aw-auto">
              <span className="aw-auto-ic"><Moon size={12} /></span>
              <div>
                <b>Base Lights</b>
                <small>At nightfall <ChevronRight size={9} /> turn ON</small>
              </div>
              <span className="aw-auto-on"><Power size={11} /></span>
            </div>
            <div className="aw-auto">
              <span className="aw-auto-ic"><Siren size={12} /></span>
              <div>
                <b>Raid Siren</b>
                <small>On alarm <ChevronRight size={9} /> pulse 30s</small>
              </div>
              <span className="aw-auto-on"><Power size={11} /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating raid alarm toast */}
      <div className="aw-toast">
        <div className="aw-toast-h"><Siren size={13} /> RAID ALARM</div>
        <p>Smart Alarm <b>“Main Base”</b> triggered — F12</p>
      </div>
    </div>
  );
}
