import { categories } from '../data/games';
import { useLanguage } from '../i18n';
import { CategoryIcon } from './Icons';

interface HeaderProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function Header({ activeCategory, onCategoryChange }: HeaderProps) {
  const { t } = useLanguage();

  return (
    <header id="game-collection" className="catalog-filter-header">
      <nav className="category-nav" aria-label={t('home.catalogTitle')}>
        {categories.map((cat) => (
          <button
            type="button"
            key={cat.id}
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat.id)}
            aria-pressed={activeCategory === cat.id}
          >
            <CategoryIcon id={cat.id} className="category-icon" />
            <span className="category-label">{t(`category.${cat.id}`)}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}
