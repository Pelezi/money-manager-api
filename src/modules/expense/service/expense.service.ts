import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common';
import { ExpenseData } from '../model';

@Injectable()
export class ExpenseService {

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    /**
     * Find all expenses for a specific year
     *
     * @param year The year to filter expenses
     * @returns An expense list
     */
    public async findByYear(year: number): Promise<ExpenseData[]> {

        const expenses = await this.prismaService.expense.findMany({
            where: {
                year
            },
            orderBy: [
                { year: 'asc' },
                { month: 'asc' }
            ]
        });

        return expenses.map(expense => new ExpenseData(expense));
    }

}
