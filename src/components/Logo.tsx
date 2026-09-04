/**
 * The Raidar mark — four targeting brackets around a centred contact.
 *
 * Design history worth keeping, so nobody re-adds what was removed:
 *  • A radar sweep line was tried and cut. It was the thinnest element carrying
 *    the most meaning, so it died first — invisible by 40px — and an outward
 *    diagonal breaking the frame read as the "open in new window" affordance.
 *  • An off-centre blip was tried and cut. Sitting near the top-right bracket,
 *    it was the first thing to fuse at 16px, and it left the knockout (dark-on-
 *    orange) build with no clearance.
 *
 * Centring the contact fixes all three at once: equal clearance on all four
 * sides at every size, an unambiguous reticle/acquisition read rather than a
 * crop tool, and enough negative space for the knockout tiles.
 *
 * Two optical variants, since one vector cannot serve 128px and 16px:
 *  • `full` (>=32px): 2.5px arms, generous legs.
 *  • `micro` (<32px): 1.5px arms pixel-snapped to integers, legs shortened so
 *    the corners stay countable instead of closing into a ring.
 *
 * Hierarchy is opacity-driven: the frame sits back at 0.6, the contact is the
 * only element at full strength.
 */

interface LogoProps {
  size?: number;
  /** Force a variant instead of deriving it from `size`. */
  variant?: 'full' | 'micro';
}

export default function Logo({ size = 26, variant }: LogoProps) {
  const v = variant ?? (size < 32 ? 'micro' : 'full');

  if (v === 'micro') {
    return (
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
        focusable="false"
        shapeRendering="crispEdges"
      >
        {/* 2px arms on integer boundaries. 1px arms drop to half-opacity greys
            at fractional DPR (1.25x / 1.5x); short legs keep the four corners
            countable instead of closing into a ring. */}
        <path
          d="M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="butt"
          opacity="0.72"
        />
        <circle cx="8" cy="8" r="2.4" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        opacity="0.6"
      >
        <path d="M3.5 10.5v-7h7" />
        <path d="M21.5 3.5h7v7" />
        <path d="M28.5 21.5v7h-7" />
        <path d="M10.5 28.5h-7v-7" />
      </g>
      <circle cx="16" cy="16" r="5" fill="currentColor" />
    </svg>
  );
}
