import { Module } from '@nestjs/common';

import { CommonModule } from './common';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { BudgetModule } from './budget/budget.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
    imports: [
        CommonModule,
        UserModule,
        CategoryModule,
        BudgetModule,
        TransactionModule
    ]
})
export class ApplicationModule {}
