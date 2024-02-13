import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';

@Entity()
export class QuizAnswer {
  @PrimaryGeneratedColumn()
  id: number; // 복합 키 대신 단일 ID 사용

  @Column()
  itemIndex: number;

  @Column({ length: 20 })
  item: string;

  @Column()
  isAnswer: boolean;

  @Column({ length: 10, nullable: true })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => Quiz, (quiz) => quiz.quizAnswers)
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;
}
