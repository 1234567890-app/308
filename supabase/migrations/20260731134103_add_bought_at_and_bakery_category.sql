/*
# Add bought_at timestamp and bakery meal category

1. Modified Tables
- `items`: added `bought_at` timestamptz column (nullable) to track when an item was purchased.
- `recipes`: category CHECK constraint expanded to include 'bakery'.

2. Security
- No RLS policy changes. bought_at is nullable and set by the owning user.

3. Notes
- bought_at is set when an item transitions from to_buy -> in_stock (purchased).
- The "Куплено" section in the shopping tab filters items where bought_at is within the last 24 hours.
- bakery is a new meal-type category for baked goods / pastries.
*/

-- Add bought_at column to items
ALTER TABLE items ADD COLUMN IF NOT EXISTS bought_at timestamptz;

-- Add bakery to recipe category constraint
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_category_check;
ALTER TABLE recipes ADD CONSTRAINT recipes_category_check
  CHECK (category IN ('breakfast','lunch','dinner','snack','dessert','bakery'));
