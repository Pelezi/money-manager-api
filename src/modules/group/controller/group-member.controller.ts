import { AuthenticatedRequest } from '../../common';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

import { RestrictedGuard } from '../../common';

import { GroupMemberData, AddGroupMemberInput, UpdateGroupMemberRoleInput, GroupInvitationData } from '../model';
import { GroupMemberService } from '../service';

@Controller('groups/:groupId/members')
@ApiTags('group-members')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class GroupMemberController {

    public constructor(
        private readonly groupMemberService: GroupMemberService
    ) { }

    @Get()
    @ApiParam({ name: 'groupId', description: 'Group ID' })
    @ApiOperation({
        summary: 'List all members of a group',
        description: 'Returns all users who are members of the group, including their assigned roles and user information. Users must be members of the group to view its members.'
    })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: GroupMemberData, description: 'List of members returned successfully' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is not a member of this group' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async find(@Param('groupId') groupId: string, @Request() req: AuthenticatedRequest): Promise<GroupMemberData[]> {
        const userId = req?.user?.userId || 1;
        return this.groupMemberService.findByGroup(parseInt(groupId), userId);
    }

    @Post()
    @ApiParam({ name: 'groupId', description: 'Group ID' })
    @ApiOperation({
        summary: 'Invite a user to the group',
        description: 'Sends an invitation to a user to join the group. The user will receive a notification and can accept or decline the invitation. Requires the canManageGroup permission.'
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: GroupInvitationData, description: 'Invitation sent successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User or role not found' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User is already a member or has a pending invitation' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User does not have permission to manage members' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data provided or role does not belong to this group' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async addMember(
        @Param('groupId') groupId: string,
        @Body() input: AddGroupMemberInput,
        @Request() req: AuthenticatedRequest
    ): Promise<GroupInvitationData> {
        const userId = req?.user?.userId || 1;
        return this.groupMemberService.addMember(parseInt(groupId), userId, input);
    }

    @Put(':memberId/role')
    @ApiParam({ name: 'groupId', description: 'Group ID' })
    @ApiParam({ name: 'memberId', description: 'Member ID to update' })
    @ApiOperation({
        summary: 'Update a member\'s role',
        description: 'Changes the role assigned to a group member, which updates their permissions. Cannot change the role of the group owner. Requires the canManageGroup permission.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: GroupMemberData, description: 'Member role updated successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Member or role not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User does not have permission to manage members or cannot change owner\'s role' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data provided or role does not belong to this group' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async updateMemberRole(
        @Param('groupId') groupId: string,
        @Param('memberId') memberId: string,
        @Body() input: UpdateGroupMemberRoleInput,
        @Request() req: AuthenticatedRequest
    ): Promise<GroupMemberData> {
        const userId = req?.user?.userId || 1;
        return this.groupMemberService.updateMemberRole(parseInt(groupId), parseInt(memberId), userId, input);
    }

    @Delete(':memberId')
    @ApiParam({ name: 'groupId', description: 'Group ID' })
    @ApiParam({ name: 'memberId', description: 'Member ID to remove' })
    @ApiOperation({
        summary: 'Remove a member from the group',
        description: 'Removes a user from the group. Cannot remove the group owner - ownership must be transferred or the group deleted instead. Requires the canManageGroup permission.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Member removed successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Member not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User does not have permission to manage members or cannot remove owner' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async removeMember(
        @Param('groupId') groupId: string,
        @Param('memberId') memberId: string,
        @Request() req: AuthenticatedRequest
    ): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.groupMemberService.removeMember(parseInt(groupId), parseInt(memberId), userId);
    }

    @Post('leave')
    @ApiParam({ name: 'groupId', description: 'Group ID' })
    @ApiOperation({
        summary: 'Leave a group',
        description: 'Allows a user to remove themselves from a group. The group owner cannot leave - they must transfer ownership or delete the group instead.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Left group successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User is not a member of this group' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Group owner cannot leave. Transfer ownership or delete the group.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async leaveGroup(@Param('groupId') groupId: string, @Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.groupMemberService.leaveGroup(parseInt(groupId), userId);
    }

}
