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

interface RequestUser {
  id: string;
  role?: { name: string } | string;
  department_id?: string;
  department?: { id: string };
}

@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  async findAll(@CurrentUser() user: RequestUser) {
    const roleName =
      typeof user.role === 'string' ? user.role : user.role?.name || 'Employee';
    const deptId = user.department_id || user.department?.id;
    return this.foldersService.findAll(user.id, roleName, deptId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const roleName =
      typeof user.role === 'string' ? user.role : user.role?.name || 'Employee';
    const deptId = user.department_id || user.department?.id;
    return this.foldersService.findOne(id, user.id, roleName, deptId);
  }

  @Post()
  async create(@Body() dto: CreateFolderDto, @CurrentUser() user: RequestUser) {
    return this.foldersService.create(dto, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @CurrentUser() user: RequestUser,
  ) {
    const roleName =
      typeof user.role === 'string' ? user.role : user.role?.name || 'Employee';
    return this.foldersService.update(id, dto, user.id, roleName);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const roleName =
      typeof user.role === 'string' ? user.role : user.role?.name || 'Employee';
    return this.foldersService.remove(id, user.id, roleName);
  }

  @Post('move-doc')
  async moveDocument(@Body() dto: MoveDocumentDto) {
    return this.foldersService.moveDocument(dto);
  }
}
