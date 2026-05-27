export interface GameItem {
  id: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
  icon: string; // emoji or pixel art text
  iconVariant?: 'default' | 'seal';
  status: 'active' | 'coming-soon' | 'beta';
  color: string; // accent color for the card
}