/*
  Warnings:

  - You are about to drop the column `canManageTransactions` on the `GroupRole` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GroupRole" DROP COLUMN "canManageTransactions",
ADD COLUMN     "canManageGroupAccounts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageGroupTransactions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageOwnAccounts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageOwnTransactions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewAccounts" BOOLEAN NOT NULL DEFAULT true;
