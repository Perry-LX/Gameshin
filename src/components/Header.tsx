import { categories } from '../data/games';

interface HeaderProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  title: string;
}

export function Header({ activeCategory, onCategoryChange, title }: HeaderProps) {
  return (
    <header className="pixel-header">
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
            <span className="category-label">{cat.label}</span>
            {activeCategory === cat.id && <span className="pixel-arrow">▶</span>}
          </button>
        ))}
      </nav>
    </header>
  );
}