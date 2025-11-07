import { ApiProperty } from '@nestjs/swagger';
import { Group } from '@prisma/client';

export class GroupData {

    @ApiProperty({ description: 'Group unique ID', example: 1 })
    public readonly id: number;

    @ApiProperty({ description: 'Group name', example: 'Family Budget' })
    public readonly name: string;

    @ApiProperty({ description: 'Group description', example: 'Shared budget for family expenses', required: false })
    public readonly description?: string;

    @ApiProperty({ description: 'Owner user ID', example: 1 })
    public readonly ownerId: number;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
    public readonly createdAt: Date;

    @ApiProperty({ description: 'Updated at', example: '2024-01-01T00:00:00Z' })
    public readonly updatedAt: Date;

    public constructor(entity: Group) {
        this.id = entity.id;
        this.name = entity.name;
        this.description = entity.description || undefined;
        this.ownerId = entity.ownerId;
        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;
    }

}
