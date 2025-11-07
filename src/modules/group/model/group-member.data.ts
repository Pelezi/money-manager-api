import { ApiProperty } from '@nestjs/swagger';
import { GroupMember } from '@prisma/client';
import { GroupRoleData } from './group-role.data';

export class GroupMemberData {

    @ApiProperty({ description: 'Member unique ID', example: 1 })
    public readonly id: number;

    @ApiProperty({ description: 'Group ID', example: 1 })
    public readonly groupId: number;

    @ApiProperty({ description: 'User ID', example: 1 })
    public readonly userId: number;

    @ApiProperty({ description: 'Role ID', example: 1 })
    public readonly roleId: number;

    @ApiProperty({ description: 'Joined at', example: '2024-01-01T00:00:00Z' })
    public readonly joinedAt: Date;

    @ApiProperty({ description: 'Updated at', example: '2024-01-01T00:00:00Z' })
    public readonly updatedAt: Date;

    @ApiProperty({ description: 'User details', required: false })
    public readonly user?: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    };

    @ApiProperty({ description: 'Role details', type: GroupRoleData, required: false })
    public readonly role?: GroupRoleData;

    public constructor(entity: GroupMember & { user?: any; role?: any }) {
        this.id = entity.id;
        this.groupId = entity.groupId;
        this.userId = entity.userId;
        this.roleId = entity.roleId;
        this.joinedAt = entity.joinedAt;
        this.updatedAt = entity.updatedAt;
        
        if (entity.user) {
            this.user = {
                id: entity.user.id,
                email: entity.user.email,
                firstName: entity.user.firstName,
                lastName: entity.user.lastName
            };
        }
        
        if (entity.role) {
            this.role = new GroupRoleData(entity.role);
        }
    }

}
