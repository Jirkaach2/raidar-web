/**
 * Partner / program strip.
 *
 * ElevenLabs Grants terms require recipients to display the "ElevenLabs
 * Grants" logo on their website, so this component is also a compliance
 * obligation, not only marketing. Both wordmarks are self-hosted white-fill
 * SVGs pulled from the vendors' own asset URLs.
 */

interface Partner {
  slug: string;
  name: string;
  /** What the relationship actually is — kept factual, no embellishment. */
  role: string;
  href: string;
  /** Rendered width in px; each wordmark has a different natural aspect. */
  width: number;
}

const PARTNERS: Partner[] = [
  {
    slug: 'elevenlabs',
    name: 'ElevenLabs',
    role: 'Grants Program',
    href: 'https://elevenlabs.io/startup-grants',
    width: 132,
  },
  {
    slug: 'braintrust',
    name: 'Braintrust',
    role: 'AI Evaluation',
    href: 'https://www.braintrust.dev',
    width: 122,
  },
];

export default function Partners() {
  return (
    <section className="partners" aria-labelledby="partners-heading">
      <div className="container">
        <p className="partners-eyebrow" id="partners-heading">
          Backed by ElevenLabs Grants · Built with Braintrust
        </p>
        <ul className="partners-row">
          {PARTNERS.map((p) => (
            <li key={p.slug} className="partner">
              <a
                className="partner-link"
                href={p.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${p.name} — ${p.role}`}
              >
                <img
                  className="partner-mark"
                  src={`/partners/${p.slug}.svg`}
                  alt={p.name}
                  width={p.width}
                  height={24}
                  loading="lazy"
                  decoding="async"
                />
                <span className="partner-role">{p.role}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
