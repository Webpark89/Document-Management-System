import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import type { Request, Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { permissions, requirePermission } from '../common/document-policy';
import type { Actor } from '../common/document-policy';

const pdfPipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
    new FileTypeValidator({ fileType: 'application/pdf' }),
  ],
});

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll(
    @CurrentUser() user: Actor,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.documentsService.findAll({
      status,
      type,
      search,
      page,
      limit,
      currentUserId: user.id,
    });
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: Actor,
    @Req() request: Request,
  ) {
    const doc = await this.documentsService.findOne(id, user);
    await this.documentsService.logAction(
      user.id,
      'View',
      doc.real_id,
      request.ip ?? '',
      doc.doc_number,
    );
    return doc;
  }

  @Get(':id/versions')
  async versions(@Param('id') id: string, @CurrentUser() user: Actor) {
    requirePermission(user, permissions.history);
    return (await this.documentsService.findOne(id, user)).versions;
  }

  @Get(':id/signed-url')
  signedUrl(@Param('id') id: string, @CurrentUser() user: Actor) {
    return this.documentsService.getLatestVersionDownloadUrl(id, user);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: Actor,
    @Res() response: Response,
    @Req() request: Request,
    @Query('v') version?: string,
    @Query('download') download?: string,
  ) {
    const { buffer, filename } = await this.documentsService.getFileBuffer(
      id,
      version === undefined ? undefined : Number(version),
      user,
      !(download === 'true' || download === '1'),
    );
    const doc = await this.documentsService.getDocument(id);
    await this.documentsService.logAction(
      user.id,
      'Download',
      doc.id,
      request.ip ?? '',
      doc.doc_number,
    );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader(
      'Content-Disposition',
      `${download === 'true' || download === '1' ? 'attachment' : 'inline'}; filename="document.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    response.send(buffer);
  }

  @Get(':id/versions/:version/signatures/:step')
  async signature(
    @Param('id') id: string,
    @Param('version') version: string,
    @Param('step') step: string,
    @CurrentUser() user: Actor,
    @Res() response: Response,
  ) {
    const image = await this.documentsService.getVersionSignature(
      id,
      Number(version),
      Number(step),
      user,
    );
    response.setHeader('Content-Type', image.mimeType);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.send(image.buffer);
  }

  @Post()
  create(@Body() dto: CreateDocumentDto, @CurrentUser() user: Actor) {
    return this.documentsService.create(dto, user.id);
  }

  private async uploadDto(
    body: Record<string, string>,
  ): Promise<CreateDocumentDto> {
    try {
      const value = body.payload
        ? JSON.parse(body.payload)
        : {
            ...body,
            prefix: body.prefix || 'DOC',
            items: body.items ? JSON.parse(body.items) : undefined,
            visibility: body.visibility
              ? JSON.parse(body.visibility)
              : undefined,
          };
      const dto = plainToInstance(CreateDocumentDto, value);
      await validateOrReject(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      return dto;
    } catch {
      throw new BadRequestException('ข้อมูลเอกสารไม่ถูกต้อง');
    }
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  async upload(
    @UploadedFile(pdfPipe) file: Express.Multer.File,
    @Body() body: Record<string, string>,
    @CurrentUser() user: Actor,
  ) {
    return this.documentsService.createWithFile(
      await this.uploadDto(body),
      user.id,
      file,
    );
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: Actor,
  ) {
    return this.documentsService.updateDocumentFull(id, dto, user.id);
  }

  @Put(':id/upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  async updateUpload(
    @Param('id') id: string,
    @UploadedFile(pdfPipe) file: Express.Multer.File,
    @Body() body: Record<string, string>,
    @CurrentUser() user: Actor,
  ) {
    return this.documentsService.updateDocumentFullWithFile(
      id,
      await this.uploadDto(body),
      user.id,
      file,
    );
  }

  @Post(':id/upload-new-version')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  uploadVersion(
    @Param('id') id: string,
    @UploadedFile(pdfPipe) file: Express.Multer.File,
    @Body() body: { title?: string; remarks?: string },
    @CurrentUser() user: Actor,
  ) {
    return this.documentsService.uploadNewVersion(
      id,
      user.id,
      file,
      body.title,
      body.remarks,
    );
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: Actor,
  ) {
    return this.documentsService.cancel(
      id,
      user,
      String(body.reason ?? '').slice(0, 5000),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: Actor) {
    return this.documentsService.softDelete(id, user);
  }
}
