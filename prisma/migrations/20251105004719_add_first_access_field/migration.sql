/*
  Warnings:

  - You are about to drop the column `locale` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "locale",
ADD COLUMN     "firstAccess" BOOLEAN NOT NULL DEFAULT true;
