import { ApiProperty } from '@nestjs/swagger';
import { Expense, EntityType } from '@prisma/client';

export class ExpenseData {

    @ApiProperty({ description: 'Unique expense ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    public readonly id: string;

    @ApiProperty({ description: 'Reference to subcategory', example: 'subcategory-123' })
    public readonly subcategoryId: string;

    @ApiProperty({ description: 'Budgeted amount for this expense', example: 500.00 })
    public readonly amount: number;

    @ApiProperty({ description: 'Month number (1-12)', example: 3 })
    public readonly month: number;

    @ApiProperty({ description: 'Year', example: 2024 })
    public readonly year: number;

    @ApiProperty({ description: 'Entity type', enum: EntityType, example: 'EXPENSE' })
    public readonly type: EntityType;

    @ApiProperty({ description: 'Creation timestamp', example: '2024-03-15T10:30:00Z' })
    public readonly createdAt?: string;

    @ApiProperty({ description: 'Update timestamp', example: '2024-03-15T10:30:00Z' })
    public readonly updatedAt?: string;

    public constructor(entity: Expense) {
        this.id = entity.id;
        this.subcategoryId = entity.subcategoryId;
        this.amount = entity.amount;
        this.month = entity.month;
        this.year = entity.year;
        this.type = entity.type;
        this.createdAt = entity.createdAt?.toISOString();
        this.updatedAt = entity.updatedAt?.toISOString();
    }

}
