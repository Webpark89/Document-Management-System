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
import type { Actor } from '../common/document-policy';
@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private folders: FoldersService) {}
  @Get() all(@CurrentUser() user: Actor) {
    return this.folders.findAll(user);
  }
  @Get(':id') one(@Param('id') id: string, @CurrentUser() user: Actor) {
    return this.folders.findOne(id, user);
  }
  @Post() create(@Body() dto: CreateFolderDto, @CurrentUser() user: Actor) {
    return this.folders.create(dto, user);
  }
  @Put(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @CurrentUser() user: Actor,
  ) {
    return this.folders.update(id, dto, user);
  }
  @Delete(':id') remove(@Param('id') id: string, @CurrentUser() user: Actor) {
    return this.folders.remove(id, user);
  }
  @Post('move-doc') move(
    @Body() dto: MoveDocumentDto,
    @CurrentUser() user: Actor,
  ) {
    return this.folders.moveDocument(dto, user);
  }
}
