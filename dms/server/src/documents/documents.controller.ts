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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/versions')
  async findVersions(@Param('id') id: string) {
    const doc = await this.documentsService.findOne(id);
    return doc.versions || [];
  }

  /**
   * GET /documents/:id/signed-url
   * คืน Signed URL ของ PDF ล่าสุด (อายุ 1 ชั่วโมง) สำหรับให้ Frontend แสดงผล
   */
  @Get(':id/signed-url')
  async getSignedUrl(@Param('id') id: string) {
    return this.documentsService.getLatestVersionSignedUrl(id);
  }

  /**
   * GET /documents/file/*
   * เสิร์ฟไฟล์ PDF จาก Storage สำหรับ Local / Presigned URL fallback
   */
  @Get('file/*key')
  async streamFile(@Param('key') key: string, @Res() res: any) {
    const decodedKey = decodeURIComponent(Array.isArray(key) ? key.join('/') : key);
    const buffer = await this.documentsService.getFileBuffer(decodedKey);
    
    let contentType = 'application/octet-stream';
    const ext = decodedKey.toLowerCase().split('.').pop();
    if (ext === 'pdf') {
      contentType = 'application/pdf';
    } else if (ext === 'png') {
      contentType = 'image/png';
    } else if (ext === 'jpg' || ext === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === 'svg') {
      contentType = 'image/svg+xml';
    }
    
    res.setHeader('Content-Type', contentType);
    res.send(buffer);
  }

  /**
   * POST /documents
   * สร้างเอกสารแบบไม่มีไฟล์ PDF (Draft เปล่า)
   */
  @Post()
  async create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.create(dto, user.id);
  }

  /**
   * POST /documents/upload
   * สร้างเอกสาร + อัปโหลดไฟล์ PDF พร้อมกันทีเดียว
   * Form fields: title, prefix, purpose, approver_ids (JSON array)
   * File field: file (PDF เท่านั้น, max 20MB)
   */
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

  /**
   * DELETE /documents/:id
   * Soft delete (is_deleted = true)
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.softDelete(id, {
      id: user.id,
      role: user.role,
    });
  }
}
