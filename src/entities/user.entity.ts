import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { QuizSubmit } from './quizSubmit.entity';
import { LectureTimeRecord } from './lectureTimeRecord.entity';
import { Enrollment } from './enrollment.entity';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column()
  birthDate: Date;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 200, nullable: true })
  @Exclude()
  password: string;

  @Column({ length: 20, nullable: true })
  phoneNumber: string;

  @Column({ length: 50, nullable: true })
  churchName: string;

  @Column({ length: 50, nullable: true })
  departmentName: string;

  @Column({ length: 50, nullable: true })
  position: string;

  @Column({ nullable: true })
  yearsOfService: number;

  @Column({ length: 10, default: 'L0', nullable: true })
  level: string;

  @Column({ length: 50, nullable: true })
  nameBirthId: string;

  @Column({ nullable: true })
  @Exclude()
  refreshToken?: string;

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

  @BeforeInsert()
  // @BeforeUpdate()
  async hashPassword(): Promise<void> {
    const salt = await bcrypt.genSalt();
    if (!/^\$2[abxy]?\$\d+\$/.test(this.password)) {
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setNameBirthId() {
    const birthDate = new Date(this.birthDate);
    const month = birthDate.getMonth() + 1; // JS에서 월은 0부터 시작하므로 1을 더해줍니다.
    const day = birthDate.getDate();
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    this.nameBirthId = `${this.name}${formattedMonth}${formattedDay}`;
  }

  async checkPassword(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this.password);
  }
}
