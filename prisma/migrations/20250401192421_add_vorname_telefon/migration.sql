/*
  Warnings:

  - Added the required column `telefon` to the `Sponsor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vorname` to the `Sponsor` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sponsor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vorname" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "songId" INTEGER NOT NULL,
    CONSTRAINT "Sponsor_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Sponsor" ("email", "id", "message", "name", "songId") SELECT "email", "id", "message", "name", "songId" FROM "Sponsor";
DROP TABLE "Sponsor";
ALTER TABLE "new_Sponsor" RENAME TO "Sponsor";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
