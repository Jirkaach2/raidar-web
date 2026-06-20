import LegalLayout from './LegalLayout';

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund Policy" updated="June 21, 2026" active="/refunds">
      <p>
        We want you to be happy with Raidar. This Refund Policy explains when and how you can get a refund for a
        paid subscription.
      </p>

      <h2>1. Free plan first</h2>
      <p>
        Raidar offers a free plan so you can try the core experience before paying. We encourage you to use it to
        confirm the Service fits your needs before upgrading.
      </p>

      <h2>2. 14-day money-back guarantee</h2>
      <p>
        If you are not satisfied with a paid plan, you may request a full refund within <strong>14 days</strong> of
        your first payment for that plan. This applies to your initial purchase of a given plan, not to subsequent
        renewals.
      </p>

      <h2>3. Renewals</h2>
      <p>
        Subscriptions renew automatically. Renewal charges are generally non-refundable, but you can cancel at any
        time from your dashboard to stop future renewals — your plan stays active until the end of the period you
        already paid for. If a renewal charged unexpectedly within the last 48 hours, contact us and we will review
        it in good faith.
      </p>

      <h2>4. How to request a refund</h2>
      <p>
        Email <a href="mailto:support@raidar.tech">support@raidar.tech</a> from the address on your account with your
        order details. Approved refunds are issued to your original payment method via Stripe and typically appear
        within 5–10 business days, depending on your bank.
      </p>

      <h2>5. Exceptions</h2>
      <ul>
        <li>Refunds may be declined where we detect abuse, fraud, or violations of our <a href="/terms">Terms of Service</a>.</li>
        <li>Partial periods already used may be deducted where required.</li>
        <li>Chargebacks filed without contacting us first may result in account suspension.</li>
      </ul>

      <h2>6. Statutory rights</h2>
      <p>
        Nothing in this policy limits any non-waivable refund or cancellation rights you have under the consumer
        laws of your country.
      </p>

      <h2>7. Contact</h2>
      <p>Need help? Email <a href="mailto:support@raidar.tech">support@raidar.tech</a>.</p>
    </LegalLayout>
  );
}
