/*
  Warnings:

  - You are about to alter the column `amount` on the `AccountBalance` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "AccountBalance" ALTER COLUMN "amount" SET DATA TYPE INTEGER;
