import { ApiProperty } from '@nestjs/swagger';
import { EntityType } from '@prisma/client';

export class TransactionAggregatedData {

    @ApiProperty({ description: 'Reference to subcategory', example: 'subcategory-123' })
    public readonly subcategoryId: string;

    @ApiProperty({ description: 'Sum of all transaction amounts', example: 1250.75 })
    public readonly total: number;

    @ApiProperty({ description: 'Number of transactions', example: 15 })
    public readonly count: number;

    @ApiProperty({ description: 'Month number (1-12)', example: 3 })
    public readonly month: number;

    @ApiProperty({ description: 'Year', example: 2024 })
    public readonly year: number;

    @ApiProperty({ description: 'Entity type', enum: EntityType, example: 'EXPENSE' })
    public readonly type: EntityType;

    public constructor(data: {
        subcategoryId: string;
        total: number;
        count: number;
        month: number;
        year: number;
        type: EntityType;
    }) {
        this.subcategoryId = data.subcategoryId;
        this.total = data.total;
        this.count = data.count;
        this.month = data.month;
        this.year = data.year;
        this.type = data.type;
    }

}
