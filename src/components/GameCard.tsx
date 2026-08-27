import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n';
import type { GameItem } from '../types';
import { ArrowRightIcon, BookmarkIcon, GameIcon, ShareIcon } from './Icons';
import { trackEvent } from '../analytics';

interface GameCardProps {
  game: GameItem;
  featured?: boolean;
}

export function GameCard({ game, featured = false }: GameCardProps) {
  const { t, pathFor, lang } = useLanguage();
  const isDisabled = game.status === 'coming-soon';
  const isInternal = game.url.startsWith('/');
  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gameshin:favorites') ?? '[]').includes(game.id);
    } catch {
      return false;
    }
  });

  const title = t(`game.${game.id}.title`);
  const description = t(`game.${game.id}.description`);
  const tags = t(`game.${game.id}.tags`).split(',').map((tag) => tag.trim()).filter(Boolean);
  const statusLabel = t(`status.${game.status}`);
  const trackCardClick = (placement: 'card_body' | 'card_play') => {
    void trackEvent('game_card_click', {
      game_id: game.id,
      category: game.category ?? 'unknown',
      locale: lang,
      destination_type: isInternal ? 'internal' : 'external',
      placement,
    });
  };

  const toggleFavorite = () => {
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    try {
      const favorites = new Set<string>(JSON.parse(localStorage.getItem('gameshin:favorites') ?? '[]'));
      if (nextFavorite) favorites.add(game.id);
      else favorites.delete(game.id);
      localStorage.setItem('gameshin:favorites', JSON.stringify([...favorites]));
    } catch {
      // The visual state remains useful if browser storage is unavailable.
    }
    window.dispatchEvent(new Event('gameshin:favorites-changed'));

    void trackEvent(nextFavorite ? 'favorite_added' : 'favorite_removed', {
      game_id: game.id,
      category: game.category ?? 'unknown',
      locale: lang,
      source: 'game_card',
    });
  };

  const shareGame = async () => {
    const url = isInternal ? `${window.location.origin}${pathFor(game.url)}` : game.url;
    const properties = { game_id: game.id, category: game.category ?? 'unknown', locale: lang, source: 'game_card' };
    const shareData = { title, text: description, url };

    try {
      if (navigator.share) {
        void trackEvent('share_invoked', { ...properties, method: 'native_share' });
        await navigator.share(shareData);
        void trackEvent('share_completed', { ...properties, method: 'native_share' });
      } else {
        await navigator.clipboard.writeText(url);
        void trackEvent('share_invoked', { ...properties, method: 'copy_link' });
        void trackEvent('share_completed', { ...properties, method: 'copy_link' });
      }
    } catch {
      // A user dismissing the native share sheet is not a failed game action.
      void trackEvent('share_dismissed', properties);
    }
  };

  const iconContent = game.iconImage ? (
    <img className="card-icon card-icon-image" src={game.iconImage} alt="" aria-hidden="true" width="64" height="64" loading="lazy" />
  ) : (
    <GameIcon id={game.id} className="card-icon card-icon-vector" />
  );

  const content = (
    <>
      <div className="card-topline">
        <div className="card-icon-wrapper">
          {iconContent}
        </div>
        <span className="card-status" data-status={game.status}>
          {statusLabel}
        </span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-desc">{description}</p>
        <div className="card-tags">
          {tags.map((tag) => (
            <span key={tag} className="pixel-tag">{tag}</span>
          ))}
        </div>
      </div>

    </>
  );

  const renderGameLink = (children: ReactNode, placement: 'card_body' | 'card_play', className?: string) => {
    const commonProps = {
      className,
      onClick: () => trackCardClick(placement),
    };

    if (isInternal) return <Link to={pathFor(game.url)} {...commonProps}>{children}</Link>;

    return (
      <a
        href={game.url}
        target={game.id === 'rightplace' || game.id === 'kitten-quest' || game.id === 'cat-painter' || game.id === 'smack-the-sprout' ? '_self' : '_blank'}
        rel="noopener noreferrer"
        {...commonProps}
      >
        {children}
      </a>
    );
  };

  if (isDisabled) {
    return (
      <div
        className={`game-card disabled${featured ? ' featured' : ''}`}
        style={{ '--card-accent': game.color } as React.CSSProperties}
        aria-disabled="true"
      >
        {content}
      </div>
    );
  }

  return (
    <article
      className={`game-card${featured ? ' featured' : ''}`}
      style={{ '--card-accent': game.color } as React.CSSProperties}
    >
      {renderGameLink(content, 'card_body', 'game-card-content-link')}
      <div className="card-footer">
        <div className="card-utility-actions">
          <button
            type="button"
            className={`card-utility-btn${isFavorite ? ' is-active' : ''}`}
            onClick={toggleFavorite}
            aria-label={isFavorite ? t('card.removeFavorite') : t('card.addFavorite')}
            aria-pressed={isFavorite}
            title={isFavorite ? t('card.removeFavorite') : t('card.addFavorite')}
          >
            <BookmarkIcon />
          </button>
          <button type="button" className="card-utility-btn" onClick={() => void shareGame()} aria-label={t('card.share')} title={t('card.share')}>
            <ShareIcon />
          </button>
        </div>
        {renderGameLink(
          <><span>{t('card.play')}</span><span className="card-play-icon-wrap" aria-hidden="true"><ArrowRightIcon className="card-play-icon" /></span></>,
          'card_play',
          'card-play-btn',
        )}
      </div>
    </article>
  );
}
