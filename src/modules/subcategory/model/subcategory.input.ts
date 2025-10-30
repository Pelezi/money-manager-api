import { ApiProperty, PickType } from '@nestjs/swagger';
import { SubcategoryData } from './subcategory.data';

export class SubcategoryInput extends PickType(SubcategoryData, ['name', 'categoryId'] as const) {
    @ApiProperty({ description: 'Subcategory description', required: false })
    public readonly description?: string;
}
