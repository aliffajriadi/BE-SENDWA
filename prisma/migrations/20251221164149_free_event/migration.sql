-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "nomor" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" INTEGER NOT NULL,
    "free_event" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_users" ("name", "nomor", "token") SELECT "name", "nomor", "token" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_nomor_key" ON "users"("nomor");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
