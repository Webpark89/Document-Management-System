import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

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

    const cleanPosition = (name?: string): string => {
      if (!name || name === '-') return '-';
      let clean = name.trim()
        .replace(/ฝ่ายจัดซื้อ|ฝ่ายผลิต|ฝ่ายบัญชี|ฝ่ายส่งมอบ|ฝ่ายคลังสินค้า|ฝ่ายทรัพยากรบุคคล|คลังสินค้า/g, '')
        .replace(/\s+(HR|IT|QA|QC|ACC|PUR|WH|LOG)\b/gi, '')
        .trim();

      if (clean === 'เจ้าหน้าที่' || clean === 'เจ้าหน้าที่ HR' || clean === 'เจ้าหน้าที่บัญชี') return 'เจ้าหน้าที่';
      if (clean === 'ผู้จัดการ' || clean === 'ผู้จัดการฝ่าย') return 'ผู้จัดการฝ่าย';
      if (clean === 'ผู้อำนวยการ' || clean === 'ผู้อำนวยการฝ่าย') return 'ผู้อำนวยการ';
      if (clean === 'หัวหน้า' || clean === 'หัวหน้างาน') return 'หัวหน้างาน / หัวหน้าแผนก';
      if (clean.includes('ผู้ดูแลระบบ')) return 'ผู้ดูแลระบบ';

      return clean || name;
    };

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      department: u.department?.name || '-',
      position: cleanPosition(u.position?.name),
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

    const user = await this.prisma.user.create({
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
      include: {
        department: true,
        position: true,
        role: true,
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      department: user.department?.name || '-',
      position: user.position?.name || '-',
      role: user.role?.name || 'Employee',
      is_active: user.is_active,
      created_at: user.created_at,
    };
  }

  async toggleUserActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้งาน');

    return this.prisma.user.update({
      where: { id },
      data: { is_active: !user.is_active },
    });
  }

  async updateUser(id: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้งาน');

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        first_name: dto.first_name,
        last_name: dto.last_name,
        department_id: dto.department_id,
        position_id: dto.position_id,
        role_id: dto.role_id,
        is_active: dto.is_active,
      },
      include: {
        department: true,
        position: true,
        role: true,
      },
    });

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      department: updatedUser.department?.name || '-',
      position: updatedUser.position?.name || '-',
      role: updatedUser.role?.name || 'Employee',
      is_active: updatedUser.is_active,
      created_at: updatedUser.created_at,
    };
  }

  async resetUserPassword(id: string, rawPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้งาน');

    const passwordHash = await bcrypt.hash(rawPassword, 10);
    return this.prisma.user.update({
      where: { id },
      data: { password_hash: passwordHash },
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

  async getRoleById(id: string) {
    const r = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
    });
    if (!r) throw new NotFoundException('Role not found');
    return {
      id: r.id,
      name: r.name,
      is_active: r.is_active,
      user_count: r._count.users,
      permissions: r.permissions.map((p) => ({
        module: p.permission.module,
        action: p.permission.action,
      })),
    };
  }

  async updateRole(id: string, dto: { name?: string; permissions?: { module: string; action: string }[] }) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    
    if (dto.name) {
      await this.prisma.role.update({ where: { id }, data: { name: dto.name } });
    }

    if (dto.permissions) {
      // Clear existing permissions for this role
      await this.prisma.rolePermission.deleteMany({ where: { role_id: id } });

      for (const p of dto.permissions) {
        // Find or create the permission
        const perm = await this.prisma.permission.upsert({
          where: { module_action: { module: p.module, action: p.action } },
          update: {},
          create: { module: p.module, action: p.action },
        });

        await this.prisma.rolePermission.create({
          data: {
            role_id: id,
            permission_id: perm.id,
          },
        });
      }
    }

    return this.getRoleById(id);
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('ไม่พบ Role');
    return this.prisma.role.update({
      where: { id },
      data: { is_active: false },
    });
  }

  // ---- Departments & Positions ----
  async getDepartments() {
    const departments = await this.prisma.department.findMany({
      include: {
        _count: {
          select: { users: { where: { is_deleted: false } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return departments.map((d) => ({
      ...d,
      employeeCount: d._count?.users ?? 0,
    }));
  }

  async createDepartment(name: string) {
    return this.prisma.department.create({ data: { name } });
  }

  async updateDepartment(id: string, dto: { name?: string; is_active?: boolean }) {
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async deleteDepartment(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('ไม่พบข้อมูลแผนก');
    const userCount = await this.prisma.user.count({ where: { department_id: id, is_deleted: false } });
    if (userCount > 0) {
      return this.prisma.department.update({ where: { id }, data: { is_active: false } });
    }
    return this.prisma.department.delete({ where: { id } });
  }

  async getPositions() {
    return this.prisma.position.findMany({ orderBy: { name: 'asc' } });
  }

  async createPosition(dto: { name: string; level?: string }) {
    return this.prisma.position.create({ 
      data: { 
        name: dto.name,
        level: dto.level || 'L1'
      } 
    });
  }

  async updatePosition(id: string, dto: { name?: string; level?: string; is_active?: boolean }) {
    return this.prisma.position.update({ where: { id }, data: dto });
  }

  async deletePosition(id: string) {
    const pos = await this.prisma.position.findUnique({ where: { id } });
    if (!pos) throw new NotFoundException('ไม่พบข้อมูลตำแหน่ง');
    const userCount = await this.prisma.user.count({ where: { position_id: id, is_deleted: false } });
    if (userCount > 0) {
      return this.prisma.position.update({ where: { id }, data: { is_active: false } });
    }
    return this.prisma.position.delete({ where: { id } });
  }

  async getDocumentTypes() {
    return this.prisma.documentType.findMany({
      include: { running_numbers: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async createDocumentType(dto: { type_name: string; prefix: string }) {
    return this.prisma.$transaction(async (tx) => {
      const docType = await tx.documentType.create({
        data: {
          type_name: dto.type_name,
          prefix: dto.prefix,
        },
      });
      await tx.runningNumber.create({
        data: {
          document_type_id: docType.id,
          prefix: dto.prefix,
          year_format: 'YYYY',
          current_number: 0,
          padding_length: 4,
        },
      });
      return docType;
    });
  }

  async updateDocumentType(id: string, dto: { type_name?: string; prefix?: string; is_active?: boolean }) {
    return this.prisma.documentType.update({ where: { id }, data: dto });
  }

  // ---- Master Data (Approval Matrix & Running Numbers) ----
  async getApprovalMatrix() {
    return this.prisma.approvalMatrix.findMany({
      include: {
        document_type: true,
        required_role: true,
      },
      orderBy: [
        { document_type_id: 'asc' },
        { step_order: 'asc' },
      ],
    });
  }

  async getApprovalWorkflows() {
    const docTypes = await this.prisma.documentType.findMany({
      include: {
        approval_matrix: {
          include: { required_role: true },
          orderBy: { step_order: 'asc' },
        },
      },
      orderBy: { prefix: 'asc' },
    });

    return docTypes.map(dt => ({
      id: dt.id,
      documentTypeId: dt.id,
      name: dt.type_name,
      prefix: dt.prefix,
      levels: dt.approval_matrix.length || 3,
      approverCount: dt.approval_matrix.length || 3,
      approvers: dt.approval_matrix.map(am => am.required_role?.name || ''),
      steps: dt.approval_matrix.map(am => am.required_role?.name || ''),
      isActive: dt.is_active,
    }));
  }

  async updateApprovalWorkflow(documentTypeId: string, dto: { levels: number; steps: string[] }) {
    // Note: To truly map steps to roles, we need the Role records. 
    // We match by Role name because the frontend passes string array of role names.
    const allRoles = await this.prisma.role.findMany();
    
    // Clear existing matrix for this document type
    await this.prisma.approvalMatrix.deleteMany({
      where: { document_type_id: documentTypeId }
    });
    
    // Create new steps
    for (let i = 0; i < dto.levels; i++) {
      const stepName = dto.steps[i];
      let role = allRoles.find(r => r.name === stepName);
      if (!role && stepName) {
         // Create the role if it doesn't exist (edge case protection)
         role = await this.prisma.role.create({ data: { name: stepName } });
         allRoles.push(role);
      }
      
      if (role) {
        await this.prisma.approvalMatrix.create({
          data: {
            document_type_id: documentTypeId,
            step_order: i + 1,
            required_role_id: role.id
          }
        });
      }
    }
    
    return { success: true };
  }

  async getSignatures() {
    const users = await this.prisma.user.findMany({
      where: { is_deleted: false },
      include: { position: true }
    });
    
    return users.map((user) => {
      let imageUrl: string | null = null;
      if (user.signature_encrypted) {
        try {
          imageUrl = this.encryption.decrypt(user.signature_encrypted);
        } catch {
          imageUrl = null;
        }
      }
      return {
        id: user.id,
        approverName: `${user.first_name} ${user.last_name}`,
        position: user.position?.name || 'Unknown',
        signedCount: 0,
        isActive: user.is_active,
        imageUrl,
      };
    });
  }

  async createApprovalMatrixStep(dto: any) {
    return this.prisma.approvalMatrix.create({
      data: {
        document_type_id: dto.document_type_id,
        step_order: dto.step_order,
        required_role_id: dto.approver_role_id,
      },
    });
  }

  async updateApprovalMatrixStep(id: string, dto: any) {
    return this.prisma.approvalMatrix.update({
      where: { id },
      data: {
        step_order: dto.step_order,
        required_role_id: dto.approver_role_id,
      },
    });
  }

  async updateRunningNumber(id: string, dto: any) {
    return this.prisma.runningNumber.update({
      where: { id },
      data: {
        last_reset_year: dto.last_reset_year,
        current_number: dto.current_number,
        padding_length: dto.padding_length,
      },
    });
  }

  // ---- Audit Logs ----
  async getAuditLogs(search?: string, action?: string, dateFrom?: string, dateTo?: string) {
    const where: any = {};
    if (action && action !== 'All') {
      where.action = action;
    }

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.created_at.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { module: { contains: search, mode: 'insensitive' } },
        { target_id: { contains: search, mode: 'insensitive' } },
        { user: { first_name: { contains: search, mode: 'insensitive' } } },
        { user: { last_name: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
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
      
      const details = l.details as any;
      if (details) {
        if (details.extra?.comment) {
          comment = details.extra.comment;
        }
        if (details.extra?.doc_number) {
          targetLabel = details.extra.doc_number;
        } else if (l.module === 'Auth') {
          targetLabel = l.user?.username || 'System';
        }
      }

      return {
        id: l.id,
        user_id: l.user_id,
        username: l.user?.username || 'System',
        user_fullname: l.user ? `${l.user.first_name} ${l.user.last_name}` : 'ระบบ',
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
