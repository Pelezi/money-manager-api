import { Module } from '@nestjs/common';

import { CommonModule } from '../common';
import { BudgetController } from './controller';
import { BudgetService } from './service';

@Module({
    imports: [
        CommonModule,
    ],
    providers: [
        BudgetService
    ],
    controllers: [
        BudgetController
    ],
    exports: [BudgetService]
})
export class BudgetModule { }
