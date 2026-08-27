import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function IconBase({ title, children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} {...props}>
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return <IconBase {...props}><path d="M5 12h14M13 6l6 6-6 6" /></IconBase>;
}

export function BookmarkIcon(props: IconProps) {
  return <IconBase {...props}><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.6L6 21z" /></IconBase>;
}

export function ShareIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></IconBase>;
}

export function CategoryIcon({ id, ...props }: IconProps & { id: string }) {
  switch (id) {
    case 'favorites':
      return <IconBase {...props}><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.6L6 21z" /></IconBase>;
    case 'board':
      return <IconBase {...props}><path d="M5 4h14v16H5zM5 9h14M5 15h14M10 4v16M15 4v16" /><circle cx="7.5" cy="6.5" r="1" fill="currentColor" stroke="none" /><circle cx="17.5" cy="17.5" r="1" fill="currentColor" stroke="none" /></IconBase>;
    case 'action':
      return <IconBase {...props}><path d="m13 2-8 12h6l-1 8 9-13h-6z" /></IconBase>;
    case 'puzzle':
      return <IconBase {...props}><path d="M8 3h4v3a2 2 0 1 0 4 0V3h5v5h-3a2 2 0 1 0 0 4h3v5h-5v3H8v-3H3v-5h3a2 2 0 1 0 0-4H3V3z" /></IconBase>;
    case 'cozy':
      return <IconBase {...props}><path d="M5 8h12v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5zM17 10h2a2 2 0 0 1 0 4h-2M8 4v2M12 3v3" /></IconBase>;
    default:
      return <IconBase {...props}><path d="m12 3 2.1 4.7L19 8.3l-3.6 3.4 1 4.9-4.4-2.5-4.4 2.5 1-4.9L5 8.3l4.9-.6z" /></IconBase>;
  }
}

export function GameIcon({ id, ...props }: IconProps & { id: string }) {
  switch (id) {
    case 'smack-the-sprout':
      return <IconBase {...props}><path d="M12 21v-7" /><path d="M12 14c-4.2 0-6.5-2.2-6.5-6.5C9.7 7.5 12 9.8 12 14Z" /><path d="M12 12.5c0-4.3 2.4-6.6 6.5-6.6 0 4.2-2.3 6.6-6.5 6.6Z" /><path d="M8.5 21h7" /></IconBase>;
    case 'snake':
      return <IconBase {...props}><path d="M5 7c0-2 1.5-3 3.5-3S12 5 12 7s-1.5 3-3.5 3H7c-2 0-3 1.5-3 3.5S5.5 17 7.5 17H15" /><path d="m15 14 4 3-4 3z" /><circle cx="8.5" cy="6.5" r=".7" fill="currentColor" stroke="none" /></IconBase>;
    case 'tetris':
      return <IconBase {...props}><path d="M4 4h5v5H4zM10 4h5v5h-5zM10 10h5v5h-5zM16 10h4v5h-4zM10 16h5v4h-5z" /></IconBase>;
    case 'chess':
    case 'chess-plus':
      return <IconBase {...props}><path d="M8 4h8M9 4l1 5-3 4h10l-3-4 1-5M7 13h10l1 6H6zM5 20h14" /></IconBase>;
    case 'gomoku':
      return <IconBase {...props}><path d="M4 4h16v16H4zM4 9h16M4 15h16M9 4v16M15 4v16" /><circle cx="9" cy="9" r="2.2" fill="currentColor" /><circle cx="15" cy="15" r="2.2" fill="none" /></IconBase>;
    case 'international-chess':
      return <IconBase {...props}><path d="M8 20h10M9 17h8l-1-5-4-2 2-3-1-3-5 4 2 2-3 3z" /></IconBase>;
    case 'platformer':
      return <IconBase {...props}><path d="M4 18h16M6 18v-5h5v5M14 18V9h4v9M7 6h5v4H7z" /><path d="m9 3 3 3-3 3" /></IconBase>;
    case 'rightplace':
      return <IconBase {...props}><path d="M8 3h8l1 5-2 2v8l2 2H7l2-2v-8L7 8zM9 8h6M10 13h4" /></IconBase>;
    case 'magic-cube':
      return <IconBase {...props}><path d="m12 2 8 4.5v9L12 22l-8-6.5v-9zM4 6.5l8 5 8-5M12 11.5V22M8 4l8 5M16 4 8 9" /></IconBase>;
    default:
      return <IconBase {...props}><path d="M8 9h8l2 3v5a2 2 0 0 1-3.5 1.3L13 17h-2l-1.5 1.3A2 2 0 0 1 6 17v-5zM9 12v3M7.5 13.5h3M15.5 12.5h.01M17 14h.01" /></IconBase>;
  }
}
