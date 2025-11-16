-- CreateEnum
CREATE TYPE "DebitMethod" AS ENUM ('INVOICE', 'PER_PURCHASE');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "creditDueDay" INTEGER,
ADD COLUMN     "debitMethod" "DebitMethod",
ADD COLUMN     "subcategoryId" INTEGER;

-- CreateIndex
CREATE INDEX "Account_subcategoryId_idx" ON "Account"("subcategoryId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
