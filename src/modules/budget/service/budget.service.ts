import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryType, Prisma } from '@prisma/client';

import { PrismaService } from '../../common';
import { BudgetData, BudgetInput } from '../model';

@Injectable()
export class BudgetService {

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    /**
     * Find all budgets for a user
     *
     * @param userId User ID
     * @param year Optional year filter
     * @param type Optional budget category type filter (EXPENSE/INCOME)
     * @param month Optional month filter
     * @param groupId Optional group filter
     * @returns A budget list
     */
    public async findByUser(userId: number, year?: number, type?: CategoryType, month?: number, groupId?: number): Promise<BudgetData[]> {

        const where: Prisma.BudgetWhereInput = {};

        // If groupId is provided, filter by group (accessible to all group members)
        // Otherwise, filter by userId AND groupId null (personal data only)
        if (groupId !== undefined) {
            where.groupId = groupId;
        } else {
            where.userId = userId;
            where.groupId = null;  // Ensure we only get personal budgets, not group budgets
        }

        if (year) {
            where.year = year;
        }

        if (type) {
            where.type = type;
        }

        if (month) {
            where.month = month;
        }

        const budgets = await this.prismaService.budget.findMany({
            where,
            orderBy: [
                { year: 'desc' },
                { month: 'asc' }
            ]
        });

        return budgets.map(budget => new BudgetData(budget));
    }

    /**
     * Find a budget by ID
     *
     * @param id Budget ID
     * @param userId User ID
     * @returns A budget or null
     */
    public async findById(id: number, userId: number): Promise<BudgetData | null> {

        const budget = await this.prismaService.budget.findFirst({
            where: { id, userId }
        });

        if (!budget) {
            return null;
        }

        return new BudgetData(budget);
    }

    /**
     * Create a new budget or distribute annual budget across months
     *
     * @param userId User ID
     * @param data Budget details
     * @returns A budget created in the database (or first month if annual)
     */
    public async create(userId: number, data: BudgetInput): Promise<BudgetData> {

        // If annual flag is set, create budgets for all 12 months
        if (data.annual) {
            const monthlyAmount = data.amount / 12;
            const budgets = [];

            for (let month = 1; month <= 12; month++) {
                const budget = await this.prismaService.budget.create({
                    data: {
                        userId,
                        amount: monthlyAmount,
                        type: data.type,
                        month,
                        year: data.year,
                        subcategoryId: data.subcategoryId,
                        groupId: data.groupId
                    }
                });
                budgets.push(budget);
            }

            // Return the first month's budget
            return new BudgetData(budgets[0]);
        }

        // Create a single monthly budget
        const budget = await this.prismaService.budget.create({
            data: {
                userId,
                amount: data.amount,
                type: data.type,
                month: data.month,
                year: data.year,
                subcategoryId: data.subcategoryId,
                groupId: data.groupId
            }
        });

        return new BudgetData(budget);
    }

    /**
     * Update a budget
     *
     * @param id Budget ID
     * @param userId User ID
     * @param data Budget details
     * @returns Updated budget
     */
    public async update(id: number, userId: number, data: Partial<BudgetInput>): Promise<BudgetData> {

        const budget = await this.prismaService.budget.findFirst({
            where: { id, userId }
        });

        if (!budget) {
            throw new NotFoundException('Budget not found');
        }

        const updated = await this.prismaService.budget.update({
            where: { id },
            data: {
                amount: data.amount,
                type: data.type,
                month: data.month,
                year: data.year,
                subcategoryId: data.subcategoryId
            }
        });

        return new BudgetData(updated);
    }

    /**
     * Delete a budget
     *
     * @param id Budget ID
     * @param userId User ID
     */
    public async delete(id: number, userId: number): Promise<void> {

        const budget = await this.prismaService.budget.findFirst({
            where: { id, userId }
        });

        if (!budget) {
            throw new NotFoundException('Budget not found');
        }

        await this.prismaService.budget.delete({
            where: { id }
        });
    }

    /**
     * Get actual spending vs budget comparison
     *
     * @param userId User ID
     * @param year Year
     * @param month Optional month
     * @param subcategoryId Optional subcategory ID
     * @param type Optional category type filter (EXPENSE/INCOME)
     * @param groupId Optional group filter
     * @returns Comparison data
     */
    public async getComparison(
        userId: number,
        year: number,
        month?: number,
        subcategoryId?: number,
        type?: CategoryType,
        groupId?: number
    ): Promise<{ budgeted: number; actual: number; difference: number }> {

        const budgetWhere: Prisma.BudgetWhereInput = {
            year
        };

        // If groupId is provided, filter by group (accessible to all group members)
        // Otherwise, filter by userId AND groupId null (personal data only)
        if (groupId !== undefined) {
            budgetWhere.groupId = groupId;
        } else {
            budgetWhere.userId = userId;
            budgetWhere.groupId = null;  // Ensure we only get personal budgets, not group budgets
        }

        if (month) {
            budgetWhere.month = month;
        }

        if (subcategoryId) {
            budgetWhere.subcategoryId = subcategoryId;
        }

        if (type) {
            budgetWhere.type = type;
        }

        const budgets = await this.prismaService.budget.findMany({
            where: budgetWhere
        });

        const budgeted = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);

        const transactionWhere: Prisma.TransactionWhereInput = {
            date: {
                gte: new Date(year, month ? month - 1 : 0, 1),
                lt: month
                    ? new Date(year, month, 1)
                    : new Date(year + 1, 0, 1)
            }
        };

        // If groupId is provided, filter by group (accessible to all group members)
        // Otherwise, filter by userId AND groupId null (personal data only)
        if (groupId !== undefined) {
            transactionWhere.groupId = groupId;
        } else {
            transactionWhere.userId = userId;
            transactionWhere.groupId = null;  // Ensure we only get personal transactions, not group transactions
        }

        if (subcategoryId) {
            transactionWhere.subcategoryId = subcategoryId;
        }

        if (type) {
            transactionWhere.type = type;
        }

        const transactions = await this.prismaService.transaction.findMany({
            where: transactionWhere
        });

        const actual = transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);

        return {
            budgeted,
            actual,
            difference: budgeted - actual
        };
    }

}
