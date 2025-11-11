import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryType, Prisma } from '@prisma/client';

import { PrismaService } from '../../common';
import { TransactionData, TransactionInput, TransactionAggregated } from '../model';

@Injectable()
export class TransactionService {

  public constructor(
    private readonly prismaService: PrismaService
  ) { }

  public async findByUser(
    userId: number,
    groupId?: number,
    categoryId?: number,
    subcategoryId?: number,
    accountId?: number,
    startDate?: Date,
    endDate?: Date,
    type?: CategoryType
  ): Promise<TransactionData[]> {

    const where: Prisma.TransactionWhereInput = {};

    if (groupId !== undefined) {
      where.groupId = groupId;
    } else {
      where.userId = userId;
      where.groupId = null;
    }

    if (categoryId) {
      const subcategories = await this.prismaService.subcategory.findMany({
        where: { categoryId }
      });
      const subcategoryIds = subcategories.map(s => s.id);
      if (subcategoryIds.length > 0) {
        where.subcategoryId = { in: subcategoryIds };
      } else {
        return [];
      }
    }

    if (subcategoryId) {
      where.subcategoryId = subcategoryId;
    }

    if (accountId) {
      where.OR = [
        { accountId },
        { toAccountId: accountId }
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate)   where.date.lte = endDate;
    }

    if (type) {
      where.type = type;
    }

    const transactions = await this.prismaService.transaction.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        subcategory: { include: { category: true } }
      },
      orderBy: { date: 'desc' }
    });

    return transactions.map(t => new TransactionData(t));
  }

  public async findById(id: number, userId: number): Promise<TransactionData | null> {
    const transaction = await this.prismaService.transaction.findFirst({
      where: { id, userId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        subcategory: { include: { category: true } }
      }
    });

    if (!transaction) return null;
    return new TransactionData(transaction);
  }

  public async create(userId: number, data: TransactionInput): Promise<TransactionData> {
    const createData: any = {
      userId: data.userId || userId,
      groupId: data.groupId,
      subcategoryId: data.subcategoryId,
      accountId: data.accountId,
      toAccountId: data.toAccountId,
      title: data.title,
      amount: data.amount,
      description: data.description,
      date: data.date + (data.time ? `T${data.time}Z` : 'T00:00:00Z'),
      type: data.type
    };

    const transaction = await this.prismaService.transaction.create({
      data: createData,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        subcategory: { include: { category: true } }
      }
    });

    return new TransactionData(transaction);
  }

  public async update(id: number, userId: number, data: Partial<TransactionInput>): Promise<TransactionData> {
    const transaction = await this.prismaService.transaction.findFirst({ where: { id, userId } });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const updateData: any = { ...data };
    if (data.accountId !== undefined) {
      updateData.accountId = data.accountId;
    }
    if (data.toAccountId !== undefined) {
      updateData.toAccountId = data.toAccountId;
    }

    // Combine date/time per payload:
    // - If date is provided: use it and (optional) time.
    // - If only time is provided: keep existing date and replace the time.
    if (data.date) {
      updateData.date = data.date + (data.time ? `T${data.time}Z` : 'T00:00:00Z');
      delete updateData.time;
    } else if (data.time) {
      const d = new Date(transaction.date);
      const yyyy = d.toISOString().slice(0, 10); // YYYY-MM-DD from existing
      updateData.date = `${yyyy}T${data.time}Z`;
      delete updateData.time;
    }

    const updated = await this.prismaService.transaction.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        subcategory: { include: { category: true } }
      }
    });

    return new TransactionData(updated);
  }

  public async delete(id: number, userId: number): Promise<void> {
    const transaction = await this.prismaService.transaction.findFirst({ where: { id, userId } });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    await this.prismaService.transaction.delete({ where: { id } });
  }

  public async getAggregatedSpending(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{ subcategoryId: number; total: number }[]> {

    const transactions = await this.prismaService.transaction.findMany({
      where: { 
        userId, 
        groupId: null, 
        date: { 
          gte: startDate, 
          lte: endDate 
        },
        type: { not: 'TRANSFER' }
      }
    });

    const map = new Map<number, number>();
    for (const t of transactions) {
      if (!t.subcategoryId) continue;
      const id = t.subcategoryId;
      map.set(id, (map.get(id) ?? 0) + Number(t.amount));
    }

    return Array.from(map.entries()).map(([subcategoryId, total]) => ({ subcategoryId, total }));
  }

  public async getAggregatedByYear(
    userId: number,
    year: number,
    groupId?: number
  ): Promise<TransactionAggregated[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const where: Prisma.TransactionWhereInput = { date: { gte: startDate, lt: endDate } };
    if (groupId !== undefined) {
      where.groupId = groupId;
    } else {
      where.userId = userId;
      where.groupId = null;
      where.type = { not: 'TRANSFER' };
    }

    const transactions = await this.prismaService.transaction.findMany({ where });

    const acc: Record<string, { subcategoryId: number; total: number; count: number; month: number; year: number; type: CategoryType }> = {};
    for (const t of transactions) {
      if (!t.subcategoryId) continue;
      const d = new Date(t.date);
      const key = `${t.subcategoryId}-${d.getMonth() + 1}-${d.getFullYear()}-${t.type}`;
      if (!acc[key]) {
        acc[key] = {
          subcategoryId: t.subcategoryId,
          total: 0,
          count: 0,
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          type: t.type,
        };
      }
      acc[key].total += Number(t.amount);
      acc[key].count += 1;
    }

    return Object.values(acc).map(({ subcategoryId, total, count, month, year, type }) =>
      new TransactionAggregated({ subcategoryId, total, count, month, year, type })
    );
  }
}
 