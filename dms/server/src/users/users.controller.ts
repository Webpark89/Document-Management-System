import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { requirePermission } from '../common/document-policy';
import type { Actor } from '../common/document-policy';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('me/signature-url') getMySignature(@CurrentUser() user: Actor) {
    return this.usersService.getMySignatureUrl(user.id);
  }
  @Get(':id/signature')
  async signature(
    @Param('id') id: string,
    @CurrentUser() user: Actor,
    @Res() response: Response,
  ) {
    const image = await this.usersService.getSignatureBuffer(id, user);
    response.setHeader('Content-Type', image.mimeType);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.send(image.buffer);
  }
  @Post('me/signature')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: Actor,
  ) {
    requirePermission(user, [
      'profile.upload_signature:edit',
      'approvals.place_signature:approve',
    ]);
    return this.usersService.uploadSignature(user.id, file);
  }
}
