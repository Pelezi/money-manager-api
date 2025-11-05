import { Module } from '@nestjs/common';

import { CommonModule } from '../common';
import { CategoryModule } from '../category/category.module';
import { UserController } from './controller';
import { UserService } from './service';

@Module({
    imports: [
        CommonModule,
        CategoryModule
    ],
    providers: [
        UserService
    ],
    controllers: [
        UserController
    ],
    exports: [UserService]
})
export class UserModule { }
