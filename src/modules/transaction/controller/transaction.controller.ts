import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

import { RestrictedGuard } from '../../common';

import { TransactionData, TransactionInput } from '../model';
import { TransactionService } from '../service';

@Controller('transactions')
@ApiTags('transaction')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class TransactionController {

    public constructor(
        private readonly transactionService: TransactionService
    ) { }

    @Get()
    @ApiOperation({ summary: 'Find all transactions for the authenticated user' })
    @ApiQuery({ name: 'subcategoryId', required: false, description: 'Filter by subcategory ID' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
    @ApiQuery({ name: 'type', required: false, enum: ['EXPENSE', 'INCOME'], description: 'Filter by transaction type (0=EXPENSE, 1=INCOME)' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TransactionData })
    public async find(
        @Query('subcategoryId') subcategoryId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('type') type?: CategoryType,
        @Request() req?: any
    ): Promise<TransactionData[]> {
        const userId = req.user?.userId || 1;
        return this.transactionService.findByUser(
            userId,
            subcategoryId ? parseInt(subcategoryId) : undefined,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
            type
        );
    }

    @Get('aggregated')
    @ApiOperation({ summary: 'Get aggregated spending by subcategory' })
    @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO format)' })
    @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO format)' })
    @ApiResponse({ status: HttpStatus.OK })
    public async getAggregated(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Request() req: any
    ): Promise<{ subcategoryId: number; total: number }[]> {
        const userId = req.user?.userId || 1;
        return this.transactionService.getAggregatedSpending(
            userId,
            new Date(startDate),
            new Date(endDate)
        );
    }

    @Get(':id')
    @ApiParam({ name: 'id', description: 'Transaction ID' })
    @ApiOperation({ summary: 'Find a transaction by ID' })
    @ApiResponse({ status: HttpStatus.OK, type: TransactionData })
    public async findById(@Param('id') id: string, @Request() req: any): Promise<TransactionData> {
        const userId = req.user?.userId || 1;
        const transaction = await this.transactionService.findById(parseInt(id), userId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        return transaction;
    }

    @Post()
    @ApiOperation({ summary: 'Create a new transaction' })
    @ApiResponse({ status: HttpStatus.CREATED, type: TransactionData })
    public async create(@Body() input: TransactionInput, @Request() req: any): Promise<TransactionData> {
        const userId = req.user?.userId || 1;
        return this.transactionService.create(userId, input);
    }

    @Put(':id')
    @ApiParam({ name: 'id', description: 'Transaction ID' })
    @ApiOperation({ summary: 'Update a transaction' })
    @ApiResponse({ status: HttpStatus.OK, type: TransactionData })
    public async update(@Param('id') id: string, @Body() input: TransactionInput, @Request() req: any): Promise<TransactionData> {
        const userId = req.user?.userId || 1;
        return this.transactionService.update(parseInt(id), userId, input);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'Transaction ID' })
    @ApiOperation({ summary: 'Delete a transaction' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    public async delete(@Param('id') id: string, @Request() req: any): Promise<void> {
        const userId = req.user?.userId || 1;
        await this.transactionService.delete(parseInt(id), userId);
    }

}
