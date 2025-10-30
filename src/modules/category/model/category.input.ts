import { ApiProperty, PickType } from '@nestjs/swagger';
import { CategoryData } from './category.data';

export class CategoryInput extends PickType(CategoryData, ['name'] as const) {
    @ApiProperty({ description: 'Category description', required: false })
    public readonly description?: string;

    @ApiProperty({ description: 'Parent category ID for subcategories', required: false })
    public readonly parentId?: number;
}
