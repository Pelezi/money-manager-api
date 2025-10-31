import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { TransactionAggregatedData } from '../model';
import { TransactionService } from '../service';

@Controller('transactions')
@ApiTags('transaction')
export class TransactionController {

    public constructor(
        private readonly transactionService: TransactionService
    ) { }

    @Get('aggregated')
    @ApiOperation({ summary: 'Find aggregated transactions by year' })
    @ApiQuery({ name: 'year', required: true, type: Number, description: 'The selected year' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: TransactionAggregatedData })
    public async findAggregatedByYear(@Query('year') year: string): Promise<TransactionAggregatedData[]> {

        const yearNumber = parseInt(year, 10);
        return this.transactionService.findAggregatedByYear(yearNumber);
    }

}
