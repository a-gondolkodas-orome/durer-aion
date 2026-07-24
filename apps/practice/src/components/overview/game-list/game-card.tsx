import { Link } from 'react-router';
import type { GameEntry, Category } from '../../games/gameList';
import { useTranslation } from '../../../language';
import { GameIcon } from '../game-icons';

const chipBase = 'rounded-full drop-shadow-sm px-2 py-0.5 whitespace-nowrap bg-surface-elevated';
// Category accent colours, increasing in difficulty A → E+. Used for the card
// chip and the icon badge; both adapt to dark mode. E/E+ carry `text-white`, so
// a `currentColor` icon placed on them turns white automatically.
const categoryColorClass: Record<Category, string> = {
  'A':  'bg-green-200 dark:bg-green-700',
  'B':  'bg-teal-300 dark:bg-teal-700',
  'C':  'bg-blue-300 dark:bg-blue-700',
  'D':  'bg-blue-400 dark:bg-blue-600',
  'E':  'bg-blue-600 text-white',
  'E+': 'bg-blue-800 text-white'
};


export const GameCard = ({ gameId, gameProps }: { gameId: string; gameProps: GameEntry }) => {
  const { t } = useTranslation();

  const round = gameProps.round === 'döntő'
    ? t({ hu: 'döntő', en: 'final' })
    : gameProps.round;

  const primaryCategory = gameProps.category[0];
  const categoryColor = categoryColorClass[primaryCategory];

  return <Link
    to={`/game/${gameId}`}
    data-testid="game-card"
    className={`
      rounded-lg border p-1 sm:p-2 max-w-[20ch] sm:max-w-[32ch] w-full flex flex-col items-center
      cursor-pointer hocus:bg-blue-50 dark:hocus:bg-blue-950 hocus:border-blue-400
      no-underline text-inherit
    `}
  >
    <span
      className={`
        rounded-full p-2 mt-1 mb-2 w-10 h-10 sm:w-12 sm:h-12
        flex items-center justify-center ${categoryColor}
      `}
      aria-hidden="true"
    >
      <GameIcon iconKey={gameProps.icon} />
    </span>
    <h2 className="mb-2 sm:mb-4 text-base sm:text-xl text-center">
      {t(gameProps.name)}
    </h2>
    <div className="grow"></div>
    <div className="flex flex-wrap items-baseline gap-1 text-xs w-full">
      <span className={chipBase} title={gameProps.year.k}>{gameProps.year.v}</span>
      <span className={chipBase}>{round}</span>
      <span className={chipBase}>{gameProps.category.join(', ')}</span>
      <span className="ml-auto" aria-hidden="true">→</span>
    </div>
  </Link>;
};
