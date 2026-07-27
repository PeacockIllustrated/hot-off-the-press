import "server-only";

/**
 * The single swap point for taking real money.
 *
 * Phase 1 of the brief calls for Stripe. Until keys exist, the mock provider
 * runs the identical code path — order created, tickets allocated, spins
 * granted — so nothing downstream has to change when Stripe is wired in.
 *
 * To go live: implement StripeProvider.charge() as a Checkout Session, move
 * ticket allocation behind the `checkout.session.completed` webhook, and set
 * PAYMENT_PROVIDER=stripe.
 */
export type PaymentRequest = {
  profileId: string;
  drawId: string;
  quantity: number;
  amountPence: number;
  description: string;
};

export type PaymentResult = {
  ref: string;
  provider: string;
  live: boolean;
};

export interface PaymentProvider {
  readonly name: string;
  readonly live: boolean;
  charge(req: PaymentRequest): Promise<PaymentResult>;
}

class MockProvider implements PaymentProvider {
  readonly name = "mock";
  readonly live = false;

  async charge(req: PaymentRequest): Promise<PaymentResult> {
    if (!Number.isInteger(req.amountPence) || req.amountPence <= 0) {
      throw new Error("Amount must be a positive whole number of pence.");
    }
    const ref = `mock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    return { ref, provider: this.name, live: false };
  }
}

class StripeProvider implements PaymentProvider {
  readonly name = "stripe";
  readonly live = true;

  async charge(): Promise<PaymentResult> {
    throw new Error(
      "Stripe is selected but not implemented yet. Set PAYMENT_PROVIDER=mock, " +
        "or implement StripeProvider.charge() and move allocation to the webhook.",
    );
  }
}

export function paymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "stripe"
    ? new StripeProvider()
    : new MockProvider();
}
