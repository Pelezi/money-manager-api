import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../common';
import { SubcategoryData, SubcategoryInput } from '../model';

@Injectable()
export class SubcategoryService {

    public constructor(
        private readonly prismaService: PrismaService
    ) { }

    /**
     * Find all subcategories for a user
     *
     * @param userId User ID
     * @param categoryId Optional category filter
     * @param groupId Optional group filter
     * @returns A subcategory list
     */
    public async findByUser(userId: number, categoryId?: number, groupId?: number): Promise<SubcategoryData[]> {

        const where: Prisma.SubcategoryWhereInput = {};

        // If groupId is provided, filter by group (accessible to all group members)
        // Otherwise, filter by userId AND groupId null (personal data only)
        if (groupId !== undefined) {
            where.groupId = groupId;
        } else {
            where.userId = userId;
            where.groupId = null;  // Ensure we only get personal subcategories, not group subcategories
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        const subcategories = await this.prismaService.subcategory.findMany({
            where
        });

        return subcategories.map(subcategory => new SubcategoryData(subcategory));
    }

    /**
     * Find a subcategory by ID
     *
     * @param id Subcategory ID
     * @param userId User ID
     * @returns A subcategory or null
     */
    public async findById(id: number, userId: number): Promise<SubcategoryData | null> {

        const subcategory = await this.prismaService.subcategory.findFirst({
            where: { id, userId }
        });

        if (!subcategory) {
            return null;
        }

        return new SubcategoryData(subcategory);
    }

    /**
     * Create a new subcategory
     *
     * @param userId User ID
     * @param data Subcategory details
     * @returns A subcategory created in the database
     */
    public async create(userId: number, data: SubcategoryInput): Promise<SubcategoryData> {

        const subcategory = await this.prismaService.subcategory.create({
            data: {
                userId,
                categoryId: data.categoryId,
                name: data.name,
                description: data.description,
                type: data.type,
                groupId: data.groupId
            }
        });

        return new SubcategoryData(subcategory);
    }

    /**
     * Update a subcategory
     *
     * @param id Subcategory ID
     * @param userId User ID
     * @param data Subcategory details
     * @returns Updated subcategory
     */
    public async update(id: number, userId: number, data: Partial<SubcategoryInput>): Promise<SubcategoryData> {

        const subcategory = await this.prismaService.subcategory.findFirst({
            where: { id, userId }
        });

        if (!subcategory) {
            throw new NotFoundException('Subcategory not found');
        }

        const updated = await this.prismaService.subcategory.update({
            where: { id },
            data
        });

        return new SubcategoryData(updated);
    }

    /**
     * Delete a subcategory
     *
     * @param id Subcategory ID
     * @param userId User ID
     */
    public async delete(id: number, userId: number): Promise<void> {

        const subcategory = await this.prismaService.subcategory.findFirst({
            where: { id, userId }
        });

        if (!subcategory) {
            throw new NotFoundException('Subcategory not found');
        }

        await this.prismaService.subcategory.delete({
            where: { id }
        });
    }

}
