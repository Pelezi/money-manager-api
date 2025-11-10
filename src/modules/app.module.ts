import { Module } from '@nestjs/common';

import { CommonModule } from './common';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { SubcategoryModule } from './subcategory/subcategory.module';
import { BudgetModule } from './budget/budget.module';
import { TransactionModule } from './transaction/transaction.module';
import { ExpenseModule } from './expense/expense.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { GroupModule } from './group/group.module';
import { NotificationModule } from './notification/notification.module';
import { AccountModule } from './account/account.module';

@Module({
    imports: [
        CommonModule,
        UserModule,
        CategoryModule,
        SubcategoryModule,
        BudgetModule,
        TransactionModule,
        ExpenseModule,
        WhatsappModule,
        GroupModule,
        NotificationModule,
        AccountModule
    ]
})
export class ApplicationModule {}
