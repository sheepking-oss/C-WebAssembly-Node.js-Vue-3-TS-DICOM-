import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;

export interface EncryptedData {
  encrypted: Buffer;
  iv: Buffer;
  authTag: Buffer;
  salt: Buffer;
}

export class EncryptionService {
  private static getKeyFromPassword(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }

  static encrypt(data: Buffer, keyOrPassword: string | Buffer): EncryptedData {
    try {
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);
      
      let key: Buffer;
      if (typeof keyOrPassword === 'string') {
        key = this.getKeyFromPassword(keyOrPassword, salt);
      } else {
        key = keyOrPassword;
      }

      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final()
      ]);

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv,
        authTag,
        salt
      };
    } catch (error) {
      console.error('加密错误:', error);
      throw new AppError('数据加密失败', 500, 'ENCRYPTION_ERROR');
    }
  }

  static decrypt(
    encryptedData: EncryptedData,
    keyOrPassword: string | Buffer
  ): Buffer {
    try {
      let key: Buffer;
      if (typeof keyOrPassword === 'string') {
        key = this.getKeyFromPassword(keyOrPassword, encryptedData.salt);
      } else {
        key = keyOrPassword;
      }

      const decipher = crypto.createDecipheriv(
        ENCRYPTION_ALGORITHM,
        key,
        encryptedData.iv
      );

      decipher.setAuthTag(encryptedData.authTag);

      const decrypted = Buffer.concat([
        decipher.update(encryptedData.encrypted),
        decipher.final()
      ]);

      return decrypted;
    } catch (error) {
      console.error('解密错误:', error);
      throw new AppError('数据解密失败', 500, 'DECRYPTION_ERROR');
    }
  }

  static encryptToBuffer(data: Buffer, keyOrPassword: string | Buffer): Buffer {
    const encrypted = this.encrypt(data, keyOrPassword);
    
    return Buffer.concat([
      encrypted.salt,
      encrypted.iv,
      encrypted.authTag,
      encrypted.encrypted
    ]);
  }

  static decryptFromBuffer(
    encryptedBuffer: Buffer,
    keyOrPassword: string | Buffer
  ): Buffer {
    const salt = encryptedBuffer.slice(0, SALT_LENGTH);
    const iv = encryptedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = encryptedBuffer.slice(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    );
    const encrypted = encryptedBuffer.slice(
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    );

    return this.decrypt(
      {
        encrypted,
        iv,
        authTag,
        salt
      },
      keyOrPassword
    );
  }

  static generateHash(data: string | Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }

  static generateRandomKey(): Buffer {
    return crypto.randomBytes(32);
  }
}
