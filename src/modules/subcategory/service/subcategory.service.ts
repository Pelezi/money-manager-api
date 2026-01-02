import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
     * @param includeHidden Whether to include hidden subcategories (default: false)
     * @returns A subcategory list
     */
    public async findByUser(userId: number, categoryId?: number, groupId?: number, includeHidden: boolean = false): Promise<SubcategoryData[]> {

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

        // Filter hidden subcategories unless explicitly requested
        if (!includeHidden) {
            where.hidden = false;
        }

        const subcategories = await this.prismaService.subcategory.findMany({
            where,
            orderBy: { name: 'asc' }
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
     * Check if subcategory has associated transactions
     *
     * @param id Subcategory ID
     * @param userId User ID
     * @returns Object with hasTransactions flag and transaction count
     */
    public async checkTransactions(id: number, userId: number): Promise<{ hasTransactions: boolean; count: number }> {
        const subcategory = await this.prismaService.subcategory.findFirst({
            where: { id, userId }
        });

        if (!subcategory) {
            throw new NotFoundException('Subcategory not found');
        }

        const count = await this.prismaService.transaction.count({
            where: {
                subcategoryId: id
            }
        });

        return {
            hasTransactions: count > 0,
            count
        };
    }

    /**
     * Delete a subcategory
     *
     * @param id Subcategory ID
     * @param userId User ID
     * @param deleteTransactions If true, delete associated transactions
     * @param moveToSubcategoryId If provided and deleteTransactions is false, move transactions to this subcategory
     */
    public async delete(
        id: number, 
        userId: number,
        deleteTransactions: boolean = false,
        moveToSubcategoryId?: number
    ): Promise<void> {

        const subcategory = await this.prismaService.subcategory.findFirst({
            where: { id, userId }
        });

        if (!subcategory) {
            throw new NotFoundException('Subcategory not found');
        }

        // Check if there are transactions
        const transactionCount = await this.prismaService.transaction.count({
            where: {
                subcategoryId: id
            }
        });

        if (transactionCount > 0) {
            if (deleteTransactions) {
                // Delete all transactions associated with this subcategory
                await this.prismaService.transaction.deleteMany({
                    where: {
                        subcategoryId: id
                    }
                });
            } else if (moveToSubcategoryId) {
                // Verify target subcategory exists and belongs to user
                const targetSubcategory = await this.prismaService.subcategory.findFirst({
                    where: { id: moveToSubcategoryId, userId }
                });

                if (!targetSubcategory) {
                    throw new BadRequestException('Target subcategory not found');
                }

                // Move all transactions to the target subcategory
                await this.prismaService.transaction.updateMany({
                    where: {
                        subcategoryId: id
                    },
                    data: {
                        subcategoryId: moveToSubcategoryId
                    }
                });
            } else {
                throw new BadRequestException('Subcategory has transactions. Please specify deleteTransactions=true or provide moveToSubcategoryId');
            }
        }

        // Delete the subcategory
        await this.prismaService.subcategory.delete({
            where: { id }
        });
    }

    /**
     * Hide a subcategory
     *
     * @param id Subcategory ID
     * @param userId User ID
     */
    public async hide(id: number, userId: number): Promise<SubcategoryData> {
        const subcategory = await this.prismaService.subcategory.findFirst({
            where: { id, userId }
        });

        if (!subcategory) {
            throw new NotFoundException('Subcategory not found');
        }

        const updated = await this.prismaService.subcategory.update({
            where: { id },
            data: { hidden: true }
        });

        return new SubcategoryData(updated);
    }

    /**
     * Unhide a subcategory
     *
     * @param id Subcategory ID
     * @param userId User ID
     */
    public async unhide(id: number, userId: number): Promise<SubcategoryData> {
        const subcategory = await this.prismaService.subcategory.findFirst({
            where: { id, userId }
        });

        if (!subcategory) {
            throw new NotFoundException('Subcategory not found');
        }

        const updated = await this.prismaService.subcategory.update({
            where: { id },
            data: { hidden: false }
        });

        return new SubcategoryData(updated);
    }

}
