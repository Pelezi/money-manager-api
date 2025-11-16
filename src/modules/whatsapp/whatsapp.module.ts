import { Module } from '@nestjs/common';

import { CommonModule } from '../common';
import { WhatsappController } from './controller';
import { WhatsappService } from './service';

@Module({
    imports: [
        CommonModule
    ],
    providers: [
        WhatsappService
    ],
    controllers: [
        WhatsappController
    ]
})
export class WhatsappModule { }
