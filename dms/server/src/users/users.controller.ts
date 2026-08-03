import { Controller, Post, Get, UseInterceptors, UploadedFile, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/signature-url')
  async getMySignatureUrl(@Request() req) {
    return this.usersService.getMySignatureUrl(req.user.id);
  }

  @Post('me/signature')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSignature(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadSignature(req.user.id, file);
  }
}
