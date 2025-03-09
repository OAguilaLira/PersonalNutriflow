import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  constructor(@Inject('STRIPE_API_KEY') private readonly stripe: Stripe) {}

  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({ email, name });
      return customer;
    } catch (error) {
      throw error;
    }
  }

  async createCheckoutSession(stripeCustomerId: string) {
    try {
      return await this.stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: 'price_1R0FMiIg2NkZCdBLlvt0Xu9y', quantity: 1 }],
        success_url: 'http://localhost:3001/payments/success/checkout/session',
        cancel_url: 'https://tu-sitio.com/cancel',
        expires_at: 1800,
      });
    } catch (error) {
      console.log('Failed to create subscription', error.stack);
      throw error;
    }
  }
}
