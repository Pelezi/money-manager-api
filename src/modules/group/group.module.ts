import { Module } from '@nestjs/common';

import { CommonModule } from '../common';
import { NotificationModule } from '../notification/notification.module';
import { GroupController, GroupRoleController, GroupMemberController } from './controller';
import { GroupInvitationController } from './controller/group-invitation.controller';
import { GroupService, GroupRoleService, GroupMemberService, GroupInvitationService } from './service';

@Module({
    imports: [
        CommonModule,
        NotificationModule
    ],
    providers: [
        GroupService,
        GroupRoleService,
        GroupMemberService,
        GroupInvitationService
    ],
    controllers: [
        GroupController,
        GroupRoleController,
        GroupMemberController,
        GroupInvitationController
    ],
    exports: [
        GroupService,
        GroupRoleService,
        GroupMemberService,
        GroupInvitationService
    ]
})
export class GroupModule { }
