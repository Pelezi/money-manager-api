import { ApiProperty } from '@nestjs/swagger';
import { Category } from '@prisma/client';

export class CategoryData {

    @ApiProperty({ description: 'Category unique ID', example: 1 })
    public readonly id: number;

    @ApiProperty({ description: 'User ID', example: 1 })
    public readonly userId: number;

    @ApiProperty({ description: 'Category name', example: 'Groceries' })
    public readonly name: string;

    @ApiProperty({ description: 'Category description', example: 'Food and household items', required: false })
    public readonly description?: string;

    @ApiProperty({ description: 'Parent category ID', example: 1, required: false })
    public readonly parentId?: number;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
    public readonly createdAt: Date;

    public constructor(entity: Category) {
        this.id = entity.id;
        this.userId = entity.userId;
        this.name = entity.name;
        this.description = entity.description || undefined;
        this.parentId = entity.parentId || undefined;
        this.createdAt = entity.createdAt;
    }

}
