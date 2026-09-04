import { useEffect, useRef, useState, type ReactNode } from 'react';

type Variant = 'up' | 'rise' | 'left' | 'right' | 'scale' | 'fade' | 'tilt' | 'blur' | 'clip';

interface RevealProps {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
}

/**
 * Reveals children with a smooth animation the first time they scroll into view.
 * Respects prefers-reduced-motion.
 *
 * The reveal state is FAIL-SAFE: `.reveal` starts at `opacity: 0`, so anything
 * that stops the observer from firing leaves the content permanently invisible
 * and unclickable. That is exactly what happened to the hero product showcase —
 * a tall element combined with `threshold: 0.12` and a negative `rootMargin`
 * meant the intersection ratio never reached the threshold, so the whole
 * showcase sat at zero opacity while still passing hit-tests.
 *
 * Three guards now prevent that class of failure:
 *   1. `threshold: 0` — fire as soon as ANY part intersects, which a tall
 *      element can always satisfy.
 *   2. No negative bottom `rootMargin`, which shrank the root box and made
 *      large elements harder to trigger rather than easier.
 *   3. A timeout backstop that reveals unconditionally, so a missing or
 *      misbehaving IntersectionObserver can never hide content for good.
 */
export default function Reveal({ children, variant = 'up', delay = 0, className = '', as = 'div' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      setShown(true);
      return;
    }

    // Already on screen at mount (above-the-fold hero): reveal immediately
    // rather than waiting for a scroll event that may never come.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setShown(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        }
      },
      { threshold: 0, rootMargin: '0px 0px 10% 0px' },
    );
    obs.observe(el);

    // Backstop: never leave content invisible because of a missed callback.
    const failSafe = window.setTimeout(() => setShown(true), 1500);

    return () => {
      obs.disconnect();
      window.clearTimeout(failSafe);
    };
  }, []);

  const Tag = as as 'div';
  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${variant} ${shown ? 'in-view' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
