-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER,
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
INSERT INTO "new_Match" ("createdAt", "finishedAt", "id", "matchNumber", "player1Alias", "player2Alias", "roundNumber", "startedAt", "status", "tournamentId", "winnerAlias") SELECT "createdAt", "finishedAt", "id", "matchNumber", "player1Alias", "player2Alias", "roundNumber", "startedAt", "status", "tournamentId", "winnerAlias" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");
CREATE INDEX "Match_tournamentId_roundNumber_idx" ON "Match"("tournamentId", "roundNumber");
CREATE UNIQUE INDEX "Match_tournamentId_roundNumber_matchNumber_key" ON "Match"("tournamentId", "roundNumber", "matchNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
