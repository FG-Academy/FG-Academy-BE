import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Lecture } from 'src/entities/lecture.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Lecture])],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
