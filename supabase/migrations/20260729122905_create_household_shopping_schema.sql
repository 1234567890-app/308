/*
# Household shopping & inventory schema

1. New Tables
- `households`: a family group (basket). Columns: id (uuid pk), name (text), pin (text 4-digit), created_by (uuid -> auth.users), created_at.
- `household_members`: links users to a household. Columns: household_id (uuid -> households), user_id (uuid -> auth.users), created_at. Primary key on (household_id, user_id).
- `items`: products tracked by a household. Columns: id (uuid pk), household_id (uuid -> households), name (text), category (text: 'fresh' | 'household' | 'long_term'), status (text: 'in_stock' | 'to_buy' | 'bought_today'), created_by (uuid -> auth.users), created_at, updated_at.

2. Security
- Enable RLS on all three tables.
- `households`: owner (creator) can SELECT/UPDATE/DELETE; members of a household can SELECT it.
- `household_members`: a user can SELECT memberships for households they belong to, and can INSERT their own membership (join via PIN). Household creator can also DELETE members.
- `items`: any authenticated member of the item's household can SELECT/INSERT/UPDATE/DELETE. Membership is checked via EXISTS subquery on household_members.

3. Notes
- `items.created_by` and `households.created_by` default to auth.uid() so client inserts omitting them still satisfy RLS.
- `items.updated_at` auto-updates on row change via trigger.
*/

CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Наша семья',
  pin text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS household_members (
  household_id uuid REFERENCES households(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (household_id, user_id)
);

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'fresh' CHECK (category IN ('fresh','household','long_term')),
  status text NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock','to_buy','bought_today')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS items_household_id_idx ON items(household_id);
CREATE INDEX IF NOT EXISTS items_status_idx ON items(status);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- updated_at trigger for items
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS items_set_updated_at ON items;
CREATE TRIGGER items_set_updated_at BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- households policies
DROP POLICY IF EXISTS "select_own_households" ON households;
CREATE POLICY "select_own_households" ON households
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM household_members m
      WHERE m.household_id = households.id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_households" ON households;
CREATE POLICY "insert_own_households" ON households
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "update_own_households" ON households;
CREATE POLICY "update_own_households" ON households
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "delete_own_households" ON households;
CREATE POLICY "delete_own_households" ON households
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- household_members policies
DROP POLICY IF EXISTS "select_own_memberships" ON household_members;
CREATE POLICY "select_own_memberships" ON household_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id AND h.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_membership" ON household_members;
CREATE POLICY "insert_own_membership" ON household_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_membership" ON household_members;
CREATE POLICY "delete_own_membership" ON household_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM households h
      WHERE h.id = household_members.household_id AND h.created_by = auth.uid()
    )
  );

-- items policies (membership-scoped)
DROP POLICY IF EXISTS "select_household_items" ON items;
CREATE POLICY "select_household_items" ON items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members m
      WHERE m.household_id = items.household_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_household_items" ON items;
CREATE POLICY "insert_household_items" ON items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members m
      WHERE m.household_id = items.household_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_household_items" ON items;
CREATE POLICY "update_household_items" ON items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members m
      WHERE m.household_id = items.household_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members m
      WHERE m.household_id = items.household_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_household_items" ON items;
CREATE POLICY "delete_household_items" ON items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members m
      WHERE m.household_id = items.household_id AND m.user_id = auth.uid()
    )
  );

-- Enable realtime publication for items and household_members
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE household_members;
ALTER PUBLICATION supabase_realtime ADD TABLE households;
