import { Module } from '@nestjs/common';

import { CommonModule } from '../common';
import { WhatsappController } from './controller';

@Module({
    imports: [
        CommonModule
    ],
    controllers: [
        WhatsappController
    ]
})
export class WhatsappModule { }
