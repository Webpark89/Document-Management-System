import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dms-secret-key-2026',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        department: true,
        position: true,
        role: true,
      },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User inactive or not found');
    }

    return {
      id: user.id,
      username: user.username,
      full_name: `${user.first_name} ${user.last_name}`,
      role: user.role?.name || 'Employee',
      department: user.department?.name || null,
      email: user.email,
      position: user.position?.name || null,
    };
  }
}
