import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';

@Entity()
export class Announcement {
  @PrimaryGeneratedColumn()
  announcementId: number;

  @Column({ length: 100 })
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  courseId: number;

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

  @ManyToOne(() => Course, (course) => course.announcements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: Course;
}
