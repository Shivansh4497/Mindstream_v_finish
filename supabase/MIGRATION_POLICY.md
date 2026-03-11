# Migration Policy — Mindstream v2

This repository shares the **live production Supabase project** with the original Mindstream repository. Real user data exists in this database.

## The Contract: Additive-Only

Every migration written in this repository **MUST** follow these rules without exception:

1. **Always use `IF NOT EXISTS`** — `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`
2. **Never use `DROP`** — No `DROP TABLE`, `DROP COLUMN`, `DROP INDEX`
3. **Never use `ALTER COLUMN`** on existing columns — No type changes, no renames, no constraint modifications on existing columns
4. **Never use `RENAME`** — No table renames, no column renames
5. **Always use nullable columns with defaults** — New columns must be nullable or have a safe default so existing rows are unaffected

## Why

The original Mindstream frontend reads from the same database. Any destructive migration will break live users immediately with no rollback window.

Adding a new nullable column is invisible to the original app — Supabase returns it as `null`, and the original frontend ignores unknown fields.

## Before Running Any Migration

1. Read this file
2. Verify every statement is additive
3. Test on a staging branch if possible
4. If in doubt, ask before running

## Emergency Rollback

There is no automated rollback. Destructive changes against this DB require manual restoration from Supabase's Point-in-Time Recovery. Don't create that situation.
