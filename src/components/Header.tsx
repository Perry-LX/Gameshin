import { categories } from '../data/games';
import { useLanguage } from '../i18n';

interface HeaderProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  title: string;
}

export function Header({ activeCategory, onCategoryChange, title }: HeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="pixel-header">
      <div className="header-top">
        <div className="pixel-logo">
          <span className="logo-pixel">GAMESHIN</span>
          <span className="logo-sub">GAME HUB</span>
        </div>
        <h1 className="home-hero-title">{t('home.heroTitle')}</h1>
        <p className="home-hero-lead">{t('home.heroLead')}</p>
        <div className="home-hero-actions">
          <button type="button" className="home-cta primary" onClick={() => onCategoryChange('all')}>
            {t('home.primaryCta')}
          </button>
          <button type="button" className="home-cta secondary" onClick={() => onCategoryChange('board')}>
            {t('home.secondaryCta')}
          </button>
        </div>
        <div className="home-stats" aria-label={title}>
          <div className="home-stat">
            <strong>{t('home.stat.games')}</strong>
            <span>{t('home.stat.gamesLabel')}</span>
          </div>
          <div className="home-stat">
            <strong>{t('home.stat.download')}</strong>
            <span>{t('home.stat.downloadLabel')}</span>
          </div>
          <div className="home-stat">
            <strong>{t('home.stat.languages')}</strong>
            <span>{t('home.stat.languagesLabel')}</span>
          </div>
        </div>
        <p className="header-desc">{title}</p>
      </div>

      <nav className="category-nav">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            <span className="category-icon">{cat.icon}</span>
            <span className="category-label">{t(`category.${cat.id}`)}</span>
            {activeCategory === cat.id && <span className="pixel-arrow">▶</span>}
          </button>
        ))}
      </nav>
    </header>
  );
}
