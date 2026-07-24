import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const res = await this.prisma.notification.updateMany({
      where: { id, user_id: userId },
      data: { is_read: true },
    });
    return { success: true, count: res.count };
  }

  async markAllAsRead(userId: string) {
    const res = await this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    return { success: true, count: res.count };
  }
}
