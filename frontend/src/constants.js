import {
  BookOpen,
  Calculator,
  Laptop,
  Bike,
  BedDouble,
  Armchair,
  Trophy,
  PencilRuler,
  Package,
} from 'lucide-react';

export const APP_NAME = 'CAMPUS CART';
export const TAGLINE = 'Buy Smart. Sell Easy. Campus Connected.';

export const CATEGORIES = [
  { name: 'Books & Study Materials', icon: BookOpen, short: 'Books & Notes' },
  { name: 'Electronics', icon: Laptop, short: 'Electronics' },
  { name: 'Calculators', icon: Calculator, short: 'Calculators' },
  { name: 'Bicycles', icon: Bike, short: 'Bicycles' },
  { name: 'Hostel Essentials', icon: BedDouble, short: 'Hostel' },
  { name: 'Furniture', icon: Armchair, short: 'Furniture' },
  { name: 'Sports Equipment', icon: Trophy, short: 'Sports' },
  { name: 'Stationery', icon: PencilRuler, short: 'Stationery' },
  { name: 'Others', icon: Package, short: 'Others' },
];

export const categoryIcon = (name) => CATEGORIES.find((c) => c.name === name)?.icon || Package;

export const CONDITIONS = ['Brand New', 'Like New', 'Good', 'Fair'];

export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Postgraduate'];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'popular', label: 'Most viewed' },
];

export const CONDITION_TONE = {
  'Brand New': 'success',
  'Like New': 'indigo',
  Good: 'violet',
  Fair: 'amber',
};

export const STATUS_TONE = {
  available: 'success',
  sold: 'slate',
  removed: 'danger',
};
