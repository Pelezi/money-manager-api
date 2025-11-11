import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class AccountInput {
    @ApiProperty({ description: 'Account name', example: 'Dinheiro' })
    public readonly name: string;

    @ApiProperty({ description: 'Account type', enum: ['CREDIT', 'CASH', 'PREPAID'], example: 'CASH' })
    public readonly type: AccountType;

    @ApiProperty({ description: 'Group ID', example: 1, required: false })
    public readonly groupId?: number;

    @ApiProperty({ description: 'Initial balance', example: 0.00, required: false })
    public readonly initialBalance?: number;

    @ApiProperty({ description: 'User ID', example: 1, required: false })
    public readonly userId?: number;
}
