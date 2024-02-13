import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Course } from './course.entity';
import { User } from './user.entity';

@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number; // 복합 키 대신 단일 ID 사용

  @Column()
  userId: number;

  @Column()
  courseId: number;

  @Column()
  completedNumber: number;

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

  @ManyToOne(() => Course, (course) => course.enrollments)
  course: Course;

  @ManyToOne(() => User, (user) => user.enrollments)
  user: User;
}
