import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { Lecture } from './lecture.entity';
import { User } from './user.entity';

@Entity()
@Index('IDX_lecture_time_record_updated_at', ['updatedAt'])
export class LectureTimeRecord {
  // @PrimaryGeneratedColumn()
  // id: number; // 복합 키 대신 단일 ID 사용

  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  lectureId: number;

  @Column({ default: 0 })
  playTime: number;

  @Column({ default: false })
  status: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => Lecture, (lecture) => lecture.lectureTimeRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lectureId' })
  lecture: Lecture;

  @ManyToOne(() => User, (user) => user.lectureTimeRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
