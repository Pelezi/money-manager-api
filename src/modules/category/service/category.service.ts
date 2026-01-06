import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

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
     * @param includeHidden Whether to include hidden categories (default: false)
     * @returns A category list
     */
    public async findByUser(userId: number, groupId?: number, includeHidden: boolean = false): Promise<CategoryData[]> {

        const where: any = {};
        
        // If groupId is provided, filter by group (accessible to all group members)
        // Otherwise, filter by userId AND groupId null (personal data only)
        if (groupId !== undefined) {
            where.groupId = groupId;
        } else {
            where.userId = userId;
            where.groupId = null;  // Ensure we only get personal categories, not group categories
        }

        // Filter hidden categories unless explicitly requested
        if (!includeHidden) {
            where.hidden = false;
        }

        const categories = await this.prismaService.category.findMany({
            where,
            orderBy: { name: 'asc' }
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
     * Check if category has associated transactions, budgets, or accounts
     *
     * @param id Category ID
     * @param userId User ID
     * @returns Object with counts for transactions, budgets, and accounts
     */
    public async checkTransactions(id: number, userId: number): Promise<{ 
        hasTransactions: boolean; 
        count: number;
        hasBudgets: boolean;
        budgetCount: number;
        hasAccounts: boolean;
        accountCount: number;
    }> {
        const category = await this.prismaService.category.findFirst({
            where: { id, userId }
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        // Get all subcategory IDs for this category
        const subcategories = await this.prismaService.subcategory.findMany({
            where: { categoryId: id },
            select: { id: true }
        });
        const subcategoryIds = subcategories.map(sub => sub.id);

        // Count transactions
        const transactionCount = await this.prismaService.transaction.count({
            where: {
                subcategoryId: { in: subcategoryIds }
            }
        });

        // Count budgets
        const budgetCount = await this.prismaService.budget.count({
            where: {
                subcategoryId: { in: subcategoryIds }
            }
        });

        // Count accounts using these subcategories
        const accountCount = await this.prismaService.account.count({
            where: {
                subcategoryId: { in: subcategoryIds }
            }
        });

        return {
            hasTransactions: transactionCount > 0,
            count: transactionCount,
            hasBudgets: budgetCount > 0,
            budgetCount,
            hasAccounts: accountCount > 0,
            accountCount
        };
    }

    /**
     * Delete a category
     *
     * @param id Category ID
     * @param userId User ID
     * @param deleteTransactions If true, delete associated transactions. If false, transactions must be moved first
     * @param moveToSubcategoryId If provided and deleteTransactions is false, move transactions to this subcategory
     */
    public async delete(
        id: number, 
        userId: number, 
        deleteTransactions: boolean = false,
        moveToSubcategoryId?: number
    ): Promise<void> {

        const category = await this.prismaService.category.findFirst({
            where: { id, userId }
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        // Get all subcategories of this category
        const subcategories = await this.prismaService.subcategory.findMany({
            where: { categoryId: id }
        });

        const subcategoryIds = subcategories.map(sub => sub.id);

        if (subcategoryIds.length > 0) {
            // Check if there are transactions
            const transactionCount = await this.prismaService.transaction.count({
                where: {
                    subcategoryId: { in: subcategoryIds }
                }
            });

            if (transactionCount > 0) {
                if (deleteTransactions) {
                    // Delete all transactions associated with subcategories of this category
                    await this.prismaService.transaction.deleteMany({
                        where: {
                            subcategoryId: { in: subcategoryIds }
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
                            subcategoryId: { in: subcategoryIds }
                        },
                        data: {
                            subcategoryId: moveToSubcategoryId
                        }
                    });
                } else {
                    throw new BadRequestException('Category has transactions. Please specify deleteTransactions=true or provide moveToSubcategoryId');
                }
            }

            // Handle budgets
            if (deleteTransactions) {
                // Delete all budgets for subcategories
                await this.prismaService.budget.deleteMany({
                    where: {
                        subcategoryId: { in: subcategoryIds }
                    }
                });
            } else if (moveToSubcategoryId) {
                // Transfer budgets to target subcategory, summing amounts for same month/year
                const budgetsToMove = await this.prismaService.budget.findMany({
                    where: {
                        subcategoryId: { in: subcategoryIds }
                    }
                });

                for (const budget of budgetsToMove) {
                    // Check if target already has a budget for this month/year
                    const existingBudget = await this.prismaService.budget.findFirst({
                        where: {
                            subcategoryId: moveToSubcategoryId,
                            month: budget.month,
                            year: budget.year
                        }
                    });

                    if (existingBudget) {
                        // Sum the amounts
                        await this.prismaService.budget.update({
                            where: { id: existingBudget.id },
                            data: {
                                amount: existingBudget.amount.toNumber() + budget.amount.toNumber()
                            }
                        });
                        // Delete the old budget
                        await this.prismaService.budget.delete({
                            where: { id: budget.id }
                        });
                    } else {
                        // Move the budget to target subcategory
                        await this.prismaService.budget.update({
                            where: { id: budget.id },
                            data: {
                                subcategoryId: moveToSubcategoryId
                            }
                        });
                    }
                }
            }

            // Handle accounts
            if (deleteTransactions) {
                // Set subcategoryId to null for accounts using these subcategories
                await this.prismaService.account.updateMany({
                    where: {
                        subcategoryId: { in: subcategoryIds }
                    },
                    data: {
                        subcategoryId: null
                    }
                });
            } else if (moveToSubcategoryId) {
                // Update accounts to use the target subcategory
                await this.prismaService.account.updateMany({
                    where: {
                        subcategoryId: { in: subcategoryIds }
                    },
                    data: {
                        subcategoryId: moveToSubcategoryId
                    }
                });
            }

            // Delete all subcategories
            await this.prismaService.subcategory.deleteMany({
                where: { categoryId: id }
            });
        }

        // Delete the category
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

    /**
     * Hide a category
     *
     * @param id Category ID
     * @param userId User ID
     */
    public async hide(id: number, userId: number): Promise<CategoryData> {
        const category = await this.prismaService.category.findFirst({
            where: { id, userId }
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        // Hide the category and all its subcategories
        await this.prismaService.$transaction([
            this.prismaService.category.update({
                where: { id },
                data: { hidden: true }
            }),
            this.prismaService.subcategory.updateMany({
                where: { categoryId: id },
                data: { hidden: true }
            })
        ]);

        const updated = await this.prismaService.category.findUnique({
            where: { id }
        });

        return new CategoryData(updated!);
    }

    /**
     * Unhide a category
     *
     * @param id Category ID
     * @param userId User ID
     */
    public async unhide(id: number, userId: number): Promise<CategoryData> {
        const category = await this.prismaService.category.findFirst({
            where: { id, userId }
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        // Unhide the category and all its subcategories
        await this.prismaService.$transaction([
            this.prismaService.category.update({
                where: { id },
                data: { hidden: false }
            }),
            this.prismaService.subcategory.updateMany({
                where: { categoryId: id },
                data: { hidden: false }
            })
        ]);

        const updated = await this.prismaService.category.findUnique({
            where: { id }
        });

        return new CategoryData(updated!);
    }

}
