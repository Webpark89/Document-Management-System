import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ---- Users ----
  async getUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        department: true,
        position: true,
        role: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      department: u.department?.name || '-',
      position: u.position?.name || '-',
      role: u.role?.name || 'Employee',
      is_active: u.is_active,
      created_at: u.created_at,
    }));
  }

  async createUser(dto: any) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });

    if (existing) {
      throw new BadRequestException('ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว');
    }

    const rawPassword = dto.password || 'folk2546';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    return this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password_hash: passwordHash,
        first_name: dto.first_name,
        last_name: dto.last_name,
        department_id: dto.department_id,
        position_id: dto.position_id,
        role_id: dto.role_id,
      },
    });
  }

  async toggleUserActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้งาน');

    return this.prisma.user.update({
      where: { id },
      data: { is_active: !user.is_active },
    });
  }

  // ---- Roles ----
  async getRoles() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      is_active: r.is_active,
      user_count: r._count.users,
      permissions: r.permissions.map((p) => ({
        module: p.permission.module,
        action: p.permission.action,
      })),
    }));
  }

  async createRole(name: string) {
    return this.prisma.role.create({ data: { name } });
  }

  // ---- Departments & Positions ----
  async getDepartments() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }

  async getPositions() {
    return this.prisma.position.findMany({ orderBy: { name: 'asc' } });
  }

  async getDocumentTypes() {
    return this.prisma.documentType.findMany({
      include: { running_numbers: true },
      orderBy: { created_at: 'asc' },
    });
  }

  // ---- Audit Logs ----
  async getAuditLogs(search?: string, action?: string) {
    const where: any = {};
    if (action && action !== 'All') {
      where.action = action;
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    return logs.map((l) => ({
      id: l.id,
      user_id: l.user_id,
      username: l.user?.username || 'System',
      user_fullname: l.user ? `${l.user.first_name} ${l.user.last_name}` : 'ระบบ',
      action: l.action,
      module: l.module,
      target_id: l.target_id,
      ip_address: l.ip_address || '127.0.0.1',
      created_at: l.created_at,
    }));
  }
}
