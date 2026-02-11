/*
  Warnings:

  - You are about to drop the column `is_owner` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "is_owner",
ADD COLUMN     "isOwner" BOOLEAN NOT NULL DEFAULT false;
