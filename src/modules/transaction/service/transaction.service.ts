import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryType } from '@prisma/client';

import { PrismaService } from '../../common';
import { TransactionData, TransactionInput } from '../model';

@Injectable()
export class TransactionService {

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    /**
     * Find all transactions for a user
     *
     * @param userId User ID
     * @param subcategoryId Optional subcategory filter
     * @param startDate Optional start date filter
     * @param endDate Optional end date filter
     * @param type Optional transaction type filter (EXPENSE/INCOME)
     * @returns A transaction list
     */
    public async findByUser(
        userId: number,
        subcategoryId?: number,
        startDate?: Date,
        endDate?: Date,
        type?: CategoryType
    ): Promise<TransactionData[]> {

        const where: any = { userId };

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
                subcategoryId: data.subcategoryId,
                amount: data.amount,
                description: data.description,
                date: data.date,
                type: data.type
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

}
