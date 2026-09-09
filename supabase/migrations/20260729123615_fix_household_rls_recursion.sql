/*
# Fix infinite recursion in household RLS policies

1. Problem
- `households` SELECT policy referenced `household_members`, and `household_members` SELECT policy referenced `households`.
- This mutual reference created infinite recursion under RLS.

2. Solution
- Create a `SECURITY DEFINER` function `user_household_id()` that returns the authenticated user's household_id by querying `household_members` directly (bypassing RLS because SECURITY DEFINER runs as the function owner, not the caller).
- Create a helper `is_household_member(household_id uuid)` that returns true if the current user is a member of the given household.
- Rewrite all RLS policies on `households`, `household_members`, and `items` to use these functions instead of sub-selecting each other.

3. New Functions
- `user_household_id()` -> uuid: returns the household_id for auth.uid(), or null.
- `is_household_member(p_household_id uuid)` -> boolean: returns true if auth.uid() is a member of p_household_id.

4. Security
- Functions are SECURITY DEFINER, owned by the postgres role, so they bypass RLS and avoid recursion.
- `households`: creator can do everything; members can SELECT.
- `household_members`: a user can read/insert/delete their own membership row.
- `items`: any member of the item's household can CRUD.
*/

-- Drop old recursive policies
DROP POLICY IF EXISTS "select_own_households" ON households;
DROP POLICY IF EXISTS "insert_own_households" ON households;
DROP POLICY IF EXISTS "update_own_households" ON households;
DROP POLICY IF EXISTS "delete_own_households" ON households;

DROP POLICY IF EXISTS "select_own_memberships" ON household_members;
DROP POLICY IF EXISTS "insert_own_membership" ON household_members;
DROP POLICY IF EXISTS "delete_own_membership" ON household_members;

DROP POLICY IF EXISTS "select_household_items" ON items;
DROP POLICY IF EXISTS "insert_household_items" ON items;
DROP POLICY IF EXISTS "update_household_items" ON items;
DROP POLICY IF EXISTS "delete_household_items" ON items;

-- Helper: return the current user's household_id (SECURITY DEFINER avoids RLS recursion)
CREATE OR REPLACE FUNCTION user_household_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id
  FROM household_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Helper: check membership for a given household (SECURITY DEFINER avoids RLS recursion)
CREATE OR REPLACE FUNCTION is_household_member(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM household_members
    WHERE household_id = p_household_id
      AND user_id = auth.uid()
  );
$$;

-- households policies (no self-reference / no reference to household_members under RLS)
CREATE POLICY "select_own_households" ON households
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR is_household_member(id)
  );

CREATE POLICY "insert_own_households" ON households
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "update_own_households" ON households
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "delete_own_households" ON households
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- household_members policies (only reference auth.uid() directly, no household lookup)
CREATE POLICY "select_own_memberships" ON household_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "insert_own_membership" ON household_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_membership" ON household_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- items policies (use SECURITY DEFINER helper, no recursive sub-select)
CREATE POLICY "select_household_items" ON items
  FOR SELECT TO authenticated
  USING (is_household_member(household_id));

CREATE POLICY "insert_household_items" ON items
  FOR INSERT TO authenticated
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "update_household_items" ON items
  FOR UPDATE TO authenticated
  USING (is_household_member(household_id))
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "delete_household_items" ON items
  FOR DELETE TO authenticated
  USING (is_household_member(household_id));
