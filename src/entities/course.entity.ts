import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Lecture } from './lecture.entity';
import { Announcement } from './announcement.entity';
import { Enrollment } from './enrollment.entity';

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  courseId: number;

  @Column({ length: 100 })
  title: string;

  @Column({ length: 20 })
  level: string;

  @Column('text')
  description: string;

  @Column('text')
  curriculum: string;

  @Column()
  openDate: Date;

  @Column()
  finishDate: Date;

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

  @OneToMany(() => Lecture, (lecture) => lecture.course)
  lectures: Lecture[];

  @OneToMany(() => Announcement, (announcement) => announcement.course)
  announcements: Announcement[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];
}
