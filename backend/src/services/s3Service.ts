import AWS from 'aws-sdk';
import { Readable } from 'stream';
import { AppError } from '../middleware/errorHandler';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME as string;

export interface S3FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  contentType: string;
}

export class S3Service {
  static async uploadFile(
    key: string,
    fileContent: Buffer | string,
    contentType: string = 'application/dicom'
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        ServerSideEncryption: 'AES256'
      };

      return await s3.upload(params).promise();
    } catch (error) {
      console.error('S3 上传错误:', error);
      throw new AppError('文件上传失败', 500, 'UPLOAD_ERROR');
    }
  }

  static async getFileStream(key: string): Promise<Readable> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      return s3.getObject(params).createReadStream();
    } catch (error) {
      console.error('S3 获取文件流错误:', error);
      throw new AppError('文件获取失败', 500, 'FETCH_ERROR');
    }
  }

  static async getFile(key: string): Promise<Buffer> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      const response = await s3.getObject(params).promise();
      return response.Body as Buffer;
    } catch (error) {
      console.error('S3 获取文件错误:', error);
      throw new AppError('文件获取失败', 500, 'FETCH_ERROR');
    }
  }

  static async getFileInfo(key: string): Promise<S3FileInfo> {
    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      const response = await s3.headObject(params).promise();

      return {
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType || 'application/dicom'
      };
    } catch (error) {
      console.error('S3 获取文件信息错误:', error);
      throw new AppError('文件信息获取失败', 500, 'INFO_ERROR');
    }
  }

  static async listFiles(prefix?: string): Promise<S3FileInfo[]> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: BUCKET_NAME,
        ...(prefix && { Prefix: prefix })
      };

      const response = await s3.listObjectsV2(params).promise();

      return (response.Contents || []).map((obj) => ({
        key: obj.Key as string,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        contentType: 'application/dicom'
      }));
    } catch (error) {
      console.error('S3 列出文件错误:', error);
      throw new AppError('文件列表获取失败', 500, 'LIST_ERROR');
    }
  }

  static async deleteFile(key: string): Promise<void> {
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      await s3.deleteObject(params).promise();
    } catch (error) {
      console.error('S3 删除文件错误:', error);
      throw new AppError('文件删除失败', 500, 'DELETE_ERROR');
    }
  }

  static generatePresignedUrl(key: string, expiresIn: number = 3600): string {
    const params: AWS.S3.GetSignedUrlRequest = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };

    return s3.getSignedUrl('getObject', params);
  }
}
