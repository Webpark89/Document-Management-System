import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('me/signature')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSignature(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadSignature(req.user.id, file);
  }
}
