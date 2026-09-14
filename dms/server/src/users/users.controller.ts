import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/signature-url')
  async getMySignatureUrl(@Request() req: Request & { user: { id: string } }) {
    return this.usersService.getMySignatureUrl(req.user.id);
  }

  @Get(':id/signature')
  async getSignatureImage(@Param('id') id: string, @Res() res: Response) {
    const { buffer, mimeType } = await this.usersService.getSignatureBuffer(id);
    res.setHeader('Content-Type', mimeType);
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/signature')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSignature(
    @Request() req: Request & { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadSignature(req.user.id, file);
  }
}
