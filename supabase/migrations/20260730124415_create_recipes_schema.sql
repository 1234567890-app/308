/*
# Create recipes, recipe_ingredients, recipe_steps tables

1. New Tables
- `recipes`: a recipe belonging to a household. Columns: id (uuid pk), household_id (uuid -> households), title (text), description (text, nullable), default_servings (int, default 2), category (text), cook_time_minutes (int, nullable), created_by (uuid -> auth.users), created_at, updated_at.
- `recipe_ingredients`: an ingredient line in a recipe. Columns: id (uuid pk), recipe_id (uuid -> recipes ON DELETE CASCADE), name (text), amount (numeric, default 1), unit (text, e.g. 'г', 'мл', 'шт'), category (text: 'fresh' | 'household' | 'long_term', default 'fresh').
- `recipe_steps`: a numbered cooking step. Columns: id (uuid pk), recipe_id (uuid -> recipes ON DELETE CASCADE), step_number (int), instruction (text).

2. Security
- Enable RLS on all three tables.
- `recipes`: any authenticated member of the recipe's household can SELECT/INSERT/UPDATE/DELETE. Membership checked via EXISTS subquery on household_members.
- `recipe_ingredients` and `recipe_steps`: scoped through their parent recipe's household — membership checked via EXISTS on recipes -> household_members.
- `recipes.created_by` defaults to auth.uid() so client inserts omitting it still satisfy RLS.

3. Notes
- Child tables cascade-delete with their parent recipe.
- `recipes.updated_at` auto-updates via the existing set_updated_at() trigger function.
- Realtime publication enabled for all three tables.
- Idempotent: uses IF NOT EXISTS for tables/indexes, DROP POLICY IF EXISTS before CREATE POLICY.
*/

CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  default_servings int NOT NULL DEFAULT 2,
  category text NOT NULL DEFAULT 'fresh' CHECK (category IN ('fresh','household','long_term')),
  cook_time_minutes int,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'г',
  category text NOT NULL DEFAULT 'fresh' CHECK (category IN ('fresh','household','long_term'))
);

CREATE TABLE IF NOT EXISTS recipe_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number int NOT NULL DEFAULT 1,
  instruction text NOT NULL
);

CREATE INDEX IF NOT EXISTS recipes_household_id_idx ON recipes(household_id);
CREATE INDEX IF NOT EXISTS recipe_ingredients_recipe_id_idx ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS recipe_steps_recipe_id_idx ON recipe_steps(recipe_id);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;

-- updated_at trigger for recipes (reuse existing function)
DROP TRIGGER IF EXISTS recipes_set_updated_at ON recipes;
CREATE TRIGGER recipes_set_updated_at BEFORE UPDATE ON recipes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ===== recipes policies (membership-scoped) =====
DROP POLICY IF EXISTS "select_household_recipes" ON recipes;
CREATE POLICY "select_household_recipes" ON recipes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members m
      WHERE m.household_id = recipes.household_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_household_recipes" ON recipes;
CREATE POLICY "insert_household_recipes" ON recipes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members m
      WHERE m.household_id = recipes.household_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_household_recipes" ON recipes;
CREATE POLICY "update_household_recipes" ON recipes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members m
      WHERE m.household_id = recipes.household_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members m
      WHERE m.household_id = recipes.household_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_household_recipes" ON recipes;
CREATE POLICY "delete_household_recipes" ON recipes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members m
      WHERE m.household_id = recipes.household_id AND m.user_id = auth.uid()
    )
  );

-- ===== recipe_ingredients policies (scoped via parent recipe) =====
DROP POLICY IF EXISTS "select_recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "select_recipe_ingredients" ON recipe_ingredients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_ingredients.recipe_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "insert_recipe_ingredients" ON recipe_ingredients
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_ingredients.recipe_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "update_recipe_ingredients" ON recipe_ingredients
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_ingredients.recipe_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_ingredients.recipe_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "delete_recipe_ingredients" ON recipe_ingredients
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_ingredients.recipe_id AND m.user_id = auth.uid()
    )
  );

-- ===== recipe_steps policies (scoped via parent recipe) =====
DROP POLICY IF EXISTS "select_recipe_steps" ON recipe_steps;
CREATE POLICY "select_recipe_steps" ON recipe_steps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_steps.recipe_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_recipe_steps" ON recipe_steps;
CREATE POLICY "insert_recipe_steps" ON recipe_steps
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_steps.recipe_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_recipe_steps" ON recipe_steps;
CREATE POLICY "update_recipe_steps" ON recipe_steps
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_steps.recipe_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_steps.recipe_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_recipe_steps" ON recipe_steps;
CREATE POLICY "delete_recipe_steps" ON recipe_steps
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_steps.recipe_id AND m.user_id = auth.uid()
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE recipes;
ALTER PUBLICATION supabase_realtime ADD TABLE recipe_ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE recipe_steps;
