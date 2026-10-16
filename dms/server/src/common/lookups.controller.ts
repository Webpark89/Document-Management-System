import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('lookups')
@UseGuards(JwtAuthGuard)
export class LookupsController {
  constructor(private prisma: PrismaService) {}
  @Get('departments') departments() {
    return this.prisma.department.findMany({
      where: { is_active: true },
      select: { id: true, name: true, is_active: true },
      orderBy: { name: 'asc' },
    });
  }
  @Get('positions') positions() {
    return this.prisma.position.findMany({
      where: { is_active: true },
      select: { id: true, name: true, level: true, is_active: true },
      orderBy: { name: 'asc' },
    });
  }
  @Get('users')
  async users() {
    const list = await this.prisma.user.findMany({
      where: { is_active: true, is_deleted: false, role: { is_active: true } },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        is_active: true,
        role_id: true,
        department_id: true,
        department: { select: { name: true } },
        position: { select: { name: true } },
        role: {
          select: {
            name: true,
            permissions: { include: { permission: true } },
          },
        },
      },
      orderBy: { first_name: 'asc' },
    });
    return list.map((u) => ({
      id: u.id,
      username: u.username,
      first_name: u.first_name,
      last_name: u.last_name,
      is_active: u.is_active,
      role_id: u.role_id,
      role: u.role?.name ?? '',
      department_id: u.department_id,
      department: u.department?.name ?? '',
      position: u.position?.name ?? '',
      can_approve:
        u.role?.permissions.some(
          (p) =>
            p.permission.module === 'approvals.approve_document' &&
            p.permission.action === 'approve',
        ) ?? false,
    }));
  }
  @Get('workflows')
  async workflows() {
    const types = await this.prisma.documentType.findMany({
      where: { is_active: true },
      include: {
        approval_matrix: {
          include: { required_role: true },
          orderBy: { step_order: 'asc' },
        },
      },
    });
    return types.map((t) => ({
      id: t.id,
      prefix: t.prefix,
      name: t.type_name,
      steps: t.approval_matrix.map((m) => m.required_role.name),
      role_ids: t.approval_matrix.map((m) => m.required_role_id),
      levels: t.approval_matrix.length,
    }));
  }
}
