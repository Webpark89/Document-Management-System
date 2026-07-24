import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(user: any): Promise<{
        id: string;
        user_id: string;
        document_id: string | null;
        message: string;
        is_read: boolean;
        created_at: Date;
    }[]>;
    getUnreadCount(user: any): Promise<{
        count: number;
    }>;
    markAllAsRead(user: any): Promise<{
        success: boolean;
        count: number;
    }>;
    markAsRead(id: string, user: any): Promise<{
        success: boolean;
        count: number;
    }>;
}
