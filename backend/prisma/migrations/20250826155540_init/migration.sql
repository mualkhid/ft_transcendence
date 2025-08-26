/*
  Warnings:

  - The primary key for the `MatchPlayer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `MatchPlayer` table. All the data in the column will be lost.
  - The primary key for the `TournamentPlayer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `backupCodes` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isTwoFactorEnabled` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twoFactorSecret` on the `User` table. All the data in the column will be lost.
  - Added the required column `matchNumber` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player1Alias` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player2Alias` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roundNumber` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Made the column `tournamentId` on table `Match` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `alias` to the `MatchPlayer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentRound` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxPlayers` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `alias` to the `TournamentPlayer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `TournamentPlayer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerOrder` to the `TournamentPlayer` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "player1Alias" TEXT NOT NULL,
    "player2Alias" TEXT NOT NULL,
    "winnerAlias" TEXT,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("finishedAt", "id", "startedAt", "tournamentId") SELECT "finishedAt", "id", "startedAt", "tournamentId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");
CREATE INDEX "Match_tournamentId_roundNumber_idx" ON "Match"("tournamentId", "roundNumber");
CREATE UNIQUE INDEX "Match_tournamentId_roundNumber_matchNumber_key" ON "Match"("tournamentId", "roundNumber", "matchNumber");
CREATE TABLE "new_MatchPlayer" (
    "matchId" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "result" TEXT,

    PRIMARY KEY ("matchId", "alias"),
    CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MatchPlayer" ("matchId", "result", "score") SELECT "matchId", "result", "score" FROM "MatchPlayer";
DROP TABLE "MatchPlayer";
ALTER TABLE "new_MatchPlayer" RENAME TO "MatchPlayer";
CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "maxPlayers" INTEGER NOT NULL,
    "currentRound" INTEGER NOT NULL,
    "creatorId" INTEGER,
    "winnerId" INTEGER,
    "winnerAlias" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tournament_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tournament_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("createdAt", "creatorId", "id", "name", "status", "updatedAt", "winnerId") SELECT "createdAt", "creatorId", "id", "name", "status", "updatedAt", "winnerId" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE TABLE "new_TournamentPlayer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "userId" INTEGER,
    "playerOrder" INTEGER NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentPlayer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TournamentPlayer" ("joinedAt", "tournamentId", "userId") SELECT "joinedAt", "tournamentId", "userId" FROM "TournamentPlayer";
DROP TABLE "TournamentPlayer";
ALTER TABLE "new_TournamentPlayer" RENAME TO "TournamentPlayer";
CREATE INDEX "TournamentPlayer_tournamentId_idx" ON "TournamentPlayer"("tournamentId");
CREATE INDEX "TournamentPlayer_userId_idx" ON "TournamentPlayer"("userId");
CREATE UNIQUE INDEX "TournamentPlayer_tournamentId_userId_key" ON "TournamentPlayer"("tournamentId", "userId");
CREATE UNIQUE INDEX "TournamentPlayer_tournamentId_playerOrder_key" ON "TournamentPlayer"("tournamentId", "playerOrder");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "passwordHash", "updatedAt", "username") SELECT "createdAt", "email", "id", "passwordHash", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
