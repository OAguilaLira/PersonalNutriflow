import {
  Controller,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';
import { PaymentsService } from '../payments/payments.service';
import { StripeWebhookGuard } from './guards/stripe.guard';

@Controller('stripe')
export class StripeController {
  constructor(
    // private readonly stripeService: StripeService,
    private readonly paymentService: PaymentsService,
  ) {}

  @UseGuards(StripeWebhookGuard)
  @Post('webhook')
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    const event = req['stripeEvent'] as Stripe.Event;

    switch (event.type) {
      case 'customer.subscription.created': {
        this.paymentService.registerPayment(event.data.object);
        break;
      }
    }

    console.log(`Evento del tipo ${event.type}, no manejado`);

    return { received: true };
  }
}
