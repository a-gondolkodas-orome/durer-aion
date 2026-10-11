import { Box, Tooltip } from '@mui/material';
import type { SystemStyleObject, Theme } from '@mui/system';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LiveGameResult, RelayProblemResult } from 'schemas';
import { formatDuration, type RelayProblemDetails } from './relay-results';

// A long problem set continues in further rows of this many columns, each row
// as wide as the first so a column sits under the one above it.
const COLUMNS_PER_ROW = 10;

const LINE = '#cccccc';
const HEADER = '#eeeeee';
// Paler with each try, so the order reads by lightness alone, without
// telling hues apart.
const SOLVED_ON_TRY = ['#4caf50', '#a5d6a7', '#e3f4e1'];
const WRONG = '#f4b4ae';
export const WON = '#c9efb8';
// Striped rather than grey, so a problem never answered, or a game the time
// ran out in, cannot be mistaken for a header cell.
const UNANSWERED = `repeating-linear-gradient(135deg, #fff 0px, #fff 6px, #e4e4e4 6px, #e4e4e4 8px)`;

interface Cell {
  content: ReactNode;
  sx?: SystemStyleObject<Theme>;
  /// Details on hover, or on a tap on a phone; the cell's content is underlined dotted.
  details?: string;
}

interface Row {
  label: string;
  cells: Cell[];
}

const headerSx = { backgroundColor: HEADER, fontWeight: 600 };

function CellBox(props: { cell: Cell }) {
  const { cell } = props;
  const box = <Box sx={[
    { padding: '6px 2px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cell.sx ?? {},
    cell.details !== undefined && { cursor: 'help' },
  ]}>
    {cell.details === undefined
      ? cell.content
      : <Box component="span" sx={{ textDecoration: 'underline dotted', textUnderlineOffset: '3px' }}>{cell.content}</Box>}
  </Box>;
  return cell.details === undefined ? box : <Tooltip title={cell.details} enterTouchDelay={0} arrow>{box}</Tooltip>;
}

// The frame every results grid shares: thin lines drawn by the gaps.
const gridFrameSx = {
  display: 'grid',
  gap: '1px',
  border: `1px solid ${LINE}`,
  backgroundColor: LINE,
  textAlign: 'center',
} as const;

const labelSx = { ...headerSx, justifyContent: 'flex-start', paddingX: '8px' };

/**
 * The look the end screens' and home page's tables share: a header row
 * naming the columns (numbering them unless told otherwise), then labelled
 * rows of as many cells. With `transposeOnPhone`, a narrow screen gets one row
 * per column instead, as wide as the labels allow.
 */
export function ResultTable(props: {
  headerLabel: string,
  columnLabels?: ReactNode[],
  rows: Row[],
  centred?: boolean,
  transposeOnPhone?: boolean,
}) {
  const count = props.rows[0]?.cells.length ?? 0;
  const columns = Math.min(count, COLUMNS_PER_ROW);
  const header: Row = {
    label: props.headerLabel,
    cells: Array.from({ length: count }, (_, idx) => ({ content: props.columnLabels?.[idx] ?? `${idx + 1}.`, sx: headerSx })),
  };
  const rows = [header, ...props.rows];
  const starts = Array.from({ length: Math.ceil(count / COLUMNS_PER_ROW) }, (_, idx) => idx * COLUMNS_PER_ROW);
  const fontSize = { xs: '13px', md: '16px' };
  return <>
    <Box sx={{
      display: props.transposeOnPhone ? { xs: 'none', sm: 'flex' } : 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignSelf: props.centred ? 'center' : 'stretch',
      maxWidth: '100%',
    }}>
      {starts.map(start => <Box key={start} sx={{
        ...gridFrameSx,
        gridTemplateColumns: props.centred
          ? `auto repeat(${columns}, minmax(32px, 48px))`
          : `auto repeat(${columns}, minmax(0, 1fr))`,
        fontSize,
      }}>
        {rows.map((row, rowIdx) => <Fragment key={rowIdx}>
          <CellBox cell={{ content: row.label, sx: labelSx }}/>
          {row.cells.slice(start, start + COLUMNS_PER_ROW).map((cell, idx) => <CellBox key={idx} cell={cell}/>)}
        </Fragment>)}
      </Box>)}
    </Box>
    {props.transposeOnPhone && <Box sx={{
      ...gridFrameSx,
      display: { xs: 'grid', sm: 'none' },
      gridTemplateColumns: `auto repeat(${props.rows.length}, minmax(0, 1fr))`,
      fontSize,
    }}>
      {rows.map((row, rowIdx) => <CellBox key={rowIdx} cell={{ content: row.label, sx: headerSx }}/>)}
      {header.cells.map((cell, idx) => <Fragment key={idx}>
        <CellBox cell={cell}/>
        {props.rows.map((row, rowIdx) => <CellBox key={rowIdx} cell={row.cells[idx]}/>)}
      </Fragment>)}
    </Box>}
  </>;
}

/**
 * A relay's points per problem, coloured by how each problem ended. Given the
 * match state's details it also has a time row and the details on hover, and
 * with `answers` the admin's row of every answer given.
 */
export function RelayResultsTable(props:
  | { problems: RelayProblemResult[], details?: false, transposeOnPhone?: boolean }
  | { problems: RelayProblemDetails[], details: true, answers?: boolean, transposeOnPhone?: boolean }
) {
  const { t } = useTranslation();
  // A problem's points: solved on some try, every try wrong, or never answered.
  const pointsCell = (problem: RelayProblemResult): Cell => {
    if (problem.tries === 0) {
      return {
        content: `0/${problem.maxPoints}`,
        sx: { background: UNANSWERED, color: '#888' },
        details: props.details ? t('relay.endTable.unanswered') : undefined,
      };
    }
    const solved = problem.points > 0;
    return {
      content: <span><b>{problem.points}</b>/{problem.maxPoints}</span>,
      sx: { backgroundColor: solved ? SOLVED_ON_TRY[problem.tries - 1] : WRONG },
      details: props.details
        ? `${t('relay.endTable.pointsOf', { points: problem.points, max: problem.maxPoints })}: ${solved
          ? t('relay.endTable.solvedOnTry', { try: problem.tries })
          : t('relay.endTable.wrongTries', { count: problem.tries })}`
        : undefined,
    };
  };
  const timeCell = (problem: RelayProblemDetails, idx: number): Cell => problem.trySeconds.length === 0
    ? { content: '–', sx: { color: '#888' } }
    : {
      content: formatDuration(problem.trySeconds.reduce((sum, it) => sum + it, 0)),
      details: `${t('relay.endTable.taskNumber', { num: idx + 1 })}: ${problem.trySeconds
        .map((seconds, tryIdx) => t('relay.endTable.tryTime', { try: tryIdx + 1, time: formatDuration(seconds) }))
        .join(' · ')}`,
    };
  const rows: Row[] = [{ label: t('relay.endTable.point'), cells: props.problems.map(pointsCell) }];
  if (props.details) {
    rows.push({ label: t('relay.endTable.time'), cells: props.problems.map(timeCell) });
    if (props.answers) {
      rows.push({
        label: t('relay.endTable.answers'),
        cells: props.problems.map(problem => ({ content: problem.answers.join(', ') })),
      });
    }
  }
  return <ResultTable headerLabel={t('relay.endTable.task')} rows={rows} transposeOnPhone={props.transposeOnPhone}/>;
}

/**
 * The relay's progress while it runs: deliberately plain, beside the problem
 * that holds the team's attention. Problems not reached show what they are worth.
 */
export function RelayProgressTable(props: { problems: RelayProblemResult[], current: number }) {
  return <Box sx={{
    ...gridFrameSx,
    gridTemplateColumns: `repeat(${Math.min(props.problems.length, COLUMNS_PER_ROW)}, minmax(0, 1fr))`,
    fontSize: '12px',
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
  if (props.results.length === 0) {
    return null;
  }
  // Spelled out key by key: the i18n check finds a key only as a literal.
  const label: Record<LiveGameResult, string> = {
    won: t('strategy.endTable.won'),
    lost: t('strategy.endTable.lost'),
    unfinished: t('strategy.endTable.unfinished'),
  };
  return <ResultTable
    centred
    headerLabel={t('strategy.endTable.game')}
    rows={[{
      label: t('strategy.endTable.result'),
      cells: props.results.map(result => ({
        content: <Box component="span" role="img" aria-label={label[result]} title={label[result]} sx={{ display: 'flex' }}>
          {RESULT_ICON[result].icon}
        </Box>,
        sx: { background: RESULT_ICON[result].background },
      })),
    }]}
  />;
}

/** A match's score as the headline of its results: big, out of its maximum. */
export function ScoreHeadline(props: { points: number, max?: number, compact?: boolean }) {
  const { t } = useTranslation();
  return <Box sx={{
    fontSize: props.compact ? '44px' : '56px',
    fontWeight: 700,
    lineHeight: 1.1,
    textAlign: 'center',
  }}>
    {props.max === undefined ? props.points : `${props.points} / ${props.max}`}{' '}
    <Box component="span" sx={{ fontSize: props.compact ? '18px' : '22px', fontWeight: 400 }}>
      {t('general.pointsUnit', { count: props.points })}
    </Box>
  </Box>;
}
