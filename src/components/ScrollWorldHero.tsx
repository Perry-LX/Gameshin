import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n';
import { ArrowRightIcon } from './Icons';
import { trackEvent } from '../analytics';

interface ScrollWorldHeroProps {
  onExplore: (category: string) => void;
}

const sceneIds = ['idea', 'strategy', 'puzzle', 'arcade', 'plaza'] as const;
const sceneImages = [
  '/scroll-world/stills/01-idea-portal.webp',
  '/scroll-world/stills/02-strategy-arena.webp',
  '/scroll-world/stills/03-puzzle-workshop.webp',
  '/scroll-world/stills/04-arcade-runway.webp',
  '/scroll-world/stills/05-game-plaza.webp',
] as const;
const sceneHdImages = [
  '/scroll-world/stills/01-idea-portal-hd.webp',
  '/scroll-world/stills/02-strategy-arena-hd.webp',
  '/scroll-world/stills/03-puzzle-workshop-hd.webp',
  '/scroll-world/stills/04-arcade-runway-hd.webp',
  '/scroll-world/stills/05-game-plaza-hd.webp',
] as const;
const mobileSceneImages = [
  '/scroll-world/stills/01-idea-portal-mobile.webp',
  '/scroll-world/stills/02-strategy-arena-mobile.webp',
  '/scroll-world/stills/03-puzzle-workshop-mobile.webp',
  '/scroll-world/stills/04-arcade-runway-mobile.webp',
  '/scroll-world/stills/05-game-plaza-mobile.webp',
] as const;
const mobileSceneHdImages = [
  '/scroll-world/stills/01-idea-portal-mobile-hd.webp',
  '/scroll-world/stills/02-strategy-arena-mobile-hd.webp',
  '/scroll-world/stills/03-puzzle-workshop-mobile-hd.webp',
  '/scroll-world/stills/04-arcade-runway-mobile-hd.webp',
  '/scroll-world/stills/05-game-plaza-mobile-hd.webp',
] as const;

export function ScrollWorldHero({ onExplore }: ScrollWorldHeroProps) {
  const { t, lang } = useLanguage();
  const rootRef = useRef<HTMLElement>(null);
  const mediaRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeScene, setActiveScene] = useState(0);
  const [loadedScenes, setLoadedScenes] = useState<ReadonlySet<number>>(() => new Set([0]));

  const scenes = sceneIds.map((id, index) => ({
    id,
    image: sceneImages[index],
    hdImage: sceneHdImages[index],
    mobileImage: mobileSceneImages[index],
    mobileHdImage: mobileSceneHdImages[index],
    eyebrow: t(`world.${id}.eyebrow`),
    title: t(`world.${id}.title`),
    body: t(`world.${id}.body`),
  }));

  useLayoutEffect(() => {
    let frame = 0;
    let previousScene = -1;

    const update = () => {
      frame = 0;
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const travel = Math.max(1, root.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const sceneProgress = progress * (scenes.length - 1);
      const nextScene = Math.min(scenes.length - 1, Math.round(sceneProgress));

      if (nextScene !== previousScene) {
        previousScene = nextScene;
        setActiveScene(nextScene);
      }

      // Do not compete with the first hero image for bandwidth. Once the user
      // starts moving through the world, load only the current and next scene.
      if (sceneProgress > 0.04) {
        const current = Math.min(scenes.length - 1, Math.floor(sceneProgress));
        const next = Math.min(scenes.length - 1, current + 1);
        setLoadedScenes((loaded) => {
          if (loaded.has(current) && loaded.has(next)) return loaded;
          const updated = new Set(loaded);
          updated.add(current);
          updated.add(next);
          return updated;
        });
      }

      mediaRefs.current.forEach((element, index) => {
        if (!element) return;
        const distance = sceneProgress - index;
        // Keep adjacent frames at a combined opacity of ~1 during handoff so
        // the scene change reads as one continuous glide instead of a dark flash.
        const opacity = Math.max(0, 1 - Math.abs(distance));
        const scale = 1.025 + Math.max(-0.035, Math.min(0.055, distance * 0.045));
        const translateY = Math.max(-20, Math.min(20, distance * -14));
        element.style.opacity = opacity.toFixed(3);
        element.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      });
    };

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scenes.length]);

  useEffect(() => {
    // Warm the second scene only after the critical render has had time to
    // settle, keeping a smooth first transition without delaying LCP.
    const warmNextScene = () => setLoadedScenes((loaded) => {
      if (loaded.has(1)) return loaded;
      const updated = new Set(loaded);
      updated.add(1);
      return updated;
    });
    let timeout = 0;
    const scheduleWarmup = () => {
      timeout = globalThis.setTimeout(warmNextScene, 1500);
    };

    if (document.readyState === 'complete') scheduleWarmup();
    else window.addEventListener('load', scheduleWarmup, { once: true });

    return () => {
      window.removeEventListener('load', scheduleWarmup);
      globalThis.clearTimeout(timeout);
    };
  }, []);

  const exploreGames = (category: string, placement: 'hero_primary' | 'hero_secondary' | 'hero_final') => {
    void trackEvent('hero_cta_click', { locale: lang, category, placement, destination: 'catalog' });
    onExplore(category);
    requestAnimationFrame(() => {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      document.getElementById('game-collection')?.scrollIntoView({ behavior, block: 'start' });
    });
  };

  return (
    <section ref={rootRef} className="scroll-world" aria-label={t('world.label')}>
      <div className="scroll-world-stage">
        <WorldBrand />
        <div className="scroll-world-media-stack" aria-hidden="true">
          {scenes.map((scene, index) => (
            <figure
              key={scene.id}
              ref={(element) => { mediaRefs.current[index] = element; }}
              className="scroll-world-media"
              style={{ opacity: index === 0 ? 1 : 0 }}
            >
              {loadedScenes.has(index) && (
                <picture>
                  <source
                    media="(max-width: 760px)"
                    srcSet={`${scene.mobileImage} 768w, ${scene.mobileHdImage} 1536w`}
                    sizes="100vw"
                  />
                  <img
                    src={scene.image}
                    srcSet={`${scene.image} 1536w, ${scene.hdImage} 3072w`}
                    sizes="100vw"
                    alt=""
                    width="1536"
                    height="1024"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding={index === 0 ? 'sync' : 'async'}
                    draggable={false}
                  />
                </picture>
              )}
            </figure>
          ))}
        </div>

        <div className="scroll-world-vignette" aria-hidden="true" />

        <div className="scroll-world-copy-stack">
          {scenes.map((scene, index) => {
            const active = activeScene === index;
            return (
              <article key={scene.id} className={`scroll-world-copy${active ? ' is-active' : ''}`} aria-hidden={!active}>
                <span className="scroll-world-eyebrow">{scene.eyebrow}</span>
                {index === 0 ? <h1>{scene.title}</h1> : <h2>{scene.title}</h2>}
                <p>{scene.body}</p>
                {index === 0 && (
                  <div className="scroll-world-actions">
                    <button type="button" className="scroll-world-cta" tabIndex={active ? 0 : -1} onClick={() => exploreGames('all', 'hero_primary')}>
                      {t('home.primaryCta')}<ArrowRightIcon />
                    </button>
                    <button type="button" className="scroll-world-cta scroll-world-cta--secondary" tabIndex={active ? 0 : -1} onClick={() => exploreGames('board', 'hero_secondary')}>
                      {t('home.secondaryCta')}
                    </button>
                  </div>
                )}
                {index === scenes.length - 1 && (
                  <button type="button" className="scroll-world-cta" tabIndex={active ? 0 : -1} onClick={() => exploreGames('all', 'hero_final')}>
                    {t('world.finalCta')}<ArrowRightIcon />
                  </button>
                )}
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}

function WorldBrand() {
  const { t } = useLanguage();

  return (
    <div className="scroll-world-brand" aria-label="Gameshin Vibe Coding Game Mix">
      <span className="scroll-world-brand-mark" aria-hidden="true">
        <img src="/brand/gameshin-mark.webp" alt="" width="64" height="64" draggable={false} />
      </span>
      <span><strong>GAMESHIN</strong><small>{t('brand.subtitle')}</small></span>
    </div>
  );
}
