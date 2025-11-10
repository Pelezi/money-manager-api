import { ApiProperty } from '@nestjs/swagger';

export class AccountBalanceInput {
    @ApiProperty({ description: 'Account ID', example: 1 })
    public readonly accountId: number;

    @ApiProperty({ description: 'Balance amount', example: 100.50 })
    public readonly amount: number;

    @ApiProperty({ description: 'Balance date', example: '2024-01-01T00:00:00Z', required: false })
    public readonly date?: Date;
}
