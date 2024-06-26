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

  @Column({ comment: '항목 번호' })
  itemIndex: number;

  @Column({ comment: '퀴즈id' })
  quizId: number;

  @Column({ length: 200, comment: '퀴즈 문항 내용' })
  item: string;

  @Column({ comment: '해당 문항이 정답인지에 대한 여부' })
  isAnswer: boolean;

  @Column({ length: 10, nullable: true, default: 'active' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => Quiz, (quiz) => quiz.quizAnswers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;
}
