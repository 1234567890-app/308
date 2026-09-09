import {
  Carrot, Apple, Milk, Beef, SprayCan, Package, Wine, Fish, Egg, Cookie,
  Coffee, Pizza, Sandwich, IceCream, Citrus, Cherry, Banana, Grape,
  type LucideIcon,
} from 'lucide-react';
import type { Category } from '@/lib/supabase';

export const ICON_MAP: Record<string, LucideIcon> = {
  Carrot,
  Apple,
  Milk,
  Beef,
  SprayCan,
  Package,
  Wine,
  Fish,
  Egg,
  Cookie,
  Coffee,
  Pizza,
  Sandwich,
  IceCream,
  Citrus,
  Cherry,
  Banana,
  Grape,
};

export const ICON_CHOICES = [
  { name: 'Carrot', label: 'Овощи' },
  { name: 'Apple', label: 'Фрукты' },
  { name: 'Milk', label: 'Молоко' },
  { name: 'Wine', label: 'Напитки' },
  { name: 'Beef', label: 'Мясо' },
  { name: 'Fish', label: 'Рыба' },
  { name: 'Egg', label: 'Яйца' },
  { name: 'Cookie', label: 'Сладкое' },
  { name: 'Coffee', label: 'Кофе' },
  { name: 'Pizza', label: 'Готовая еда' },
  { name: 'Sandwich', label: 'Хлеб' },
  { name: 'IceCream', label: 'Мороженое' },
  { name: 'Citrus', label: 'Цитрусы' },
  { name: 'Cherry', label: 'Ягоды' },
  { name: 'Banana', label: 'Бананы' },
  { name: 'Grape', label: 'Виноград' },
  { name: 'SprayCan', label: 'Химия' },
  { name: 'Package', label: 'Прочее' },
];

export const CATEGORY_DEFAULT_ICON: Record<Category, string> = {
  fresh: 'Carrot',
  household: 'SprayCan',
  long_term: 'Package',
};

export const CATEGORY_META: Record<Category, { label: string; defaultIcon: string; color: string; bg: string }> = {
  fresh: { label: 'Свежие продукты', defaultIcon: 'Carrot', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  household: { label: 'Бытовая химия', defaultIcon: 'SprayCan', color: 'text-blue-600', bg: 'bg-blue-100' },
  long_term: { label: 'Долгосрочные цели', defaultIcon: 'Package', color: 'text-amber-600', bg: 'bg-amber-100' },
};

export function getItemIcon(item: { icon?: string | null; category: Category }): LucideIcon {
  const name = item.icon ?? CATEGORY_DEFAULT_ICON[item.category];
  return ICON_MAP[name] ?? Package;
}

export function getItemIconColor(item: { icon?: string | null; category: Category }): { color: string; bg: string } {
  return {
    color: CATEGORY_META[item.category].color,
    bg: CATEGORY_META[item.category].bg,
  };
}

const KEYWORD_MAP: { keywords: string[]; icon: string }[] = [
  { keywords: ['молок', 'кефир', 'йогурт', 'сметан', 'творог', 'сыр', 'cheese', 'milk', 'yogurt'], icon: 'Milk' },
  { keywords: ['помидор', 'томат', 'огурец', 'лук', 'чеснок', 'морков', 'картоф', 'капуст', 'перец', 'салат', 'зелень', 'vegetable', 'carrot', 'tomato'], icon: 'Carrot' },
  { keywords: ['яблок', 'банан', 'апельсин', 'мандарин', 'груш', 'виноград', 'лимон', 'киви', 'ананас', 'персик', 'fruit', 'apple', 'banana'], icon: 'Apple' },
  { keywords: ['хлеб', 'батон', 'булк', 'багет', 'лаваш', 'пирож', 'торт', 'печень', 'бисквит', 'bread', 'cake', 'cookie'], icon: 'Sandwich' },
  { keywords: ['мяс', 'куриц', 'говядин', 'свинин', 'баранин', 'колбас', 'сосиск', 'бекон', 'meat', 'beef', 'chicken'], icon: 'Beef' },
  { keywords: ['рыб', 'селёдк', 'лосос', 'тунец', 'креветк', 'fish', 'salmon', 'shrimp'], icon: 'Fish' },
  { keywords: ['яиц', 'яйцо', 'egg'], icon: 'Egg' },
  { keywords: ['вин', 'пив', 'вод', 'сок', 'напиток', 'лимонад', 'чай', 'coffee', 'wine', 'beer', 'juice', 'drink'], icon: 'Wine' },
  { keywords: ['кофе', 'капучино', 'латте', 'эспрессо', 'coffee'], icon: 'Coffee' },
  { keywords: ['шоколад', 'конфет', 'печень', 'сахар', 'сладост', 'десерт', 'chocolate', 'candy', 'sweet', 'dessert'], icon: 'Cookie' },
  { keywords: ['порошок', 'мыл', 'средств', 'чист', 'стираль', 'посуд', 'уборк', 'химия', 'detergent', 'soap', 'clean'], icon: 'SprayCan' },
  { keywords: ['паст', 'щётк', 'шампун', 'гель', 'космет', 'гигиен', 'toothpaste', 'shampoo', 'hygiene'], icon: 'SprayCan' },
  { keywords: ['пылесос', 'телевизор', 'холодильник', 'стиральн', 'машин', 'техник', 'vacuum', 'tv', 'appliance'], icon: 'Package' },
  { keywords: ['пицц', 'бургер', 'суши', 'ролл', 'фастфуд', 'готов', 'pizza', 'burger'], icon: 'Pizza' },
  { keywords: ['морожен', 'пломбир', 'ice cream'], icon: 'IceCream' },
  { keywords: ['ягод', 'клубник', 'малин', 'черник', 'смородин', 'berry', 'strawberry'], icon: 'Cherry' },
  { keywords: ['цитрус', 'лимон', 'апельсин', 'грейпфрут', 'citrus', 'orange'], icon: 'Citrus' },
  { keywords: ['виноград', 'грозд', 'grape'], icon: 'Grape' },
  { keywords: ['банан', 'banana'], icon: 'Banana' },
];

export function autoPickIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.icon;
    }
  }
  return 'Package';
}
