/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/no-extraneous-dependencies */

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { App } from 'supertest/types';
import { ApplicationModule } from '../../app.module';

/**
 * Expense API end-to-end tests
 *
 * This test suite performs end-to-end tests on the expense API endpoints,
 * allowing us to test the behavior of the API and making sure that it fits
 * the requirements.
 */
describe('Expense API', () => {

    let app: INestApplication;

    beforeAll(async () => {

        const module = await Test.createTestingModule({
            imports: [ApplicationModule],
        })
        .compile();

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () =>
        app.close()
    );

    it('Should return empty expense list for year 2024', async () =>

        request(app.getHttpServer() as App)
            .get('/expenses?year=2024')
            .expect(HttpStatus.OK)
            .then(response => {
                expect(response.body).toBeInstanceOf(Array);
                expect(response.body.length).toEqual(0);
            })
    );

    it('Should return 200 for valid year query parameter', async () =>

        request(app.getHttpServer() as App)
            .get('/expenses?year=2025')
            .expect(HttpStatus.OK)
    );

});
