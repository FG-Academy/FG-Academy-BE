import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Lecture } from './lecture.entity';
import { QuizSubmit } from './quizSubmit.entity';
import { QuizAnswer } from './quizAnswer.entity';

@Entity()
export class Quiz {
  @PrimaryGeneratedColumn()
  quizId: number;

  @Column({ length: 20 })
  quizType: string;

  @Column()
  quizIndex: number;

  @Column('text')
  question: string;

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

  @ManyToOne(() => Lecture, (lecture) => lecture.quizzes)
  @JoinColumn({ name: 'lectureId' })
  lecture: Lecture;

  @OneToMany(() => QuizSubmit, (quizSubmit) => quizSubmit.quiz)
  quizSubmits: QuizSubmit[];

  @OneToMany(() => QuizAnswer, (quizAnswer) => quizAnswer.quiz)
  quizAnswers: QuizAnswer[];
}
