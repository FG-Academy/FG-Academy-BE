import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly cloudfrontDomain: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_S3_REGION');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    this.cloudfrontDomain = this.configService.get<string>(
      'AWS_CLOUDFRONT_DOMAIN',
    );

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_S3_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async generatePresignedUrl(
    contentType: string,
    folder: string = 'asset',
  ): Promise<PresignedUrlResponse> {
    const extension = contentType.split('/').pop();
    const key = `${folder}/${uuid().substring(0, 8)}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300,
    });

    const fileUrl = this.getFileUrl(key);

    return { uploadUrl, fileUrl, key };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = this.extractKeyFromUrl(fileUrl);
    if (!key) return;

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  getFileUrl(key: string): string {
    if (this.cloudfrontDomain) {
      return `https://${this.cloudfrontDomain}/${key}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch {
      return null;
    }
  }
}
