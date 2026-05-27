import { Link } from 'react-router-dom';
import type { GameItem } from '../types';

interface GameCardProps {
  game: GameItem;
}

const statusLabels: Record<GameItem['status'], string> = {
  active: '🔥 热玩中',
  beta: '🧪 试玩版',
  'coming-soon': '⏳ 即将上线',
};

export function GameCard({ game }: GameCardProps) {
  const isDisabled = game.status === 'coming-soon';
  const isInternal = game.url.startsWith('/');

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
          <h3 className="card-title">{game.title}</h3>
          <p className="card-desc">{game.description}</p>

          <div className="card-footer">
            <div className="card-tags">
              {game.tags.map((tag) => (
                <span key={tag} className="pixel-tag">▸ {tag}</span>
              ))}
            </div>
            <span className="card-status" data-status={game.status}>
              {statusLabels[game.status]}
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
        <h3 className="card-title">{game.title}</h3>
        <p className="card-desc">{game.description}</p>

        <div className="card-footer">
          <div className="card-tags">
            {game.tags.map((tag) => (
              <span key={tag} className="pixel-tag">▸ {tag}</span>
            ))}
          </div>
          <span className="card-status" data-status={game.status}>
            {statusLabels[game.status]}
          </span>
        </div>
      </div>

      <span className="card-play-btn">▶ PLAY</span>
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
      target="_blank"
      rel="noopener noreferrer"
      className="game-card"
      style={{ '--card-accent': game.color } as React.CSSProperties}
    >
      {content}
    </a>
  );
}