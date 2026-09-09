/*
# Change recipes.category from product categories to meal types

1. Modified Tables
- `recipes`: the `category` column CHECK constraint changed from ('fresh','household','long_term') to ('breakfast','lunch','dinner','snack','dessert'). Default changed from 'fresh' to 'breakfast'.
- `recipe_ingredients.category`: unchanged — still ('fresh','household','long_term') since ingredient shopping categories are separate from recipe meal types.

2. Security
- No RLS policy changes.

3. Notes
- Constraint is dropped FIRST, then existing recipe category values are migrated to 'breakfast', then the new constraint is added. This avoids the check constraint firing during the UPDATE.
- Idempotent: drops and recreates the constraint safely.
*/

-- 1. Drop the old constraint so the UPDATE can proceed
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_category_check;

-- 2. Migrate any old product-category values to a valid meal type
UPDATE recipes SET category = 'breakfast' WHERE category NOT IN ('breakfast','lunch','dinner','snack','dessert');

-- 3. Add the new meal-type constraint
ALTER TABLE recipes ADD CONSTRAINT recipes_category_check
  CHECK (category IN ('breakfast','lunch','dinner','snack','dessert'));

-- 4. Update the default
ALTER TABLE recipes ALTER COLUMN category SET DEFAULT 'breakfast';
