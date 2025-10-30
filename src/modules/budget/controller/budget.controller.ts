import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BudgetType } from '@prisma/client';

import { RestrictedGuard } from '../../common';

import { BudgetData, BudgetInput } from '../model';
import { BudgetService } from '../service';

@Controller('budgets')
@ApiTags('budget')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class BudgetController {

    public constructor(
        private readonly budgetService: BudgetService
    ) { }

    @Get()
    @ApiOperation({ summary: 'Find all budgets for the authenticated user' })
    @ApiQuery({ name: 'year', required: false, description: 'Filter by year' })
    @ApiQuery({ name: 'type', required: false, enum: ['MONTHLY', 'ANNUAL'], description: 'Filter by budget type' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: BudgetData })
    public async find(
        @Query('year') year?: string,
        @Query('type') type?: BudgetType,
        @Request() req?: any
    ): Promise<BudgetData[]> {
        const userId = req.user?.userId || 1;
        return this.budgetService.findByUser(
            userId,
            year ? parseInt(year) : undefined,
            type
        );
    }

    @Get('comparison')
    @ApiOperation({ summary: 'Get budget vs actual spending comparison' })
    @ApiQuery({ name: 'year', required: true, description: 'Year' })
    @ApiQuery({ name: 'month', required: false, description: 'Month (1-12)' })
    @ApiQuery({ name: 'subcategoryId', required: false, description: 'Subcategory ID' })
    @ApiResponse({ status: HttpStatus.OK })
    public async getComparison(
        @Query('year') year: string,
        @Query('month') month?: string,
        @Query('subcategoryId') subcategoryId?: string,
        @Request() req?: any
    ): Promise<{ budgeted: number; actual: number; difference: number }> {
        const userId = req.user?.userId || 1;
        return this.budgetService.getComparison(
            userId,
            parseInt(year),
            month ? parseInt(month) : undefined,
            subcategoryId ? parseInt(subcategoryId) : undefined
        );
    }

    @Get(':id')
    @ApiParam({ name: 'id', description: 'Budget ID' })
    @ApiOperation({ summary: 'Find a budget by ID' })
    @ApiResponse({ status: HttpStatus.OK, type: BudgetData })
    public async findById(@Param('id') id: string, @Request() req: any): Promise<BudgetData> {
        const userId = req.user?.userId || 1;
        const budget = await this.budgetService.findById(parseInt(id), userId);
        if (!budget) {
            throw new Error('Budget not found');
        }
        return budget;
    }

    @Post()
    @ApiOperation({ summary: 'Create a new budget' })
    @ApiResponse({ status: HttpStatus.CREATED, type: BudgetData })
    public async create(@Body() input: BudgetInput, @Request() req: any): Promise<BudgetData> {
        const userId = req.user?.userId || 1;
        return this.budgetService.create(userId, input);
    }

    @Put(':id')
    @ApiParam({ name: 'id', description: 'Budget ID' })
    @ApiOperation({ summary: 'Update a budget' })
    @ApiResponse({ status: HttpStatus.OK, type: BudgetData })
    public async update(@Param('id') id: string, @Body() input: BudgetInput, @Request() req: any): Promise<BudgetData> {
        const userId = req.user?.userId || 1;
        return this.budgetService.update(parseInt(id), userId, input);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'Budget ID' })
    @ApiOperation({ summary: 'Delete a budget' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    public async delete(@Param('id') id: string, @Request() req: any): Promise<void> {
        const userId = req.user?.userId || 1;
        await this.budgetService.delete(parseInt(id), userId);
    }

}
