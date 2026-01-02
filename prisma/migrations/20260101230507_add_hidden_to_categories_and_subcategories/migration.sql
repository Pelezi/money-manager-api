-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Subcategory" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Category_hidden_idx" ON "Category"("hidden");

-- CreateIndex
CREATE INDEX "Subcategory_hidden_idx" ON "Subcategory"("hidden");
