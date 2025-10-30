import { ApiProperty } from '@nestjs/swagger';
import { BudgetType, CategoryType } from '@prisma/client';

export class BudgetInput {
    @ApiProperty({ description: 'Budget name', example: 'Groceries Budget' })
    public readonly name: string;

    @ApiProperty({ description: 'Budget amount', example: 500.00 })
    public readonly amount: number;

    @ApiProperty({ description: 'Budget type', enum: ['MONTHLY', 'ANNUAL'] })
    public readonly type: BudgetType;

    @ApiProperty({ description: 'Budget category type - EXPENSE (0) or INCOME (1)', enum: ['EXPENSE', 'INCOME'], example: 'EXPENSE', required: false })
    public readonly budgetType?: CategoryType;

    @ApiProperty({ description: 'Month (1-12) - required for MONTHLY budgets', example: 1, required: false })
    public readonly month?: number;

    @ApiProperty({ description: 'Year', example: 2024 })
    public readonly year: number;

    @ApiProperty({ description: 'Subcategory ID', example: 1 })
    public readonly subcategoryId: number;
}
