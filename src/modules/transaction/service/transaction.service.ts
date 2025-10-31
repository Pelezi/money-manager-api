import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common';
import { TransactionAggregatedData } from '../model';

@Injectable()
export class TransactionService {

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    /**
     * Find aggregated transactions for a specific year
     * Aggregates transactions by subcategory, month, year, and type
     *
     * @param year The year to filter transactions
     * @returns An aggregated transaction list
     */
    public async findAggregatedByYear(year: number): Promise<TransactionAggregatedData[]> {

        const aggregatedTransactions = await this.prismaService.transaction.groupBy({
            by: ['subcategoryId', 'month', 'year', 'type'],
            where: {
                year
            },
            _sum: {
                amount: true
            },
            _count: {
                id: true
            },
            orderBy: [
                { year: 'asc' },
                { month: 'asc' }
            ]
        });

        return aggregatedTransactions.map(item => {
            // eslint-disable-next-line no-underscore-dangle
            const sumAmount = item._sum.amount;
            // eslint-disable-next-line no-underscore-dangle
            const countId = item._count.id;

            return new TransactionAggregatedData({
                subcategoryId: item.subcategoryId,
                total: sumAmount || 0,
                count: countId,
                month: item.month,
                year: item.year,
                type: item.type
            });
        });
    }

}
