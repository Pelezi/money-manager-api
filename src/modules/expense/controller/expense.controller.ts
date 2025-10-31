import { Controller, Get, HttpStatus, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

import { AuthenticatedRequest, RestrictedGuard } from '../../common';
import { BudgetService } from '../../budget/service';
import { BudgetData } from '../../budget/model';

@Controller('expenses')
@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class ExpenseController {

    public constructor(
        private readonly budgetService: BudgetService
    ) { }

    @Get()
    @ApiOperation({ 
        summary: 'Get all budgeted expenses for a year',
        description: 'Returns all budgeted amounts (expenses) for the authenticated user filtered by year. These represent the planned spending amounts for each subcategory in each month of the year.'
    })
    @ApiQuery({ name: 'year', required: true, description: 'Year to filter expenses (e.g., 2024, 2025)' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: BudgetData, description: 'List of budgeted expenses for the year' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Year parameter is required' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token JWT ausente ou inválido' })
    public async getExpenses(
        @Query('year') year: string,
        @Request() req: AuthenticatedRequest
    ): Promise<BudgetData[]> {
        if (!year) {
            throw new BadRequestException('Year parameter is required');
        }
        const userId = req?.user?.userId || 1;
        return this.budgetService.findByUser(userId, parseInt(year));
    }

}
