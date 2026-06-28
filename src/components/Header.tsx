import { categories } from '../data/games';
import { useLanguage, type SupportedLanguage } from '../i18n';

interface HeaderProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  title: string;
}

export function Header({ activeCategory, onCategoryChange, title }: HeaderProps) {
  const { lang, setLang, t } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(e.target.value as SupportedLanguage);
  };

  return (
    <header className="pixel-header">
      <div className="lang-dropdown-wrap">
        <select
          className="lang-dropdown"
          value={lang}
          onChange={handleLanguageChange}
          aria-label="Language"
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </div>
      <div className="header-top">
        <div className="pixel-logo">
          <span className="logo-pixel">GAMESHIN</span>
          <span className="logo-sub">GAME HUB</span>
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
