import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationData {

    @ApiProperty({
        description: 'Notification ID',
        example: 1
    })
    public id: number;

    @ApiProperty({
        description: 'User ID who receives the notification',
        example: 1
    })
    public userId: number;

    @ApiProperty({
        description: 'Type of notification',
        enum: NotificationType,
        example: NotificationType.GROUP_INVITATION
    })
    public type: NotificationType;

    @ApiProperty({
        description: 'Notification title',
        example: 'Group Invitation'
    })
    public title: string;

    @ApiProperty({
        description: 'Notification message',
        example: 'You have been invited to join the Family Budget group'
    })
    public message: string;

    @ApiProperty({
        description: 'Whether the notification has been read',
        example: false
    })
    public isRead: boolean;

    @ApiProperty({
        description: 'Additional metadata',
        example: { groupId: 1, invitationId: 5 },
        required: false
    })
    public metadata?: any;

    @ApiProperty({
        description: 'Creation date',
        example: '2024-11-07T00:00:00.000Z'
    })
    public createdAt: Date;

    public constructor(data: any) {
        this.id = data.id;
        this.userId = data.userId;
        this.type = data.type;
        this.title = data.title;
        this.message = data.message;
        this.isRead = data.isRead;
        this.metadata = data.metadata;
        this.createdAt = data.createdAt;
    }

}
