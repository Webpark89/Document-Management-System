import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

import { CreateUserDto } from './dto/create-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Permissions('config.user_management:view', 'config.access:view')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users')
  @Permissions('config.user_management:create')
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id/toggle-active')
  @Permissions('config.user_management:edit')
  async toggleUserActive(@Param('id') id: string) {
    return this.adminService.toggleUserActive(id);
  }

  @Patch('users/:id')
  @Permissions('config.user_management:edit')
  async updateUser(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateUser(id, dto);
  }

  @Post('users/:id/reset-password')
  @Permissions('config.user_management:edit')
  async resetUserPassword(@Param('id') id: string, @Body() dto: { password_hash: string }) {
    return this.adminService.resetUserPassword(id, dto.password_hash);
  }

  @Get('roles')
  @Permissions('config.role_management:view', 'config.access:view')
  async getRoles() {
    return this.adminService.getRoles();
  }

  @Get('roles/:id')
  @Permissions('config.role_management:view')
  async getRoleById(@Param('id') id: string) {
    return this.adminService.getRoleById(id);
  }

  @Post('roles')
  @Permissions('config.role_management:create')
  async createRole(@Body('name') name: string) {
    return this.adminService.createRole(name);
  }

  @Patch('roles/:id')
  @Permissions('config.role_management:edit')
  async updateRole(@Param('id') id: string, @Body() dto: { name?: string; permissions?: { module: string; action: string }[] }) {
    return this.adminService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @Permissions('config.role_management:delete')
  async deleteRole(@Param('id') id: string) {
    return this.adminService.deleteRole(id);
  }

  @Get('departments')
  @Permissions('masterdata.access:view')
  async getDepartments() {
    return this.adminService.getDepartments();
  }

  @Post('departments')
  @Permissions('masterdata.access:edit')
  async createDepartment(@Body() dto: { name: string }) {
    return this.adminService.createDepartment(dto.name);
  }

  @Patch('departments/:id')
  @Permissions('masterdata.access:edit')
  async updateDepartment(@Param('id') id: string, @Body() dto: { name?: string; is_active?: boolean }) {
    return this.adminService.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @Permissions('masterdata.access:delete')
  async deleteDepartment(@Param('id') id: string) {
    return this.adminService.deleteDepartment(id);
  }

  @Get('positions')
  @Permissions('masterdata.access:view')
  async getPositions() {
    return this.adminService.getPositions();
  }

  @Post('positions')
  @Permissions('masterdata.access:edit')
  async createPosition(@Body() dto: { name: string; level?: string }) {
    return this.adminService.createPosition(dto);
  }

  @Patch('positions/:id')
  @Permissions('masterdata.access:edit')
  async updatePosition(@Param('id') id: string, @Body() dto: { name?: string; level?: string; is_active?: boolean }) {
    return this.adminService.updatePosition(id, dto);
  }

  @Delete('positions/:id')
  @Permissions('masterdata.access:delete')
  async deletePosition(@Param('id') id: string) {
    return this.adminService.deletePosition(id);
  }

  @Get('document-types')
  @Permissions('masterdata.access:view')
  async getDocumentTypes() {
    return this.adminService.getDocumentTypes();
  }

  @Post('document-types')
  @Permissions('masterdata.access:edit')
  async createDocumentType(@Body() dto: { type_name: string; prefix: string }) {
    return this.adminService.createDocumentType(dto);
  }

  @Patch('document-types/:id')
  @Permissions('masterdata.access:edit')
  async updateDocumentType(@Param('id') id: string, @Body() dto: { type_name?: string; prefix?: string; is_active?: boolean }) {
    return this.adminService.updateDocumentType(id, dto);
  }

  @Get('workflows')
  @Permissions('masterdata.access:view')
  async getApprovalWorkflows() {
    return this.adminService.getApprovalWorkflows();
  }

  @Patch('workflows/:id')
  @Permissions('masterdata.access:edit')
  async updateApprovalWorkflow(@Param('id') documentTypeId: string, @Body() dto: { levels: number; steps: string[] }) {
    return this.adminService.updateApprovalWorkflow(documentTypeId, dto);
  }

  @Get('signatures')
  @Permissions('masterdata.access:view')
  async getSignatures() {
    return this.adminService.getSignatures();
  }

  @Get('audit-logs')
  @Permissions('auditlog.access:view')
  async getAuditLogs(
    @Query('search') search?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs(search, action);
  }

  @Get('approval-matrix')
  @Permissions('masterdata.access:view')
  async getApprovalMatrix() {
    return this.adminService.getApprovalMatrix();
  }

  @Post('approval-matrix')
  @Permissions('masterdata.access:edit')
  async createApprovalMatrixStep(@Body() dto: any) {
    return this.adminService.createApprovalMatrixStep(dto);
  }

  @Patch('approval-matrix/:id')
  @Permissions('masterdata.access:edit')
  async updateApprovalMatrixStep(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateApprovalMatrixStep(id, dto);
  }

  @Patch('running-numbers/:id')
  @Permissions('masterdata.access:edit')
  async updateRunningNumber(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateRunningNumber(id, dto);
  }
}
