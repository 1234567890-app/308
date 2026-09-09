import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase, type Household, type Item, type Category, type ItemStatus } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface ItemInput {
  name: string;
  category: Category;
  status: ItemStatus;
  note?: string | null;
  icon?: string | null;
}

interface HouseholdContextValue {
  household: Household | null;
  items: Item[];
  loading: boolean;
  error: string | null;
  createHousehold: (name: string, pin: string) => Promise<{ error: string | null }>;
  joinHousehold: (pin: string) => Promise<{ error: string | null }>;
  addItem: (input: ItemInput) => Promise<void>;
  updateItemStatus: (id: string, status: ItemStatus) => Promise<void>;
  updateItem: (id: string, patch: Partial<Pick<Item, 'name' | 'note' | 'icon' | 'category' | 'status'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  finishShopping: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextValue | undefined>(undefined);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHousehold = useCallback(async () => {
    if (!user) {
      setHousehold(null);
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: membership, error: mErr } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (mErr) throw mErr;
      if (!membership) {
        setHousehold(null);
        setItems([]);
        setLoading(false);
        return;
      }

      const { data: hh, error: hErr } = await supabase
        .from('households')
        .select('*')
        .eq('id', membership.household_id)
        .maybeSingle();

      if (hErr) throw hErr;
      if (!hh) {
        setHousehold(null);
        setItems([]);
        setLoading(false);
        return;
      }

      setHousehold(hh as Household);
      await loadItems(hh.id);
    } catch (err) {
      console.error('loadHousehold error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadItems = useCallback(async (householdId: string) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setItems((data ?? []) as Item[]);
    } catch (err) {
      console.error('loadItems error:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    loadHousehold();
  }, [loadHousehold]);

  // Realtime subscription
  useEffect(() => {
    if (!household) return;
    const channel = supabase
      .channel(`items:${household.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `household_id=eq.${household.id}` },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === 'INSERT') {
              const newItem = payload.new as Item;
              if (prev.some((it) => it.id === newItem.id)) return prev;
              return [...prev, newItem];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((it) => (it.id === (payload.new as Item).id ? (payload.new as Item) : it));
            }
            if (payload.eventType === 'DELETE') {
              const oldId = (payload.old as Item).id;
              return prev.filter((it) => it.id !== oldId);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [household]);

  const seedHousehold = async (householdId: string, userId: string) => {
    const seeds: { name: string; category: Category; status: ItemStatus; icon: string | null }[] = [
      { name: 'Помидоры', category: 'fresh', status: 'in_stock', icon: 'Carrot' },
      { name: 'Огурцы', category: 'fresh', status: 'in_stock', icon: 'Carrot' },
      { name: 'Молоко', category: 'fresh', status: 'in_stock', icon: 'Milk' },
      { name: 'Стиральный порошок', category: 'household', status: 'in_stock', icon: 'SprayCan' },
      { name: 'Средство для посуды', category: 'household', status: 'in_stock', icon: 'SprayCan' },
      { name: 'Сыр', category: 'fresh', status: 'to_buy', icon: 'Milk' },
      { name: 'Зубная паста', category: 'household', status: 'to_buy', icon: 'SprayCan' },
      { name: 'Пылесос', category: 'long_term', status: 'to_buy', icon: 'Package' },
    ];
    try {
      const { error } = await supabase.from('items').insert(
        seeds.map((s) => ({
          household_id: householdId,
          name: s.name,
          category: s.category,
          status: s.status,
          icon: s.icon,
          created_by: userId,
        })),
      );
      if (error) throw error;
    } catch (err) {
      console.error('seedHousehold error:', err);
    }
  };

  const createHousehold = useCallback(
    async (name: string, pin: string) => {
      if (!user) return { error: 'Not authenticated' };
      try {
        const { data: hh, error: hErr } = await supabase
          .from('households')
          .insert({ name, pin, created_by: user.id })
          .select('*')
          .single();
        if (hErr) throw hErr;
        const { error: memErr } = await supabase
          .from('household_members')
          .insert({ household_id: hh.id, user_id: user.id });
        if (memErr) throw memErr;
        setHousehold(hh as Household);
        await seedHousehold(hh.id, user.id);
        await loadItems(hh.id);
        return { error: null };
      } catch (err) {
        console.error('createHousehold error:', err);
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
    [user, loadItems],
  );

  const joinHousehold = useCallback(
    async (pin: string) => {
      if (!user) return { error: 'Not authenticated' };
      try {
        const { data: hh, error: hErr } = await supabase
          .from('households')
          .select('*')
          .eq('pin', pin)
          .maybeSingle();
        if (hErr) throw hErr;
        if (!hh) return { error: 'Семейная корзина с таким PIN не найдена' };
        const { error: memErr } = await supabase
          .from('household_members')
          .insert({ household_id: hh.id, user_id: user.id });
        if (memErr && memErr.code !== '23505') throw memErr;
        setHousehold(hh as Household);
        await loadItems(hh.id);
        return { error: null };
      } catch (err) {
        console.error('joinHousehold error:', err);
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
    [user, loadItems],
  );

  const addItem = useCallback(
    async (input: ItemInput) => {
      if (!household || !user) return;
      const tempId = `temp-${Date.now()}`;
      const optimistic: Item = {
        id: tempId,
        household_id: household.id,
        name: input.name,
        category: input.category,
        status: input.status,
        note: input.note ?? null,
        icon: input.icon ?? null,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        bought_at: null,
      };
      setItems((prev) => [...prev, optimistic]);
      try {
        const { data, error } = await supabase
          .from('items')
          .insert({
            household_id: household.id,
            name: input.name,
            category: input.category,
            status: input.status,
            note: input.note ?? null,
            icon: input.icon ?? null,
            created_by: user.id,
          })
          .select('*')
          .single();
        if (error) throw error;
        setItems((prev) => prev.map((it) => (it.id === tempId ? (data as Item) : it)));
      } catch (err) {
        console.error('addItem error (RLS may be blocking):', err);
        setItems((prev) => prev.filter((it) => it.id !== tempId));
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [household, user],
  );

  const updateItemStatus = useCallback(async (id: string, status: ItemStatus) => {
    const now = new Date().toISOString();
    const patch =
      status === 'in_stock'
        ? { status, bought_at: now }
        : { status, bought_at: null };
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    try {
      const { error } = await supabase.from('items').update(patch).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('updateItemStatus error (RLS may be blocking):', err);
      setError(err instanceof Error ? err.message : String(err));
      setItems((prev) => {
        const fresh = prev.find((it) => it.id === id);
        if (!fresh) return prev;
        return prev.map((it) => (it.id === id ? { ...it, status: fresh.status, bought_at: fresh.bought_at } : it));
      });
    }
  }, []);

  const updateItem = useCallback(
    async (id: string, patch: Partial<Pick<Item, 'name' | 'note' | 'icon' | 'category' | 'status'>>) => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
      try {
        const { error } = await supabase.from('items').update(patch).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('updateItem error (RLS may be blocking):', err);
        setError(err instanceof Error ? err.message : String(err));
        setItems((prev) => {
          const fresh = prev.find((it) => it.id === id);
          if (!fresh) return prev;
          return prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
        });
      }
    },
    [],
  );

  const deleteItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    try {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('deleteItem error (RLS may be blocking):', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const finishShopping = useCallback(async () => {
    if (!household) return;
    const now = new Date().toISOString();
    const boughtIds = items.filter((i) => i.status === 'bought_today').map((i) => i.id);
    if (boughtIds.length === 0) return;
    setItems((prev) =>
      prev.map((it) =>
        it.status === 'bought_today' ? { ...it, status: 'in_stock' as ItemStatus, bought_at: now } : it,
      ),
    );
    try {
      const { error } = await supabase
        .from('items')
        .update({ status: 'in_stock', bought_at: now })
        .in('id', boughtIds);
      if (error) throw error;
    } catch (err) {
      console.error('finishShopping error (RLS may be blocking):', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [household, items]);

  const value = useMemo<HouseholdContextValue>(
    () => ({
      household,
      items,
      loading,
      error,
      createHousehold,
      joinHousehold,
      addItem,
      updateItemStatus,
      updateItem,
      deleteItem,
      finishShopping,
    }),
    [household, items, loading, error, createHousehold, joinHousehold, addItem, updateItemStatus, updateItem, deleteItem, finishShopping],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
  return ctx;
}
