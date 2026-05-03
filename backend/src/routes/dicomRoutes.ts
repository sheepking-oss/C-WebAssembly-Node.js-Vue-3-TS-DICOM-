import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '../services/s3Service';
import { EncryptionService } from '../services/encryptionService';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { PassThrough } from 'stream';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

interface UploadDicomRequest extends Request {
  file: Express.Multer.File;
}

router.get(
  '/list',
  authenticate,
  authorize('doctor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = await S3Service.listFiles('dicom/');
      
      res.json({
        success: true,
        data: files.map((file) => ({
          id: file.key,
          name: file.key.split('/').pop() || file.key,
          size: file.size,
          lastModified: file.lastModified,
          contentType: file.contentType
        }))
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:key/info',
  authenticate,
  authorize('doctor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const fileInfo = await S3Service.getFileInfo(decodeURIComponent(key));

      res.json({
        success: true,
        data: {
          id: fileInfo.key,
          name: fileInfo.key.split('/').pop() || fileInfo.key,
          size: fileInfo.size,
          lastModified: fileInfo.lastModified,
          contentType: fileInfo.contentType
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:key/stream',
  authenticate,
  authorize('doctor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const decodedKey = decodeURIComponent(key);

      const fileInfo = await S3Service.getFileInfo(decodedKey);
      const s3Stream = await S3Service.getFileStream(decodedKey);

      res.setHeader('Content-Type', fileInfo.contentType);
      res.setHeader('Content-Length', fileInfo.size);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${fileInfo.key.split('/').pop()}"`
      );

      if (process.env.ENCRYPTION_KEY) {
        const passThrough = new PassThrough();
        const encryptedChunks: Buffer[] = [];

        s3Stream.on('data', (chunk: Buffer) => {
          encryptedChunks.push(chunk);
        });

        s3Stream.on('end', async () => {
          try {
            const encryptedBuffer = Buffer.concat(encryptedChunks);
            const decryptedBuffer = EncryptionService.decryptFromBuffer(
              encryptedBuffer,
              process.env.ENCRYPTION_KEY as string
            );

            res.end(decryptedBuffer);
          } catch (error) {
            next(error);
          }
        });

        s3Stream.on('error', (error) => {
          next(error);
        });
      } else {
        s3Stream.pipe(res);
      }
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/upload',
  authenticate,
  authorize('doctor', 'admin'),
  upload.single('file'),
  async (req: UploadDicomRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('请选择要上传的文件', 400, 'NO_FILE');
      }

      const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
      const isValidFormat = ['dcm', 'dicom', ''].includes(fileExtension || '');

      if (!isValidFormat) {
        throw new AppError('不支持的文件格式，请上传 DICOM 文件', 400, 'INVALID_FORMAT');
      }

      const fileId = uuidv4();
      const key = `dicom/${fileId}.dcm`;

      let fileContent: Buffer;
      if (process.env.ENCRYPTION_KEY) {
        fileContent = EncryptionService.encryptToBuffer(
          req.file.buffer,
          process.env.ENCRYPTION_KEY
        );
      } else {
        fileContent = req.file.buffer;
      }

      const result = await S3Service.uploadFile(
        key,
        fileContent,
        'application/dicom'
      );

      res.status(201).json({
        success: true,
        data: {
          id: key,
          name: req.file.originalname,
          size: req.file.size,
          key: result.Key,
          location: result.Location,
          encrypted: !!process.env.ENCRYPTION_KEY
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:key',
  authenticate,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      await S3Service.deleteFile(decodeURIComponent(key));

      res.json({
        success: true,
        message: '文件已成功删除'
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:key/presigned-url',
  authenticate,
  authorize('doctor', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const decodedKey = decodeURIComponent(key);
      const expiresIn = req.query.expiresIn ? parseInt(req.query.expiresIn as string) : 3600;

      const presignedUrl = S3Service.generatePresignedUrl(decodedKey, expiresIn);

      res.json({
        success: true,
        data: {
          url: presignedUrl,
          expiresIn
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
