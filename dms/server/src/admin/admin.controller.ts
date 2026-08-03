import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { CreateUserDto } from './dto/create-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Administrator')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id/toggle-active')
  async toggleUserActive(@Param('id') id: string) {
    return this.adminService.toggleUserActive(id);
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateUser(id, dto);
  }

  @Post('users/:id/reset-password')
  async resetUserPassword(@Param('id') id: string, @Body() dto: { password_hash: string }) {
    // Note: client passes password, but schema or DTO needs to hash it.
    return this.adminService.resetUserPassword(id, dto.password_hash);
  }

  @Get('roles')
  async getRoles() {
    return this.adminService.getRoles();
  }

  @Post('roles')
  async createRole(@Body('name') name: string) {
    return this.adminService.createRole(name);
  }

  @Get('departments')
  async getDepartments() {
    return this.adminService.getDepartments();
  }

  @Post('departments')
  async createDepartment(@Body() dto: { name: string }) {
    return this.adminService.createDepartment(dto.name);
  }

  @Patch('departments/:id')
  async updateDepartment(@Param('id') id: string, @Body() dto: { name?: string; is_active?: boolean }) {
    return this.adminService.updateDepartment(id, dto);
  }

  @Get('positions')
  async getPositions() {
    return this.adminService.getPositions();
  }

  @Post('positions')
  async createPosition(@Body() dto: { name: string; level?: string }) {
    return this.adminService.createPosition(dto);
  }

  @Patch('positions/:id')
  async updatePosition(@Param('id') id: string, @Body() dto: { name?: string; level?: string; is_active?: boolean }) {
    return this.adminService.updatePosition(id, dto);
  }

  @Get('document-types')
  async getDocumentTypes() {
    return this.adminService.getDocumentTypes();
  }

  @Post('document-types')
  async createDocumentType(@Body() dto: { type_name: string; prefix: string }) {
    return this.adminService.createDocumentType(dto);
  }

  @Patch('document-types/:id')
  async updateDocumentType(@Param('id') id: string, @Body() dto: { type_name?: string; prefix?: string; is_active?: boolean }) {
    return this.adminService.updateDocumentType(id, dto);
  }

  @Get('workflows')
  async getApprovalWorkflows() {
    return this.adminService.getApprovalWorkflows();
  }

  @Patch('workflows/:id')
  async updateApprovalWorkflow(@Param('id') documentTypeId: string, @Body() dto: { levels: number; steps: string[] }) {
    return this.adminService.updateApprovalWorkflow(documentTypeId, dto);
  }

  @Get('signatures')
  async getSignatures() {
    return this.adminService.getSignatures();
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('search') search?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs(search, action);
  }

  @Get('approval-matrix')
  async getApprovalMatrix() {
    return this.adminService.getApprovalMatrix();
  }

  @Post('approval-matrix')
  async createApprovalMatrixStep(@Body() dto: any) {
    return this.adminService.createApprovalMatrixStep(dto);
  }

  @Patch('approval-matrix/:id')
  async updateApprovalMatrixStep(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateApprovalMatrixStep(id, dto);
  }

  @Patch('running-numbers/:id')
  async updateRunningNumber(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateRunningNumber(id, dto);
  }
}
