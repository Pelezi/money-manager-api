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
     * @param groupId Optional group filter
     * @returns A category list
     */
    public async findByUser(userId: number, groupId?: number): Promise<CategoryData[]> {

        const where: any = {};
        
        // If groupId is provided, filter by group (accessible to all group members)
        // Otherwise, filter by userId AND groupId null (personal data only)
        if (groupId !== undefined) {
            where.groupId = groupId;
        } else {
            where.userId = userId;
            where.groupId = null;  // Ensure we only get personal categories, not group categories
        }

        const categories = await this.prismaService.category.findMany({
            where
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
                groupId: data.groupId,
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

    /**
     * Bulk create categories with subcategories
     *
     * @param userId User ID
     * @param categories Array of categories with their subcategories
     * @returns Created categories
     */
    public async bulkCreateWithSubcategories(
        userId: number,
        categories: Array<{ name: string; type: 'EXPENSE' | 'INCOME'; subcategories: string[] }>
    ): Promise<CategoryData[]> {
        const createdCategories: CategoryData[] = [];

        for (const categoryData of categories) {
            const category = await this.prismaService.category.create({
                data: {
                    userId,
                    name: categoryData.name,
                    type: categoryData.type,
                    subcategories: {
                        create: categoryData.subcategories.map(subName => ({
                            userId,
                            name: subName,
                            type: categoryData.type
                        }))
                    }
                }
            });

            createdCategories.push(new CategoryData(category));
        }

        return createdCategories;
    }

}
