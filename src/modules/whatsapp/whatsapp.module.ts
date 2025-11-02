import { Module } from '@nestjs/common';

import { WhatsappController } from './controller';

@Module({
    controllers: [
        WhatsappController
    ]
})
export class WhatsappModule { }
