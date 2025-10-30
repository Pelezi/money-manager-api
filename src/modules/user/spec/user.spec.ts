/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/no-extraneous-dependencies */

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { App } from 'supertest/types';
import { ApplicationModule } from '../../app.module';
import { PrismaService } from '../../common';

/**
 * User API end-to-end tests
 *
 * This test suite performs end-to-end tests on the user API endpoints,
 * allowing us to test the authentication behavior of the API.
 */
describe('User API', () => {

    let app: INestApplication;
    let prismaService: PrismaService;

    beforeAll(async () => {

        const module = await Test.createTestingModule({
            imports: [ApplicationModule],
        })
        .compile();

        app = module.createNestApplication();
        prismaService = module.get<PrismaService>(PrismaService);
        await app.init();
    });

    afterAll(async () => {
        await prismaService.$disconnect();
        await app.close();
    });

    beforeEach(async () => {
        await prismaService.user.deleteMany({});
    });

    it('Should register a new user', async () =>
        request(app.getHttpServer() as App)
            .post('/users/register')
            .send({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe'
            })
            .expect(HttpStatus.CREATED)
            .then(response => {
                expect(response.body.email).toEqual('test@example.com');
                expect(response.body.firstName).toEqual('John');
                expect(response.body.lastName).toEqual('Doe');
                expect(response.body.password).toBeUndefined();
            })
    );

    it('Should login with valid credentials', async () => {
        await request(app.getHttpServer() as App)
            .post('/users/register')
            .send({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe'
            });

        return request(app.getHttpServer() as App)
            .post('/users/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            })
            .expect(HttpStatus.OK)
            .then(response => {
                expect(response.body.token).toBeDefined();
                expect(response.body.user.email).toEqual('test@example.com');
            });
    });

    it('Should reject login with invalid credentials', async () => {
        await request(app.getHttpServer() as App)
            .post('/users/register')
            .send({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe'
            });

        return request(app.getHttpServer() as App)
            .post('/users/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            })
            .expect(HttpStatus.UNAUTHORIZED);
    });

});
