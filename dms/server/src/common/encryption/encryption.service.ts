import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const rawKey = this.config.get<string>('ENCRYPTION_KEY') || 'default_secret_key_32bytes_len!!';
    // Ensure key is 32 bytes (256 bits)
    this.key = crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypt plaintext string into iv:authTag:ciphertext (hex)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return '';
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt iv:authTag:ciphertext back to plaintext string
   */
  decrypt(encryptedPayload: string): string {
    if (!encryptedPayload) return '';
    try {
      const parts = encryptedPayload.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }
      const [ivHex, authTagHex, ciphertextHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err: any) {
      this.logger.error(`Decryption failed: ${err.message}`);
      throw new Error('Failed to decrypt data');
    }
  }
}
