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
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { Payment } from './entities/payment.entity';

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
      const updatedUser: User = await this.userService.addStripeId(
        stripeCustomerId,
        user.id,
      );
    }
    return this.stripeService.createCheckoutSession(stripeCustomerId);
  }

  async registerPayment(paymentData: Stripe.Subscription) {
    const payment: Payment | null =
      await this.paymentRepository.findOneByStripeId(paymentData.id);
    if (!payment && paymentData.status === 'active') {
      const stripeCustomerId: string =
        typeof paymentData.customer === 'string'
          ? paymentData.customer
          : paymentData.customer.id;
      const user: User =
        await this.userService.findByStripeId(stripeCustomerId);
      const createPaymentData: CreatePaymentDto = {
        status: true,
        stripeSubscriptionId: paymentData.id,
        user,
      };
      await this.paymentRepository.create(createPaymentData);
      await this.userService.updateSubscriptionType(user.id);
    } else if (payment) {
      const newStatus: boolean = paymentData.status !== 'active' ? false : true;
      await this.paymentRepository.update(payment.id, { status: newStatus });
      if (!newStatus) {
        const stripeCustomerId: string =
          typeof paymentData.customer === 'string'
            ? paymentData.customer
            : paymentData.customer.id;
        const user: User =
          await this.userService.findByStripeId(stripeCustomerId);
        this.userService.downgradeSubscriptionType(user.id);
      }
    }
  }

  async subscriptiondowngrade(paymentData: Stripe.Subscription) {
    const payment: Payment = await this.paymentRepository.findOneByStripeId(
      paymentData.id,
    );
    await this.paymentRepository.update(payment.id, {
      status: false,
      canceled_at: new Date(),
    });
    const consumerId: string = paymentData.customer.toString();
    const user: User = await this.userService.findByStripeId(consumerId);
    await this.userService.downgradeSubscriptionType(user.id);
  }

  async cancelSubscriptionNow(userId: string) {
    const activeSuscription: Payment =
      await this.paymentRepository.findActiveByUser(userId);
    await this.stripeService.cancelSubscriptionNow(
      activeSuscription.stripeSubscriptionId,
    );
  }
}
