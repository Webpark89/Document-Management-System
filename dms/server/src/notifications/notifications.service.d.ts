import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserNotifications(userId: string): Promise<{
        id: string;
        user_id: string;
        document_id: string | null;
        message: string;
        is_read: boolean;
        created_at: Date;
    }[]>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
    markAsRead(id: string, userId: string): Promise<{
        success: boolean;
        count: number;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
        count: number;
    }>;
}
