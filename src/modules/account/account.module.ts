import { Module } from '@nestjs/common';

import { CommonModule } from '../common';
import { AccountController } from './controller';
import { AccountService } from './service';

@Module({
    imports: [
        CommonModule,
    ],
    providers: [
        AccountService
    ],
    controllers: [
        AccountController
    ],
    exports: [AccountService]
})
export class AccountModule { }
