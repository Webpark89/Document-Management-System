import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

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
      },
    };
  }
}
