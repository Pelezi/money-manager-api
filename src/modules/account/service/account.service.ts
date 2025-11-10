import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../common';
import { AccountData, AccountInput, AccountBalanceData, AccountBalanceInput } from '../model';

@Injectable()
export class AccountService {

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    /**
     * Check if user has permission to manage an account
     * 
     * @param userId User ID
     * @param account Account entity
     * @returns boolean
     */
    private async canManageAccount(userId: number, account: any): Promise<boolean> {
        // If it's a personal account, only the owner can manage
        if (!account.groupId) {
            return account.userId === userId;
        }

        // For group accounts, check permissions
        const member = await this.prismaService.groupMember.findFirst({
            where: {
                groupId: account.groupId,
                userId
            },
            include: {
                role: true
            }
        });

        if (!member) {
            return false;
        }

        // Can manage all group accounts or can manage own accounts (if owner)
        return member.role.canManageGroupAccounts || 
               (member.role.canManageOwnAccounts && account.userId === userId);
    }

    /**
     * Find all accounts for a user
     *
     * @param userId User ID
     * @param groupId Optional group filter
     * @returns An account list
     */
    public async findByUser(userId: number, groupId?: number): Promise<AccountData[]> {

        const where: Prisma.AccountWhereInput = {};

        // If groupId is provided, filter by group (accessible to all group members)
        // Otherwise, filter by userId AND groupId null (personal data only)
        if (groupId !== undefined) {
            where.groupId = groupId;
        } else {
            where.userId = userId;
            where.groupId = null;  // Ensure we only get personal accounts, not group accounts
        }

        const accounts = await this.prismaService.account.findMany({
            where,
            orderBy: [
                { createdAt: 'desc' }
            ]
        });

        return accounts.map(account => new AccountData(account));
    }

    /**
     * Find an account by ID
     *
     * @param id Account ID
     * @param userId User ID
     * @returns An account or null
     */
    public async findById(id: number, userId: number): Promise<AccountData | null> {

        const account = await this.prismaService.account.findFirst({
            where: { 
                id,
                OR: [
                    { userId },
                    { group: { members: { some: { userId } } } }
                ]
            }
        });

        if (!account) {
            return null;
        }

        return new AccountData(account);
    }

    /**
     * Get current balance for an account
     *
     * @param accountId Account ID
     * @param userId User ID
     * @returns The most recent balance or null
     */
    public async getCurrentBalance(accountId: number, userId: number): Promise<AccountBalanceData | null> {
        
        // Verify user has access to this account
        const account = await this.findById(accountId, userId);
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        const balance = await this.prismaService.accountBalance.findFirst({
            where: { accountId },
            orderBy: { date: 'desc' }
        });

        if (!balance) {
            return null;
        }

        return new AccountBalanceData(balance);
    }

    /**
     * Get balance history for an account
     *
     * @param accountId Account ID
     * @param userId User ID
     * @returns List of account balances
     */
    public async getBalanceHistory(accountId: number, userId: number): Promise<AccountBalanceData[]> {
        
        // Verify user has access to this account
        const account = await this.findById(accountId, userId);
        if (!account) {
            throw new NotFoundException('Account not found');
        }

        const balances = await this.prismaService.accountBalance.findMany({
            where: { accountId },
            orderBy: { date: 'desc' }
        });

        return balances.map(balance => new AccountBalanceData(balance));
    }

    /**
     * Create a new account
     *
     * @param userId User ID
     * @param data Account details
     * @returns An account created in the database
     */
    public async create(userId: number, data: AccountInput): Promise<AccountData> {

        // If groupId is provided, verify user is member of that group
        if (data.groupId) {
            const groupMember = await this.prismaService.groupMember.findFirst({
                where: {
                    groupId: data.groupId,
                    userId
                }
            });

            if (!groupMember) {
                throw new ForbiddenException('You are not a member of this group');
            }
        }

        const account = await this.prismaService.account.create({
            data: {
                userId,
                name: data.name,
                type: data.type,
                groupId: data.groupId
            }
        });

        // Create initial balance if provided
        if (data.initialBalance !== undefined) {
            await this.prismaService.accountBalance.create({
                data: {
                    accountId: account.id,
                    amount: data.initialBalance,
                    date: new Date()
                }
            });
        }

        return new AccountData(account);
    }

    /**
     * Update an account
     *
     * @param id Account ID
     * @param userId User ID
     * @param data Account details
     * @returns An updated account
     */
    public async update(id: number, userId: number, data: Partial<AccountInput>): Promise<AccountData> {

        const existingAccount = await this.prismaService.account.findFirst({
            where: { 
                id,
                OR: [
                    { userId },
                    { group: { members: { some: { userId } } } }
                ]
            }
        });

        if (!existingAccount) {
            throw new NotFoundException('Account not found');
        }

        // Check if user has permission to manage this account
        const canManage = await this.canManageAccount(userId, existingAccount);
        if (!canManage) {
            throw new ForbiddenException('You do not have permission to manage this account');
        }

        // If groupId is being changed, verify user is member of new group
        if (data.groupId !== undefined && data.groupId !== existingAccount.groupId) {
            const groupMember = await this.prismaService.groupMember.findFirst({
                where: {
                    groupId: data.groupId,
                    userId
                }
            });

            if (!groupMember) {
                throw new ForbiddenException('You are not a member of this group');
            }
        }

        const updateData: Prisma.AccountUpdateInput = {};
        
        if (data.name !== undefined) updateData.name = data.name;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.groupId !== undefined) {
            updateData.group = data.groupId 
                ? { connect: { id: data.groupId } }
                : { disconnect: true };
        }

        const account = await this.prismaService.account.update({
            where: { id },
            data: updateData
        });

        return new AccountData(account);
    }

    /**
     * Delete an account
     *
     * @param id Account ID
     * @param userId User ID
     * @returns void
     */
    public async delete(id: number, userId: number): Promise<void> {

        const account = await this.prismaService.account.findFirst({
            where: { 
                id,
                OR: [
                    { userId },
                    { group: { members: { some: { userId } } } }
                ]
            }
        });

        if (!account) {
            throw new NotFoundException('Account not found');
        }

        // Check if user has permission to manage this account
        const canManage = await this.canManageAccount(userId, account);
        if (!canManage) {
            throw new ForbiddenException('You do not have permission to manage this account');
        }

        await this.prismaService.account.delete({
            where: { id }
        });
    }

    /**
     * Add a new balance entry for an account
     *
     * @param userId User ID
     * @param data Balance details
     * @returns A balance created in the database
     */
    public async addBalance(userId: number, data: AccountBalanceInput): Promise<AccountBalanceData> {

        // Verify user has access to this account
        const accountData = await this.findById(data.accountId, userId);
        if (!accountData) {
            throw new NotFoundException('Account not found');
        }

        // Get full account with relations to check permissions
        const account = await this.prismaService.account.findUnique({
            where: { id: data.accountId }
        });

        if (!account) {
            throw new NotFoundException('Account not found');
        }

        // Check if user has permission to manage this account
        const canManage = await this.canManageAccount(userId, account);
        if (!canManage) {
            throw new ForbiddenException('You do not have permission to manage this account');
        }

        const balance = await this.prismaService.accountBalance.create({
            data: {
                accountId: data.accountId,
                amount: data.amount,
                date: data.date || new Date()
            }
        });

        return new AccountBalanceData(balance);
    }

    /**
     * Update a balance entry
     *
     * @param id Balance ID
     * @param userId User ID
     * @param data Balance details
     * @returns An updated balance
     */
    public async updateBalance(id: number, userId: number, data: Partial<AccountBalanceInput>): Promise<AccountBalanceData> {

        const existingBalance = await this.prismaService.accountBalance.findUnique({
            where: { id },
            include: { account: true }
        });

        if (!existingBalance) {
            throw new NotFoundException('Balance not found');
        }

        // Verify user has access to this account
        const accountData = await this.findById(existingBalance.accountId, userId);
        if (!accountData) {
            throw new NotFoundException('Account not found');
        }

        // Check if user has permission to manage this account
        const canManage = await this.canManageAccount(userId, existingBalance.account);
        if (!canManage) {
            throw new ForbiddenException('You do not have permission to manage this account');
        }

        const updateData: Prisma.AccountBalanceUpdateInput = {};
        
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.date !== undefined) updateData.date = data.date;

        const balance = await this.prismaService.accountBalance.update({
            where: { id },
            data: updateData
        });

        return new AccountBalanceData(balance);
    }

    /**
     * Delete a balance entry
     *
     * @param id Balance ID
     * @param userId User ID
     * @returns void
     */
    public async deleteBalance(id: number, userId: number): Promise<void> {

        const balance = await this.prismaService.accountBalance.findUnique({
            where: { id },
            include: { account: true }
        });

        if (!balance) {
            throw new NotFoundException('Balance not found');
        }

        // Verify user has access to this account
        const accountData = await this.findById(balance.accountId, userId);
        if (!accountData) {
            throw new NotFoundException('Account not found');
        }

        // Check if user has permission to manage this account
        const canManage = await this.canManageAccount(userId, balance.account);
        if (!canManage) {
            throw new ForbiddenException('You do not have permission to manage this account');
        }

        await this.prismaService.accountBalance.delete({
            where: { id }
        });
    }

}
