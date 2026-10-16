import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { CreateUserDto } from './dto/create-user.dto';
import { normalizeDashboardPermissions } from '../common/dashboard-permissions';
import {
  Actor,
  lockEntity,
  jsonSnapshot,
  safeUserSelect,
} from '../common/document-policy';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}
  private async audit(
    tx: Prisma.TransactionClient,
    actor: Actor,
    module: string,
    target: string,
    oldState: unknown,
    newState: unknown,
    action: AuditAction = 'Edit',
  ) {
    await tx.auditLog.create({
      data: {
        user_id: actor.id,
        action,
        module,
        target_id: target,
        details: {
          oldState: jsonSnapshot(oldState),
          newState: jsonSnapshot(newState),
          extra: {},
        },
      },
    });
  }
  async getUsers() {
    const list = await this.prisma.user.findMany({
      where: { is_deleted: false },
      select: {
        ...safeUserSelect,
        is_active: true,
        created_at: true,
        role_id: true,
        department_id: true,
        position_id: true,
      },
      orderBy: { created_at: 'desc' },
    });
    return list.map((u) => ({
      ...u,
      department: u.department?.name ?? '',
      position: u.position?.name ?? '',
      role: u.role?.name ?? '',
    }));
  }
  private async references(
    tx: Prisma.TransactionClient,
    dto: Partial<CreateUserDto>,
  ) {
    if (
      dto.role_id &&
      !(await tx.role.findFirst({
        where: { id: dto.role_id, is_active: true },
      }))
    )
      throw new BadRequestException('ไม่พบบทบาทที่ใช้งาน');
    if (
      dto.department_id &&
      !(await tx.department.findFirst({
        where: { id: dto.department_id, is_active: true },
      }))
    )
      throw new BadRequestException('ไม่พบแผนกที่ใช้งาน');
    if (
      dto.position_id &&
      !(await tx.position.findFirst({
        where: { id: dto.position_id, is_active: true },
      }))
    )
      throw new BadRequestException('ไม่พบตำแหน่งที่ใช้งาน');
  }
  async createUser(dto: CreateUserDto, actor: Actor) {
    if (!dto.password || !dto.role_id || !dto.department_id)
      throw new BadRequestException('กรุณาระบุรหัสผ่าน บทบาท และแผนก');
    const hash = await bcrypt.hash(dto.password, 10);
    return this.prisma.$transaction(async (tx) => {
      await this.references(tx, dto);
      const user = await tx.user.create({
        data: {
          username: dto.username.trim(),
          email: dto.email.trim(),
          first_name: dto.first_name.trim(),
          last_name: dto.last_name.trim(),
          role_id: dto.role_id,
          department_id: dto.department_id,
          position_id: dto.position_id,
          is_active: dto.is_active ?? true,
          password_hash: hash,
        },
        select: safeUserSelect,
      });
      await this.audit(tx, actor, 'User', user.id, {}, user, 'Upload');
      return user;
    });
  }
  async toggleUserActive(id: string, actor: Actor) {
    return this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `user:${id}`);
      const user = await tx.user.findUnique({
        where: { id },
        select: { id: true, is_active: true },
      });
      if (!user) throw new NotFoundException('ไม่พบผู้ใช้');
      if (id === actor.id)
        throw new ConflictException('ไม่สามารถปิดบัญชีที่กำลังใช้งาน');
      const updated = await tx.user.update({
        where: { id },
        data: { is_active: !user.is_active },
        select: { id: true, is_active: true },
      });
      await this.audit(tx, actor, 'User', id, user, updated);
      return updated;
    });
  }
  async updateUser(
    id: string,
    dto: Partial<CreateUserDto> & { is_active?: boolean },
    actor: Actor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `user:${id}`);
      const old = await tx.user.findUnique({
        where: { id },
        select: safeUserSelect,
      });
      if (!old) throw new NotFoundException('ไม่พบผู้ใช้');
      if (id === actor.id && dto.is_active === false)
        throw new ConflictException('ไม่สามารถปิดบัญชีที่กำลังใช้งาน');
      await this.references(tx, dto);
      const updated = await tx.user.update({
        where: { id },
        data: {
          email: dto.email,
          first_name: dto.first_name,
          last_name: dto.last_name,
          role_id: dto.role_id,
          department_id: dto.department_id,
          position_id: dto.position_id,
          is_active: dto.is_active,
        },
        select: safeUserSelect,
      });
      await this.audit(tx, actor, 'User', id, old, updated);
      return updated;
    });
  }
  async resetUserPassword(id: string, raw: string, actor: Actor) {
    if (typeof raw !== 'string' || raw.length < 8 || raw.length > 72)
      throw new BadRequestException('รหัสผ่านต้องยาว 8–72 ตัวอักษร');
    const hash = await bcrypt.hash(raw, 10);
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          password_hash: hash,
          reset_token: null,
          reset_token_expiry: null,
        },
      });
      await this.audit(tx, actor, 'User', id, {}, { password_reset: true });
      return { success: true };
    });
  }
  async getRoles() {
    const list = await this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
    return list.map((r) => ({
      id: r.id,
      name: r.name,
      is_active: r.is_active,
      user_count: r._count.users,
      permissions: normalizeDashboardPermissions(
        r.permissions.map(
          (p) => `${p.permission.module}:${p.permission.action}`,
        ),
      ).map((key) => {
        const index = key.lastIndexOf(':');
        return { module: key.slice(0, index), action: key.slice(index + 1) };
      }),
    }));
  }
  async getRoleById(id: string) {
    const role = (await this.getRoles()).find((r) => r.id === id);
    if (!role) throw new NotFoundException('ไม่พบบทบาท');
    return role;
  }
  async createRole(name: string, actor: Actor) {
    if (!name?.trim()) throw new BadRequestException('กรุณาระบุชื่อบทบาท');
    return this.prisma.$transaction(async (tx) => {
      const r = await tx.role.create({ data: { name: name.trim() } });
      await this.audit(tx, actor, 'Role', r.id, {}, r, 'Upload');
      return r;
    });
  }
  async updateRole(
    id: string,
    dto: {
      name?: string;
      is_active?: boolean;
      permissions?: { module: string; action: string }[];
    },
    actor: Actor,
  ) {
    if (
      dto.permissions?.some(
        (p) =>
          !p.module ||
          !['view', 'create', 'edit', 'delete', 'approve'].includes(
            p.action.toLowerCase(),
          ),
      )
    )
      throw new BadRequestException('Permission ไม่ถูกต้อง');
    await this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `role:${id}`);
      const old = await tx.role.findUnique({
        where: { id },
        include: { permissions: true },
      });
      if (!old) throw new NotFoundException('ไม่พบบทบาท');
      await tx.role.update({
        where: { id },
        data: { name: dto.name?.trim(), is_active: dto.is_active },
      });
      if (dto.permissions) {
        await tx.rolePermission.deleteMany({ where: { role_id: id } });
        for (const p of [
          ...new Map(
            dto.permissions.map((p) => [`${p.module}:${p.action}`, p]),
          ).values(),
        ]) {
          const perm = await tx.permission.upsert({
            where: {
              module_action: {
                module: p.module,
                action: p.action.toLowerCase(),
              },
            },
            update: {},
            create: { module: p.module, action: p.action.toLowerCase() },
          });
          await tx.rolePermission.create({
            data: { role_id: id, permission_id: perm.id },
          });
        }
      }
      await this.audit(
        tx,
        actor,
        'Role',
        id,
        { name: old.name, is_active: old.is_active },
        dto,
      );
    });
    return this.getRoleById(id);
  }
  deleteRole(id: string, actor: Actor) {
    return this.updateRole(id, { is_active: false }, actor);
  }
  async getDepartments() {
    const rows = await this.prisma.department.findMany({
      include: {
        _count: { select: { users: { where: { is_deleted: false } } } },
      },
      orderBy: { name: 'asc' },
    });
    return rows.map((d) => ({ ...d, employeeCount: d._count.users }));
  }
  async createDepartment(name: string, actor: Actor) {
    if (!name?.trim()) throw new BadRequestException('กรุณาระบุชื่อแผนก');
    return this.prisma.$transaction(async (tx) => {
      const d = await tx.department.create({ data: { name: name.trim() } });
      await this.audit(tx, actor, 'Department', d.id, {}, d, 'Upload');
      return d;
    });
  }
  async updateDepartment(
    id: string,
    dto: { name?: string; is_active?: boolean },
    actor: Actor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.department.findUnique({ where: { id } });
      if (!old) throw new NotFoundException('ไม่พบแผนก');
      const d = await tx.department.update({
        where: { id },
        data: { name: dto.name?.trim(), is_active: dto.is_active },
      });
      await this.audit(tx, actor, 'Department', id, old, d);
      return d;
    });
  }
  deleteDepartment(id: string, actor: Actor) {
    return this.updateDepartment(id, { is_active: false }, actor);
  }
  getPositions() {
    return this.prisma.position.findMany({
      include: {
        _count: { select: { users: { where: { is_deleted: false } } } },
      },
      orderBy: { name: 'asc' },
    });
  }
  async createPosition(dto: { name: string; level?: string }, actor: Actor) {
    if (!dto.name?.trim())
      throw new BadRequestException('กรุณาระบุชื่อตำแหน่ง');
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.position.create({
        data: { name: dto.name.trim(), level: dto.level ?? 'L1' },
      });
      await this.audit(tx, actor, 'Position', p.id, {}, p, 'Upload');
      return p;
    });
  }
  async updatePosition(
    id: string,
    dto: { name?: string; level?: string; is_active?: boolean },
    actor: Actor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const old = await tx.position.findUnique({ where: { id } });
      if (!old) throw new NotFoundException('ไม่พบตำแหน่ง');
      const p = await tx.position.update({ where: { id }, data: dto });
      await this.audit(tx, actor, 'Position', id, old, p);
      return p;
    });
  }
  deletePosition(id: string, actor: Actor) {
    return this.updatePosition(id, { is_active: false }, actor);
  }
  async getDocumentTypes() {
    const rows = await this.prisma.documentType.findMany({
      include: {
        running_numbers: true,
        _count: { select: { documents: true } },
      },
      orderBy: { created_at: 'asc' },
    });
    return rows.map((r) => ({ ...r, doc_count: r._count.documents }));
  }
  async createDocumentType(
    dto: { type_name: string; prefix: string },
    actor: Actor,
  ) {
    if (!dto.type_name?.trim() || !/^[A-Z0-9]{2,12}$/.test(dto.prefix))
      throw new BadRequestException('ชื่อหรือ prefix ไม่ถูกต้อง');
    return this.prisma.$transaction(async (tx) => {
      const d = await tx.documentType.create({
        data: { type_name: dto.type_name.trim(), prefix: dto.prefix },
      });
      await tx.runningNumber.create({
        data: { document_type_id: d.id, prefix: d.prefix, year_format: 'YYYY' },
      });
      await this.audit(tx, actor, 'Document Type', d.id, {}, d, 'Upload');
      return d;
    });
  }
  async updateDocumentType(
    id: string,
    dto: { type_name?: string; prefix?: string; is_active?: boolean },
    actor: Actor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `number:${id}`);
      const old = await tx.documentType.findUnique({ where: { id } });
      if (!old) throw new NotFoundException('ไม่พบประเภทเอกสาร');
      if (dto.prefix && !/^[A-Z0-9]{2,12}$/.test(dto.prefix))
        throw new BadRequestException('Prefix ไม่ถูกต้อง');
      if (
        dto.prefix &&
        dto.prefix !== old.prefix &&
        (await tx.document.count({ where: { type_id: id } }))
      )
        throw new ConflictException(
          'มีเอกสารใช้ prefix เดิมแล้ว ไม่สามารถเปลี่ยน',
        );
      const d = await tx.documentType.update({ where: { id }, data: dto });
      if (dto.prefix)
        await tx.runningNumber.updateMany({
          where: { document_type_id: id },
          data: { prefix: dto.prefix },
        });
      await this.audit(tx, actor, 'Document Type', id, old, d);
      return d;
    });
  }
  getApprovalMatrix() {
    return this.prisma.approvalMatrix.findMany({
      include: { document_type: true, required_role: true },
      orderBy: [{ document_type_id: 'asc' }, { step_order: 'asc' }],
    });
  }
  async getApprovalWorkflows() {
    const list = await this.prisma.documentType.findMany({
      include: {
        approval_matrix: {
          include: { required_role: true },
          orderBy: { step_order: 'asc' },
        },
      },
    });
    return list.map((t) => ({
      id: t.id,
      documentTypeId: t.id,
      name: t.type_name,
      prefix: t.prefix,
      levels: t.approval_matrix.length,
      approverCount: t.approval_matrix.length,
      approvers: t.approval_matrix.map((m) => m.required_role.name),
      steps: t.approval_matrix.map((m) => m.required_role.name),
      isActive: t.is_active,
    }));
  }
  async updateApprovalWorkflow(
    id: string,
    dto: { levels?: number; steps?: string[]; is_active?: boolean },
    actor: Actor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `matrix:${id}`);
      const type = await tx.documentType.findUnique({ where: { id } });
      if (!type) throw new NotFoundException('ไม่พบประเภทเอกสาร');
      const old = await tx.approvalMatrix.findMany({
        where: { document_type_id: id },
        orderBy: { step_order: 'asc' },
      });
      if (dto.steps) {
        if (
          !Number.isInteger(dto.levels) ||
          dto.levels! < 1 ||
          dto.levels! > 20 ||
          dto.steps.length !== dto.levels
        )
          throw new BadRequestException('จำนวนขั้นไม่ตรงรายชื่อบทบาท');
        const roles = await tx.role.findMany({
          where: { name: { in: dto.steps }, is_active: true },
        });
        if (dto.steps.some((name) => !roles.some((r) => r.name === name)))
          throw new BadRequestException('กรุณาเลือกบทบาทที่เปิดใช้งาน');
        await tx.approvalMatrix.deleteMany({ where: { document_type_id: id } });
        await tx.approvalMatrix.createMany({
          data: dto.steps.map((name, i) => ({
            document_type_id: id,
            step_order: i + 1,
            required_role_id: roles.find((r) => r.name === name)!.id,
          })),
        });
      }
      // A disabled workflow cannot be submitted: disable its document type atomically.
      if (dto.is_active !== undefined)
        await tx.documentType.update({
          where: { id },
          data: { is_active: dto.is_active },
        });
      await this.audit(tx, actor, 'Approval Matrix', id, old, dto);
      return { success: true };
    });
  }
  async getSignatures() {
    const users = await this.prisma.user.findMany({
      where: { is_deleted: false },
      include: {
        position: true,
        _count: {
          select: { workflow_steps: { where: { signature_applied: true } } },
        },
      },
    });
    return users.map((u) => ({
      id: u.id,
      approverName: `${u.first_name} ${u.last_name}`,
      position: u.position?.name ?? '',
      signedCount: u._count.workflow_steps,
      isActive: !!u.signature_encrypted,
      imageUrl: u.signature_encrypted ? `/api/users/${u.id}/signature` : null,
    }));
  }
  async getRunningNumbers() {
    const rows = await this.prisma.runningNumber.findMany({
      include: { document_type: true },
      orderBy: { prefix: 'asc' },
    });
    return rows.map((r) => {
      let config = {
        yearFormat: r.year_format === 'YY' ? 'ce2' : 'ce4',
        separator: '-',
        resetCycle: 'yearly',
        isActive: true,
      };
      try {
        if (r.year_format.startsWith('{'))
          config = { ...config, ...JSON.parse(r.year_format) };
      } catch {
        /* legacy format */
      }
      return {
        id: r.id,
        documentTypeId: r.document_type_id,
        matrixKey: r.id,
        prefix: r.prefix,
        typeName: r.document_type.type_name,
        currentCounter: r.current_number,
        runningDigits: r.padding_length,
        ...config,
      };
    });
  }
  async updateRunningNumber(
    id: string,
    dto: {
      yearFormat?: string;
      separator?: string;
      resetCycle?: string;
      isActive?: boolean;
      current_number?: number;
      padding_length?: number;
      runningDigits?: number;
      last_reset_year?: string | number;
    },
    actor: Actor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.runningNumber.findUnique({ where: { id } });
      if (!row) throw new NotFoundException('ไม่พบรูปแบบเลข');
      await lockEntity(tx, `number:${row.document_type_id}`);
      if (
        dto.current_number !== undefined &&
        (!Number.isInteger(dto.current_number) ||
          dto.current_number < row.current_number)
      )
        throw new BadRequestException('ไม่สามารถลดเลข running เดิม');
      let config = {
        yearFormat: row.year_format === 'YY' ? 'ce2' : 'ce4',
        separator: '-',
        resetCycle: 'yearly',
        isActive: true,
      };
      if (row.year_format.startsWith('{'))
        config = { ...config, ...JSON.parse(row.year_format) };
      if (dto.yearFormat !== undefined) {
        if (!['ce4', 'ce2', 'be4', 'be2', 'none'].includes(dto.yearFormat))
          throw new BadRequestException('รูปแบบปีไม่ถูกต้อง');
        config.yearFormat = dto.yearFormat;
      }
      if (dto.separator !== undefined) {
        if (!['-', 'none'].includes(dto.separator))
          throw new BadRequestException('ใช้ตัวคั่น - หรือไม่มีตัวคั่น');
        config.separator = dto.separator;
      }
      if (dto.resetCycle !== undefined) {
        if (!['yearly', 'monthly', 'never'].includes(dto.resetCycle))
          throw new BadRequestException('รอบ reset ไม่ถูกต้อง');
        config.resetCycle = dto.resetCycle;
      }
      if (dto.isActive !== undefined) config.isActive = dto.isActive;
      const digits =
        dto.runningDigits ?? dto.padding_length ?? row.padding_length;
      if (!Number.isInteger(digits) || digits < 3 || digits > 8)
        throw new BadRequestException('จำนวนหลักต้องเป็น 3–8');
      const year =
        dto.last_reset_year === undefined
          ? undefined
          : Number(dto.last_reset_year);
      if (year !== undefined && !Number.isInteger(year))
        throw new BadRequestException('ปี reset ไม่ถูกต้อง');
      const updated = await tx.runningNumber.update({
        where: { id },
        data: {
          year_format: JSON.stringify(config),
          padding_length: digits,
          current_number: dto.current_number,
          ...(year !== undefined ? { last_reset_year: year } : {}),
        },
      });
      await this.audit(tx, actor, 'Running Number', id, row, updated);
      return { success: true };
    });
  }
  async createApprovalMatrixStep(
    dto: {
      document_type_id: string;
      step_order: number;
      approver_role_id: string;
    },
    actor: Actor,
  ) {
    const matrix = await this.getApprovalMatrix();
    const type = matrix
      .filter((m) => m.document_type_id === dto.document_type_id)
      .sort((a, b) => a.step_order - b.step_order);
    if (dto.step_order !== type.length + 1)
      throw new BadRequestException('เพิ่มได้เฉพาะขั้นถัดไป');
    const role = await this.prisma.role.findUnique({
      where: { id: dto.approver_role_id },
    });
    if (!role) throw new BadRequestException('ไม่พบบทบาท');
    return this.updateApprovalWorkflow(
      dto.document_type_id,
      {
        levels: type.length + 1,
        steps: [...type.map((m) => m.required_role.name), role.name],
      },
      actor,
    );
  }
  async updateApprovalMatrixStep(
    id: string,
    dto: { step_order?: number; approver_role_id?: string },
    actor: Actor,
  ) {
    const matrix = await this.getApprovalMatrix();
    const step = matrix.find((m) => m.id === id);
    if (!step) throw new NotFoundException('ไม่พบขั้น');
    if (dto.step_order !== undefined && dto.step_order !== step.step_order)
      throw new BadRequestException('แก้ลำดับผ่านหน้าสายอนุมัติ');
    const roles = await this.prisma.role.findMany();
    const entries = matrix
      .filter((m) => m.document_type_id === step.document_type_id)
      .sort((a, b) => a.step_order - b.step_order);
    const role = roles.find(
      (r) => r.id === (dto.approver_role_id ?? step.required_role_id),
    );
    if (!role) throw new BadRequestException('ไม่พบบทบาท');
    return this.updateApprovalWorkflow(
      step.document_type_id,
      {
        levels: entries.length,
        steps: entries.map((m) =>
          m.id === id ? role.name : m.required_role.name,
        ),
      },
      actor,
    );
  }
  async getAuditLogs(
    search?: string,
    action?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        ...(action && action !== 'All'
          ? { action: action as AuditAction }
          : {}),
        ...(dateFrom || dateTo
          ? {
              created_at: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo
                  ? {
                      lte: (() => {
                        const d = new Date(dateTo);
                        d.setHours(23, 59, 59, 999);
                        return d;
                      })(),
                    }
                  : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { module: { contains: search, mode: 'insensitive' as const } },
                {
                  target_id: { contains: search, mode: 'insensitive' as const },
                },
                {
                  user: {
                    is: {
                      first_name: {
                        contains: search,
                        mode: 'insensitive' as const,
                      },
                    },
                  },
                },
                {
                  user: {
                    is: {
                      last_name: {
                        contains: search,
                        mode: 'insensitive' as const,
                      },
                    },
                  },
                },
                {
                  user: {
                    is: {
                      username: {
                        contains: search,
                        mode: 'insensitive' as const,
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        user: true,
      },
      take: 100,
    });

    return logs.map((l) => {
      let comment = '';
      let targetLabel = l.target_id;

      const details = l.details as Record<string, unknown> | null;
      if (details) {
        const extra = details.extra as Record<string, unknown> | undefined;
        if (extra?.comment) {
          comment = extra.comment as string;
        }
        if (extra?.doc_number) {
          targetLabel = extra.doc_number as string;
        } else if (l.module === 'Auth') {
          targetLabel = l.user?.username || 'System';
        }
      }

      return {
        id: l.id,
        user_id: l.user_id,
        username: l.user?.username || 'System',
        user_fullname: l.user
          ? `${l.user.first_name} ${l.user.last_name}`
          : 'ระบบ',
        action: l.action,
        module: l.module,
        target_id: l.target_id,
        target_label: targetLabel,
        comment: comment,
        ip_address: l.ip_address || '127.0.0.1',
        created_at: l.created_at,
      };
    });
  }
}
