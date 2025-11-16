import { Module } from '@nestjs/common';
import { CommonModule } from '../common';

import { NotificationService } from './service/notification.service';
import { NotificationController } from './controller/notification.controller';

@Module({
    imports: [CommonModule],
    controllers: [NotificationController],
    providers: [NotificationService],
    exports: [NotificationService]
})
export class NotificationModule { }
