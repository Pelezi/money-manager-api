import { Injectable, HttpException } from '@nestjs/common';
import { CategoryType, Prisma } from '@prisma/client';

import { PrismaService } from '../../common';
import { TransactionData, TransactionInput, TransactionAggregated } from '../model';

@Injectable()
export class TransactionService {

  public constructor(
    private readonly prismaService: PrismaService
  ) { }

  /**
   * Calculate timezone offset in milliseconds for a given timezone and date
   * @param timezone IANA timezone string (e.g., 'America/Sao_Paulo')
   * @param date The date to calculate offset for
   * @returns Offset in milliseconds
   */
  private getTimezoneOffset(timezone: string, date: Date): number {
    try {
      // Get the date string in the target timezone
      const tzDateStr = date.toLocaleString('en-US', { timeZone: timezone });
      const tzDate = new Date(tzDateStr);
      // Get the date string in UTC
      const utcDateStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
      const utcDate = new Date(utcDateStr);
      // The difference is the offset
      return tzDate.getTime() - utcDate.getTime();
    } catch (error) {
      // If timezone is invalid, return 0 (treat as UTC)
      return 0;
    }
  }

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

    let adjustedStartDate: Date | undefined;
    let adjustedEndDate: Date | undefined;

    if (startDate || endDate) {
      // Fetch user's timezone to properly interpret date boundaries
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { timezone: true }
      });
      const userTimezone = user?.timezone || 'UTC';

      if (startDate) {
        // Convert start of day in user's timezone to UTC
        const startDateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const startInUserTz = new Date(`${startDateStr}T00:00:00`);
        // Calculate offset: parse as if it were in the user's timezone
        const offsetMs = this.getTimezoneOffset(userTimezone, startInUserTz);
        adjustedStartDate = new Date(startInUserTz.getTime() - offsetMs);
      }
      if (endDate) {
        // Convert end of day in user's timezone to UTC
        const endDateStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const endInUserTz = new Date(`${endDateStr}T23:59:59.999`);
        const offsetMs = this.getTimezoneOffset(userTimezone, endInUserTz);
        adjustedEndDate = new Date(endInUserTz.getTime() - offsetMs);
      }

      where.date = {};
      if (adjustedStartDate) where.date.gte = adjustedStartDate;
      if (adjustedEndDate) where.date.lte = adjustedEndDate;
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
    if (adjustedStartDate || adjustedEndDate) {
      // Reuse the same timezone-adjusted date range from the main where clause
      balanceWhere.date = {};
      if (adjustedStartDate) balanceWhere.date.gte = adjustedStartDate;
      if (adjustedEndDate) balanceWhere.date.lte = adjustedEndDate;
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

  public async update(id: number, data: Partial<TransactionInput>): Promise<TransactionData> {
    try {
      const transaction = await this.prismaService.transaction.findFirst({ where: { id } });
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

  /**
   * Calculate the due date month for a credit card transaction based on closing and due days
   * @param transactionDate The date of the transaction
   * @param closingDay The closing day of the credit card (1-31)
   * @param dueDay The due day of the credit card (1-31)
   * @returns Object with month (1-12) and year
   */
  private calculateDueDateMonth(transactionDate: Date, closingDay: number, dueDay: number): { month: number; year: number } {
    const txDate = new Date(transactionDate);
    const txMonth = txDate.getMonth(); // 0-11
    const txYear = txDate.getFullYear();
    const txDay = txDate.getDate();

    // Determine which billing cycle this transaction belongs to
    let billingMonth = txMonth;
    let billingYear = txYear;

    // If transaction is after closing day, it goes to next month's bill
    if (txDay > closingDay) {
      billingMonth += 1;
      if (billingMonth > 11) {
        billingMonth = 0;
        billingYear += 1;
      }
    }

    // Now calculate the due date for this billing cycle
    let dueMonth = billingMonth;
    let dueYear = billingYear;

    // Due date is typically in the next month after closing
    if (dueDay < closingDay) {
      dueMonth += 1;
      if (dueMonth > 11) {
        dueMonth = 0;
        dueYear += 1;
      }
    }

    return { month: dueMonth + 1, year: dueYear }; // Return 1-12 for month
  }

  public async getAggregatedByYear(
    userId: number,
    year: number,
    groupId?: number
  ): Promise<TransactionAggregated[]> {
    // Expand query range to include 2 months before the year to capture
    // transactions from previous year that may have due dates in the requested year
    // (e.g., December purchases with January due dates)
    const startDate = new Date(year - 1, 10, 1); // November of previous year
    const endDate = new Date(year + 1, 0, 1); // End of requested year

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
    const accountMap = new Map<number, { 
      type: string; 
      subcategoryId?: number | null; 
      debitMethod?: string | null; 
      budgetMonthBasis?: string | null;
      creditDueDay?: number | null;
      creditClosingDay?: number | null;
    }>();
    for (const account of accounts) {
      accountMap.set(account.id, { 
        type: account.type, 
        subcategoryId: account.subcategoryId, 
        debitMethod: account.debitMethod ?? null,
        budgetMonthBasis: account.budgetMonthBasis ?? null,
        creditDueDay: account.creditDueDay ?? null,
        creditClosingDay: account.creditClosingDay ?? null,
      });
    }

    const acc: Record<string, { subcategoryId: number; total: number; count: number; month: number; year: number; type: CategoryType }> = {};
    for (const t of transactions) {
      if (t.id == 232) {
        console.log('Processing transaction 232:', t);
      }
      const d = new Date(t.date);

      // Non-transfer transactions: aggregate by their subcategory
      if (t.type !== 'TRANSFER') {
        // If this is an expense coming from a PREPAID account, skip it
        if (t.type === 'EXPENSE' && t.accountId) {
          const src = accountMap.get(t.accountId);
          if (src && src.type == 'PREPAID') {
            continue;
          }
          if (src && src.type == 'CREDIT' && src.debitMethod == 'INVOICE') {
            continue;
          }
        }

        if (!t.subcategoryId) continue;

        // Determine which month to attribute this transaction to
        let targetMonth = d.getMonth() + 1;
        let targetYear = d.getFullYear();

        // For CREDIT accounts with PER_PURCHASE debit and DUE_DATE basis, calculate due date month
        if (t.type === 'EXPENSE' && t.accountId) {
          const account = accountMap.get(t.accountId);
          if (account && 
              account.type === 'CREDIT' && 
              account.debitMethod === 'PER_PURCHASE' && 
              account.budgetMonthBasis === 'DUE_DATE' &&
              account.creditClosingDay &&
              account.creditClosingDay !== null &&
              account.creditDueDay &&
              account.creditDueDay !== null
              ) {
                console.log('Calculating due date month for transaction', t.id);
                console.log('Account creditClosingDay:', account.creditClosingDay, 'creditDueDay:', account.creditDueDay);
                console.log('Transaction date:', d);
              const dueDateInfo = this.calculateDueDateMonth(d, account.creditClosingDay, account.creditDueDay);
              console.log('Due date Info:', dueDateInfo);
              targetMonth = dueDateInfo.month;
              targetYear = dueDateInfo.year;
          }
        }

        const key = `${t.subcategoryId}-${targetMonth}-${targetYear}-${t.type}`;
        if (!acc[key]) {
          acc[key] = {
            subcategoryId: t.subcategoryId,
            total: 0,
            count: 0,
            month: targetMonth,
            year: targetYear,
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

    return Object.values(acc)
      .filter(({ year: aggYear }) => aggYear === year)
      .map(({ subcategoryId, total, count, month, year, type }) =>
        new TransactionAggregated({ subcategoryId, total, count, month, year, type })
      );
  }
}
