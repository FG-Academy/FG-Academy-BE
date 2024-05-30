import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { User } from './user.entity';

@Entity()
export class Answer {
  @PrimaryGeneratedColumn()
  answerId: number;

  @Column('text')
  content: string;

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => Question, (question) => question.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @ManyToOne(() => User, (user) => user.questions)
  @JoinColumn({ name: 'userId' }) // Linking User entity
  user: User;
}
