import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Animation variant. */
  variant?: 'up' | 'left' | 'right' | 'scale' | 'fade';
  /** Stagger delay in ms. */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
}

/**
 * Reveals its children with a smooth animation the first time they scroll into
 * view (IntersectionObserver). Respects prefers-reduced-motion.
 */
export default function Reveal({ children, variant = 'up', delay = 0, className = '', as = 'div' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
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
