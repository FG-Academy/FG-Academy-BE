import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { QuizSubmit } from './quizSubmit.entity';
import { LectureTimeRecord } from './lectureTimeRecord.entity';
import { Enrollment } from './enrollment.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column()
  birthDate: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 200 })
  password: string;

  @Column({ length: 20 })
  phoneNumber: string;

  @Column({ length: 50 })
  churchName: string;

  @Column({ length: 50 })
  departmentName: string;

  @Column({ length: 50 })
  position: string;

  @Column()
  yearsOfService: number;

  @Column({ length: 10, nullable: true })
  level: string;

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

  @OneToMany(() => QuizSubmit, (quizSubmit) => quizSubmit.user)
  quizSubmits: QuizSubmit[];

  @OneToMany(
    () => LectureTimeRecord,
    (lectureTimeRecord) => lectureTimeRecord.user,
  )
  lectureTimeRecords: LectureTimeRecord[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.user)
  enrollments: Enrollment[];
}
