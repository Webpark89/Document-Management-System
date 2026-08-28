import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MoveDocumentDto } from './dto/move-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    const roleName = user.role?.name || user.role || 'Employee';
    const deptId = user.department_id || user.department?.id;
    return this.foldersService.findAll(user.id, roleName, deptId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const roleName = user.role?.name || user.role || 'Employee';
    const deptId = user.department_id || user.department?.id;
    return this.foldersService.findOne(id, user.id, roleName, deptId);
  }

  @Post()
  async create(@Body() dto: CreateFolderDto, @CurrentUser() user: any) {
    return this.foldersService.create(dto, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @CurrentUser() user: any
  ) {
    const roleName = user.role?.name || user.role || 'Employee';
    return this.foldersService.update(id, dto, user.id, roleName);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const roleName = user.role?.name || user.role || 'Employee';
    return this.foldersService.remove(id, user.id, roleName);
  }

  @Post('move-doc')
  async moveDocument(@Body() dto: MoveDocumentDto, @CurrentUser() user: any) {
    const roleName = user.role?.name || user.role || 'Employee';
    return this.foldersService.moveDocument(dto, user.id, roleName);
  }
}
