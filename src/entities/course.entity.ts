import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Lecture } from './lecture.entity';
import { Announcement } from './announcement.entity';
import { Enrollment } from './enrollment.entity';
import { Category } from './category.entity';

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  courseId: number;

  @Column({ comment: '썸네일 이미지 경로', length: 255, nullable: true })
  thumbnailImagePath: string;

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

  @OneToMany(() => Lecture, (lecture) => lecture.course, {
    cascade: true,
  })
  lectures: Lecture[];

  @OneToMany(() => Announcement, (announcement) => announcement.course, {
    cascade: true,
  })
  announcements: Announcement[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course, {
    cascade: true,
  })
  enrollments: Enrollment[];

  @ManyToOne(() => Category, (category) => category.courses, {
    nullable: true,
  })
  category: Category;
}
