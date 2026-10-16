import * as crypto from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { Request } from 'express';
import { normalizeDashboardPermissions } from '../common/dashboard-permissions';

export interface JwtPayload {
  sub: string;
  credential_version: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET env variable is not set');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          let token: string | null = null;
          if (request && request.cookies) {
            token = request.cookies['access_token'] as string;
          }
          if (!token && request && request.headers) {
            // fallback to bearer header
            const authHeader = request.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
              token = authHeader.substring(7);
            }
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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
      throw new UnauthorizedException('User inactive or not found');
    }

    if (
      payload.credential_version !==
      crypto.createHash('sha256').update(user.password_hash).digest('hex')
    )
      throw new UnauthorizedException(
        'รหัสผ่านเปลี่ยนแล้ว กรุณาเข้าสู่ระบบใหม่',
      );

    const empId = (() => {
      if (user.username === 'admin') return 'EMP-00001';
      const match = user.username?.match(/\d+/);
      if (match)
        return `EMP-${String(100 + parseInt(match[0], 10)).padStart(5, '0')}`;
      const hex = (user.id || '').replace(/-/g, '').substring(0, 6);
      return `EMP-${(parseInt(hex || '0', 16) % 90000) + 10000}`;
    })();

    return {
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
    };
  }
}
