import { ApiProperty } from '@nestjs/swagger';
import { AccountBalance } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class AccountBalanceData {

    @ApiProperty({ description: 'Balance unique ID', example: 1 })
    public readonly id: number;

    @ApiProperty({ description: 'Account ID', example: 1 })
    public readonly accountId: number;

    @ApiProperty({ description: 'Balance amount', example: 100.50 })
    public readonly amount: number;

    @ApiProperty({ description: 'Balance date', example: '2024-01-01T00:00:00Z' })
    public readonly date: Date;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
    public readonly createdAt: Date;

    public constructor(entity: AccountBalance) {
        this.id = entity.id;
        this.accountId = entity.accountId;
        this.amount = (entity.amount as Decimal).toNumber();
        this.date = entity.date;
        this.createdAt = entity.createdAt;
    }

}
