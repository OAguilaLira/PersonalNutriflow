import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  stripeSubscriptionId: string;

  @Column({ type: 'boolean' })
  status: boolean;

  @Column({ type: 'date', nullable: true })
  canceled_at: Date;

  @ManyToOne(() => User, (user) => user.payments, { onDelete: 'CASCADE' })
  user: User;
}
