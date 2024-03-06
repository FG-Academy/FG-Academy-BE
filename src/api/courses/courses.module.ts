import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { NestjsFormDataModule, FileSystemStoredFile } from 'nestjs-form-data';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course]),
    NestjsFormDataModule.config({ storage: FileSystemStoredFile }),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
