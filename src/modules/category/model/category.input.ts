import { ApiProperty, PickType } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';
import { CategoryData } from './category.data';

export class CategoryInput extends PickType(CategoryData, ['name'] as const) {
    @ApiProperty({ description: 'Category description', required: false })
    public readonly description?: string;

    @ApiProperty({ description: 'Category type - EXPENSE (0) or INCOME (1)', enum: ['EXPENSE', 'INCOME'], example: 'EXPENSE', required: false })
    public readonly type?: CategoryType;

    @ApiProperty({ description: 'Group ID', example: 1, required: false })
    public readonly groupId?: number;
}
