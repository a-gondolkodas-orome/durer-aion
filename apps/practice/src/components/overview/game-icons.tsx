import type { FC, SVGProps } from 'react';
import type { IconKey } from '../games/gameList';
import { ScissorSvg } from '../games/rock-paper-scissor/symbols/scissor-svg';

// Small, self-contained, monochrome icons for the overview cards. Everything is
// drawn with `currentColor` so each icon tints with the category-accent badge it
// sits in (see game-card.tsx). Deliberately no <symbol>/<use> or global ids —
// unlike the in-game SVGs — so they compose safely wherever they're rendered.

type IconProps = SVGProps<SVGSVGElement>;

const svgProps = (rest: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
  className: 'w-full h-full',
  ...rest
});

const ChessIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <path d="M12 3a2 2 0 0 0-1 3.7C9.8 7.6 9 9 9 10.5c0 1.4.7 2.2 1.5 2.8L9 19h6l-1.5-5.7c.8-.6 1.5-1.4
      1.5-2.8 0-1.5-.8-2.9-2-3.8A2 2 0 0 0 12 3Z" />
    <path d="M7 21h10" />
  </svg>
);

const BoardIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <rect x="3" y="6" width="18" height="12" rx="1" />
    <path d="M9 6v12M15 6v12M3 12h18" />
    <circle cx="6" cy="9" r="2" fill="currentColor" stroke="none" />
  </svg>
);

const ColoringIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <path d="M12 3 3 19h18L12 3Z" />
    <path d="M12 3 7.5 11h9L12 3Z" fill="currentColor" stroke="none" />
  </svg>
);

const CoinsIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <circle cx="9" cy="9" r="5" />
    <path d="M14 6.2a5 5 0 1 1 0 9.6" />
    <path d="M9 6.8v4.4M7.3 9h3.4" />
  </svg>
);

const NumberIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <text
      x="12" y="12.5" textAnchor="middle" dominantBaseline="central"
      fontSize="12" fontWeight="700" fill="currentColor" stroke="none"
    >3</text>
  </svg>
);

const SmallGraphIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <rect x="5" y="5" width="14" height="14" />
    <path d="M5 5 19 19" />
    <circle cx="5" cy="5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="19" cy="5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="5" cy="19" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="19" cy="19" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

const PilesIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <rect x="4" y="15" width="5" height="5" rx="1" />
    <rect x="4" y="9" width="5" height="5" rx="1" />
    <rect x="15" y="15" width="5" height="5" rx="1" />
  </svg>
);

const CardsIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <rect x="5" y="5" width="10" height="14" rx="1.5" transform="rotate(-15 10 12)" />
    <rect x="8" y="6" width="11" height="14" rx="1.5" className="fill-surface-elevated" />
    <text
      x="13.5" y="13.5" textAnchor="middle" dominantBaseline="central"
      fontSize="10" fontWeight="700" fill="currentColor" stroke="none"
    >5</text>
  </svg>
);

const PursuitIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="12" r="2.5" fill="currentColor" stroke="none" />
    <path d="M9 12h6" />
    <path d="M13.5 9.5 16 12l-2.5 2.5" />
  </svg>
);

const PyramidIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <path d="M12 4 20 20H4L12 4Z" />
    <path d="M8 12h8M6 16h12" />
  </svg>
);

const DominoesIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <rect x="4" y="8" width="16" height="8" rx="1.5" />
    <path d="M12 8v8" />
    <circle cx="8" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const HouseIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <path d="M3.5 11 12 4 20.5 11" />
    <rect x="6" y="11" width="12" height="9" />
    <rect x="10.4" y="14.5" width="3.2" height="5.5" />
  </svg>
);

// Reuses the in-game scissor artwork; it already draws with `currentColor` and
// has no global ids, so it composes safely on the overview cards.
const ScissorIcon: FC<IconProps> = (p) => (
  <ScissorSvg className="w-full h-full" aria-hidden focusable="false" {...p} />
);

// Neutral placeholder for games without a dedicated icon.
export const FallbackIcon: FC<IconProps> = (p) => (
  <svg {...svgProps(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>
);

export const gameIcons: Record<IconKey, FC<IconProps>> = {
  chess: ChessIcon,
  board: BoardIcon,
  coloring: ColoringIcon,
  coins: CoinsIcon,
  number: NumberIcon,
  'small-graph': SmallGraphIcon,
  piles: PilesIcon,
  cards: CardsIcon,
  pursuit: PursuitIcon,
  pyramid: PyramidIcon,
  dominoes: DominoesIcon,
  house: HouseIcon,
  scissor: ScissorIcon
};

export const GameIcon = ({ iconKey, ...rest }: { iconKey?: IconKey } & IconProps) => {
  const Icon = (iconKey && gameIcons[iconKey]) ?? FallbackIcon;
  return <Icon {...rest} />;
};
