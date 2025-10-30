/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/no-extraneous-dependencies */

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BudgetType } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';

import { App } from 'supertest/types';
import { ApplicationModule } from '../../app.module';
import { PrismaService } from '../../common';

/**
 * Budget API end-to-end tests
 *
 * This test suite validates budget CRUD operations and 
 * monthly/annual synchronization logic.
 */
describe('Budget API', () => {

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

        app = module.createNestApplication();
        prismaService = module.get<PrismaService>(PrismaService);
        await app.init();

        await prismaService.user.deleteMany({});
        await prismaService.budget.deleteMany({});
        await prismaService.subcategory.deleteMany({});
        await prismaService.category.deleteMany({});

        const user = await prismaService.user.create({
            data: {
                email: 'budget@example.com',
                password: 'hashedpassword',
                firstName: 'Budget',
                lastName: 'User'
            }
        });
        userId = user.id;

        // Create a test category and subcategory
        const category = await prismaService.category.create({
            data: {
                userId: user.id,
                name: 'Groceries',
                description: 'Food and household items'
            }
        });

        const subcategory = await prismaService.subcategory.create({
            data: {
                userId: user.id,
                categoryId: category.id,
                name: 'Fresh Produce',
                description: 'Fruits and vegetables'
            }
        });
        subcategoryId = subcategory.id;

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

    it('Should create a monthly budget', async () =>
        request(app.getHttpServer() as App)
            .post('/budgets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'January Groceries',
                amount: 500,
                type: BudgetType.MONTHLY,
                month: 1,
                year: 2024,
                subcategoryId
            })
            .expect(HttpStatus.CREATED)
            .then(response => {
                expect(response.body.name).toEqual('January Groceries');
                expect(response.body.amount).toEqual(500);
                expect(response.body.type).toEqual('MONTHLY');
                expect(response.body.month).toEqual(1);
            })
    );

    it('Should create an annual budget', async () =>
        request(app.getHttpServer() as App)
            .post('/budgets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Annual Groceries',
                amount: 6000,
                type: BudgetType.ANNUAL,
                year: 2024,
                subcategoryId
            })
            .expect(HttpStatus.CREATED)
            .then(response => {
                expect(response.body.name).toEqual('Annual Groceries');
                expect(response.body.amount).toEqual(6000);
                expect(response.body.type).toEqual('ANNUAL');
                expect(response.body.month).toBeUndefined();
            })
    );

    it('Should synchronize annual budget from monthly budgets', async () => {
        await request(app.getHttpServer() as App)
            .post('/budgets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Annual Groceries',
                amount: 0,
                type: BudgetType.ANNUAL,
                year: 2024,
                subcategoryId
            });

        await request(app.getHttpServer() as App)
            .post('/budgets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'January Groceries',
                amount: 500,
                type: BudgetType.MONTHLY,
                month: 1,
                year: 2024,
                subcategoryId
            });

        await request(app.getHttpServer() as App)
            .post('/budgets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'February Groceries',
                amount: 600,
                type: BudgetType.MONTHLY,
                month: 2,
                year: 2024,
                subcategoryId
            });

        const budgets = await prismaService.budget.findMany({
            where: {
                userId,
                year: 2024,
                type: BudgetType.ANNUAL,
                subcategoryId
            }
        });

        expect(budgets.length).toBeGreaterThan(0);
        expect(Number(budgets[0].amount)).toEqual(1100);
    });

});
