-- Birthday is the source of truth. age stays for matching until it is derived on save.
ALTER TABLE "user_dating_profiles" ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE;
