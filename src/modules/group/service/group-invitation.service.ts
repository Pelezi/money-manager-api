import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common';
import { GroupInvitationData } from '../model';
import { GroupService } from './group.service';
import { NotificationService } from '../../notification/service';

@Injectable()
export class GroupInvitationService {

    public constructor(
        private readonly prismaService: PrismaService,
        private readonly groupService: GroupService,
        private readonly notificationService: NotificationService
    ) { }

    /**
     * Find all pending invitations for a user
     *
     * @param userId User ID
     * @returns A list of pending invitations
     */
    public async findPendingByUser(userId: number): Promise<GroupInvitationData[]> {
        const invitations = await this.prismaService.groupInvitation.findMany({
            where: {
                userId,
                status: 'PENDING'
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
            },
            orderBy: { createdAt: 'desc' }
        });

        return invitations.map(invitation => new GroupInvitationData(invitation));
    }

    /**
     * Find all invitations for a group
     *
     * @param groupId Group ID
     * @param userId User ID (for permission check)
     * @returns A list of invitations
     */
    public async findByGroup(groupId: number, userId: number): Promise<GroupInvitationData[]> {
        // Check if user has permission to manage the group
        const hasPermission = await this.groupService.checkManageGroupPermission(groupId, userId);
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to view invitations for this group');
        }

        const invitations = await this.prismaService.groupInvitation.findMany({
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
                inviter: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                role: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return invitations.map(invitation => new GroupInvitationData(invitation));
    }

    /**
     * Accept a group invitation
     *
     * @param invitationId Invitation ID
     * @param userId User ID (must be the invited user)
     */
    public async accept(invitationId: number, userId: number): Promise<void> {
        const invitation = await this.prismaService.groupInvitation.findFirst({
            where: {
                id: invitationId,
                userId,
                status: 'PENDING'
            },
            include: {
                group: true
            }
        });

        if (!invitation) {
            throw new NotFoundException('Invitation not found or already processed');
        }

        // Create group member
        await this.prismaService.groupMember.create({
            data: {
                groupId: invitation.groupId,
                userId: invitation.userId,
                roleId: invitation.roleId
            }
        });

        // Update invitation status
        await this.prismaService.groupInvitation.update({
            where: { id: invitationId },
            data: { status: 'ACCEPTED' }
        });

        // Notify group members about the new member
        const members = await this.prismaService.groupMember.findMany({
            where: { groupId: invitation.groupId }
        });

        const user = await this.prismaService.user.findUnique({
            where: { id: userId }
        });

        for (const member of members) {
            if (member.userId !== userId) {
                await this.notificationService.create(
                    member.userId,
                    'GROUP_MEMBER_JOINED',
                    'New Member Joined',
                    `${user?.firstName} ${user?.lastName} has joined ${invitation.group.name}`,
                    { groupId: invitation.groupId, userId }
                );
            }
        }
    }

    /**
     * Decline a group invitation
     *
     * @param invitationId Invitation ID
     * @param userId User ID (must be the invited user)
     */
    public async decline(invitationId: number, userId: number): Promise<void> {
        const invitation = await this.prismaService.groupInvitation.findFirst({
            where: {
                id: invitationId,
                userId,
                status: 'PENDING'
            }
        });

        if (!invitation) {
            throw new NotFoundException('Invitation not found or already processed');
        }

        // Update invitation status
        await this.prismaService.groupInvitation.update({
            where: { id: invitationId },
            data: { status: 'DECLINED' }
        });
    }

    /**
     * Cancel a group invitation
     *
     * @param invitationId Invitation ID
     * @param userId User ID (for permission check)
     */
    public async cancel(invitationId: number, userId: number): Promise<void> {
        const invitation = await this.prismaService.groupInvitation.findUnique({
            where: { id: invitationId },
            include: { group: true }
        });

        if (!invitation) {
            throw new NotFoundException('Invitation not found');
        }

        // Check if user has permission to manage the group
        const hasPermission = await this.groupService.checkManageGroupPermission(invitation.groupId, userId);
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to cancel this invitation');
        }

        if (invitation.status !== 'PENDING') {
            throw new BadRequestException('Cannot cancel an invitation that has already been processed');
        }

        // Delete the invitation
        await this.prismaService.groupInvitation.delete({
            where: { id: invitationId }
        });
    }

}
