import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Course } from './course.entity';
import { Quiz } from './quiz.entity';
import { LectureTimeRecord } from './lectureTimeRecord.entity';

@Entity()
export class Lecture {
  @PrimaryGeneratedColumn()
  lectureId: number;

  @Column()
  courseId: number;

  @Column()
  lectureNumber: number;

  @Column({ length: 100 })
  title: string;

  @Column('text')
  videoLink: string;

  @Column('text', { nullable: true })
  attachmentFile: string;

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

  @ManyToOne(() => Course, (course) => course.lectures)
  course: Course;

  @OneToMany(() => Quiz, (quiz) => quiz.lecture)
  quizzes: Quiz[];

  @OneToMany(
    () => LectureTimeRecord,
    (lectureTimeRecord) => lectureTimeRecord.lecture,
  )
  lectureTimeRecords: LectureTimeRecord[];
}
