import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        department: true,
        position: true,
        role: true,
      },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role?.name || 'Employee',
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        full_name: `${user.first_name} ${user.last_name}`,
        role: user.role?.name || 'Employee',
        department: user.department?.name || null,
        email: user.email,
        position: user.position?.name || null,
        signature_image_path: user.signature_image_path || null,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak whether the email exists or not
      return { success: true, message: 'หากอีเมลมีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
      },
    });

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      });

      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      console.log('====================================');
      console.log('PASSWORD RESET LINK:', resetLink);
      console.log('====================================');

      await transporter.sendMail({
        from: `"Document Management System" <${process.env.SMTP_FROM || 'noreply@dms.local'}>`,
        to: user.email,
        subject: 'ตั้งรหัสผ่านใหม่ (Reset Password)',
        html: `<p>คุณได้ทำการขอรีเซ็ตรหัสผ่าน, กรุณาคลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
               <p><a href="${resetLink}">${resetLink}</a></p>
               <p>ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>`,
      });
    } catch (error) {
      console.error('Failed to send reset email:', error);
      // Optional: handle email error gracefully, still return success for security
    }

    return { success: true, message: 'หากอีเมลมีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว' };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token) throw new UnauthorizedException('Token ไม่ถูกต้อง');

    const user = await this.prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token ไม่ถูกต้องหรือหมดอายุแล้ว');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expiry: null,
      },
    });

    return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
  }
}
