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

  return (
    <a
      href={isDisabled ? undefined : game.url}
      target={isDisabled ? undefined : '_blank'}
      rel={isDisabled ? undefined : 'noopener noreferrer'}
      className={`game-card ${isDisabled ? 'disabled' : ''}`}
      style={{ '--card-accent': game.color } as React.CSSProperties}
    >
      {/* Pixel corner decorations */}
      <div className="pixel-corners">
        <span className="pixel-corner tl" />
        <span className="pixel-corner tr" />
        <span className="pixel-corner bl" />
        <span className="pixel-corner br" />
      </div>

      <div className="card-icon-wrapper">
        <span className="card-icon">{game.icon}</span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{game.title}</h3>
        <p className="card-desc">{game.description}</p>

        <div className="card-footer">
          <div className="card-tags">
            {game.tags.map((tag) => (
              <span key={tag} className="pixel-tag">
                ▸ {tag}
              </span>
            ))}
          </div>
          <span className="card-status" data-status={game.status}>
            {statusLabels[game.status]}
          </span>
        </div>
      </div>

      {!isDisabled && <span className="card-play-btn">▶ PLAY</span>}
    </a>
  );
}