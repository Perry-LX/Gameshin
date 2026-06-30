export interface GameItem {
  id: string;
  url: string;
  icon: string; // emoji or pixel art text
  iconImage?: string; // image path for custom icons (overrides icon)
  iconVariant?: 'default' | 'seal';
  status: 'active' | 'coming-soon' | 'beta';
  color: string; // accent color for the card
  category?: 'board' | 'shooting' | 'action' | 'puzzle'; // genre category
}
