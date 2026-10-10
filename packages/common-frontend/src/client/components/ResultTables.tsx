import { Box, Tooltip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LiveGameResult, RelayProblemResult } from 'schemas';
import { formatDuration, relayOutcome, type RelayProblemRow } from './relay-results';

// A long problem set continues in further rows of this many columns, each row
// as wide as the first so a column sits under the one above it.
const COLUMNS_PER_ROW = 10;

const LINE = '#cccccc';
const HEADER = '#eeeeee';
const SOLVED_ON_TRY = ['#3fc523', '#9beb53', '#d5eb42'];
const WRONG = '#f4b4ae';
const WON = '#c9efb8';
// Striped rather than grey, so a problem never answered, or a game the time
// ran out in, cannot be mistaken for a header cell.
const UNANSWERED = `repeating-linear-gradient(135deg, #fff 0px, #fff 6px, #e4e4e4 6px, #e4e4e4 8px)`;

interface Cell {
  content: ReactNode;
  sx?: SxProps<Theme>;
  /// Details on hover, or on a tap on a phone; the cell gets an asterisk.
  details?: string;
}

interface Row {
  label: string;
  cells: Cell[];
}

const chunk = <T,>(items: T[]): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += COLUMNS_PER_ROW) {
    chunks.push(items.slice(i, i + COLUMNS_PER_ROW));
  }
  return chunks;
};

const headerSx = { backgroundColor: HEADER, fontWeight: 600 };

function CellBox(props: { cell: Cell }) {
  const { cell } = props;
  const box = <Box sx={[
    { padding: '6px 2px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    ...(Array.isArray(cell.sx) ? cell.sx : [cell.sx]),
    cell.details !== undefined && { cursor: 'help' },
  ]}>
    {cell.content}
    {cell.details !== undefined && <Box component="sup" sx={{ color: '#555', fontSize: '11px', marginLeft: '1px' }}>*</Box>}
  </Box>;
  return cell.details === undefined ? box : <Tooltip title={cell.details} enterTouchDelay={0} arrow>{box}</Tooltip>;
}

/** The look every result table shares: a header row, then labelled rows. */
function ResultTable(props: { header: Row, rows: Row[], centred?: boolean }) {
  const columns = Math.min(props.header.cells.length, COLUMNS_PER_ROW);
  const rows = [props.header, ...props.rows];
  const chunked = rows.map(row => chunk(row.cells));
  return <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: props.centred ? 'center' : 'stretch' }}>
    {chunked[0].map((_, chunkIdx) => <Box key={chunkIdx} sx={{
      display: 'grid',
      gridTemplateColumns: props.centred
        ? `auto repeat(${columns}, 48px)`
        : `auto repeat(${columns}, minmax(0, 1fr))`,
      gap: '1px',
      border: `1px solid ${LINE}`,
      backgroundColor: LINE,
      textAlign: 'center',
      fontSize: { xs: '13px', md: '16px' },
    }}>
      {rows.map((row, rowIdx) => <Fragment key={rowIdx}>
        <CellBox cell={{
          content: row.label,
          sx: [headerSx, { justifyContent: 'flex-start', paddingX: '8px' }],
        }}/>
        {chunked[rowIdx][chunkIdx].map((cell, idx) => <CellBox key={idx} cell={
          rowIdx === 0 ? { ...cell, sx: headerSx } : cell
        }/>)}
      </Fragment>)}
    </Box>)}
  </Box>;
}

/**
 * A relay's points per problem, coloured by how each problem ended. Given the
 * match state's rows it also has a time row and the details on hover, and with
 * `answers` the admin's row of every answer given.
 */
export function RelayResultsTable(props: { problems: RelayProblemRow[], details?: boolean, answers?: boolean }) {
  const { t } = useTranslation();
  const pointsCell = (problem: RelayProblemRow): Cell => {
    const outcome = relayOutcome(problem);
    const points = t('relay.endTable.pointsOf', { points: problem.points, max: problem.maxPoints });
    if (outcome === 'unanswered') {
      return {
        content: `${problem.points}/${problem.maxPoints}`,
        sx: { background: UNANSWERED, color: '#888' },
        details: props.details ? t('relay.endTable.unanswered') : undefined,
      };
    }
    return {
      content: <span><b>{problem.points}</b>/{problem.maxPoints}</span>,
      sx: { backgroundColor: outcome === 'wrong' ? WRONG : SOLVED_ON_TRY[outcome.solvedOnTry - 1] ?? WRONG },
      details: !props.details ? undefined : outcome === 'wrong'
        ? `${points}: ${t('relay.endTable.wrongTries', { count: problem.tries })}`
        : `${points}: ${t('relay.endTable.solvedOnTry', { try: outcome.solvedOnTry })}`,
    };
  };
  const timeCell = (problem: RelayProblemRow, idx: number): Cell => problem.seconds === undefined
    ? { content: '–', sx: { color: '#888' } }
    : {
      content: formatDuration(problem.seconds),
      details: `${t('relay.endTable.taskNumber', { num: idx + 1 })}: ${(problem.trySeconds ?? [])
        .map((seconds, tryIdx) => t('relay.endTable.tryTime', { try: tryIdx + 1, time: formatDuration(seconds) }))
        .join(' · ')}`,
    };
  const rows: Row[] = [{ label: t('relay.endTable.point'), cells: props.problems.map(pointsCell) }];
  if (props.details) {
    rows.push({ label: t('relay.endTable.time'), cells: props.problems.map(timeCell) });
  }
  if (props.answers) {
    rows.push({
      label: t('relay.endTable.answers'),
      cells: props.problems.map(problem => ({ content: (problem.answers ?? []).join(', ') })),
    });
  }
  return <ResultTable
    header={{ label: t('relay.endTable.task'), cells: props.problems.map((_, idx) => ({ content: `${idx + 1}.` })) }}
    rows={rows}
  />;
}

/**
 * The relay's progress while it runs: deliberately plain, beside the problem
 * that holds the team's attention. Problems not reached show what they are worth.
 */
export function RelayProgressTable(props: { problems: RelayProblemResult[], current: number }) {
  return <Box sx={{
    display: 'grid',
    gridTemplateColumns: `repeat(${Math.min(props.problems.length, COLUMNS_PER_ROW)}, minmax(0, 1fr))`,
    gap: '1px',
    border: '1px solid #d0d0d0',
    backgroundColor: '#d0d0d0',
    fontSize: '12px',
    textAlign: 'center',
    color: '#444',
  }}>
    {props.problems.map((problem, idx) => <Box key={idx} sx={[
      { backgroundColor: '#fff', padding: '3px 0' },
      idx === props.current && { fontWeight: 700, color: '#1a1a1a' },
      idx > props.current && { color: '#aaa' },
    ]}>
      <Box sx={{ color: '#888', fontWeight: 400 }}>{idx + 1}.</Box>
      <Box>{idx < props.current ? problem.points : '–'}/{problem.maxPoints}</Box>
    </Box>)}
  </Box>;
}

const RESULT_ICON: Record<LiveGameResult, { icon: ReactNode, background: string }> = {
  won: { icon: <CheckIcon fontSize="small" sx={{ color: '#1b5e20' }}/>, background: WON },
  lost: { icon: <CloseIcon fontSize="small" sx={{ color: '#8e2b23' }}/>, background: WRONG },
  unfinished: { icon: <HourglassEmptyIcon fontSize="small" sx={{ color: '#666' }}/>, background: UNANSWERED },
};

/** Each live strategy game's result, in the order played. */
export function StrategyGamesTable(props: { results: LiveGameResult[] }) {
  const { t } = useTranslation();
  // Spelled out key by key: the i18n check finds a key only as a literal.
  const label = (result: LiveGameResult) => {
    switch (result) {
      case 'won': return t('strategy.endTable.won');
      case 'lost': return t('strategy.endTable.lost');
      case 'unfinished': return t('strategy.endTable.unfinished');
    }
  };
  return <ResultTable
    centred
    header={{ label: t('strategy.endTable.game'), cells: props.results.map((_, idx) => ({ content: `${idx + 1}.` })) }}
    rows={[{
      label: t('strategy.endTable.result'),
      cells: props.results.map(result => ({
        content: <Box component="span" role="img" aria-label={label(result)} title={label(result)} sx={{ display: 'flex' }}>
          {RESULT_ICON[result].icon}
        </Box>,
        sx: { background: RESULT_ICON[result].background },
      })),
    }]}
  />;
}

/** A match's score as the headline of its results: big, out of its maximum. */
export function ScoreHeadline(props: { points: number, max?: number, size?: 'large' | 'medium' }) {
  const { t } = useTranslation();
  return <Box sx={{
    fontSize: props.size === 'medium' ? '44px' : '56px',
    fontWeight: 700,
    lineHeight: 1.1,
    textAlign: 'center',
  }}>
    {props.max === undefined ? props.points : `${props.points} / ${props.max}`}{' '}
    <Box component="span" sx={{ fontSize: props.size === 'medium' ? '18px' : '22px', fontWeight: 400 }}>
      {t('general.pointsUnit', { count: props.points })}
    </Box>
  </Box>;
}
