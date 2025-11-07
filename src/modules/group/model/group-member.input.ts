import { ApiProperty } from '@nestjs/swagger';

export class AddGroupMemberInput {
    @ApiProperty({ description: 'User ID to add to the group', example: 2 })
    public readonly userId: number;

    @ApiProperty({ description: 'Role ID to assign to the user', example: 1 })
    public readonly roleId: number;
}

export class UpdateGroupMemberRoleInput {
    @ApiProperty({ description: 'New role ID for the member', example: 2 })
    public readonly roleId: number;
}
