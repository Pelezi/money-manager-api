import { BadRequestException, Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ExpenseData } from '../model';
import { ExpenseService } from '../service';

@Controller('expenses')
@ApiTags('expense')
export class ExpenseController {

    public constructor(
        private readonly expenseService: ExpenseService
    ) { }

    @Get()
    @ApiOperation({ summary: 'Find expenses by year' })
    @ApiQuery({ name: 'year', required: true, type: Number, description: 'The selected year' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: ExpenseData })
    public async findByYear(@Query('year') year: string): Promise<ExpenseData[]> {

        const yearNumber = parseInt(year, 10);
        if (isNaN(yearNumber)) {
            throw new BadRequestException('Invalid year parameter');
        }
        return this.expenseService.findByYear(yearNumber);
    }

}
