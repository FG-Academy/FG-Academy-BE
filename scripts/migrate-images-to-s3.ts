import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function uploadFileToS3(filePath: string, key: string): Promise<string> {
  const fileContent = fs.readFileSync(filePath);
  const contentType = getContentType(filePath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
    }),
  );

  return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function migrateImages() {
  console.log('Starting image migration to S3...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT courseId, thumbnailImagePath FROM course WHERE thumbnailImagePath IS NOT NULL AND thumbnailImagePath NOT LIKE "https://%"',
    );

    console.log(`Found ${rows.length} images to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      const { courseId, thumbnailImagePath } = row;

      if (!thumbnailImagePath) continue;

      const localPath = path.join(PUBLIC_DIR, thumbnailImagePath);
      const s3Key = thumbnailImagePath.startsWith('/')
        ? thumbnailImagePath.substring(1)
        : thumbnailImagePath;

      try {
        if (!fs.existsSync(localPath)) {
          console.log(`[SKIP] File not found: ${localPath}`);
          continue;
        }

        const s3Url = await uploadFileToS3(localPath, s3Key);

        await connection.execute(
          'UPDATE course SET thumbnailImagePath = ? WHERE courseId = ?',
          [s3Url, courseId],
        );

        console.log(
          `[OK] Course ${courseId}: ${thumbnailImagePath} -> ${s3Url}`,
        );
        successCount++;
      } catch (err) {
        console.error(`[ERROR] Course ${courseId}: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Success: ${successCount}, Errors: ${errorCount}`);
  } finally {
    await connection.end();
  }
}

migrateImages().catch(console.error);
