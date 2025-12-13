-- CreateEnum
CREATE TYPE "BudgetMonthBasis" AS ENUM ('PURCHASE_DATE', 'DUE_DATE');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "budgetMonthBasis" "BudgetMonthBasis" DEFAULT 'PURCHASE_DATE';
