import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Lecture } from './lecture.entity';
import { User } from './user.entity';

@Entity()
export class LectureTimeRecord {
  @PrimaryGeneratedColumn()
  id: number; // 복합 키 대신 단일 ID 사용

  @Column()
  lectureId: number;

  @Column()
  userId: number;

  @Column()
  playTime: number;

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

  @ManyToOne(() => Lecture, (lecture) => lecture.lectureTimeRecords)
  lecture: Lecture;

  @ManyToOne(() => User, (user) => user.lectureTimeRecords)
  user: User;
}
