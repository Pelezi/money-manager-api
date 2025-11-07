import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryType, Prisma } from '@prisma/client';

import { PrismaService } from '../../common';
import { TransactionData, TransactionInput, TransactionAggregated } from '../model';

@Injectable()
export class TransactionService {

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    /**
     * Find all transactions for a user
     *
     * @param userId User ID
     * @param groupId Optional group filter
     * @param subcategoryId Optional subcategory filter
     * @param startDate Optional start date filter
     * @param endDate Optional end date filter
     * @param type Optional transaction type filter (EXPENSE/INCOME)
     * @returns A transaction list
     */
    public async findByUser(
        userId: number,
        groupId?: number,
        subcategoryId?: number,
        startDate?: Date,
        endDate?: Date,
        type?: CategoryType
    ): Promise<TransactionData[]> {

        const where: Prisma.TransactionWhereInput = {};

        // If groupId is provided, filter by group (accessible to all group members)
        // Otherwise, filter by userId (personal data)
        if (groupId !== undefined) {
            where.groupId = groupId;
        } else {
            where.userId = userId;
        }

        if (subcategoryId) {
            where.subcategoryId = subcategoryId;
        }

        if (startDate || endDate) {
            where.date = {};
            if (startDate) {
                where.date.gte = startDate;
            }
            if (endDate) {
                where.date.lte = endDate;
            }
        }

        if (type) {
            where.type = type;
        }

        const transactions = await this.prismaService.transaction.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                subcategory: {
                    include: {
                        category: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        return transactions.map(transaction => new TransactionData(transaction));
    }

    /**
     * Find a transaction by ID
     *
     * @param id Transaction ID
     * @param userId User ID
     * @returns A transaction or null
     */
    public async findById(id: number, userId: number): Promise<TransactionData | null> {

        const transaction = await this.prismaService.transaction.findFirst({
            where: { id, userId }
        });

        if (!transaction) {
            return null;
        }

        return new TransactionData(transaction);
    }

    /**
     * Create a new transaction
     *
     * @param userId User ID
     * @param data Transaction details
     * @returns A transaction created in the database
     */
    public async create(userId: number, data: TransactionInput): Promise<TransactionData> {

        const transaction = await this.prismaService.transaction.create({
            data: {
                userId,
                groupId: data.groupId,
                subcategoryId: data.subcategoryId,
                title: data.title,
                amount: data.amount,
                description: data.description,
                date: data.date + (data.time ? `T${data.time}Z` : 'T00:00:00Z'),
                type: data.type
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                subcategory: {
                    include: {
                        category: true
                    }
                }
            }
        });

        return new TransactionData(transaction);
    }

    /**
     * Update a transaction
     *
     * @param id Transaction ID
     * @param userId User ID
     * @param data Transaction details
     * @returns Updated transaction
     */
    public async update(id: number, userId: number, data: Partial<TransactionInput>): Promise<TransactionData> {

        const transaction = await this.prismaService.transaction.findFirst({
            where: { id, userId }
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        const updated = await this.prismaService.transaction.update({
            where: { id },
            data
        });

        return new TransactionData(updated);
    }

    /**
     * Delete a transaction
     *
     * @param id Transaction ID
     * @param userId User ID
     */
    public async delete(id: number, userId: number): Promise<void> {

        const transaction = await this.prismaService.transaction.findFirst({
            where: { id, userId }
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        await this.prismaService.transaction.delete({
            where: { id }
        });
    }

    /**
     * Get aggregated spending by subcategory
     *
     * @param userId User ID
     * @param startDate Start date
     * @param endDate End date
     * @returns Aggregated spending data
     */
    public async getAggregatedSpending(
        userId: number,
        startDate: Date,
        endDate: Date
    ): Promise<{ subcategoryId: number; total: number }[]> {

        const transactions = await this.prismaService.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const aggregated = transactions.reduce((acc, transaction) => {
            const subcategoryId = transaction.subcategoryId;
            if (!acc[subcategoryId]) {
                acc[subcategoryId] = 0;
            }
            acc[subcategoryId] += Number(transaction.amount);
            return acc;
        }, {} as Record<number, number>);

        return Object.entries(aggregated).map(([subcategoryId, total]) => ({
            subcategoryId: parseInt(subcategoryId),
            total
        }));
    }

    /**
     * Get aggregated transactions by year, grouped by subcategory, month, and type
     *
     * @param userId User ID
     * @param year Year to filter transactions
     * @param groupId Optional group filter
     * @returns Aggregated transaction data grouped by subcategory, month, year, and type
     */
    public async getAggregatedByYear(
        userId: number,
        year: number,
        groupId?: number
    ): Promise<TransactionAggregated[]> {

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);

        const where: Prisma.TransactionWhereInput = {
            date: {
                gte: startDate,
                lt: endDate
            }
        };

        // If groupId is provided, filter by group (accessible to all group members)
        // Otherwise, filter by userId (personal data)
        if (groupId !== undefined) {
            where.groupId = groupId;
        } else {
            where.userId = userId;
        }

        const transactions = await this.prismaService.transaction.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        // Group by subcategoryId, month, year, and type (and optionally userId for group analytics)
        const aggregated = transactions.reduce((acc, transaction) => {
            const date = new Date(transaction.date);
            const month = date.getMonth() + 1; // 1-12
            const year = date.getFullYear();
            const key = `${transaction.subcategoryId}-${month}-${year}-${transaction.type}${groupId ? `-${transaction.userId}` : ''}`;
            
            if (!acc[key]) {
                acc[key] = {
                    subcategoryId: transaction.subcategoryId,
                    total: 0,
                    count: 0,
                    month,
                    year,
                    type: transaction.type,
                    userId: groupId ? transaction.userId : undefined,
                    user: groupId ? transaction.user : undefined
                };
            }
            
            acc[key].total += Number(transaction.amount);
            acc[key].count += 1;
            
            return acc;
        }, {} as Record<string, { subcategoryId: number; total: number; count: number; month: number; year: number; type: CategoryType; userId?: number; user?: any }>);

        return Object.values(aggregated).map(data => new TransactionAggregated(data));
    }

}
