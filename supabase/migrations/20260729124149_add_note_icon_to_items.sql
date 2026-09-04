/*
# Add note and icon columns to items

1. Modified Tables
- `items`: add `note` (text, nullable) — optional "where to buy" note (e.g. "Купить в ВкусВилл").
- `items`: add `icon` (text, nullable) — lucide-react icon name (e.g. 'Carrot', 'Milk'). Null falls back to category default.

2. Security
- No policy changes. Existing RLS policies already cover the new columns (they are not restricted).

3. Notes
- Both columns are optional (nullable) so existing rows are unaffected.
- Uses DO $$ ... END $$ to add columns idempotently if they don't already exist.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'note') THEN
    ALTER TABLE items ADD COLUMN note text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'icon') THEN
    ALTER TABLE items ADD COLUMN icon text;
  END IF;
END $$;
