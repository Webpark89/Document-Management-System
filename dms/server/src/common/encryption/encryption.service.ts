import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;
  private readonly legacyKey = crypto
    .createHash('sha256')
    .update('default_secret_key_32bytes_len!!')
    .digest();
  constructor(config: ConfigService) {
    const configured = config.get<string>('ENCRYPTION_KEY');
    if (configured) {
      this.key = crypto.createHash('sha256').update(configured).digest();
      return;
    }
    const server = fs.existsSync(path.join(process.cwd(), 'server/src'))
      ? path.join(process.cwd(), 'server')
      : process.cwd();
    const directory = path.join(server, '.local');
    fs.mkdirSync(directory, { recursive: true });
    const keyPath = path.join(directory, 'signature.key');
    try {
      fs.writeFileSync(keyPath, crypto.randomBytes(32), {
        flag: 'wx',
        mode: 0o600,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    this.key = fs.readFileSync(keyPath);
    if (this.key.length !== 32)
      throw new Error('Invalid local signature encryption key');
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12),
      cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    return `v2:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(payload: string): string {
    const modern = payload.startsWith('v2:');
    const parts = (modern ? payload.slice(3) : payload).split(':');
    if (parts.length !== 3) throw new Error('Invalid signature ciphertext');
    const decode = (key: Buffer) => {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(parts[0], 'hex'),
      );
      decipher.setAuthTag(Buffer.from(parts[1], 'hex'));
      return Buffer.concat([
        decipher.update(Buffer.from(parts[2], 'hex')),
        decipher.final(),
      ]).toString('utf8');
    };
    try {
      return decode(this.key);
    } catch (error) {
      if (modern) throw error;
      return decode(this.legacyKey);
    }
  }
}
