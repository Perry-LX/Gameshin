import { useEffect } from 'react';
import './SmackTheSproutGame.css';

/** Godot export intentionally owns the full viewport while this route is open. */
export function SmackTheSproutGame() {
  useEffect(() => {
    document.body.classList.add('godot-game-open');
    return () => document.body.classList.remove('godot-game-open');
  }, []);

  return (
    <main className="smack-the-sprout-page" aria-label="Smack The Sprout game">
      <iframe
        className="smack-the-sprout-frame"
        src="/games/smack-the-sprout/index.html"
        title="Smack The Sprout action multiplayer game"
        allow="autoplay; fullscreen; gamepad"
        allowFullScreen
        onLoad={(event) => event.currentTarget.focus()}
      />
    </main>
  );
}
