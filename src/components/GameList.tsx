import { useLanguage } from '../i18n';
import type { GameItem } from '../types';
import { GameCard } from './GameCard';
import { GameIcon } from './Icons';

interface GameListProps {
  games: GameItem[];
  isFavorites?: boolean;
}

export function GameList({ games, isFavorites = false }: GameListProps) {
  const { t } = useLanguage();

  if (games.length === 0) {
    return (
      <div className="empty-state">
        <GameIcon id="default" className="empty-state-icon" />
        <p className="empty-text">{t(isFavorites ? 'gameList.favoriteEmpty' : 'gameList.empty')}</p>
        <p className="empty-hint">{t(isFavorites ? 'gameList.favoriteEmptyHint' : 'gameList.emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="game-grid">
      {games.map((game, index) => (
        <GameCard key={game.id} game={game} featured={index === 0 && games.length > 2} />
      ))}
    </div>
  );
}
