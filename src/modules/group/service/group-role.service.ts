import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common';
import { GroupRoleData, GroupRoleInput, UpdateGroupRoleInput } from '../model';
import { GroupService } from './group.service';

@Injectable()
export class GroupRoleService {

    public constructor(
        private readonly prismaService: PrismaService,
        private readonly groupService: GroupService
    ) { }

    /**
     * Find all roles for a group
     *
     * @param groupId Group ID
     * @param userId User ID (for permission check)
     * @returns A list of roles
     */
    public async findByGroup(groupId: number, userId: number): Promise<GroupRoleData[]> {
        // Check if user is a member of the group
        const isMember = await this.groupService.isMember(groupId, userId);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this group');
        }

        const roles = await this.prismaService.groupRole.findMany({
            where: { groupId },
            orderBy: { createdAt: 'asc' }
        });

        return roles.map(role => new GroupRoleData(role));
    }

    /**
     * Find a role by ID
     *
     * @param id Role ID
     * @param userId User ID (for permission check)
     * @returns A role or null
     */
    public async findById(id: number, userId: number): Promise<GroupRoleData | null> {
        const role = await this.prismaService.groupRole.findUnique({
            where: { id }
        });

        if (!role) {
            return null;
        }

        // Check if user is a member of the group
        const isMember = await this.groupService.isMember(role.groupId, userId);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this group');
        }

        return new GroupRoleData(role);
    }

    /**
     * Create a new role
     *
     * @param groupId Group ID
     * @param userId User ID (for permission check)
     * @param data Role details
     * @returns A role created in the database
     */
    public async create(groupId: number, userId: number, data: GroupRoleInput): Promise<GroupRoleData> {
        // Check if user has permission to manage the group
        const hasPermission = await this.groupService.checkManageGroupPermission(groupId, userId);
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to manage roles in this group');
        }

        // Check if role name already exists in this group
        const existingRole = await this.prismaService.groupRole.findFirst({
            where: {
                groupId,
                name: data.name
            }
        });

        if (existingRole) {
            throw new ConflictException('A role with this name already exists in the group');
        }

        const role = await this.prismaService.groupRole.create({
            data: {
                groupId,
                name: data.name,
                description: data.description,
                canViewTransactions: data.canViewTransactions ?? true,
                canManageOwnTransactions: data.canManageOwnTransactions ?? false,
                canManageGroupTransactions: data.canManageGroupTransactions ?? false,
                canViewCategories: data.canViewCategories ?? true,
                canManageCategories: data.canManageCategories ?? false,
                canViewSubcategories: data.canViewSubcategories ?? true,
                canManageSubcategories: data.canManageSubcategories ?? false,
                canViewBudgets: data.canViewBudgets ?? true,
                canManageBudgets: data.canManageBudgets ?? false,
                canViewAccounts: data.canViewAccounts ?? true,
                canManageOwnAccounts: data.canManageOwnAccounts ?? false,
                canManageGroupAccounts: data.canManageGroupAccounts ?? false,
                canManageGroup: data.canManageGroup ?? false
            }
        });

        return new GroupRoleData(role);
    }

    /**
     * Update a role
     *
     * @param id Role ID
     * @param userId User ID (for permission check)
     * @param data Role details
     * @returns Updated role
     */
    public async update(id: number, userId: number, data: UpdateGroupRoleInput): Promise<GroupRoleData> {
        const role = await this.prismaService.groupRole.findUnique({
            where: { id }
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        // Check if user has permission to manage the group
        const hasPermission = await this.groupService.checkManageGroupPermission(role.groupId, userId);
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to manage roles in this group');
        }

        // If name is being changed, check for conflicts
        if (data.name && data.name !== role.name) {
            const existingRole = await this.prismaService.groupRole.findFirst({
                where: {
                    groupId: role.groupId,
                    name: data.name
                }
            });

            if (existingRole) {
                throw new ConflictException('A role with this name already exists in the group');
            }
        }

        const updated = await this.prismaService.groupRole.update({
            where: { id },
            data
        });

        return new GroupRoleData(updated);
    }

    /**
     * Delete a role
     *
     * @param id Role ID
     * @param userId User ID (for permission check)
     */
    public async delete(id: number, userId: number): Promise<void> {
        const role = await this.prismaService.groupRole.findUnique({
            where: { id },
            include: {
                members: true
            }
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        // Check if user has permission to manage the group
        const hasPermission = await this.groupService.checkManageGroupPermission(role.groupId, userId);
        if (!hasPermission) {
            throw new ForbiddenException('You do not have permission to manage roles in this group');
        }

        // Check if role has members
        if (role.members.length > 0) {
            throw new ConflictException('Cannot delete a role that has members assigned to it');
        }

        await this.prismaService.groupRole.delete({
            where: { id }
        });
    }

}
