import { Module } from '@nestjs/common';

import { CommonModule } from '../common';
import { GroupController, GroupRoleController, GroupMemberController } from './controller';
import { GroupService, GroupRoleService, GroupMemberService } from './service';

@Module({
    imports: [
        CommonModule,
    ],
    providers: [
        GroupService,
        GroupRoleService,
        GroupMemberService
    ],
    controllers: [
        GroupController,
        GroupRoleController,
        GroupMemberController
    ],
    exports: [
        GroupService,
        GroupRoleService,
        GroupMemberService
    ]
})
export class GroupModule { }
