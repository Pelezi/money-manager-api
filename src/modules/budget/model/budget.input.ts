import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

export class BudgetInput {
    @ApiProperty({ description: 'Budget name', example: 'Groceries Budget' })
    public readonly name: string;

    @ApiProperty({ description: 'Budget amount - if annual is true, this will be distributed across 12 months', example: 500.00 })
    public readonly amount: number;

    @ApiProperty({ description: 'Budget type - EXPENSE (0) or INCOME (1)', enum: ['EXPENSE', 'INCOME'], example: 'EXPENSE', required: false })
    public readonly type?: CategoryType;

    @ApiProperty({ description: 'Month (1-12)', example: 1 })
    public readonly month: number;

    @ApiProperty({ description: 'Year', example: 2024 })
    public readonly year: number;

    @ApiProperty({ description: 'Subcategory ID', example: 1 })
    public readonly subcategoryId: number;

    @ApiProperty({ description: 'If true, creates budgets for all 12 months of the year with amount distributed equally', example: false, required: false })
    public readonly annual?: boolean;

    @ApiProperty({ description: 'Group ID', example: 1, required: false })
    public readonly groupId?: number;
}
