import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { S3Service } from 'src/common/s3/s3.service';
import { GeneratePresignedUrlDto } from './dto/generate-presigned-url.dto';
import { Roles } from '../users/decorators/role.decorator';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('presigned-url')
  @Roles('admin', 'manager', 'tutor')
  @ApiOperation({ summary: 'S3 업로드용 pre-signed URL 생성' })
  async generatePresignedUrl(@Body() dto: GeneratePresignedUrlDto) {
    return this.s3Service.generatePresignedUrl(dto.contentType);
  }
}
