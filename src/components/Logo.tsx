/** The Raidar radar-scope mark — identical to the desktop app's titlebar icon. */
export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.55" />
      <path d="M12 12 L11.2 2.85 A9.2 9.2 0 0 1 19.05 6.05 Z" fill="currentColor" fillOpacity="0.22" />
      <line x1="12" y1="12" x2="19.05" y2="6.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16.3" cy="7.0" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
