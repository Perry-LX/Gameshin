# GAMESHIN GAME HUB

A pixel-styled game navigation center — an entry portal integrating multiple mini-games.

## Tech Stack

- **React 19** + **TypeScript 6**
- **Vite 8** build tool
- **React Router v7** client-side routing (HashRouter)
- Pure CSS pixel-art theme design
- Canvas game rendering
- **i18n** — built-in internationalization (English / Chinese)

## Features

- **Pixel-style UI** — Press Start 2P pixel font, crisp borders, stepped animations
- **Steampunk palette** — deep slate background + amber accent, with grid patterns and gradient glows
- **Category filtering** — filter games by genre: All / Board / Shooting / Action / Puzzle
- **Responsive layout** — desktop, tablet, and mobile support
- **Game cards** — each card shows icon, title, description, tags, and status (active / beta / coming-soon)
- **Card sorting** — active games appear first, then beta, then coming-soon (disabled) cards last
- **Language switching** — dropdown in the homepage header to toggle between English and Chinese
- **Touch controls** — Snake and Tetris include on-screen D-pad for mobile play
- **7 built-in games + 2 external** — Snake, Tetris, Chinese Chess, Gomoku, International Chess, Pixel Jumper, RightPlace, Kitten Quest

## Built-in Games

### Snake Classic
- Classic snake gameplay
- WASD / Arrow key controls + on-screen D-pad for mobile
- Local high score persistence via localStorage
- Zoom from 50% to 200%

### Tetris Battle
- Standard 22x10 Tetris grid
- 7-bag randomizer
- NEXT preview panel
- Wall kick rotation + smooth drop animation
- On-screen D-pad controls for mobile

### Chinese Chess
- Classic Chinese Chess rendered on Canvas
- Play vs AI (Rookie / Intermediate / Expert difficulty)
- Preset endgame challenges
- Undo, restart, board skin switching (3 skins)
- AI search based on Alpha-Beta pruning

### Chinese Chess Plus
- Enhanced Chinese Chess interface reusing the same AI engine
- Supports AI duel, Player vs Player, **AI vs AI**, and Preset Challenge modes
- Move history panel (shows latest 3 records; click "View All" for a scrollable popup)
- Dropdown-based settings panel for mode, difficulty, preset, and skin
- Start / Restart buttons positioned at the top-right of the board
- Undo, restart, and cycle skin

### Gomoku
- Local two-player Gomoku (Five-in-a-Row)
- Start, restart, undo, resign
- White-first toggle and move index display

### International Chess
- Standard 8x8 chess board
- Click-to-move with capture highlighting
- Dropdown-based settings: AI side (None / White / Black / Both), move speed (1/2/4 APS), perspective (White/Black)
- Unified settings panel with restart button

### Pixel Jumper
- Horizontal pixel platformer with 18 levels
- 3 enemy types: patrol, chase, and ranged shooter
- Stomp to defeat enemies; side-contact or bullet hits = fail
- Collect/kill task objectives per stage
- Segmented map region transitions
- Best-time tracking across full run

### Kitten Quest
- Color-based deduction puzzle inspired by Minesweeper
- Find hidden kittens on a colorful N×N grid
- 300 fixed levels from 6×6 to 13×13
- Click to flag, double-click to reveal
- Opens in the current browser tab from the game hub

### RightPlace
- Position-based reasoning puzzle game
- Drag or click to swap bottles, use judgment feedback to deduce correct placement
- Multiple modes: Novice, Level (630 stages), Uniform Challenge, Multiplayer
- 4 visual themes with 13 real bottle PNG images
- Opens in the current browser tab from the game hub

## SEO / GEO Optimization

The site has been optimized for both traditional search engines (Google, Bing) and AI search engines (ChatGPT, Perplexity, Gemini, Copilot, Claude).

### Files Added

| File | Purpose |
|------|---------|
| `public/robots.txt` | Allows all major crawlers and AI bots access |
| `public/sitemap.xml` | Indexes all game pages and subdomain games |
| `public/og-image.png` | 1200×630 Open Graph image for social sharing |
| `public/humans.txt` | Site authorship and tech-stack information |

### Meta Tags (in `index.html`)
- **Title** — `Gameshin - Free Online Browser Games | Chinese Chess, Snake, Tetris & More`
- **Description** — 155-character optimized description with key game keywords
- **Keywords** — bilingual (English + Chinese) game-related keywords
- **Open Graph** — 10 tags including og:title, og:description, og:image, og:url, og:site_name
- **Twitter Cards** — summary_large_image format
- **Canonical URL** — prevents duplicate content issues
- **Hreflang** — zh-CN and x-default language tags
- **Theme Color** — matches site design (#1a1a2e)

### JSON-LD Structured Data (5 schemas)

| Schema | Type | AI Visibility Boost |
|--------|------|---------------------|
| WebSite | Site metadata + search action | Base SEO |
| Organization | Brand identity | Base SEO |
| CollectionPage + ItemList | 7 VideoGame entries with descriptions | +25% |
| FAQPage | 5 questions covering site, games, languages | **+40%** |
| BreadcrumbList | Navigation hierarchy | Base SEO |

### Dynamic Page Title
- **Homepage** — typing animation: `GAMESHIN` → ` | Board, Action, Puzzle & Shooting Games` → blinking cursor → static title
- **Game pages** — static format: `{Game Name} | Gameshin`

## Quick Start

```bash
# Install dependencies
npm install
# Start dev server
npm run dev
# Build for production
npm run build
# Preview production build
npm run preview
```

## Project Structure

```text
Gameshin/
├── public/
│   ├── favicon.svg / favicon.png     # Site icons
│   ├── og-image.png                  # Open Graph share image
│   ├── robots.txt                    # Crawler & AI bot access rules
│   ├── sitemap.xml                   # Search engine sitemap
│   ├── humans.txt                    # Site authorship info
│   └── chess/
│       ├── audio/                    # Chinese Chess / Chess Plus sound effects
│       ├── data/                     # Opening book (gambit.js)
│       └── img/                      # Board, piece, skin assets (stype_1/2/3)
├── src/
│   ├── hooks/
│   │   └── usePageTitle.ts           # Dynamic animated page title hook
│   ├── i18n/                         # Internationalization system
│   │   ├── index.tsx                 # LanguageProvider, useLanguage hook, t()
│   │   ├── en.ts                     # English translations
│   │   └── zh.ts                     # Chinese translations
│   ├── types/index.ts                # Global type definitions
│   ├── data/games.ts                 # Game data configuration (categories + status)
│   ├── games/                        # Game core logic
│   │   ├── chess/                    # Chinese Chess engine, AI, opening book, presets
│   │   ├── gobang/                   # Gomoku local two-player rules & components
│   │   ├── international-chess/      # International Chess rules & AI
│   │   └── pixel-jumper/             # Pixel Jumper physics, levels, rendering
│   ├── pages/                        # Game page components & styles
│   │   ├── SnakeGame.tsx/css
│   │   ├── TetrisGame.tsx/css
│   │   ├── ChessGame.tsx/css
│   │   ├── ChessPlusGame.tsx/css
│   │   ├── GomokuGame.tsx/css
│   │   ├── InternationalChessGame.tsx/css
│   │   └── PixelJumperGame.tsx/css
│   ├── components/                   # Shared UI components
│   │   ├── Header.tsx                # Header + category nav + language dropdown
│   │   ├── GameCard.tsx              # Game card (internal route / external link)
│   │   ├── GameList.tsx              # Card grid list
│   │   └── Footer.tsx                # Footer
│   ├── App.tsx                       # Route entry + conditional game sorting
│   ├── main.tsx                      # App bootstrap (HashRouter + LanguageProvider)
│   └── index.css                     # Global pixel-style theme
├── index.html
├── vite.config.ts                    # Vite build config
├── tsconfig.json                     # TypeScript project references
├── tsconfig.app.json                 # App TS config
├── tsconfig.node.json                # Node TS config
├── package.json
└── README.md
```

## Internationalization

The project includes a built-in i18n system supporting **English** (default) and **Chinese**.
- **Storage key**: `gameshin:language` (persisted in localStorage)
- **Toggle location**: homepage header (top-right dropdown)
- **Scope**: all static UI text across every page and component

To add a new language:
1. Create a new translation file in `src/i18n/` (e.g., `ja.ts`)
2. Import it in `src/i18n/index.tsx` and add it to the `translations` object
3. Add the language option to the `SupportedLanguage` type

## Category System

Games are organized into genre categories:

| Category | Icon | Includes |
|----------|------|----------|
| All | ⭐ | Every game |
| Board | ♜ | Chinese Chess, Chinese Chess Plus, Gomoku, International Chess |
| Shooting | 🎯 | Space Shooter |
| Action | ⚡ | Snake Classic, Pixel Jumper, Dungeon Quest, Retro Racer |
| Puzzle | 🧩 | Tetris Battle, Match Puzzle, RightPlace, Kitten Quest |

Games marked as `coming-soon` are shown as disabled placeholder cards, sorted after all active and beta games. Disabled cards display a dimmed icon + subtle diagonal pattern overlay while keeping text fully readable.

## Build & Deploy

### Build

```bash
npm run build
```

Output goes to `dist/`:

```
dist/
├── index.html
├── favicon.svg / favicon.png
├── og-image.png
├── robots.txt
├── sitemap.xml
├── humans.txt
├── assets/
│   ├── index-*.css           # Global styles
│   ├── index-*.js            # App code
│   ├── vendor-*.js           # React / React Router deps
│   └── bg-*.jpg              # Gomoku board texture
└── chess/                    # Chess static assets (auto-copied from public/)
```

### Local Preview

```bash
npm run preview
```

Vite's preview server handles SPA fallback, so all routes work normally.

### Deploy to Subdirectory

To deploy to `https://example.com/games/`, update `vite.config.ts`:

```ts
export default defineConfig({
  base: '/games/',  // your sub-path
  // ...
})
```

All asset paths (JS, CSS, images, audio, opening books) adapt automatically.

### Deploy to Static Server

This project uses **HashRouter**, so no server-side SPA fallback configuration is needed. It can be deployed directly to any static file server (nginx, Apache, GitHub Pages, Vercel, Netlify, etc.).

## Adding a New Game

Edit `src/data/games.ts` and add an entry:

```ts
{
  id: 'your-game-id',
  url: '/game/your-game',     // starts with / for internal routes
  icon: '🎮',
  status: 'active',           // active | beta | coming-soon
  color: '#ff6b1a',
  category: 'action',         // board | shooting | action | puzzle
}
```

Then add localized display text in `src/i18n/en.ts` and `src/i18n/zh.ts`:

```ts
'game.your-game-id.title': 'Your Game Title',
'game.your-game-id.description': 'Game description.',
'game.your-game-id.tags': 'Tag1,Tag2,Tag3',
```

For internal games, also register a route in `src/App.tsx`:

```tsx
<Route path="/game/your-game" element={<YourGame />} />
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint code check |
