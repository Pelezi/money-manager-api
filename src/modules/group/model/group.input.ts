import { ApiProperty } from '@nestjs/swagger';

export class GroupInput {
    @ApiProperty({ description: 'Group name', example: 'Family Budget' })
    public readonly name: string;

    @ApiProperty({ description: 'Group description', example: 'Shared budget for family expenses', required: false })
    public readonly description?: string;
}

export class UpdateGroupInput {
    @ApiProperty({ description: 'Group name', example: 'Family Budget', required: false })
    public readonly name?: string;

    @ApiProperty({ description: 'Group description', example: 'Shared budget for family expenses', required: false })
    public readonly description?: string;
}
