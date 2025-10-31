import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

export class TransactionAggregated {

    @ApiProperty({ description: 'Subcategory ID', example: 1 })
    public readonly subcategoryId: number;

    @ApiProperty({ description: 'Total amount of all transactions', example: 150.00 })
    public readonly total: number;

    @ApiProperty({ description: 'Number of transactions', example: 5 })
    public readonly count: number;

    @ApiProperty({ description: 'Month (1-12)', example: 1 })
    public readonly month: number;

    @ApiProperty({ description: 'Year', example: 2024 })
    public readonly year: number;

    @ApiProperty({ description: 'Transaction type', enum: ['EXPENSE', 'INCOME'], example: 'EXPENSE' })
    public readonly type: CategoryType;

    public constructor(data: {
        subcategoryId: number;
        total: number;
        count: number;
        month: number;
        year: number;
        type: CategoryType;
    }) {
        this.subcategoryId = data.subcategoryId;
        this.total = data.total;
        this.count = data.count;
        this.month = data.month;
        this.year = data.year;
        this.type = data.type;
    }

}
