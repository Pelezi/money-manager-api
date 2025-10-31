import { Module } from '@nestjs/common';

import { CommonModule } from './common';
import { ExpenseModule } from './expense/expense.module';
import { PassengerModule } from './passenger/passenger.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
    imports: [
        CommonModule,
        PassengerModule,
        ExpenseModule,
        TransactionModule
    ]
})
export class ApplicationModule {}
