import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class TransactionData {

    @ApiProperty({ description: 'Transaction unique ID', example: 1 })
    public readonly id: number;

    @ApiProperty({ description: 'User ID', example: 1 })
    public readonly userId: number;

    @ApiProperty({ description: 'Category ID', example: 1 })
    public readonly categoryId: number;

    @ApiProperty({ description: 'Transaction amount', example: 50.00 })
    public readonly amount: number;

    @ApiProperty({ description: 'Transaction description', example: 'Grocery shopping', required: false })
    public readonly description?: string;

    @ApiProperty({ description: 'Transaction date', example: '2024-01-15T00:00:00Z' })
    public readonly date: Date;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
    public readonly createdAt: Date;

    public constructor(entity: Transaction) {
        this.id = entity.id;
        this.userId = entity.userId;
        this.categoryId = entity.categoryId;
        this.amount = (entity.amount as Decimal).toNumber();
        this.description = entity.description || undefined;
        this.date = entity.date;
        this.createdAt = entity.createdAt;
    }

}
