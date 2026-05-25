import type { GameItem } from '../types';
import { GameCard } from './GameCard';

interface GameListProps {
  games: GameItem[];
}

export function GameList({ games }: GameListProps) {
  if (games.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-pixel-art">
          <span>◢</span><span>■</span><span>◤</span>
        </div>
        <p className="empty-text">没有找到匹配的游戏</p>
        <p className="empty-hint">试试其他分类标签</p>
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