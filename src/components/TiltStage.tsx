import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Wraps the hero app window in a 3D stage that:
 *  • eases from a tilted, lifted pose to flat as it scrolls into view (parallax)
 *  • responds subtly to the cursor for a living, interactive feel
 * Falls back to a static frame when reduced motion is requested.
 */
export default function TiltStage({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = wrap.current;
    const el = inner.current;
    if (!w || !el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let mx = 0, my = 0;     // cursor offset (−1..1)
    let scroll = 0;         // scroll-derived tilt (1 → 0 as it centers)
    let raf = 0;

    const apply = () => {
      const rotX = scroll * 8 + my * -2;
      const rotY = mx * 3;
      const lift = scroll * 40;
      el.style.transform = `perspective(1600px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(${lift.toFixed(1)}px)`;
      raf = 0;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };

    const onScroll = () => {
      const r = w.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 1 when the element top is at the bottom of the viewport, 0 once centered.
      const p = Math.min(1, Math.max(0, (r.top - vh * 0.2) / (vh * 0.8)));
      scroll = p;
      schedule();
    };
    const onMove = (e: MouseEvent) => {
      const r = w.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      schedule();
    };
    const onLeave = () => { mx = 0; my = 0; schedule(); };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    w.addEventListener('mousemove', onMove);
    w.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('scroll', onScroll);
      w.removeEventListener('mousemove', onMove);
      w.removeEventListener('mouseleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="tilt-stage" ref={wrap}>
      <div className="tilt-inner" ref={inner}>{children}</div>
    </div>
  );
}
