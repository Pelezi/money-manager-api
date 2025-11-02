import { Controller, Get, Post, Query, Body, Res, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { LoggerService } from '../../common/provider';

@Controller('webhook')
@ApiTags('whatsapp')
export class WhatsappController {

    public constructor(
        private readonly logger: LoggerService
    ) { }

    @Get()
    @ApiOperation({ 
        summary: 'WhatsApp webhook verification',
        description: 'Handles WhatsApp webhook verification challenge. This endpoint is called by WhatsApp to verify the webhook URL during setup.'
    })
    @ApiQuery({ name: 'hub.mode', required: false, description: 'Webhook mode' })
    @ApiQuery({ name: 'hub.challenge', required: false, description: 'Challenge string to echo back' })
    @ApiQuery({ name: 'hub.verify_token', required: false, description: 'Verification token' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Webhook verified successfully' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid verification token' })
    public whatsappWebhook(
        @Query('hub.mode') mode: string,
        @Query('hub.challenge') challenge: string,
        @Query('hub.verify_token') token: string,
        @Res() res: FastifyReply
    ): void {
        const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

        if (!WEBHOOK_VERIFY_TOKEN) {
            this.logger.error('WEBHOOK_VERIFY_TOKEN environment variable is not set');
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
            return;
        }

        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
            this.logger.info('WhatsApp webhook verified successfully');
            res.status(HttpStatus.OK).send(challenge);
        } else {
            this.logger.error('WhatsApp webhook verification failed: invalid token or mode');
            res.status(HttpStatus.FORBIDDEN).send();
        }
    }

    @Post()
    @ApiOperation({ 
        summary: 'WhatsApp webhook receiver',
        description: 'Receives incoming WhatsApp webhook events. This endpoint processes messages and notifications from WhatsApp.'
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Webhook processed successfully' })
    public whatsappWebhookPost(
        @Body() body: any,
        @Res() res: FastifyReply
    ): void {
        this.logger.info('WhatsApp webhook received: ' + JSON.stringify(body));
        res.status(HttpStatus.OK).send('Webhook processed');
    }

}
