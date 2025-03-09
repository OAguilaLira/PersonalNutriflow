import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import Stripe from 'stripe';
import { StripeService } from '../stripe/stripe.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { PaymentRepository } from './payment.repository';
import { time } from 'console';
import { Subscription } from 'rxjs';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly userService: UsersService,
    private readonly paymentRepository: PaymentRepository,
  ) {}
  async createCheckoutSession(userId: string) {
    const user: User = await this.userService.findById(userId);
    let stripeCustomerId: string = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer: Stripe.Customer =
        await this.stripeService.createCustomer(user.email, user.name);
      stripeCustomerId = stripeCustomer.id;
    }
    return this.stripeService.createCheckoutSession(stripeCustomerId);
  }

  async registerPayment(paymentData: Stripe.Subscription) {
    const exists = await this.paymentRepository.findOneByStripeId(
      paymentData.id,
    );
    console.log(paymentData);
    console.log('####');
    console.log(paymentData.customer);
    if (!exists) {
      console.log(paymentData);
      // const user: User = await this.userService.findByStripeId(paymentData.customer)
      // await this.subscriptionRepo.save({
      //   stripeSubscriptionId: subscription.id,
      //   status: subscription.status,
      //   user: await this.getUserFromCustomerId(subscription.customer),
      //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      // });

      // Enviar email de bienvenida
      // this.emailService.sendSubscriptionConfirmation(
      //   subscription.customer.toString(),
      // );
    }
  }
}
