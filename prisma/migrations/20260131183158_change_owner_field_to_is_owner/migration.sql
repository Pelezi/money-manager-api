/*
  Warnings:

  - You are about to drop the column `owner` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "owner",
ADD COLUMN     "is_owner" BOOLEAN NOT NULL DEFAULT false;
