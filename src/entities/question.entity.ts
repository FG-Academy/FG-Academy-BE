import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Answer } from './answer.entity';
import { User } from './user.entity';

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  questionId: number;

  @Column({ length: 100 })
  title: string;

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

  @OneToMany(() => Answer, (answer) => answer.question, {
    cascade: true,
  })
  answers: Answer[];

  @ManyToOne(() => User, (user) => user.questions)
  @JoinColumn({ name: 'userId' }) // Linking User entity
  user: User;
}
