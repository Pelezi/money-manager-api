import { Injectable, HttpException } from '@nestjs/common';
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
      if (endDate) where.date.lte = endDate;
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

    // Also fetch account balance updates in the same period and ownership scope
    const balanceWhere: any = {};
    if (startDate || endDate) {
      balanceWhere.date = {} as any;
      if (startDate) balanceWhere.date.gte = startDate;
      if (endDate) balanceWhere.date.lte = endDate;
    }

    // Account ownership constraint: if groupId provided, filter by account.groupId, otherwise by account.userId and account.groupId null
    if (groupId !== undefined) {
      balanceWhere.account = { groupId };
    } else {
      balanceWhere.account = { userId, groupId: null };
    }

    if (accountId) {
      balanceWhere.accountId = accountId;
    }

    const balances = await this.prismaService.accountBalance.findMany({
      where: balanceWhere,
      include: { account: true },
      orderBy: { date: 'desc' }
    });

    const syntheticFromBalances = balances.map(b => ({
      id: -(b.id),
      accountId: b.accountId,
      userId: b.account?.userId || userId,
      subcategoryId: null,
      title: 'Atualização de Saldo',
      amount: Number(b.amount),
      description: null,
      date: b.date,
      type: CategoryType.UPDATE,
      toAccountId: null,
      createdAt: b.createdAt,
    }));

    const combined = [...transactions, ...syntheticFromBalances];

    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Convert combined raw entities to TransactionData DTOs (handles Decimal -> number)
  return combined.map(t => new TransactionData(t));
  }

  public async findById(id: number): Promise<TransactionData> {
    try {
      const transaction = await this.prismaService.transaction.findFirst({
        where: { id },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          subcategory: { include: { category: true } }
        }
      });

  if (!transaction) throw new HttpException('Transação não encontrada', 404);
  return new TransactionData(transaction);
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  public async create(userId: number, data: TransactionInput): Promise<TransactionData> {
    try {

      const resolvedUserId = data.userId || userId;

      const createData: any = {
        userId: resolvedUserId,
        groupId: data.groupId,
        subcategoryId: data.subcategoryId,
        accountId: data.accountId,
        // Frontend sometimes sends 0 when no account is selected — coerce 0 -> null so DB FK isn't violated
        toAccountId: data.toAccountId && Number(data.toAccountId) > 0 ? data.toAccountId : null,
        title: data.title,
        amount: data.amount,
        description: data.description,
        date: data.date + (data.time ? `T${data.time}Z` : 'T00:00:00Z'),
        type: data.type
      };

      // Handle TRANSFER transactions: they should not reference a subcategory
      if (data.type === CategoryType.TRANSFER) {
        createData.subcategoryId = null;
        if (!data.toAccountId || Number(data.toAccountId) <= 0) {
          throw new HttpException('toAccountId is required for transfer transactions', 400);
        }
      } else {
        // If a subcategoryId was provided, validate it exists and belongs to the same user/group
        if (data.subcategoryId !== undefined && data.subcategoryId !== null) {
          const subcategory = await this.prismaService.subcategory.findUnique({ where: { id: data.subcategoryId } });
          if (!subcategory) {
            throw new HttpException('Subcategory not found', 400);
          }

          // If transaction is for a group, subcategory must belong to that group. Otherwise it must belong to the user.
          if (createData.groupId !== undefined && createData.groupId !== null) {
            if (subcategory.groupId !== createData.groupId) {
              throw new HttpException('Subcategory does not belong to this group', 400);
            }
          } else {
            if (subcategory.userId !== resolvedUserId) {
              throw new HttpException('Subcategory does not belong to this user', 400);
            }
          }
        }
      }

      const transaction = await this.prismaService.transaction.create({
        data: createData,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          subcategory: { include: { category: true } }
        }
      });

      return new TransactionData(transaction);
    }
    catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  public async update(id: number, userId: number, data: Partial<TransactionInput>): Promise<TransactionData> {
    try {
      const transaction = await this.prismaService.transaction.findFirst({ where: { id, userId } });
      if (!transaction) {
        throw new HttpException('Transaction not found', 404);
      }

      const updateData: any = { ...data };
      if (data.accountId !== undefined) {
        updateData.accountId = data.accountId;
      }
      if (data.toAccountId !== undefined) {
        // Coerce 0 -> null (frontend uses 0 as 'not selected')
        updateData.toAccountId = Number(data.toAccountId) > 0 ? data.toAccountId : null;
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
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  public async delete(id: number, userId: number): Promise<void> {
    try {
      const transaction = await this.prismaService.transaction.findFirst({ where: { id, userId } });
      if (!transaction) {
        throw new HttpException('Transaction not found', 404);
      }
      await this.prismaService.transaction.delete({ where: { id } });
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  public async getAggregatedSpending(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{ subcategoryId: number; total: number }[]> {

    try {

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

    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
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
    }

    const transactions = await this.prismaService.transaction.findMany({ where });

    const accountWhere: any = {};
    if (groupId !== undefined) {
      accountWhere.groupId = groupId;
    } else {
      accountWhere.userId = userId;
      accountWhere.groupId = null;
    }
    const accounts = await this.prismaService.account.findMany({ where: accountWhere });
    const accountMap = new Map<number, { type: string; subcategoryId?: number | null; debitMethod?: string | null }>();
    for (const account of accounts) {
      accountMap.set(account.id, { type: account.type, subcategoryId: account.subcategoryId, debitMethod: account.debitMethod ?? null });
    }

    const acc: Record<string, { subcategoryId: number; total: number; count: number; month: number; year: number; type: CategoryType }> = {};
    for (const t of transactions) {
      const d = new Date(t.date);

      // Non-transfer transactions: aggregate by their subcategory
      if (t.type !== 'TRANSFER') {
        // If this is an expense coming from a CREDIT account with debitMethod=INVOICE, skip it
        if (t.type === 'EXPENSE' && t.accountId) {
          const src = accountMap.get(t.accountId);
          if (src && src.type === 'CREDIT') {
            continue;
          }
        }

        if (!t.subcategoryId) continue;
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
        continue;
      }

      // For TRANSFER transactions: if the destination account is a PREPAID account,
      // treat this transfer as an EXPENSE attributed to the prepaid account's configured subcategory.
      if (t.toAccountId) {
        const dest = accountMap.get(t.toAccountId);
        if (dest) {
          // Transfers to PREPAID accounts -> expense attributed to that account's subcategory
          if (dest.type === 'PREPAID' && dest.subcategoryId) {
            const subId = dest.subcategoryId as number;
            const key = `${subId}-${d.getMonth() + 1}-${d.getFullYear()}-EXPENSE`;
            if (!acc[key]) {
              acc[key] = {
                subcategoryId: subId,
                total: 0,
                count: 0,
                month: d.getMonth() + 1,
                year: d.getFullYear(),
                type: 'EXPENSE',
              };
            }
            acc[key].total += Number(t.amount);
            acc[key].count += 1;
          }

          // Transfers to CREDIT accounts with invoice billing -> treat as expense to the account's subcategory
          if (dest.type === 'CREDIT' && dest.subcategoryId) {
            const subId = dest.subcategoryId as number;
            const key = `${subId}-${d.getMonth() + 1}-${d.getFullYear()}-EXPENSE`;
            if (!acc[key]) {
              acc[key] = {
                subcategoryId: subId,
                total: 0,
                count: 0,
                month: d.getMonth() + 1,
                year: d.getFullYear(),
                type: 'EXPENSE',
              };
            }
            acc[key].total += Number(t.amount);
            acc[key].count += 1;
          }
        }
      }
    }

    return Object.values(acc).map(({ subcategoryId, total, count, month, year, type }) =>
      new TransactionAggregated({ subcategoryId, total, count, month, year, type })
    );
  }
}
