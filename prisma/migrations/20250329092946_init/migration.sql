-- CreateTable
CREATE TABLE "Song" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "komponist" TEXT NOT NULL,
    "anzahl" INTEGER NOT NULL,
    "preis" REAL NOT NULL,
    "gesamtpreis" REAL NOT NULL,
    "bewerber" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "songId" INTEGER NOT NULL,
    CONSTRAINT "Sponsor_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
