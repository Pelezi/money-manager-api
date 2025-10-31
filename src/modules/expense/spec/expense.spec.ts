/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/no-extraneous-dependencies */

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import request from 'supertest';

import { ApplicationModule } from '../../app.module';
import { PrismaService } from '../../common';

/**
 * Expense API end-to-end tests
 *
 * This test suite validates expense (budget) retrieval by year.
 */
describe('Expense API', () => {

    let app: INestApplication;
    let prismaService: PrismaService;
    let authToken: string;
    let userId: number;
    let subcategoryId: number;

    beforeAll(async () => {

        const module = await Test.createTestingModule({
            imports: [ApplicationModule],
        })
        .compile();

        app = module.createNestApplication(new FastifyAdapter());
        app.setGlobalPrefix('/api/v1');
        prismaService = module.get<PrismaService>(PrismaService);
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        // Clean up only this test's data by email
        const existingUser = await prismaService.user.findUnique({
            where: { email: 'expense@example.com' }
        });
        if (existingUser) {
            await prismaService.budget.deleteMany({ where: { userId: existingUser.id } });
            await prismaService.subcategory.deleteMany({ where: { userId: existingUser.id } });
            await prismaService.category.deleteMany({ where: { userId: existingUser.id } });
            await prismaService.user.delete({ where: { id: existingUser.id } });
        }

        const user = await prismaService.user.create({
            data: {
                email: 'expense@example.com',
                password: 'hashedpassword',
                firstName: 'Expense',
                lastName: 'User'
            }
        });
        userId = user.id;

        // Create a test category and subcategory
        const category = await prismaService.category.create({
            data: {
                userId: user.id,
                name: 'Food',
                description: 'Food expenses'
            }
        });

        const subcategory = await prismaService.subcategory.create({
            data: {
                userId: user.id,
                categoryId: category.id,
                name: 'Groceries',
                description: 'Grocery shopping'
            }
        });
        subcategoryId = subcategory.id;

        const jwt = await import('jsonwebtoken');
        authToken = jwt.sign({ userId: user.id, role: 'restricted' }, `${process.env.JWT_SECRET}`, {
            algorithm: 'HS256',
            issuer: `${process.env.JWT_ISSUER}`
        });
    });

    afterAll(async () => {
        await prismaService.budget.deleteMany({});
        await prismaService.subcategory.deleteMany({});
        await prismaService.category.deleteMany({});
        await prismaService.user.deleteMany({});
        await prismaService.$disconnect();
        await app.close();
    });

    beforeEach(async () => {
        await prismaService.budget.deleteMany({});
    });

    it('Should get expenses for a specific year', async () => {
        // Create budgets for 2024
        await prismaService.budget.createMany({
            data: [
                {
                    userId,
                    subcategoryId,
                    amount: 500,
                    type: 'EXPENSE',
                    month: 1,
                    year: 2024
                },
                {
                    userId,
                    subcategoryId,
                    amount: 600,
                    type: 'EXPENSE',
                    month: 2,
                    year: 2024
                },
                {
                    userId,
                    subcategoryId,
                    amount: 400,
                    type: 'EXPENSE',
                    month: 1,
                    year: 2025
                }
            ]
        });

        const response = await request(app.getHttpServer())
            .get('/api/v1/expenses?year=2024')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(HttpStatus.OK);

        expect(response.body).toHaveLength(2);
        expect(response.body[0].year).toEqual(2024);
        expect(response.body[1].year).toEqual(2024);
    });

    it('Should return empty array for year with no expenses', async () => {
        const response = await request(app.getHttpServer())
            .get('/api/v1/expenses?year=2023')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(HttpStatus.OK);

        expect(response.body).toHaveLength(0);
    });

});
