-- Store the current avatar as a URL for now. This can later point to uploaded file storage.
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
