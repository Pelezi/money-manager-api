import { Module } from '@nestjs/common';

import { CommonModule } from '../common';
import { ExpenseController } from './controller';
import { ExpenseService } from './service';

@Module({
    imports: [
        CommonModule,
    ],
    providers: [
        ExpenseService
    ],
    controllers: [
        ExpenseController
    ],
    exports: []
})
export class ExpenseModule { }
