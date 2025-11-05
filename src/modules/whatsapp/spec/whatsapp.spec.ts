/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/no-extraneous-dependencies */

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import request from 'supertest';

import { ApplicationModule } from '../../app.module';

/**
 * WhatsApp Webhook API end-to-end tests
 *
 * This test suite validates the WhatsApp webhook endpoints.
 */
describe('WhatsApp Webhook API', () => {

    let app: INestApplication;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            imports: [ApplicationModule],
        })
        .compile();

        app = module.createNestApplication(new FastifyAdapter());
        app.setGlobalPrefix('/api/v1');
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        // Set the WEBHOOK_VERIFY_TOKEN for testing
        process.env.WEBHOOK_VERIFY_TOKEN = 'test_token_12345';
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/webhook', () => {
        it('Should verify webhook with valid token', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/webhook?hub.mode=subscribe&hub.challenge=test_challenge&hub.verify_token=test_token_12345')
                .expect(HttpStatus.OK);

            expect(response.text).toEqual('test_challenge');
        });

        it('Should reject webhook verification with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/webhook?hub.mode=subscribe&hub.challenge=test_challenge&hub.verify_token=invalid_token')
                .expect(HttpStatus.FORBIDDEN);
        });

        it('Should reject webhook verification without mode', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/webhook?hub.challenge=test_challenge&hub.verify_token=test_token_12345')
                .expect(HttpStatus.FORBIDDEN);
        });

        it('Should reject webhook verification without token', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/webhook?hub.mode=subscribe&hub.challenge=test_challenge')
                .expect(HttpStatus.FORBIDDEN);
        });
    });

    describe('POST /api/v1/webhook', () => {
        it('Should process webhook POST request', async () => {
            const webhookData = {
                object: 'whatsapp_business_account',
                entry: [{
                    id: '123456',
                    changes: [{
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: {
                                display_phone_number: '1234567890',
                                phone_number_id: '1234567890'
                            },
                            messages: [{
                                from: '1234567890',
                                id: 'wamid.test',
                                timestamp: '1234567890',
                                text: {
                                    body: 'Test message'
                                },
                                type: 'text'
                            }]
                        }
                    }]
                }]
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/webhook')
                .send(webhookData)
                .expect(HttpStatus.OK);

            expect(response.text).toEqual('Webhook processed');
        });

        it('Should process empty webhook POST request', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/webhook')
                .send({})
                .expect(HttpStatus.OK);

            expect(response.text).toEqual('Webhook processed');
        });
    });

});
