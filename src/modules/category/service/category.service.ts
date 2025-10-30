import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common';
import { CategoryData, CategoryInput } from '../model';

@Injectable()
export class CategoryService {

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    /**
     * Find all categories for a user
     *
     * @param userId User ID
     * @returns A category list
     */
    public async findByUser(userId: number): Promise<CategoryData[]> {

        const categories = await this.prismaService.category.findMany({
            where: { userId }
        });

        return categories.map(category => new CategoryData(category));
    }

    /**
     * Find a category by ID
     *
     * @param id Category ID
     * @param userId User ID
     * @returns A category or null
     */
    public async findById(id: number, userId: number): Promise<CategoryData | null> {

        const category = await this.prismaService.category.findFirst({
            where: { id, userId }
        });

        if (!category) {
            return null;
        }

        return new CategoryData(category);
    }

    /**
     * Create a new category
     *
     * @param userId User ID
     * @param data Category details
     * @returns A category created in the database
     */
    public async create(userId: number, data: CategoryInput): Promise<CategoryData> {

        const category = await this.prismaService.category.create({
            data: {
                userId,
                name: data.name,
                description: data.description,
                type: data.type
            }
        });

        return new CategoryData(category);
    }

    /**
     * Update a category
     *
     * @param id Category ID
     * @param userId User ID
     * @param data Category details
     * @returns Updated category
     */
    public async update(id: number, userId: number, data: Partial<CategoryInput>): Promise<CategoryData> {

        const category = await this.prismaService.category.findFirst({
            where: { id, userId }
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        const updated = await this.prismaService.category.update({
            where: { id },
            data
        });

        return new CategoryData(updated);
    }

    /**
     * Delete a category
     *
     * @param id Category ID
     * @param userId User ID
     */
    public async delete(id: number, userId: number): Promise<void> {

        const category = await this.prismaService.category.findFirst({
            where: { id, userId }
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        await this.prismaService.category.delete({
            where: { id }
        });
    }

}
