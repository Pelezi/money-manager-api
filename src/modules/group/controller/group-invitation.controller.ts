import { AuthenticatedRequest } from '../../common';
import { Controller, Get, HttpStatus, Param, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';

import { RestrictedGuard } from '../../common';

import { GroupInvitationData } from '../model';
import { GroupInvitationService } from '../service';

@Controller('group-invitations')
@ApiTags('group-invitations')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class GroupInvitationController {

    public constructor(
        private readonly groupInvitationService: GroupInvitationService
    ) { }

    @Get('pending')
    @ApiOperation({
        summary: 'List all pending invitations for the user',
        description: 'Returns all pending group invitations for the authenticated user.'
    })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: GroupInvitationData, description: 'List of pending invitations returned successfully' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async findPending(@Request() req: AuthenticatedRequest): Promise<GroupInvitationData[]> {
        const userId = req?.user?.userId || 1;
        return this.groupInvitationService.findPendingByUser(userId);
    }

    @Post(':id/accept')
    @ApiParam({ name: 'id', description: 'Invitation ID' })
    @ApiOperation({
        summary: 'Accept a group invitation',
        description: 'Accepts a pending group invitation. The user will be added as a member of the group with the assigned role.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Invitation accepted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invitation not found or already processed' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async accept(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.groupInvitationService.accept(parseInt(id), userId);
    }

    @Post(':id/decline')
    @ApiParam({ name: 'id', description: 'Invitation ID' })
    @ApiOperation({
        summary: 'Decline a group invitation',
        description: 'Declines a pending group invitation.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Invitation declined successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invitation not found or already processed' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async decline(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.groupInvitationService.decline(parseInt(id), userId);
    }

}
