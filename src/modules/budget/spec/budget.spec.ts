/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/no-extraneous-dependencies */

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';

import { App } from 'supertest/types';
import { ApplicationModule } from '../../app.module';
import { PrismaService } from '../../common';

/**
 * Budget API end-to-end tests
 *
 * This test suite validates budget CRUD operations.
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
                month: 1,
                year: 2024,
                subcategoryId
            })
            .expect(HttpStatus.CREATED)
            .then(response => {
                expect(response.body.name).toEqual('January Groceries');
                expect(response.body.amount).toEqual(500);
                expect(response.body.type).toEqual('EXPENSE');
                expect(response.body.month).toEqual(1);
            })
    );

    it('Should create annual budget distributed across 12 months', async () => {
        const response = await request(app.getHttpServer() as App)
            .post('/budgets')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Annual Groceries',
                amount: 6000,
                month: 1, // Required but will create for all months
                year: 2024,
                subcategoryId,
                annual: true
            })
            .expect(HttpStatus.CREATED);

        expect(response.body.name).toEqual('Annual Groceries - Month 1');
        expect(response.body.amount).toEqual(500); // 6000 / 12

        // Check all 12 months were created
        const budgets = await prismaService.budget.findMany({
            where: {
                userId,
                year: 2024,
                subcategoryId
            }
        });

        expect(budgets.length).toEqual(12);
        budgets.forEach(budget => {
            expect(Number(budget.amount)).toEqual(500);
        });
    });

});
