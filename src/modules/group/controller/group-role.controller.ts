import { AuthenticatedRequest } from '../../common';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

import { RestrictedGuard } from '../../common';

import { GroupRoleData, GroupRoleInput, UpdateGroupRoleInput } from '../model';
import { GroupRoleService } from '../service';

@Controller('groups/:groupId/roles')
@ApiTags('group-roles')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class GroupRoleController {

    public constructor(
        private readonly groupRoleService: GroupRoleService
    ) { }

    @Get()
    @ApiParam({ name: 'groupId', description: 'Group ID' })
    @ApiOperation({
        summary: 'List all roles in a group',
        description: 'Returns all customizable roles defined for a group. Each role has granular permissions for viewing and managing transactions, categories, subcategories, budgets, and the group itself. Users must be members of the group to view its roles.'
    })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: GroupRoleData, description: 'List of roles returned successfully' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is not a member of this group' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async find(@Param('groupId') groupId: string, @Request() req: AuthenticatedRequest): Promise<GroupRoleData[]> {
        const userId = req?.user?.userId || 1;
        return this.groupRoleService.findByGroup(parseInt(groupId), userId);
    }

    @Get(':id')
    @ApiParam({ name: 'groupId', description: 'Group ID' })
    @ApiParam({ name: 'id', description: 'Unique role ID' })
    @ApiOperation({
        summary: 'Get a specific role by ID',
        description: 'Returns complete details of a specific role including all permission flags. The user must be a member of the group to view its roles.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: GroupRoleData, description: 'Role found and returned successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is not a member of this group' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async findById(
        @Param('groupId') groupId: string,
        @Param('id') id: string,
        @Request() req: AuthenticatedRequest
    ): Promise<GroupRoleData> {
        const userId = req?.user?.userId || 1;
        const role = await this.groupRoleService.findById(parseInt(id), userId);
        if (!role) {
            throw new Error('Role not found');
        }
        return role;
    }

    @Post()
    @ApiParam({ name: 'groupId', description: 'Group ID' })
    @ApiOperation({
        summary: 'Create a new role',
        description: 'Creates a new customizable role for the group. You can specify which permissions this role should have. By default, all "view" permissions are enabled and all "manage" permissions are disabled. Requires the canManageGroup permission. Role names must be unique within a group.'
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: GroupRoleData, description: 'Role created successfully' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'A role with this name already exists in the group' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User does not have permission to manage roles' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data provided' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async create(
        @Param('groupId') groupId: string,
        @Body() input: GroupRoleInput,
        @Request() req: AuthenticatedRequest
    ): Promise<GroupRoleData> {
        const userId = req?.user?.userId || 1;
        return this.groupRoleService.create(parseInt(groupId), userId, input);
    }

    @Put(':id')
    @ApiParam({ name: 'groupId', description: 'Group ID' })
    @ApiParam({ name: 'id', description: 'Unique role ID to update' })
    @ApiOperation({
        summary: 'Update a role',
        description: 'Updates role information and permissions. You can change the role name, description, and any of the permission flags. Requires the canManageGroup permission. If changing the name, it must remain unique within the group.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: GroupRoleData, description: 'Role updated successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'A role with this name already exists in the group' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User does not have permission to manage roles' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data provided' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async update(
        @Param('groupId') groupId: string,
        @Param('id') id: string,
        @Body() input: UpdateGroupRoleInput,
        @Request() req: AuthenticatedRequest
    ): Promise<GroupRoleData> {
        const userId = req?.user?.userId || 1;
        return this.groupRoleService.update(parseInt(id), userId, input);
    }

    @Delete(':id')
    @ApiParam({ name: 'groupId', description: 'Group ID' })
    @ApiParam({ name: 'id', description: 'Unique role ID to delete' })
    @ApiOperation({
        summary: 'Delete a role',
        description: 'Permanently removes a role from the group. ATTENTION: Cannot delete a role that has members assigned to it. You must reassign or remove all members with this role before deleting it. Requires the canManageGroup permission.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Role deleted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot delete a role that has members' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User does not have permission to manage roles' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async delete(
        @Param('groupId') groupId: string,
        @Param('id') id: string,
        @Request() req: AuthenticatedRequest
    ): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.groupRoleService.delete(parseInt(id), userId);
    }

}
