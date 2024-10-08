import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { Course } from './course.entity';

@Entity()
export class Category {
  // @PrimaryGeneratedColumn()
  // categoryId: number;

  @PrimaryColumn({ length: 50 })
  name: string;

  @Column({ type: 'int' })
  order: number;

  @OneToMany(() => Course, (course) => course.category)
  courses: Course[];
}
