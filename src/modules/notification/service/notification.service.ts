import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common';
import { NotificationData } from '../model';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    /**
     * Find all notifications for a user
     *
     * @param userId User ID
     * @param unreadOnly Whether to return only unread notifications
     * @returns A list of notifications
     */
    public async findByUser(userId: number, unreadOnly: boolean = false): Promise<NotificationData[]> {
        const notifications = await this.prismaService.notification.findMany({
            where: {
                userId,
                ...(unreadOnly ? { isRead: false } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit to 100 most recent notifications
        });

        return notifications.map(notification => new NotificationData(notification));
    }

    /**
     * Mark notification as read
     *
     * @param id Notification ID
     * @param userId User ID (for permission check)
     */
    public async markAsRead(id: number, userId: number): Promise<void> {
        await this.prismaService.notification.updateMany({
            where: {
                id,
                userId
            },
            data: {
                isRead: true
            }
        });
    }

    /**
     * Mark all notifications as read for a user
     *
     * @param userId User ID
     */
    public async markAllAsRead(userId: number): Promise<void> {
        await this.prismaService.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });
    }

    /**
     * Create a notification
     *
     * @param userId User ID who receives the notification
     * @param type Notification type
     * @param title Notification title
     * @param message Notification message
     * @param metadata Additional metadata
     */
    public async create(
        userId: number,
        type: NotificationType,
        title: string,
        message: string,
        metadata?: any
    ): Promise<NotificationData> {
        const notification = await this.prismaService.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                metadata
            }
        });

        return new NotificationData(notification);
    }

    /**
     * Delete a notification
     *
     * @param id Notification ID
     * @param userId User ID (for permission check)
     */
    public async delete(id: number, userId: number): Promise<void> {
        await this.prismaService.notification.deleteMany({
            where: {
                id,
                userId
            }
        });
    }

    /**
     * Get unread notification count
     *
     * @param userId User ID
     * @returns Count of unread notifications
     */
    public async getUnreadCount(userId: number): Promise<number> {
        return await this.prismaService.notification.count({
            where: {
                userId,
                isRead: false
            }
        });
    }

}
