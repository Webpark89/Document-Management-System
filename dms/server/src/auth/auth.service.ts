import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { normalizeDashboardPermissions } from '../common/dashboard-permissions';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, ipAddress: string = '127.0.0.1') {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        department: true,
        position: true,
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || !user.is_active || user.is_deleted || !user.role?.is_active) {
      throw new UnauthorizedException('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    }

    const payload = {
      sub: user.id,
      credential_version: crypto
        .createHash('sha256')
        .update(user.password_hash)
        .digest('hex'),
      username: user.username,
      role: user.role?.name || 'Employee',
    };

    const token = this.jwtService.sign(payload);

    const empId = (() => {
      if (user.username === 'admin') return 'EMP-00001';
      const match = user.username?.match(/\d+/);
      if (match)
        return `EMP-${String(100 + parseInt(match[0], 10)).padStart(5, '0')}`;
      const hex = (user.id || '').replace(/-/g, '').substring(0, 6);
      return `EMP-${(parseInt(hex || '0', 16) % 90000) + 10000}`;
    })();

    await this.prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'Login',
        module: 'Auth',
        target_id: user.id,
        ip_address: ipAddress,
        details: {
          newState: { status: 'Success' },
          extra: { comment: 'เข้าสู่ระบบสำเร็จ' },
        },
      },
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        employee_id: empId,
        username: user.username,
        full_name: `${user.first_name} ${user.last_name}`,
        role: user.role?.name || 'Employee',
        role_id: user.role_id,
        department_id: user.department_id,
        department: user.department?.name || null,
        email: user.email,
        position: user.position?.name || null,
        signature_url: user.signature_encrypted
          ? `/api/users/${user.id}/signature`
          : null,
        permissions: normalizeDashboardPermissions(
          user.role?.permissions.map(
            (p) => `${p.permission.module}:${p.permission.action}`,
          ) || [],
        ),
      },
    };
  }

  async forgotPassword(email: string) {
    if (!process.env.SMTP_HOST)
      throw new ServiceUnavailableException(
        'ระบบส่งอีเมลยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลเพื่อรีเซ็ตรหัสผ่าน',
      );
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        is_active: true,
        is_deleted: false,
        role: { is_active: true },
      },
    });
    const response = {
      success: true,
      message: 'หากอีเมลมีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว',
    };
    if (!user) return response;
    const token = crypto.randomBytes(32).toString('hex'),
      stored = crypto.createHash('sha256').update(token).digest('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: stored,
        reset_token_expiry: new Date(Date.now() + 3600000),
      },
    });
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      ...(process.env.SMTP_USER
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
        : {}),
    });
    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM || 'noreply@dms.local',
        to: user.email,
        subject: 'ตั้งรหัสผ่านใหม่',
        html: `<p>ตั้งรหัสผ่านใหม่ภายใน 1 ชั่วโมง: <a href="${link}">${link}</a></p>`,
      });
    } catch {
      await this.prisma.user.updateMany({
        where: { id: user.id, reset_token: stored },
        data: { reset_token: null, reset_token_expiry: null },
      });
      throw new ServiceUnavailableException(
        'ส่งอีเมลไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ',
      );
    }
    return response;
  }

  async resetPassword(token: string, newPassword: string) {
    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 8 ||
      newPassword.length > 72
    )
      throw new BadRequestException('รหัสผ่านต้องยาว 8–72 ตัวอักษร');
    if (!token) throw new UnauthorizedException('Token ไม่ถูกต้อง');

    const user = await this.prisma.user.findFirst({
      where: {
        reset_token: crypto.createHash('sha256').update(token).digest('hex'),
        is_active: true,
        is_deleted: false,
        reset_token_expiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token ไม่ถูกต้องหรือหมดอายุแล้ว');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      const changed = await tx.user.updateMany({
        where: {
          id: user.id,
          reset_token: user.reset_token,
          reset_token_expiry: { gte: new Date() },
        },
        data: {
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expiry: null,
        },
      });
      if (changed.count !== 1)
        throw new UnauthorizedException('ลิงก์หมดอายุหรือใช้งานไปแล้ว');
      await tx.auditLog.create({
        data: {
          user_id: user.id,
          action: 'Edit',
          module: 'Auth',
          target_id: user.id,
          details: {
            oldState: {},
            newState: { password_reset: true },
            extra: {},
          },
        },
      });
    });

    return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
  }
}
