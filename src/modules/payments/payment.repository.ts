import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment) private PaymentRepository: Repository<Payment>,
  ) {}

  async findOneByStripeId(paymentStripeId: string): Promise<Payment> {
    return this.PaymentRepository.findOne({
      where: { stripeSubscriptionId: paymentStripeId },
    });
  }
}
