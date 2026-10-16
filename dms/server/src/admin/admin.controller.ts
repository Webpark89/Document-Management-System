import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { Actor } from '../common/document-policy';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { BadRequestException } from '@nestjs/common';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}
  @Get('settings')
  getSettings() {
    const p = path.join(process.cwd(), 'uploads/settings.json');
    return fs.existsSync(p)
      ? JSON.parse(fs.readFileSync(p, 'utf8'))
      : { companyName: 'บริษัท นิสซุย (ประเทศไทย) จำกัด', companyAddress: '' };
  }
  @Post('settings')
  @Permissions('config.access:edit', 'config.role_management:edit')
  async saveSettings(
    @Body() body: { companyName?: string; companyAddress?: string },
    @CurrentUser() actor: Actor,
  ) {
    if (
      !body.companyName?.trim() ||
      body.companyName.length > 500 ||
      (body.companyAddress?.length ?? 0) > 5000
    )
      throw new BadRequestException('ข้อมูลบริษัทไม่ถูกต้อง');
    const before = this.getSettings(),
      settings = {
        companyName: body.companyName.trim(),
        companyAddress: body.companyAddress ?? '',
      };
    const directory = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(directory, { recursive: true });
    const destination = path.join(directory, 'settings.json'),
      temp = path.join(directory, `settings-${crypto.randomUUID()}.tmp`);
    fs.writeFileSync(temp, JSON.stringify(settings, null, 2));
    fs.renameSync(temp, destination);
    await this.prisma.auditLog.create({
      data: {
        user_id: actor.id,
        action: 'Edit',
        module: 'Settings',
        details: { oldState: before, newState: settings, extra: {} },
      },
    });
    return { success: true };
  }
  @Get('users')
  @Permissions('config.user_management:view', 'config.role_management:view')
  users() {
    return this.adminService.getUsers();
  }
  @Post('users')
  @Permissions('config.user_management:create')
  createUser(@Body() dto: CreateUserDto, @CurrentUser() actor: Actor) {
    return this.adminService.createUser(dto, actor);
  }
  @Patch('users/:id')
  @Permissions('config.user_management:edit')
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: Actor,
  ) {
    return this.adminService.updateUser(id, dto, actor);
  }
  @Patch('users/:id/toggle-active')
  @Permissions('config.user_management:edit')
  toggleUser(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.adminService.toggleUserActive(id, actor);
  }
  @Post('users/:id/reset-password')
  @Permissions('config.user_management:edit')
  resetUser(
    @Param('id') id: string,
    @Body() body: { password_hash: string },
    @CurrentUser() actor: Actor,
  ) {
    return this.adminService.resetUserPassword(id, body.password_hash, actor);
  }
  @Get('roles')
  @Permissions(
    'config.role_management:view',
    'config.user_management:view',
    'masterdata.access:view',
  )
  roles() {
    return this.adminService.getRoles();
  }
  @Get('roles/:id')
  @Permissions('config.role_management:view')
  role(@Param('id') id: string) {
    return this.adminService.getRoleById(id);
  }
  @Post('roles')
  @Permissions('config.role_management:create')
  createRole(@Body('name') name: string, @CurrentUser() actor: Actor) {
    return this.adminService.createRole(name, actor);
  }
  @Patch('roles/:id')
  @Permissions('config.role_management:edit')
  updateRole(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      is_active?: boolean;
      permissions?: { module: string; action: string }[];
    },
    @CurrentUser() actor: Actor,
  ) {
    return this.adminService.updateRole(id, dto, actor);
  }
  @Delete('roles/:id')
  @Permissions('config.role_management:delete')
  deleteRole(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.adminService.deleteRole(id, actor);
  }
  @Get('departments')
  @Permissions('masterdata.access:view', 'config.user_management:view')
  departments() {
    return this.adminService.getDepartments();
  }
  @Post('departments')
  @Permissions('masterdata.access:edit', 'masterdata.departments:create')
  createDepartment(@Body() dto: { name: string }, @CurrentUser() actor: Actor) {
    return this.adminService.createDepartment(dto.name, actor);
  }
  @Patch('departments/:id')
  @Permissions('masterdata.access:edit', 'masterdata.departments:edit')
  updateDepartment(
    @Param('id') id: string,
    @Body() dto: { name?: string; is_active?: boolean },
    @CurrentUser() actor: Actor,
  ) {
    return this.adminService.updateDepartment(id, dto, actor);
  }
  @Delete('departments/:id')
  @Permissions('masterdata.access:delete', 'masterdata.departments:delete')
  deleteDepartment(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.adminService.deleteDepartment(id, actor);
  }
  @Get('positions')
  @Permissions('masterdata.access:view', 'config.user_management:view')
  positions() {
    return this.adminService.getPositions();
  }
  @Post('positions')
  @Permissions('masterdata.access:edit', 'masterdata.positions:create')
  createPosition(
    @Body() dto: { name: string; level?: string },
    @CurrentUser() actor: Actor,
  ) {
    return this.adminService.createPosition(dto, actor);
  }
  @Patch('positions/:id')
  @Permissions('masterdata.access:edit', 'masterdata.positions:edit')
  updatePosition(
    @Param('id') id: string,
    @Body() dto: { name?: string; level?: string; is_active?: boolean },
    @CurrentUser() actor: Actor,
  ) {
    return this.adminService.updatePosition(id, dto, actor);
  }
  @Delete('positions/:id')
  @Permissions('masterdata.access:delete', 'masterdata.positions:delete')
  deletePosition(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.adminService.deletePosition(id, actor);
  }
  @Get('document-types')
  @Permissions('masterdata.access:view')
  types() {
    return this.adminService.getDocumentTypes();
  }
  @Post('document-types')
  @Permissions('masterdata.access:edit', 'masterdata.doc_types:create')
  createType(
    @Body() dto: { type_name: string; prefix: string },
    @CurrentUser() actor: Actor,
  ) {
    return this.adminService.createDocumentType(dto, actor);
  }
  @Patch('document-types/:id')
  @Permissions('masterdata.access:edit', 'masterdata.doc_types:edit')
  updateType(
    @Param('id') id: string,
    @Body() dto: { type_name?: string; prefix?: string; is_active?: boolean },
    @CurrentUser() actor: Actor,
  ) {
    return this.adminService.updateDocumentType(id, dto, actor);
  }
  @Get('workflows')
  @Permissions('masterdata.access:view')
  workflows() {
    return this.adminService.getApprovalWorkflows();
  }
  @Patch('workflows/:id')
  @Permissions('masterdata.access:edit', 'masterdata.workflow:edit')
  workflow(
    @Param('id') id: string,
    @Body() dto: { levels?: number; steps?: string[]; is_active?: boolean },
    @CurrentUser() actor: Actor,
  ) {
    return this.adminService.updateApprovalWorkflow(id, dto, actor);
  }
  @Get('signatures')
  @Permissions('masterdata.access:view', 'masterdata.signatures:view')
  signatures() {
    return this.adminService.getSignatures();
  }
  @Patch('signatures/:id')
  @Permissions(
    'masterdata.access:edit',
    'masterdata.signatures:edit',
    'masterdata.signatures:create',
  )
  setSignature(
    @Param('id') id: string,
    @Body() body: { imageUrl: string | null },
    @CurrentUser() actor: Actor,
  ) {
    return this.usersService.setUserSignature(id, body.imageUrl, actor);
  }
  @Get('approval-matrix')
  @Permissions('masterdata.access:view')
  matrix() {
    return this.adminService.getApprovalMatrix();
  }
  @Post('approval-matrix')
  @Permissions('masterdata.access:edit', 'masterdata.workflow:edit')
  createMatrix(
    @Body()
    dto: {
      document_type_id: string;
      step_order: number;
      approver_role_id: string;
    },
    @CurrentUser() actor: Actor,
  ) {
    return this.adminService.createApprovalMatrixStep(dto, actor);
  }
  @Patch('approval-matrix/:id')
  @Permissions('masterdata.access:edit', 'masterdata.workflow:edit')
  updateMatrix(
    @Param('id') id: string,
    @Body() dto: { step_order?: number; approver_role_id?: string },
    @CurrentUser() actor: Actor,
  ) {
    return this.adminService.updateApprovalMatrixStep(id, dto, actor);
  }
  @Get('running-numbers')
  @Permissions('masterdata.access:view')
  numbers() {
    return this.adminService.getRunningNumbers();
  }
  @Patch('running-numbers/:id')
  @Permissions('masterdata.access:edit', 'masterdata.running_numbers:edit')
  updateNumber(
    @Param('id') id: string,
    @Body() dto: Parameters<AdminService['updateRunningNumber']>[1],
    @CurrentUser() actor: Actor,
  ) {
    return this.adminService.updateRunningNumber(id, dto, actor);
  }
  @Get('audit-logs')
  @Permissions('auditlog.access:view')
  logs(
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getAuditLogs(search, action, dateFrom, dateTo);
  }
}
