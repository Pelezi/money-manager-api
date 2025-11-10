import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../../common';
import { GroupService } from '../service';

export const REQUIRED_PERMISSION = 'requiredPermission';
export const RequirePermission = (permission: keyof GroupPermissions) => SetMetadata(REQUIRED_PERMISSION, permission);

export interface GroupPermissions {
    canViewTransactions: boolean;
    canManageOwnTransactions: boolean;
    canManageGroupTransactions: boolean;
    canViewCategories: boolean;
    canManageCategories: boolean;
    canViewSubcategories: boolean;
    canManageSubcategories: boolean;
    canViewBudgets: boolean;
    canManageBudgets: boolean;
    canViewAccounts: boolean;
    canManageOwnAccounts: boolean;
    canManageGroupAccounts: boolean;
    canManageGroup: boolean;
}

@Injectable()
export class GroupPermissionGuard implements CanActivate {

    public constructor(
        private readonly reflector: Reflector,
        private readonly groupService: GroupService
    ) { }

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermission = this.reflector.get<keyof GroupPermissions>(
            REQUIRED_PERMISSION,
            context.getHandler()
        );

        if (!requiredPermission) {
            return true; // No permission required
        }

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const userId = request.user?.userId;
        
        if (!userId) {
            throw new ForbiddenException('User not authenticated');
        }

        // Get groupId from params or body
        const params = request.params as any;
        const body = request.body as any;
        const groupId = parseInt(params?.groupId || body?.groupId);
        
        if (!groupId) {
            throw new ForbiddenException('Group ID not provided');
        }

        // Check if user is the owner (owners always have full permissions)
        const group = await this.groupService.findById(groupId, userId);
        if (!group) {
            throw new ForbiddenException('Group not found or you are not a member');
        }

        const permissions = await this.groupService.getUserPermissions(groupId, userId);
        
        if (!permissions) {
            throw new ForbiddenException('You are not a member of this group');
        }

        if (!permissions[requiredPermission]) {
            throw new ForbiddenException(`You do not have the required permission: ${requiredPermission}`);
        }

        return true;
    }

}
