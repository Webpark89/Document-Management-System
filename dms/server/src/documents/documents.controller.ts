import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.documentsService.findAll(status, type, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/versions')
  async findVersions(@Param('id') id: string) {
    const doc = await this.documentsService.findOne(id);
    return doc.versions || [];
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.create(dto, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.documentsService.softDelete(id);
  }
}
