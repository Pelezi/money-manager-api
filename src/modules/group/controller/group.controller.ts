import { AuthenticatedRequest } from '../../common';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

import { RestrictedGuard } from '../../common';

import { GroupData, GroupInput, UpdateGroupInput } from '../model';
import { GroupService } from '../service';

@Controller('groups')
@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class GroupController {

    public constructor(
        private readonly groupService: GroupService
    ) { }

    @Get()
    @ApiOperation({
        summary: 'List all groups the user is a member of',
        description: 'Returns all groups where the authenticated user is either the owner or a member. Groups allow multiple users to collaborate on managing finances together with customizable permissions.'
    })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: GroupData, description: 'List of groups returned successfully' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async find(@Request() req: AuthenticatedRequest): Promise<GroupData[]> {
        const userId = req?.user?.userId || 1;
        return this.groupService.findByUser(userId);
    }

    @Get(':id')
    @ApiParam({ name: 'id', description: 'Unique group ID' })
    @ApiOperation({
        summary: 'Get a specific group by ID',
        description: 'Returns complete details of a specific group. The user must be either the owner or a member of the group to access it.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: GroupData, description: 'Group found and returned successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Group not found or user is not a member' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async findById(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<GroupData> {
        const userId = req?.user?.userId || 1;
        const group = await this.groupService.findById(parseInt(id), userId);
        if (!group) {
            throw new Error('Group not found');
        }
        return group;
    }

    @Post()
    @ApiOperation({
        summary: 'Create a new group',
        description: 'Creates a new group with the authenticated user as the owner. The group is automatically created with three default roles: Owner (full access), Member (can manage transactions), and Viewer (read-only). The creating user is automatically added as a member with the Owner role.'
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: GroupData, description: 'Group created successfully' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data provided' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async create(@Body() input: GroupInput, @Request() req: AuthenticatedRequest): Promise<GroupData> {
        const userId = req?.user?.userId || 1;
        return this.groupService.create(userId, input);
    }

    @Put(':id')
    @ApiParam({ name: 'id', description: 'Unique group ID to update' })
    @ApiOperation({
        summary: 'Update a group',
        description: 'Updates group information such as name and description. Requires the canManageGroup permission or ownership of the group.'
    })
    @ApiResponse({ status: HttpStatus.OK, type: GroupData, description: 'Group updated successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Group not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User does not have permission to manage this group' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data provided' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async update(@Param('id') id: string, @Body() input: UpdateGroupInput, @Request() req: AuthenticatedRequest): Promise<GroupData> {
        const userId = req?.user?.userId || 1;
        return this.groupService.update(parseInt(id), userId, input);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'Unique group ID to delete' })
    @ApiOperation({
        summary: 'Delete a group',
        description: 'Permanently removes a group and all related data (roles, members, budgets, categories, subcategories, transactions). ATTENTION: This operation is irreversible. Only the group owner can delete a group.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Group deleted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Group not found' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only the group owner can delete the group' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.groupService.delete(parseInt(id), userId);
    }

    @Get(':id/permissions')
    @ApiParam({ name: 'id', description: 'Unique group ID' })
    @ApiOperation({
        summary: 'Get user permissions in a group',
        description: 'Returns the permissions that the authenticated user has in the specified group. Returns null if the user is not a member.'
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Permissions returned successfully' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async getPermissions(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        const userId = req?.user?.userId || 1;
        return this.groupService.getUserPermissions(parseInt(id), userId);
    }

}
