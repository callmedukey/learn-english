-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isProfileIncomplete" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "password" DROP NOT NULL;
