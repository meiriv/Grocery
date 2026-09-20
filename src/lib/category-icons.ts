import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  Beef,
  CakeSlice,
  Carrot,
  Coffee,
  Cookie,
  Croissant,
  Heart,
  Home,
  Milk,
  Package,
  Snowflake,
} from 'lucide-react';

type IconComponent = LucideIcon;

// Icons used by the built-in categories. Importing them explicitly (instead of
// pulling in the whole icon library with `import * as Icons`) keeps the client
// bundle small - it saved ~170kB of JavaScript on every page that renders a
// category.
const categoryIcons: Record<string, IconComponent> = {
  Apple,
  Beef,
  CakeSlice,
  Carrot,
  Coffee,
  Cookie,
  Croissant,
  Heart,
  Home,
  Milk,
  Package,
  Snowflake,
};

export function getCategoryIcon(iconName?: string): IconComponent | null {
  if (!iconName) return null;
  return categoryIcons[iconName] || null;
}
