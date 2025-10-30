import { ApiProperty } from '@nestjs/swagger';
import { Subcategory, CategoryType } from '@prisma/client';

export class SubcategoryData {

    @ApiProperty({ description: 'Subcategory unique ID', example: 1 })
    public readonly id: number;

    @ApiProperty({ description: 'User ID', example: 1 })
    public readonly userId: number;

    @ApiProperty({ description: 'Category ID', example: 1 })
    public readonly categoryId: number;

    @ApiProperty({ description: 'Subcategory name', example: 'Fresh Produce' })
    public readonly name: string;

    @ApiProperty({ description: 'Subcategory description', example: 'Fruits and vegetables', required: false })
    public readonly description?: string;

    @ApiProperty({ description: 'Subcategory type', enum: ['EXPENSE', 'INCOME'], example: 'EXPENSE' })
    public readonly type: CategoryType;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
    public readonly createdAt: Date;

    public constructor(entity: Subcategory) {
        this.id = entity.id;
        this.userId = entity.userId;
        this.categoryId = entity.categoryId;
        this.name = entity.name;
        this.description = entity.description || undefined;
        this.type = entity.type;
        this.createdAt = entity.createdAt;
    }

}
