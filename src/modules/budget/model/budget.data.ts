import { ApiProperty } from '@nestjs/swagger';
import { Budget, CategoryType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class BudgetData {

    @ApiProperty({ description: 'Budget unique ID', example: 1 })
    public readonly id: number;

    @ApiProperty({ description: 'User ID', example: 1 })
    public readonly userId: number;

    @ApiProperty({ description: 'Budget name', example: 'Groceries Budget' })
    public readonly name: string;

    @ApiProperty({ description: 'Budget amount', example: 500.00 })
    public readonly amount: number;

    @ApiProperty({ description: 'Budget type - EXPENSE (0) or INCOME (1)', enum: ['EXPENSE', 'INCOME'], example: 'EXPENSE' })
    public readonly type: CategoryType;

    @ApiProperty({ description: 'Month (1-12)', example: 1 })
    public readonly month: number;

    @ApiProperty({ description: 'Year', example: 2024 })
    public readonly year: number;

    @ApiProperty({ description: 'Subcategory ID', example: 1 })
    public readonly subcategoryId: number;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
    public readonly createdAt: Date;

    public constructor(entity: Budget) {
        this.id = entity.id;
        this.userId = entity.userId;
        this.amount = (entity.amount as Decimal).toNumber();
        this.type = entity.type;
        this.month = entity.month;
        this.year = entity.year;
        this.subcategoryId = entity.subcategoryId;
        this.createdAt = entity.createdAt;
    }

}
