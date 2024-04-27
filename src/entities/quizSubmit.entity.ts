import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { User } from './user.entity';

@Entity()
export class QuizSubmit {
  @PrimaryGeneratedColumn()
  id: number; // Composite primary key 대신 단일 ID 사용

  @Column()
  userId: number;

  @Column({ comment: '객관식 답안 제출' })
  multipleAnswer: number;

  @Column('text', { nullable: true })
  submittedAnswer: string;

  @Column('text', { nullable: true })
  feedbackComment: string;

  @Column({
    default: false,
    comment: '(주관식의 경우) 0: 미채점 / 1: 정답 / 2: 오답',
  })
  status: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => Quiz, (quiz) => quiz.quizSubmits)
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @ManyToOne(() => User, (user) => user.quizSubmits)
  @JoinColumn({ name: 'userId' })
  user: User;
}
