import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

export class TransactionData {
    @ApiProperty({ description: 'Account ID', example: 1, required: true })
    public readonly accountId: number;

    @ApiProperty({ description: 'Transaction unique ID', example: 1 })
    public readonly id: number;

    @ApiProperty({ description: 'User ID', example: 1 })
    public readonly userId: number;

    @ApiProperty({ description: 'Subcategory ID', example: 1, required: false })
    public readonly subcategoryId?: number | null;

    @ApiProperty({ description: 'Transaction title', example: 'Grocery shopping' })
    public readonly title?: string | null;

    @ApiProperty({ description: 'Transaction amount', example: 50.00 })
    public readonly amount: number;

    @ApiProperty({ description: 'Transaction description', example: 'Weekly groceries at Whole Foods', required: false })
    public readonly description?: string | null;

    @ApiProperty({ description: 'Transaction date', example: '2024-01-15T00:00:00Z' })
    public readonly date: Date;

    @ApiProperty({ description: 'Transaction type', enum: ['EXPENSE', 'INCOME', 'TRANSFER'], example: 'EXPENSE' })
    public readonly type: CategoryType;

    @ApiProperty({ description: 'Destination account ID for transfers', example: 2, required: false })
    public readonly toAccountId?: number | null;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
    public readonly createdAt: Date;

    @ApiProperty({ description: 'User information', required: false })
    public readonly user?: {
        id: number;
        firstName: string;
        lastName: string;
    };

    @ApiProperty({ description: 'Subcategory with category information', required: false })
    public readonly subcategory?: {
        id: number;
        name: string;
        category: {
            id: number;
            name: string;
            type: CategoryType;
        };
    } | null;

    public constructor(entity: any) {
        this.accountId = entity.accountId;
        this.id = entity.id;
        this.userId = entity.userId;
        this.subcategoryId = entity.subcategoryId;
        this.title = entity.title;
        this.amount = Number(entity.amount);
        this.description = entity.description;
        this.date = entity.date;
        this.type = entity.type;
        this.toAccountId = entity.toAccountId;
        this.createdAt = entity.createdAt;
        
        // Include user data if available
        if (entity.user) {
            this.user = {
                id: entity.user.id,
                firstName: entity.user.firstName,
                lastName: entity.user.lastName
            };
        }

        // Include subcategory and category data if available
        if (entity.subcategory) {
            this.subcategory = {
                id: entity.subcategory.id,
                name: entity.subcategory.name,
                category: {
                    id: entity.subcategory.category.id,
                    name: entity.subcategory.category.name,
                    type: entity.subcategory.category.type
                }
            };
        }
    }

}
