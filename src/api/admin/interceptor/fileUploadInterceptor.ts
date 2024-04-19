import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  UnsupportedMediaTypeException,
  PayloadTooLargeException,
  CallHandler,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import multer from 'multer';
import { FileFilterCallback, diskStorage } from 'multer';
import { Observable } from 'rxjs';
import { v4 } from 'uuid';

// import { MAX_IMAGE_SIZE } from '../../common/constant';

const MAX_IMAGE_SIZE = 1024 * 1024 * 40;

@Injectable()
export class FileUploadInterceptor implements NestInterceptor<void, void> {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<void>> {
    const ctx: HttpArgumentsHost = context.switchToHttp();
    const req = ctx.getRequest<Request & { filepath?: string }>();

    const multerOptions: multer.Options = {
      fileFilter: (_req, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (!file.mimetype.match(/image\/(gif|jpeg|png)/)) {
          cb(
            new UnsupportedMediaTypeException(
              'gif, jpeg, png 형식의 파일만 업로드 가능합니다.',
            ),
          );
        }
        cb(null, true);
      },
      storage: diskStorage({
        destination: 'public/asset',
        filename: (_req, file, cb) => {
          const uuid = v4().substring(0, 6);
          // const myId = req.headers['x-my-id'];
          const extArray = file.mimetype.split('/');
          const filename = `profile-${uuid}.${extArray[extArray.length - 1]}`;
          req.filepath = `/asset/${filename}`; // 파일 경로를 요청 객체에 추가
          cb(null, filename);
        },
      }),
      limits: { fileSize: MAX_IMAGE_SIZE },
    };

    await new Promise<void>((resolve, reject) =>
      multer(multerOptions).single('thumbnailImage')(
        ctx.getRequest(),
        ctx.getResponse(),
        (error) => {
          error
            ? reject(
                error.code === 'LIMIT_FILE_SIZE'
                  ? new PayloadTooLargeException(
                      '이미지 파일은 4MB 이하로 업로드 가능합니다.',
                    )
                  : error,
              )
            : resolve();
        },
      ),
    );
    return next.handle();
  }
}
