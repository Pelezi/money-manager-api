import { Module } from '@nestjs/common';

import { BudgetModule } from '../budget/budget.module';
import { CommonModule } from '../common';

import { ExpenseController } from './controller';

@Module({
    imports: [
        CommonModule,
        BudgetModule
    ],
    controllers: [ExpenseController]
})
export class ExpenseModule {}
