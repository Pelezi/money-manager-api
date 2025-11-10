import { ApiProperty } from '@nestjs/swagger';
import { GroupRole } from '@prisma/client';

export class GroupRoleData {

    @ApiProperty({ description: 'Role unique ID', example: 1 })
    public readonly id: number;

    @ApiProperty({ description: 'Group ID', example: 1 })
    public readonly groupId: number;

    @ApiProperty({ description: 'Role name', example: 'Admin' })
    public readonly name: string;

    @ApiProperty({ description: 'Role description', example: 'Full access to all features', required: false })
    public readonly description?: string;

    @ApiProperty({ description: 'Can view transactions', example: true })
    public readonly canViewTransactions: boolean;

    @ApiProperty({ description: 'Can manage own transactions', example: false })
    public readonly canManageOwnTransactions: boolean;

    @ApiProperty({ description: 'Can manage all group transactions', example: false })
    public readonly canManageGroupTransactions: boolean;

    @ApiProperty({ description: 'Can view categories', example: true })
    public readonly canViewCategories: boolean;

    @ApiProperty({ description: 'Can manage categories', example: false })
    public readonly canManageCategories: boolean;

    @ApiProperty({ description: 'Can view subcategories', example: true })
    public readonly canViewSubcategories: boolean;

    @ApiProperty({ description: 'Can manage subcategories', example: false })
    public readonly canManageSubcategories: boolean;

    @ApiProperty({ description: 'Can view budgets', example: true })
    public readonly canViewBudgets: boolean;

    @ApiProperty({ description: 'Can manage budgets', example: false })
    public readonly canManageBudgets: boolean;

    @ApiProperty({ description: 'Can view accounts', example: true })
    public readonly canViewAccounts: boolean;

    @ApiProperty({ description: 'Can manage own accounts', example: false })
    public readonly canManageOwnAccounts: boolean;

    @ApiProperty({ description: 'Can manage all group accounts', example: false })
    public readonly canManageGroupAccounts: boolean;

    @ApiProperty({ description: 'Can manage group (members, roles, settings)', example: false })
    public readonly canManageGroup: boolean;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
    public readonly createdAt: Date;

    @ApiProperty({ description: 'Updated at', example: '2024-01-01T00:00:00Z' })
    public readonly updatedAt: Date;

    public constructor(entity: GroupRole) {
        this.id = entity.id;
        this.groupId = entity.groupId;
        this.name = entity.name;
        this.description = entity.description || undefined;
        this.canViewTransactions = entity.canViewTransactions;
        this.canManageOwnTransactions = entity.canManageOwnTransactions;
        this.canManageGroupTransactions = entity.canManageGroupTransactions;
        this.canViewCategories = entity.canViewCategories;
        this.canManageCategories = entity.canManageCategories;
        this.canViewSubcategories = entity.canViewSubcategories;
        this.canManageSubcategories = entity.canManageSubcategories;
        this.canViewBudgets = entity.canViewBudgets;
        this.canManageBudgets = entity.canManageBudgets;
        this.canViewAccounts = entity.canViewAccounts;
        this.canManageOwnAccounts = entity.canManageOwnAccounts;
        this.canManageGroupAccounts = entity.canManageGroupAccounts;
        this.canManageGroup = entity.canManageGroup;
        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;
    }

}
