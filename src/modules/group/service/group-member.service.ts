import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common';
import { GroupMemberData, AddGroupMemberInput, UpdateGroupMemberRoleInput } from '../model';
import { GroupService } from './group.service';

@Injectable()
export class GroupMemberService {

    public constructor(
        private readonly prismaService: PrismaService,
        private readonly groupService: GroupService
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
     * Add a member to a group
     *
     * @param groupId Group ID
     * @param userId User ID (for permission check)
     * @param data Member details
     * @returns A member created in the database
     */
    public async addMember(groupId: number, userId: number, data: AddGroupMemberInput): Promise<GroupMemberData> {
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

        const member = await this.prismaService.groupMember.create({
            data: {
                groupId,
                userId: data.userId,
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

        return new GroupMemberData(member);
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

        await this.prismaService.groupMember.delete({
            where: { id: memberId }
        });
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

        await this.prismaService.groupMember.delete({
            where: { id: member.id }
        });
    }

}
