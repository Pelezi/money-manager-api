import { Module } from '@nestjs/common';

import { CommonModule } from '../common';
import { SubcategoryController } from './controller';
import { SubcategoryService } from './service';

@Module({
    imports: [
        CommonModule,
    ],
    providers: [
        SubcategoryService
    ],
    controllers: [
        SubcategoryController
    ],
    exports: [SubcategoryService]
})
export class SubcategoryModule { }
