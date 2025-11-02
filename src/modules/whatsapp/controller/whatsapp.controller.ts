import { Controller, Get, Post, Query, Body, Res, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';

@Controller('webhook')
@ApiTags('whatsapp')
export class WhatsappController {

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

        if (mode && token === WEBHOOK_VERIFY_TOKEN) {
            res.status(HttpStatus.OK).send(challenge);
        } else {
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
        console.log(JSON.stringify(body, null, 2));
        res.status(HttpStatus.OK).send('Webhook processed');
    }

}
