import { ApiProperty } from '@nestjs/swagger';

export class GroupRoleInput {
    @ApiProperty({ description: 'Role name', example: 'Admin' })
    public readonly name: string;

    @ApiProperty({ description: 'Role description', example: 'Full access to all features', required: false })
    public readonly description?: string;

    @ApiProperty({ description: 'Can view transactions', example: true, default: true })
    public readonly canViewTransactions?: boolean;

    @ApiProperty({ description: 'Can manage own transactions', example: false, default: false })
    public readonly canManageOwnTransactions?: boolean;

    @ApiProperty({ description: 'Can manage all group transactions', example: false, default: false })
    public readonly canManageGroupTransactions?: boolean;

    @ApiProperty({ description: 'Can view categories', example: true, default: true })
    public readonly canViewCategories?: boolean;

    @ApiProperty({ description: 'Can manage categories', example: false, default: false })
    public readonly canManageCategories?: boolean;

    @ApiProperty({ description: 'Can view subcategories', example: true, default: true })
    public readonly canViewSubcategories?: boolean;

    @ApiProperty({ description: 'Can manage subcategories', example: false, default: false })
    public readonly canManageSubcategories?: boolean;

    @ApiProperty({ description: 'Can view budgets', example: true, default: true })
    public readonly canViewBudgets?: boolean;

    @ApiProperty({ description: 'Can manage budgets', example: false, default: false })
    public readonly canManageBudgets?: boolean;

    @ApiProperty({ description: 'Can view accounts', example: true, default: true })
    public readonly canViewAccounts?: boolean;

    @ApiProperty({ description: 'Can manage own accounts', example: false, default: false })
    public readonly canManageOwnAccounts?: boolean;

    @ApiProperty({ description: 'Can manage all group accounts', example: false, default: false })
    public readonly canManageGroupAccounts?: boolean;

    @ApiProperty({ description: 'Can manage group (members, roles, settings)', example: false, default: false })
    public readonly canManageGroup?: boolean;
}

export class UpdateGroupRoleInput {
    @ApiProperty({ description: 'Role name', example: 'Admin', required: false })
    public readonly name?: string;

    @ApiProperty({ description: 'Role description', example: 'Full access to all features', required: false })
    public readonly description?: string;

    @ApiProperty({ description: 'Can view transactions', example: true, required: false })
    public readonly canViewTransactions?: boolean;

    @ApiProperty({ description: 'Can manage own transactions', example: false, required: false })
    public readonly canManageOwnTransactions?: boolean;

    @ApiProperty({ description: 'Can manage all group transactions', example: false, required: false })
    public readonly canManageGroupTransactions?: boolean;

    @ApiProperty({ description: 'Can view categories', example: true, required: false })
    public readonly canViewCategories?: boolean;

    @ApiProperty({ description: 'Can manage categories', example: false, required: false })
    public readonly canManageCategories?: boolean;

    @ApiProperty({ description: 'Can view subcategories', example: true, required: false })
    public readonly canViewSubcategories?: boolean;

    @ApiProperty({ description: 'Can manage subcategories', example: false, required: false })
    public readonly canManageSubcategories?: boolean;

    @ApiProperty({ description: 'Can view budgets', example: true, required: false })
    public readonly canViewBudgets?: boolean;

    @ApiProperty({ description: 'Can manage budgets', example: false, required: false })
    public readonly canManageBudgets?: boolean;

    @ApiProperty({ description: 'Can view accounts', example: true, required: false })
    public readonly canViewAccounts?: boolean;

    @ApiProperty({ description: 'Can manage own accounts', example: false, required: false })
    public readonly canManageOwnAccounts?: boolean;

    @ApiProperty({ description: 'Can manage all group accounts', example: false, required: false })
    public readonly canManageGroupAccounts?: boolean;

    @ApiProperty({ description: 'Can manage group (members, roles, settings)', example: false, required: false })
    public readonly canManageGroup?: boolean;
}
