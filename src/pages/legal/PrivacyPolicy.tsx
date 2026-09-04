import LegalLayout from './LegalLayout';

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 21, 2026" active="/privacy">
      <p>
        This Privacy Policy explains how Raidar (“we”, “us”, “our”) collects, uses, and protects your
        information when you use the Raidar desktop application, website, and related services (the “Service”).
        We keep data collection to the minimum needed to run the Service.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account data.</strong> When you register we store your display name, email address, and an authentication identifier. If you sign in with Discord, Google, or Steam, we receive a provider ID and basic profile details (name and avatar).</li>
        <li><strong>Subscription data.</strong> Your current plan, status, and billing references. Card details are handled entirely by our payment processor (Stripe) — we never see or store full card numbers.</li>
        <li><strong>Game connection data.</strong> Server pairing tokens and entity data you connect through Rust+ (Facepunch’s companion API), processed to power live maps, alerts, and tools.</li>
        <li><strong>Technical data.</strong> Basic logs such as IP address, device type, and timestamps, used for security and troubleshooting.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To provide, maintain, and improve the Service.</li>
        <li>To authenticate you and keep your account secure.</li>
        <li>To process subscriptions and send service-related emails (verification, receipts, important notices).</li>
        <li>To detect, prevent, and address abuse, fraud, or technical issues.</li>
      </ul>

      <h2>3. Sharing your information</h2>
      <p>
        We do not sell your personal data. We share data only with processors that make the Service work —
        for example our hosting and authentication provider (Appwrite), our payment processor (Stripe), and
        Facepunch’s Rust+ service when you connect a server. Each processes data on our behalf under their
        own terms.
      </p>

      <h2>4. Data retention</h2>
      <p>
        We retain account and subscription data for as long as your account is active. You can delete your
        account at any time, after which we remove your personal data except where we must retain records to
        comply with legal or accounting obligations.
      </p>

      <h2>5. Your rights</h2>
      <p>
        Depending on your location you may have the right to access, correct, export, or delete your personal
        data, and to object to or restrict certain processing. To exercise these rights, contact us at
        <a href="mailto:info@raidar.tech"> info@raidar.tech</a>.
      </p>

      <h2>6. Security</h2>
      <p>
        We use industry-standard measures including encryption in transit, scoped access keys, and least-privilege
        server functions. No system is perfectly secure, but we work to protect your data and will notify you of
        any breach affecting it as required by law.
      </p>

      <h2>7. Children</h2>
      <p>The Service is not directed at children under 13, and we do not knowingly collect their data.</p>

      <h2>8. Changes</h2>
      <p>
        We may update this policy as the Service evolves. Material changes will be announced in-app or by email.
        Continued use after an update means you accept the revised policy.
      </p>

      <h2>9. Contact</h2>
      <p>Questions? Reach us at <a href="mailto:info@raidar.tech">info@raidar.tech</a>.</p>
    </LegalLayout>
  );
}
