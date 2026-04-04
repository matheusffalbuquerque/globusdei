import { Injectable, Logger } from '@nestjs/common';

/**
 * Service handling all integrations with the Stripe Payment Gateway.
 * Currently explicitly MOCKED per architectural phased execution plan Phase 3 rules.
 * This class serves to define the interface that the eventual real Stripe SDK will use.
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  /**
   * Mocks the generation of a payment intent to process a donation or resource allocation.
   * @param amount The financial amount in cents.
   * @param currency The fiat currency ticker, defaulting to BRL.
   * @returns A promise resolving to an object containing a mocked client secret.
   */
  async createPaymentIntent(amount: number, currency = 'BRL'): Promise<{ clientSecret: string }> {
    this.logger.log(`[MOCK] Creating PaymentIntent for ${amount} ${currency}`);
    
    // Simulate network delay and processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      clientSecret: `mock_pi_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
    };
  }

  /**
   * Mocks the registration of an investment (donation) inside the simulated Stripe vault.
   * Represents the actual charging component once a method is attached to an intent.
   * @param token The frontend generated card token or payment method id.
   * @returns A promise determining definitive transaction success.
   */
  async chargeInvestment(token: string): Promise<boolean> {
    this.logger.log(`[MOCK] Charging investment via secure token: ${token}`);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 300));

    return true;
  }
}
