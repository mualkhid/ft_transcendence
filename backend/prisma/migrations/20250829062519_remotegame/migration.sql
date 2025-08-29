-- DropIndex
DROP INDEX "Match_tournamentId_roundNumber_matchNumber_key";

-- DropIndex
DROP INDEX "Match_tournamentId_roundNumber_idx";

-- CreateIndex
CREATE INDEX "Match_startedAt_idx" ON "Match"("startedAt");
