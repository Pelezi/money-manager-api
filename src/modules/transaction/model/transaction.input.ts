import { ApiProperty } from '@nestjs/swagger';

export class TransactionInput {
    @ApiProperty({ description: 'Subcategory ID', example: 1 })
    public readonly subcategoryId: number;

    @ApiProperty({ description: 'Transaction amount', example: 50.00 })
    public readonly amount: number;

    @ApiProperty({ description: 'Transaction description', required: false })
    public readonly description?: string;

    @ApiProperty({ description: 'Transaction date', example: '2024-01-15T00:00:00Z' })
    public readonly date: Date;
}
