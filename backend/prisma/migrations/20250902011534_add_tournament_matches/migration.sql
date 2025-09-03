/*
  Warnings:

  - You are about to drop the column `creatorId` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `currentRound` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `winnerAlias` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `winnerId` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `alias` on the `TournamentPlayer` table. All the data in the column will be lost.
  - You are about to drop the column `playerOrder` on the `TournamentPlayer` table. All the data in the column will be lost.
  - Added the required column `name` to the `TournamentPlayer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "winnerId" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "TournamentPlayer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "TournamentPlayer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "TournamentPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "maxPlayers" INTEGER NOT NULL,
    "createdBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "Tournament_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("createdAt", "id", "maxPlayers", "name", "status", "updatedAt") SELECT "createdAt", "id", "maxPlayers", "name", "status", "updatedAt" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");
CREATE INDEX "Tournament_createdBy_idx" ON "Tournament"("createdBy");
CREATE TABLE "new_TournamentPlayer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentPlayer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TournamentPlayer" ("id", "joinedAt", "tournamentId", "userId") SELECT "id", "joinedAt", "tournamentId", "userId" FROM "TournamentPlayer";
DROP TABLE "TournamentPlayer";
ALTER TABLE "new_TournamentPlayer" RENAME TO "TournamentPlayer";
CREATE INDEX "TournamentPlayer_tournamentId_idx" ON "TournamentPlayer"("tournamentId");
CREATE INDEX "TournamentPlayer_userId_idx" ON "TournamentPlayer"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TournamentMatch_tournamentId_idx" ON "TournamentMatch"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentMatch_tournamentId_round_idx" ON "TournamentMatch"("tournamentId", "round");

-- CreateIndex
CREATE INDEX "TournamentMatch_player1Id_idx" ON "TournamentMatch"("player1Id");

-- CreateIndex
CREATE INDEX "TournamentMatch_player2Id_idx" ON "TournamentMatch"("player2Id");
