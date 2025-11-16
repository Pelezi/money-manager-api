import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/provider';

@Injectable()
export class WhatsappService {

    public constructor(
        private readonly logger: LoggerService
    ) { }

    /**
     * Verify webhook token and mode
     *
     * @param mode Webhook mode
     * @param token Webhook token
     * @returns True if verification is successful
     */
    public verifyWebhook(mode: string, token: string): boolean {
        const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

        if (!WEBHOOK_VERIFY_TOKEN) {
            this.logger.error('WEBHOOK_VERIFY_TOKEN environment variable is not set');
            return false;
        }

        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
            this.logger.info('WhatsApp webhook verified successfully');
            return true;
        }

        this.logger.error('WhatsApp webhook verification failed: invalid token or mode');
        return false;
    }

    /**
     * Process incoming webhook event
     *
     * @param body Webhook event body
     */
    public processWebhookEvent(body: any): void {
        this.logger.info('WhatsApp webhook received: ' + JSON.stringify(body));
    }

}
