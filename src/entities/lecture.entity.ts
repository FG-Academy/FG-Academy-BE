import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { Quiz } from './quiz.entity';
import { LectureTimeRecord } from './lectureTimeRecord.entity';
import { Exclude } from 'class-transformer';

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

  @Exclude()
  @Column({ length: 20, default: 'active' })
  status: string;

  @Exclude()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Exclude()
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => Course, (course) => course.lectures)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @OneToMany(() => Quiz, (quiz) => quiz.lecture)
  quizzes: Quiz[];

  @OneToMany(
    () => LectureTimeRecord,
    (lectureTimeRecord) => lectureTimeRecord.lecture,
  )
  lectureTimeRecords: LectureTimeRecord[];
}
