import { useLanguage } from '../i18n';
import type { GameItem } from '../types';
import { GameCard } from './GameCard';

interface GameListProps {
  games: GameItem[];
}

export function GameList({ games }: GameListProps) {
  const { t } = useLanguage();

  if (games.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-pixel-art">
          <span>◢</span><span>■</span><span>◤</span>
        </div>
        <p className="empty-text">{t('gameList.empty')}</p>
        <p className="empty-hint">{t('gameList.emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="game-grid">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
