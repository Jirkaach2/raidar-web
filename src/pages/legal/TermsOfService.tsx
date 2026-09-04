import LegalLayout from './LegalLayout';

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" updated="June 21, 2026" active="/terms">
      <p>
        These Terms of Service (“Terms”) govern your access to and use of Raidar (the “Service”). By creating an
        account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        Raidar is a tactical companion for the game Rust that connects to Facepunch’s Rust+ companion API to
        provide live maps, smart-device control, team tools, and Discord integrations. Raidar is an independent
        product and is not affiliated with, endorsed by, or sponsored by Facepunch Studios.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate information and keep your credentials secure.</li>
        <li>You are responsible for all activity that occurs under your account.</li>
        <li>You must be old enough to form a binding contract in your jurisdiction.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service to violate any law or the rules of any game server you connect to.</li>
        <li>Reverse engineer, resell, or abuse the Service or its APIs beyond fair use.</li>
        <li>Interfere with the Service’s operation, security, or other users.</li>
        <li>Use the Service to harass, dox, or harm others.</li>
      </ul>

      <h2>4. Subscriptions and billing</h2>
      <p>
        Paid plans are billed in advance on a recurring basis through Stripe until cancelled. Prices and plan
        features may change with notice. You can manage or cancel your subscription at any time from your
        dashboard; cancellation takes effect at the end of the current billing period. Refunds are governed by
        our <a href="/refunds">Refund Policy</a>.
      </p>

      <h2>5. Intellectual property</h2>
      <p>
        The Service, including its software, design, and branding, is owned by Raidar and protected by
        intellectual-property laws. We grant you a limited, non-exclusive, non-transferable license to use the
        Service for its intended purpose. “Rust” and related marks belong to their respective owners.
      </p>

      <h2>6. Disclaimers</h2>
      <p>
        The Service is provided “as is” and “as available” without warranties of any kind. We do not guarantee
        that the Service will be uninterrupted, error-free, or that data from third-party APIs (including Rust+)
        will be accurate or available.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Raidar will not be liable for any indirect, incidental, or
        consequential damages, or for any loss of data, profits, or in-game progress arising from your use of
        the Service. Our total liability is limited to the amount you paid us in the 12 months before the claim.
      </p>

      <h2>8. Termination</h2>
      <p>
        We may suspend or terminate your access if you breach these Terms or use the Service in a way that risks
        harm to us or others. You may stop using the Service and delete your account at any time.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these Terms. We will notify you of material changes in-app or by email. Continued use after
        an update constitutes acceptance.
      </p>

      <h2>10. Contact</h2>
      <p>Questions about these Terms? Email <a href="mailto:info@raidar.tech">info@raidar.tech</a>.</p>
    </LegalLayout>
  );
}
