import { AuthenticatedRequest } from '../../common';
import { Controller, Delete, Get, HttpStatus, Param, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';

import { RestrictedGuard } from '../../common';

import { NotificationData } from '../model';
import { NotificationService } from '../service';

@Controller('notifications')
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(RestrictedGuard)
export class NotificationController {

    public constructor(
        private readonly notificationService: NotificationService
    ) { }

    @Get()
    @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: 'Return only unread notifications' })
    @ApiOperation({
        summary: 'List all notifications',
        description: 'Returns all notifications for the authenticated user. Can be filtered to show only unread notifications.'
    })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: NotificationData, description: 'List of notifications returned successfully' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async find(@Request() req: AuthenticatedRequest, @Query('unreadOnly') unreadOnly?: string): Promise<NotificationData[]> {
        const userId = req?.user?.userId || 1;
        const unreadFilter = unreadOnly === 'true';
        return this.notificationService.findByUser(userId, unreadFilter);
    }

    @Get('unread-count')
    @ApiOperation({
        summary: 'Get unread notification count',
        description: 'Returns the count of unread notifications for the authenticated user.'
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Unread count returned successfully' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async getUnreadCount(@Request() req: AuthenticatedRequest): Promise<{ count: number }> {
        const userId = req?.user?.userId || 1;
        const count = await this.notificationService.getUnreadCount(userId);
        return { count };
    }

    @Post(':id/read')
    @ApiParam({ name: 'id', description: 'Notification ID' })
    @ApiOperation({
        summary: 'Mark notification as read',
        description: 'Marks a specific notification as read.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Notification marked as read successfully' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async markAsRead(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.notificationService.markAsRead(parseInt(id), userId);
    }

    @Post('read-all')
    @ApiOperation({
        summary: 'Mark all notifications as read',
        description: 'Marks all unread notifications as read for the authenticated user.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'All notifications marked as read successfully' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async markAllAsRead(@Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.notificationService.markAllAsRead(userId);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'Notification ID' })
    @ApiOperation({
        summary: 'Delete a notification',
        description: 'Permanently removes a notification.'
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Notification deleted successfully' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'JWT token missing or invalid' })
    public async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<void> {
        const userId = req?.user?.userId || 1;
        await this.notificationService.delete(parseInt(id), userId);
    }

}
