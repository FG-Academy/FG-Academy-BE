import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { User } from './user.entity';

@Entity()
@Index('IDX_quiz_submit_user_quiz', ['user', 'quiz'])
@Index('IDX_quiz_submit_quiz', ['quiz'])
export class QuizSubmit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '객관식 답안 제출' })
  multipleAnswer: number;

  @Column({ nullable: true, comment: 'JSON 형식의 객관식 답안' })
  answer: string;

  @Column('text', { nullable: true })
  submittedAnswer: string;

  @Column('text', { nullable: true })
  feedbackComment: string;

  @Column({
    default: 0,
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

  @ManyToOne(() => Quiz, (quiz) => quiz.quizSubmits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.quizSubmits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
