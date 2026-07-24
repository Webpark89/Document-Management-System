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

import { CreateUserDto } from './dto/create-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
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

  @Get('positions')
  async getPositions() {
    return this.adminService.getPositions();
  }

  @Get('document-types')
  async getDocumentTypes() {
    return this.adminService.getDocumentTypes();
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('search') search?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs(search, action);
  }
}
