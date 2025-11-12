import { ApiProperty } from '@nestjs/swagger';
import { Account, AccountType } from '@prisma/client';

export class AccountData {

    @ApiProperty({ description: 'Account unique ID', example: 1 })
    public readonly id: number;

    @ApiProperty({ description: 'User ID', example: 1 })
    public readonly userId: number;

    @ApiProperty({ description: 'User', required: false })
    public readonly user?: {
        firstName: string;
        lastName: string;
    };

    @ApiProperty({ description: 'Group ID', example: 1, required: false })
    public readonly groupId?: number | null;

    @ApiProperty({ description: 'Account name', example: 'Dinheiro' })
    public readonly name: string;

    @ApiProperty({ description: 'Account type', enum: ['CREDIT', 'CASH', 'PREPAID'], example: 'CASH' })
    public readonly type: AccountType;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
    public readonly createdAt: Date;

    @ApiProperty({ description: 'Updated at', example: '2024-01-01T00:00:00Z' })
    public readonly updatedAt: Date;

    public constructor(entity: Account & { user?: { firstName: string; lastName: string } | null }) {
        this.id = entity.id;
        this.userId = entity.userId;
        this.groupId = entity.groupId ?? undefined;
        this.name = entity.name;
        this.type = entity.type;
        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;
        this.user = entity.user ? {
            firstName: entity.user.firstName,
            lastName: entity.user.lastName
        } : undefined;
    }

}
