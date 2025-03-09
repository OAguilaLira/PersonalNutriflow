import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import Stripe from 'stripe';
import { StripeService } from '../stripe/stripe.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { PaymentRepository } from './payment.repository';
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
    const activeSuscription: Payment =
      await this.paymentRepository.findActiveByUser(userId);
    if (activeSuscription) {
      new BadRequestException(
        `El usuario ${userId} ya tiene una suscripción activa`,
      );
    }
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
    const checkoutSession =
      await this.stripeService.createCheckoutSession(stripeCustomerId);
    return {
      message: '\"Checkout Session\" creada exitosamente',
      url: checkoutSession.url,
    };
  }

  async cancelSubscriptionNow(userId: string) {
    const activeSuscription: Payment =
      await this.paymentRepository.findActiveByUser(userId);
    if (!activeSuscription) {
      throw new BadRequestException(
        `El usuario ${userId} no tiene una suscripción activa`,
      );
    }
    await this.stripeService.cancelSubscriptionNow(
      activeSuscription.stripeSubscriptionId,
    );

    return {
      message: `Se canceló exitosamente la suscripción del usuario ${userId}`,
    };
  }

  async getAllPaymentsByUser(userId: string, limit: number, page: number) {
    const allPayments = await this.paymentRepository.finAllByUser(
      userId,
      limit,
      page,
    );
    return {
      message: `Registros de pagos considerando estar en la página ${page} con ${limit} registros por cada página`,
      data: {
        result: allPayments.results,
        total: allPayments.total,
        page,
        limit,
        totalPages: Math.ceil(allPayments.total / limit),
      },
    };
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
        isActive: true,
        stripeSubscriptionId: paymentData.id,
        user,
        currentPeriodStart: new Date(paymentData.current_period_start * 1000),
        currentPeriodEnd: new Date(paymentData.current_period_end * 1000),
      };
      await this.paymentRepository.create(createPaymentData);
      await this.userService.updateSubscriptionType(user.id);
    } else if (payment) {
      const newStatus: boolean = paymentData.status !== 'active' ? false : true;
      await this.paymentRepository.update(payment.id, { isActive: newStatus });
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
    if (!paymentData.id) return;
    const payment: Payment = await this.paymentRepository.findOneByStripeId(
      paymentData.id,
    );
    if (!payment) return;
    await this.paymentRepository.update(payment.id, {
      isActive: false,
      canceled_at: new Date(),
    });
    const consumerId: string = paymentData.customer.toString();
    const user: User = await this.userService.findByStripeId(consumerId);
    await this.userService.downgradeSubscriptionType(user.id);
  }

  async handleSubscriptionInvoicePaid(invoiceObject: Stripe.Invoice) {
    if (invoiceObject.subscription) {
      const subscriptionId: string = invoiceObject.subscription.toString();
      const subscriptionData =
        this.stripeService.getSuscriptionData(subscriptionId);
    }
  }
}
