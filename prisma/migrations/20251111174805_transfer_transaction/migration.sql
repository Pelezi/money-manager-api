-- AlterEnum
ALTER TYPE "CategoryType" ADD VALUE 'TRANSFER';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "toAccountId" INTEGER,
ALTER COLUMN "subcategoryId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_toAccountId_idx" ON "Transaction"("toAccountId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
