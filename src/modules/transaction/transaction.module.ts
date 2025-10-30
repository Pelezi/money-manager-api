import { Module } from '@nestjs/common';

import { CommonModule } from '../common';
import { TransactionController } from './controller';
import { TransactionService } from './service';

@Module({
    imports: [
        CommonModule,
    ],
    providers: [
        TransactionService
    ],
    controllers: [
        TransactionController
    ],
    exports: [TransactionService]
})
export class TransactionModule { }
