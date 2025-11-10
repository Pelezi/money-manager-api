import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common';
import { GroupData, GroupInput, UpdateGroupInput } from '../model';

@Injectable()
export class GroupService {

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    /**
     * Find all groups where user is a member or owner
     *
     * @param userId User ID
     * @returns A list of groups
     */
    public async findByUser(userId: number): Promise<GroupData[]> {
        const groups = await this.prismaService.group.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    {
                        members: {
                            some: { userId }
                        }
                    }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        return groups.map(group => new GroupData(group));
    }

    /**
     * Find a group by ID
     *
     * @param id Group ID
     * @param userId User ID (for permission check)
     * @returns A group or null
     */
    public async findById(id: number, userId: number): Promise<GroupData | null> {
        const group = await this.prismaService.group.findFirst({
            where: {
                id,
                OR: [
                    { ownerId: userId },
                    {
                        members: {
                            some: { userId }
                        }
                    }
                ]
            }
        });

        if (!group) {
            return null;
        }

        return new GroupData(group);
    }

    /**
     * Create a new group
     *
     * @param userId User ID (will be the owner)
     * @param data Group details
     * @returns A group created in the database
     */
    public async create(userId: number, data: GroupInput): Promise<GroupData> {
        // Create group with default roles
        const group = await this.prismaService.group.create({
            data: {
                name: data.name,
                description: data.description,
                ownerId: userId,
                roles: {
                    create: [
                        {
                            name: 'Dono',
                            description: 'Acesso total a todas as funcionalidades',
                            canViewTransactions: true,
                            canManageOwnTransactions: true,
                            canManageGroupTransactions: true,
                            canViewCategories: true,
                            canManageCategories: true,
                            canViewSubcategories: true,
                            canManageSubcategories: true,
                            canViewBudgets: true,
                            canManageBudgets: true,
                            canViewAccounts: true,
                            canManageOwnAccounts: true,
                            canManageGroupAccounts: true,
                            canManageGroup: true
                        },
                        {
                            name: 'Membro',
                            description: 'Pode ver tudo e gerenciar seus próprios dados',
                            canViewTransactions: true,
                            canManageOwnTransactions: true,
                            canManageGroupTransactions: false,
                            canViewCategories: true,
                            canManageCategories: false,
                            canViewSubcategories: true,
                            canManageSubcategories: false,
                            canViewBudgets: true,
                            canManageBudgets: false,
                            canViewAccounts: true,
                            canManageOwnAccounts: true,
                            canManageGroupAccounts: false,
                            canManageGroup: false
                        },
                        {
                            name: 'Leitor',
                            description: 'Acesso somente leitura a todas as funcionalidades',
                            canViewTransactions: true,
                            canManageOwnTransactions: false,
                            canManageGroupTransactions: false,
                            canViewCategories: true,
                            canManageCategories: false,
                            canViewSubcategories: true,
                            canManageSubcategories: false,
                            canViewBudgets: true,
                            canManageBudgets: false,
                            canViewAccounts: true,
                            canManageOwnAccounts: false,
                            canManageGroupAccounts: false,
                            canManageGroup: false
                        }
                    ]
                }
            }
        });

        // Add owner as member with Owner role
        const ownerRole = await this.prismaService.groupRole.findFirst({
            where: { groupId: group.id, name: 'Dono' }
        });

        if (ownerRole) {
            await this.prismaService.groupMember.create({
                data: {
                    groupId: group.id,
                    userId,
                    roleId: ownerRole.id
                }
            });
        }

        return new GroupData(group);
    }

    /**
     * Update a group
     *
     * @param id Group ID
     * @param userId User ID (for permission check)
     * @param data Group details
     * @returns Updated group
     */
    public async update(id: number, userId: number, data: UpdateGroupInput): Promise<GroupData> {
        // Check if user has permission to manage the group
        const hasPermission = await this.checkManageGroupPermission(id, userId);
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to manage this group');
        }

        const updated = await this.prismaService.group.update({
            where: { id },
            data
        });

        return new GroupData(updated);
    }

    /**
     * Delete a group
     *
     * @param id Group ID
     * @param userId User ID (must be the owner)
     */
    public async delete(id: number, userId: number): Promise<void> {
        const group = await this.prismaService.group.findUnique({
            where: { id }
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        if (group.ownerId !== userId) {
            throw new ForbiddenException('Only the group owner can delete the group');
        }

        await this.prismaService.group.delete({
            where: { id }
        });
    }

    /**
     * Check if user has permission to manage the group
     *
     * @param groupId Group ID
     * @param userId User ID
     * @returns True if user has permission, false otherwise
     */
    public async checkManageGroupPermission(groupId: number, userId: number): Promise<boolean> {
        const group = await this.prismaService.group.findUnique({
            where: { id: groupId }
        });

        // Owner always has permission
        if (group?.ownerId === userId) {
            return true;
        }

        // Check if user is a member with manageGroup permission
        const member = await this.prismaService.groupMember.findFirst({
            where: {
                groupId,
                userId,
                role: {
                    canManageGroup: true
                }
            }
        });

        return !!member;
    }

    /**
     * Check if user is a member of the group
     *
     * @param groupId Group ID
     * @param userId User ID
     * @returns True if user is a member, false otherwise
     */
    public async isMember(groupId: number, userId: number): Promise<boolean> {
        const member = await this.prismaService.groupMember.findFirst({
            where: { groupId, userId }
        });

        return !!member;
    }

    /**
     * Get user's permissions in a group
     *
     * @param groupId Group ID
     * @param userId User ID
     * @returns User's permissions or null if not a member
     */
    public async getUserPermissions(groupId: number, userId: number) {
        const member = await this.prismaService.groupMember.findFirst({
            where: { groupId, userId },
            include: { role: true }
        });

        if (!member) {
            return null;
        }

        return {
            canViewTransactions: member.role.canViewTransactions,
            canManageOwnTransactions: member.role.canManageOwnTransactions,
            canManageGroupTransactions: member.role.canManageGroupTransactions,
            canViewCategories: member.role.canViewCategories,
            canManageCategories: member.role.canManageCategories,
            canViewSubcategories: member.role.canViewSubcategories,
            canManageSubcategories: member.role.canManageSubcategories,
            canViewBudgets: member.role.canViewBudgets,
            canManageBudgets: member.role.canManageBudgets,
            canViewAccounts: member.role.canViewAccounts,
            canManageOwnAccounts: member.role.canManageOwnAccounts,
            canManageGroupAccounts: member.role.canManageGroupAccounts,
            canManageGroup: member.role.canManageGroup
        };
    }

}
