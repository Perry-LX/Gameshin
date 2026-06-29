import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n';
import type { GameItem } from '../types';

interface GameCardProps {
  game: GameItem;
}

export function GameCard({ game }: GameCardProps) {
  const { t } = useLanguage();
  const isDisabled = game.status === 'coming-soon';
  const isInternal = game.url.startsWith('/');

  const title = t(`game.${game.id}.title`);
  const description = t(`game.${game.id}.description`);
  const tags = t(`game.${game.id}.tags`).split(',');
  const statusLabel = t(`status.${game.status}`);

  if (isDisabled) {
    return (
      <div
        className="game-card disabled"
        style={{ '--card-accent': game.color } as React.CSSProperties}
      >
        <div className="pixel-corners">
          <span className="pixel-corner tl" />
          <span className="pixel-corner tr" />
          <span className="pixel-corner bl" />
          <span className="pixel-corner br" />
        </div>

        <div className="card-icon-wrapper">
          <span className={`card-icon ${game.iconVariant === 'seal' ? 'card-icon-seal' : ''}`}>{game.icon}</span>
        </div>

        <div className="card-body">
          <h3 className="card-title">{title}</h3>
          <p className="card-desc">{description}</p>

          <div className="card-footer">
            <div className="card-tags">
              {tags.map((tag) => (
                <span key={tag} className="pixel-tag">▸ {tag}</span>
              ))}
            </div>
            <span className="card-status" data-status={game.status}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <>
      <div className="pixel-corners">
        <span className="pixel-corner tl" />
        <span className="pixel-corner tr" />
        <span className="pixel-corner bl" />
        <span className="pixel-corner br" />
      </div>

      <div className="card-icon-wrapper">
        <span className={`card-icon ${game.iconVariant === 'seal' ? 'card-icon-seal' : ''}`}>{game.icon}</span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-desc">{description}</p>

        <div className="card-footer">
          <div className="card-tags">
            {tags.map((tag) => (
              <span key={tag} className="pixel-tag">▸ {tag}</span>
            ))}
          </div>
          <span className="card-status" data-status={game.status}>
            {statusLabel}
          </span>
        </div>
      </div>

      <span className="card-play-btn">{t('card.play')}</span>
    </>
  );

  if (isInternal) {
    return (
      <Link
        to={game.url}
        className="game-card"
        style={{ '--card-accent': game.color } as React.CSSProperties}
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={game.url}
      target={game.id === 'rightplace' || game.id === 'kitten-quest' ? '_self' : '_blank'}
      rel="noopener noreferrer"
      className="game-card"
      style={{ '--card-accent': game.color } as React.CSSProperties}
    >
      {content}
    </a>
  );
}
