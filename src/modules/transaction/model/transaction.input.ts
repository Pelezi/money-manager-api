import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

export class TransactionInput {
    @ApiProperty({ description: 'Account ID', example: 1, required: true })
    public readonly accountId: number;
    
    @ApiProperty({ description: 'Subcategory ID', example: 1, required: false })
    public readonly subcategoryId?: number;

    @ApiProperty({ description: 'Transaction title', example: 'Grocery shopping', required: false })
    public readonly title?: string;

    @ApiProperty({ description: 'Transaction amount', example: 50.00 })
    public readonly amount: number;

    @ApiProperty({ description: 'Transaction description', required: false })
    public readonly description?: string;

    @ApiProperty({ description: 'Transaction date', example: '2024-01-15' })
    public readonly date: Date;

    @ApiProperty({ description: 'Transaction time', example: '14:30:00', required: false })
    public readonly time?: string;

    @ApiProperty({ description: 'Transaction type - EXPENSE, INCOME or TRANSFER', enum: ['EXPENSE', 'INCOME', 'TRANSFER'], example: 'EXPENSE', required: false })
    public readonly type?: CategoryType;

    @ApiProperty({ description: 'Group ID', example: 1, required: false })
    public readonly groupId?: number;

    @ApiProperty({ description: 'User ID - Only for group transactions to specify which member made the transaction', example: 1, required: false })
    public readonly userId?: number;

    @ApiProperty({ description: 'Destination account ID (for transfers)', example: 2, required: false })
    public readonly toAccountId?: number;
}
