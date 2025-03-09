import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { User } from 'src/modules/users/entities/user.entity';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  stripeSubscriptionId: string;

  @IsBoolean()
  status: boolean;

  @Type(() => User)
  user: User;
}
