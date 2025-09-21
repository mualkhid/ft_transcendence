/*
  Warnings:

  - You are about to drop the column `originalEmail` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `originalUsername` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL DEFAULT '/avatars/default.jpg',
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorTempSecret" TEXT,
    "twoFactorBackupCodes" TEXT
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "email", "gamesPlayed", "id", "isEmailVerified", "isTwoFactorEnabled", "lastSeen", "losses", "passwordHash", "twoFactorBackupCodes", "twoFactorSecret", "twoFactorTempSecret", "updatedAt", "username", "wins") SELECT "avatarUrl", "createdAt", "email", "gamesPlayed", "id", "isEmailVerified", "isTwoFactorEnabled", "lastSeen", "losses", "passwordHash", "twoFactorBackupCodes", "twoFactorSecret", "twoFactorTempSecret", "updatedAt", "username", "wins" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
