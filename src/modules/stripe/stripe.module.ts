import { forwardRef, Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeProvider } from 'src/config/stripe.config';
import { StripeController } from './stripe.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [forwardRef(() => PaymentsModule)],
  providers: [StripeService, StripeProvider],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
