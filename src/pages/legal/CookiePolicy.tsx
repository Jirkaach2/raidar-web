import LegalLayout from './LegalLayout';

export default function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy" updated="June 21, 2026" active="/cookies">
      <p>
        This Cookie Policy explains how Raidar uses cookies and similar technologies on our website and app. We
        keep tracking to a minimum — the storage we use is mostly there to keep you signed in.
      </p>

      <h2>1. What cookies are</h2>
      <p>
        Cookies are small text files stored on your device. Similar technologies include local storage and session
        storage used by your browser. They let a site remember your actions and preferences over time.
      </p>

      <h2>2. How we use them</h2>
      <ul>
        <li><strong>Essential.</strong> Authentication and session cookies keep you logged in and protect against cross-site request forgery. The Service cannot function without these.</li>
        <li><strong>Preferences.</strong> Local storage remembers settings such as your selected view or dismissed notices.</li>
        <li><strong>Security.</strong> Tokens that help us detect abuse and keep your account safe.</li>
      </ul>

      <h2>3. What we don’t do</h2>
      <p>
        We do not use advertising cookies, and we do not sell data to advertisers. We avoid third-party tracking
        beyond what is required to operate authentication and payments.
      </p>

      <h2>4. Third-party cookies</h2>
      <p>
        Some providers we rely on may set their own cookies when you use their features — for example our
        authentication provider (Appwrite) and payment processor (Stripe) during checkout. These are governed by
        their respective policies.
      </p>

      <h2>5. Managing cookies</h2>
      <p>
        You can clear or block cookies in your browser settings. Note that blocking essential cookies will prevent
        you from signing in or using core parts of the Service.
      </p>

      <h2>6. Changes</h2>
      <p>We may update this policy over time. Material changes will be announced in-app or by email.</p>

      <h2>7. Contact</h2>
      <p>Questions about cookies? Email <a href="mailto:info@raidar.tech">info@raidar.tech</a>.</p>
    </LegalLayout>
  );
}
