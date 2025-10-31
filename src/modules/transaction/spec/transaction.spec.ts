/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/no-extraneous-dependencies */

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import request from 'supertest';

import { ApplicationModule } from '../../app.module';
import { PrismaService } from '../../common';

/**
 * Transaction API end-to-end tests
 *
 * This test suite validates transaction aggregation by year.
 */
describe('Transaction Aggregated API', () => {

    let app: INestApplication;
    let prismaService: PrismaService;
    let authToken: string;
    let userId: number;
    let subcategoryId1: number;
    let subcategoryId2: number;

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

        await prismaService.user.deleteMany({});
        await prismaService.transaction.deleteMany({});
        await prismaService.subcategory.deleteMany({});
        await prismaService.category.deleteMany({});

        const user = await prismaService.user.create({
            data: {
                email: 'transaction@example.com',
                password: 'hashedpassword',
                firstName: 'Transaction',
                lastName: 'User'
            }
        });
        userId = user.id;

        // Create test categories and subcategories
        const category = await prismaService.category.create({
            data: {
                userId: user.id,
                name: 'Food',
                description: 'Food expenses'
            }
        });

        const subcategory1 = await prismaService.subcategory.create({
            data: {
                userId: user.id,
                categoryId: category.id,
                name: 'Groceries',
                description: 'Grocery shopping'
            }
        });
        subcategoryId1 = subcategory1.id;

        const subcategory2 = await prismaService.subcategory.create({
            data: {
                userId: user.id,
                categoryId: category.id,
                name: 'Restaurants',
                description: 'Dining out'
            }
        });
        subcategoryId2 = subcategory2.id;

        const jwt = await import('jsonwebtoken');
        authToken = jwt.sign({ userId: user.id, role: 'restricted' }, `${process.env.JWT_SECRET}`, {
            algorithm: 'HS256',
            issuer: `${process.env.JWT_ISSUER}`
        });
    });

    afterAll(async () => {
        await prismaService.transaction.deleteMany({});
        await prismaService.subcategory.deleteMany({});
        await prismaService.category.deleteMany({});
        await prismaService.user.deleteMany({});
        await prismaService.$disconnect();
        await app.close();
    });

    beforeEach(async () => {
        await prismaService.transaction.deleteMany({});
    });

    it('Should get aggregated transactions for a specific year grouped by month', async () => {
        // Create transactions for 2024
        await prismaService.transaction.createMany({
            data: [
                {
                    userId,
                    subcategoryId: subcategoryId1,
                    title: 'Grocery 1',
                    amount: 100,
                    date: new Date('2024-01-15'),
                    type: 'EXPENSE'
                },
                {
                    userId,
                    subcategoryId: subcategoryId1,
                    title: 'Grocery 2',
                    amount: 150,
                    date: new Date('2024-01-20'),
                    type: 'EXPENSE'
                },
                {
                    userId,
                    subcategoryId: subcategoryId1,
                    title: 'Grocery 3',
                    amount: 200,
                    date: new Date('2024-02-10'),
                    type: 'EXPENSE'
                },
                {
                    userId,
                    subcategoryId: subcategoryId2,
                    title: 'Restaurant 1',
                    amount: 50,
                    date: new Date('2024-01-18'),
                    type: 'EXPENSE'
                },
                {
                    userId,
                    subcategoryId: subcategoryId1,
                    title: 'Grocery 4',
                    amount: 120,
                    date: new Date('2025-01-10'),
                    type: 'EXPENSE'
                }
            ]
        });

        const response = await request(app.getHttpServer())
            .get('/api/v1/transactions/aggregated?year=2024')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(HttpStatus.OK);

        expect(response.body).toHaveLength(3);
        
        // Find the aggregation for subcategory1 in January
        const jan2024Sub1 = response.body.find(
            (item: any) => item.subcategoryId === subcategoryId1 && item.month === 1
        );
        expect(jan2024Sub1).toBeDefined();
        expect(jan2024Sub1.total).toEqual(250); // 100 + 150
        expect(jan2024Sub1.count).toEqual(2);
        expect(jan2024Sub1.year).toEqual(2024);
        expect(jan2024Sub1.type).toEqual('EXPENSE');

        // Find the aggregation for subcategory1 in February
        const feb2024Sub1 = response.body.find(
            (item: any) => item.subcategoryId === subcategoryId1 && item.month === 2
        );
        expect(feb2024Sub1).toBeDefined();
        expect(feb2024Sub1.total).toEqual(200);
        expect(feb2024Sub1.count).toEqual(1);

        // Find the aggregation for subcategory2 in January
        const jan2024Sub2 = response.body.find(
            (item: any) => item.subcategoryId === subcategoryId2 && item.month === 1
        );
        expect(jan2024Sub2).toBeDefined();
        expect(jan2024Sub2.total).toEqual(50);
        expect(jan2024Sub2.count).toEqual(1);
    });

    it('Should return empty array for year with no transactions', async () => {
        const response = await request(app.getHttpServer())
            .get('/api/v1/transactions/aggregated?year=2023')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(HttpStatus.OK);

        expect(response.body).toHaveLength(0);
    });

    it('Should aggregate INCOME and EXPENSE separately', async () => {
        await prismaService.transaction.createMany({
            data: [
                {
                    userId,
                    subcategoryId: subcategoryId1,
                    title: 'Expense 1',
                    amount: 100,
                    date: new Date('2024-01-15'),
                    type: 'EXPENSE'
                },
                {
                    userId,
                    subcategoryId: subcategoryId1,
                    title: 'Income 1',
                    amount: 200,
                    date: new Date('2024-01-20'),
                    type: 'INCOME'
                }
            ]
        });

        const response = await request(app.getHttpServer())
            .get('/api/v1/transactions/aggregated?year=2024')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(HttpStatus.OK);

        expect(response.body).toHaveLength(2);
        
        const expense = response.body.find((item: any) => item.type === 'EXPENSE');
        expect(expense).toBeDefined();
        expect(expense.total).toEqual(100);
        expect(expense.count).toEqual(1);

        const income = response.body.find((item: any) => item.type === 'INCOME');
        expect(income).toBeDefined();
        expect(income.total).toEqual(200);
        expect(income.count).toEqual(1);
    });

});
