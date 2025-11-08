import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common';
import { GroupMemberData, AddGroupMemberInput, UpdateGroupMemberRoleInput, GroupInvitationData } from '../model';
import { GroupService } from './group.service';
import { NotificationService } from '../../notification/service';

@Injectable()
export class GroupMemberService {

    public constructor(
        private readonly prismaService: PrismaService,
        private readonly groupService: GroupService,
        private readonly notificationService: NotificationService
    ) { }

    /**
     * Find all members of a group
     *
     * @param groupId Group ID
     * @param userId User ID (for permission check)
     * @returns A list of members
     */
    public async findByGroup(groupId: number, userId: number): Promise<GroupMemberData[]> {
        // Check if user is a member of the group
        const isMember = await this.groupService.isMember(groupId, userId);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this group');
        }

        const members = await this.prismaService.groupMember.findMany({
            where: { groupId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                role: true
            },
            orderBy: { joinedAt: 'asc' }
        });

        return members.map(member => new GroupMemberData(member));
    }

    /**
     * Invite a member to a group (creates an invitation)
     *
     * @param groupId Group ID
     * @param userId User ID (for permission check)
     * @param data Member details
     * @returns An invitation created in the database
     */
    public async addMember(groupId: number, userId: number, data: AddGroupMemberInput): Promise<GroupInvitationData> {
        // Check if user has permission to manage the group
        const hasPermission = await this.groupService.checkManageGroupPermission(groupId, userId);
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to manage members in this group');
        }

        // Check if user to add exists
        const userToAdd = await this.prismaService.user.findUnique({
            where: { id: data.userId }
        });

        if (!userToAdd) {
            throw new NotFoundException('User not found');
        }

        // Check if user is already a member
        const existingMember = await this.prismaService.groupMember.findFirst({
            where: {
                groupId,
                userId: data.userId
            }
        });

        if (existingMember) {
            throw new ConflictException('User is already a member of this group');
        }

        // Check if there's already a pending invitation
        const existingInvitation = await this.prismaService.groupInvitation.findFirst({
            where: {
                groupId,
                userId: data.userId,
                status: 'PENDING'
            }
        });

        if (existingInvitation) {
            throw new ConflictException('User already has a pending invitation to this group');
        }

        // Check if role exists and belongs to the group
        const role = await this.prismaService.groupRole.findFirst({
            where: {
                id: data.roleId,
                groupId
            }
        });

        if (!role) {
            throw new BadRequestException('Role not found or does not belong to this group');
        }

        const group = await this.prismaService.group.findUnique({
            where: { id: groupId }
        });

        // Create invitation
        const invitation = await this.prismaService.groupInvitation.create({
            data: {
                groupId,
                userId: data.userId,
                invitedBy: userId,
                roleId: data.roleId
            },
            include: {
                group: true,
                inviter: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                role: true
            }
        });

        // Get current user info
        const inviter = await this.prismaService.user.findUnique({
            where: { id: userId }
        });

        // Create notification for the invited user
        await this.notificationService.create(
            data.userId,
            'GROUP_INVITATION',
            'Group Invitation',
            `${inviter?.firstName} ${inviter?.lastName} has invited you to join ${group?.name}`,
            { groupId, invitationId: invitation.id }
        );

        return new GroupInvitationData(invitation);
    }

    /**
     * Update a member's role
     *
     * @param groupId Group ID
     * @param memberId Member ID
     * @param userId User ID (for permission check)
     * @param data Update details
     * @returns Updated member
     */
    public async updateMemberRole(groupId: number, memberId: number, userId: number, data: UpdateGroupMemberRoleInput): Promise<GroupMemberData> {
        // Check if user has permission to manage the group
        const hasPermission = await this.groupService.checkManageGroupPermission(groupId, userId);
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to manage members in this group');
        }

        const member = await this.prismaService.groupMember.findFirst({
            where: {
                id: memberId,
                groupId
            }
        });

        if (!member) {
            throw new NotFoundException('Member not found in this group');
        }

        // Check if role exists and belongs to the group
        const role = await this.prismaService.groupRole.findFirst({
            where: {
                id: data.roleId,
                groupId
            }
        });

        if (!role) {
            throw new BadRequestException('Role not found or does not belong to this group');
        }

        // Don't allow changing the owner's role
        const group = await this.prismaService.group.findUnique({
            where: { id: groupId }
        });

        if (group?.ownerId === member.userId) {
            throw new ForbiddenException('Cannot change the role of the group owner');
        }

        const updated = await this.prismaService.groupMember.update({
            where: { id: memberId },
            data: {
                roleId: data.roleId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                role: true
            }
        });

        return new GroupMemberData(updated);
    }

    /**
     * Remove a member from a group
     *
     * @param groupId Group ID
     * @param memberId Member ID
     * @param userId User ID (for permission check)
     */
    public async removeMember(groupId: number, memberId: number, userId: number): Promise<void> {
        // Check if user has permission to manage the group
        const hasPermission = await this.groupService.checkManageGroupPermission(groupId, userId);
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to manage members in this group');
        }

        const member = await this.prismaService.groupMember.findFirst({
            where: {
                id: memberId,
                groupId
            }
        });

        if (!member) {
            throw new NotFoundException('Member not found in this group');
        }

        // Don't allow removing the owner
        const group = await this.prismaService.group.findUnique({
            where: { id: groupId }
        });

        if (group?.ownerId === member.userId) {
            throw new ForbiddenException('Cannot remove the group owner from the group');
        }

        const removedUser = await this.prismaService.user.findUnique({
            where: { id: member.userId }
        });

        await this.prismaService.groupMember.delete({
            where: { id: memberId }
        });

        // Notify other group members
        const members = await this.prismaService.groupMember.findMany({
            where: { groupId }
        });

        for (const m of members) {
            await this.notificationService.create(
                m.userId,
                'GROUP_MEMBER_LEFT',
                'Member Removed',
                `${removedUser?.firstName} ${removedUser?.lastName} was removed from ${group?.name}`,
                { groupId }
            );
        }
    }

    /**
     * Leave a group (self-removal)
     *
     * @param groupId Group ID
     * @param userId User ID
     */
    public async leaveGroup(groupId: number, userId: number): Promise<void> {
        const member = await this.prismaService.groupMember.findFirst({
            where: {
                groupId,
                userId
            }
        });

        if (!member) {
            throw new NotFoundException('You are not a member of this group');
        }

        // Don't allow owner to leave
        const group = await this.prismaService.group.findUnique({
            where: { id: groupId }
        });

        if (group?.ownerId === userId) {
            throw new ForbiddenException('Group owner cannot leave the group. Transfer ownership or delete the group instead.');
        }

        const user = await this.prismaService.user.findUnique({
            where: { id: userId }
        });

        await this.prismaService.groupMember.delete({
            where: { id: member.id }
        });

        // Notify other group members
        const members = await this.prismaService.groupMember.findMany({
            where: { groupId }
        });

        for (const m of members) {
            await this.notificationService.create(
                m.userId,
                'GROUP_MEMBER_LEFT',
                'Member Left',
                `${user?.firstName} ${user?.lastName} has left ${group?.name}`,
                { groupId }
            );
        }
    }

}
