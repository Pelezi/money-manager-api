import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BudgetType, CategoryType } from '@prisma/client';

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
     * @param type Optional budget type filter
     * @param budgetType Optional budget category type filter (EXPENSE/INCOME)
     * @returns A budget list
     */
    public async findByUser(userId: number, year?: number, type?: BudgetType, budgetType?: CategoryType): Promise<BudgetData[]> {

        const where: any = { userId };

        if (year) {
            where.year = year;
        }

        if (type) {
            where.type = type;
        }

        if (budgetType) {
            where.budgetType = budgetType;
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
     * Create a new budget with automatic monthly/annual synchronization
     *
     * @param userId User ID
     * @param data Budget details
     * @returns A budget created in the database
     */
    public async create(userId: number, data: BudgetInput): Promise<BudgetData> {

        if (data.type === BudgetType.MONTHLY && !data.month) {
            throw new BadRequestException('Month is required for monthly budgets');
        }

        if (data.type === BudgetType.ANNUAL && data.month) {
            throw new BadRequestException('Month should not be specified for annual budgets');
        }

        const budget = await this.prismaService.budget.create({
            data: {
                userId,
                name: data.name,
                amount: data.amount,
                type: data.type,
                budgetType: data.budgetType,
                month: data.month,
                year: data.year,
                subcategoryId: data.subcategoryId
            }
        });

        await this.syncBudgets(userId, budget.year, budget.subcategoryId);

        return new BudgetData(budget);
    }

    /**
     * Update a budget with automatic monthly/annual synchronization
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
            data
        });

        await this.syncBudgets(userId, updated.year, updated.subcategoryId);

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

        await this.syncBudgets(userId, budget.year, budget.subcategoryId);
    }

    /**
     * Synchronize monthly and annual budgets
     * When monthly budgets change, update annual summary
     * When annual budget is adjusted, distribute to monthly budgets
     *
     * @param userId User ID
     * @param year Year to synchronize
     * @param subcategoryId Subcategory ID
     */
    private async syncBudgets(userId: number, year: number, subcategoryId: number): Promise<void> {

        const where: any = {
            userId,
            year,
            subcategoryId
        };

        const monthlyBudgets = await this.prismaService.budget.findMany({
            where: {
                ...where,
                type: BudgetType.MONTHLY
            }
        });

        const totalMonthlyAmount = monthlyBudgets.reduce((sum, budget) => {
            return sum + Number(budget.amount);
        }, 0);

        const annualBudget = await this.prismaService.budget.findFirst({
            where: {
                ...where,
                type: BudgetType.ANNUAL
            }
        });

        if (annualBudget && monthlyBudgets.length > 0) {
            const currentAnnualAmount = Number(annualBudget.amount);

            if (Math.abs(currentAnnualAmount - totalMonthlyAmount) > 0.01) {
                await this.prismaService.budget.update({
                    where: { id: annualBudget.id },
                    data: { amount: totalMonthlyAmount }
                });
            }
        }
    }

    /**
     * Get actual spending vs budget comparison
     *
     * @param userId User ID
     * @param year Year
     * @param month Optional month
     * @param subcategoryId Optional subcategory ID
     * @param budgetType Optional budget category type filter (EXPENSE/INCOME)
     * @returns Comparison data
     */
    public async getComparison(
        userId: number,
        year: number,
        month?: number,
        subcategoryId?: number,
        budgetType?: CategoryType
    ): Promise<{ budgeted: number; actual: number; difference: number }> {

        const budgetWhere: any = {
            userId,
            year,
            type: month ? BudgetType.MONTHLY : BudgetType.ANNUAL
        };

        if (month) {
            budgetWhere.month = month;
        }

        if (subcategoryId) {
            budgetWhere.subcategoryId = subcategoryId;
        }

        if (budgetType) {
            budgetWhere.budgetType = budgetType;
        }

        const budgets = await this.prismaService.budget.findMany({
            where: budgetWhere
        });

        const budgeted = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);

        const transactionWhere: any = {
            userId,
            date: {
                gte: new Date(year, month ? month - 1 : 0, 1),
                lt: month
                    ? new Date(year, month, 1)
                    : new Date(year + 1, 0, 1)
            }
        };

        if (subcategoryId) {
            transactionWhere.subcategoryId = subcategoryId;
        }

        if (budgetType) {
            transactionWhere.type = budgetType;
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
