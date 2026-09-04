import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  Res,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { Response } from 'express';
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
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ) {
    return this.documentsService.findAll({
      status,
      type,
      search,
      page,
      limit,
      currentUserId: user?.id,
      currentUserRole: user?.role,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user?: any, @Req() req?: Request) {
    const doc = await this.documentsService.findOne(id);
    if (user && req) {
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      this.documentsService.logAction(user.id, 'View', doc.real_id, Array.isArray(ip) ? ip[0] : ip, doc.id);
    }
    return doc;
  }

  @Get(':id/versions')
  async findVersions(@Param('id') id: string) {
    const doc = await this.documentsService.findOne(id);
    return doc.versions || [];
  }

  @Get(':id/signed-url')
  async getSignedUrl(@Param('id') id: string) {
    return this.documentsService.getLatestVersionDownloadUrl(id);
  }

  @Get(':id/download')
  async downloadFile(
    @Param('id') id: string,
    @Res() res: any,
    @Query('v') version?: number,
    @CurrentUser() user?: any,
    @Req() req?: Request,
  ) {
    const buffer = await this.documentsService.getFileBuffer(id, version);
    if (user && req) {
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      // Find doc real_id from getFileBuffer (it doesn't return id, so let's use the param id)
      this.documentsService.logAction(user.id, 'Download', id, Array.isArray(ip) ? ip[0] : ip, id);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="document-${id}.pdf"`);
    res.send(buffer);
  }

  @Post()
  async create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.create(dto, user.id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    if (!body.title) {
      throw new BadRequestException('กรุณาระบุชื่อเอกสาร');
    }

    let approverIds: string[] = [];
    if (body.approver_ids) {
      try {
        approverIds =
          typeof body.approver_ids === 'string'
            ? JSON.parse(body.approver_ids)
            : body.approver_ids;
      } catch {
        approverIds = [];
      }
    }

    const dto: CreateDocumentDto = {
      title: body.title,
      prefix: body.prefix || 'DOC',
      purpose: body.purpose,
      items: body.items ? JSON.parse(body.items) : [],
    };

    return this.documentsService.createWithFile(dto, user.id, file, approverIds);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.softDelete(id, {
      id: user.id,
      role: user.role,
    });
  }
}
