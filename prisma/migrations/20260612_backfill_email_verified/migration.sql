-- Backfill: marque tous les comptes existants comme email vérifié.
-- La migration add_email_verification a déjà utilisé DEFAULT true lors de l'ALTER TABLE,
-- donc les anciennes lignes sont déjà à true. Ce UPDATE est un filet de sécurité explicite
-- pour garantir qu'aucun compte existant ne soit bloqué si REQUIRE_EMAIL_VERIFICATION
-- est activé en production.
UPDATE "User" SET "isEmailVerified" = true WHERE "isEmailVerified" = false;
