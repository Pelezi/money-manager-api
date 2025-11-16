import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';

export class GroupInvitationData {

    @ApiProperty({
        description: 'Invitation ID',
        example: 1
    })
    public id: number;

    @ApiProperty({
        description: 'Group ID',
        example: 1
    })
    public groupId: number;

    @ApiProperty({
        description: 'Group name',
        example: 'Family Budget'
    })
    public groupName?: string;

    @ApiProperty({
        description: 'User ID being invited',
        example: 2
    })
    public userId: number;

    @ApiProperty({
        description: 'User ID who sent the invitation',
        example: 1
    })
    public invitedBy: number;

    @ApiProperty({
        description: 'Inviter name',
        example: 'John Doe'
    })
    public inviterName?: string;

    @ApiProperty({
        description: 'Role ID',
        example: 2
    })
    public roleId: number;

    @ApiProperty({
        description: 'Role name',
        example: 'Member'
    })
    public roleName?: string;

    @ApiProperty({
        description: 'Invitation status',
        enum: InvitationStatus,
        example: InvitationStatus.PENDING
    })
    public status: InvitationStatus;

    @ApiProperty({
        description: 'Creation date',
        example: '2024-11-07T00:00:00.000Z'
    })
    public createdAt: Date;

    @ApiProperty({
        description: 'Last update date',
        example: '2024-11-07T00:00:00.000Z'
    })
    public updatedAt: Date;

    public constructor(data: any) {
        this.id = data.id;
        this.groupId = data.groupId;
        this.groupName = data.group?.name;
        this.userId = data.userId;
        this.invitedBy = data.invitedBy;
        this.inviterName = data.inviter ? `${data.inviter.firstName} ${data.inviter.lastName}` : undefined;
        this.roleId = data.roleId;
        this.roleName = data.role?.name;
        this.status = data.status;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

}
