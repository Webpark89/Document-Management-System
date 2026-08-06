import { Controller, Post, Get, Param, Res, UseInterceptors, UploadedFile, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/signature-url')
  async getMySignatureUrl(@Request() req) {
    return this.usersService.getMySignatureUrl(req.user.id);
  }

  @Get(':id/signature')
  async getSignatureImage(@Param('id') id: string, @Res() res: any) {
    const { buffer, mimeType } = await this.usersService.getSignatureBuffer(id);
    res.setHeader('Content-Type', mimeType);
    res.send(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/signature')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSignature(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadSignature(req.user.id, file);
  }
}
