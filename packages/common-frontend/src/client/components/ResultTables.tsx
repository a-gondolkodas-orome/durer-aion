import { Box, Tooltip } from '@mui/material';
import type { SystemStyleObject, Theme } from '@mui/system';
import { Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { STRATEGY_POINTS_BY_LOSSES } from 'game';
import type { LiveGameResult, RelayProblemResult } from 'schemas';
import { formatDuration } from './relay-results';

// A long problem set continues in further rows of this many columns, each
// column under the one above it.
const COLUMNS_PER_ROW = 10;

// The games table shows only the latest live games, numbered as played, so it
// fits the strategy board's narrow panel however many games a team plays.
const SHOWN_GAMES = 6;

const LINE = '#cccccc';
const HEADER = '#eeeeee';
// Paler with each try, so the order reads by lightness alone, without
// telling hues apart.
export const SOLVED_ON_TRY = ['#4caf50', '#a5d6a7', '#d0ebcb'];
export const WRONG = '#f4b4ae';
// Striped rather than grey, so a problem never answered, or a game the time
// ran out in, cannot be mistaken for a header cell.
export const UNANSWERED = `repeating-linear-gradient(135deg, #fff 0px, #fff 6px, #e4e4e4 6px, #e4e4e4 8px)`;

interface Cell {
  content: ReactNode;
  sx?: SystemStyleObject<Theme>;
  /** Details on hover, or on a tap on a phone; the cell's content is underlined dotted. */
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

// The frame the result tables share: thin lines drawn by the gaps.
const gridFrameSx = {
  display: 'grid',
  gap: '1px',
  border: `1px solid ${LINE}`,
  backgroundColor: LINE,
  textAlign: 'center',
} as const;

const labelSx = { ...headerSx, justifyContent: 'flex-start', paddingX: '8px' };

/**
 * The look the result tables share: a header row naming the columns
 * (numbering them unless told otherwise), then labelled rows of as many cells.
 * With `transposeOnPhone`, a narrow screen gets one row per column instead, as
 * wide as the labels allow.
 */
function ResultTable(props: {
  headerLabel: string,
  columnLabels?: ReactNode[],
  rows: Row[],
  centred?: boolean,
  transposeOnPhone?: boolean,
}) {
  const count = props.rows[0].cells.length;
  const columns = Math.min(count, COLUMNS_PER_ROW);
  const header: Row = {
    label: props.headerLabel,
    cells: Array.from({ length: count }, (_, idx) => ({ content: props.columnLabels?.[idx] ?? `${idx + 1}.`, sx: headerSx })),
  };
  const rows = [header, ...props.rows];
  const starts = Array.from({ length: Math.ceil(count / COLUMNS_PER_ROW) }, (_, idx) => idx * COLUMNS_PER_ROW);
  const fontSize = { xs: '13px', md: '16px' };
  const template = (cells: number) => props.centred
    ? `auto repeat(${cells}, minmax(32px, 48px))`
    : `auto repeat(${cells}, minmax(0, 1fr))`;
  return <>
    {/* The outer grid owns the columns, so stretched columns line up across
        blocks of rows; each block is a subgrid spanning only its own cells, so
        a short last block draws nothing past its last cell. A browser without
        subgrid (e.g. Chrome before 117) gives each block its own columns over the
        same span, which line up but for the width of the label column. */}
    <Box sx={{
      display: props.transposeOnPhone ? { xs: 'none', sm: 'grid' } : 'grid',
      gridTemplateColumns: template(columns),
      rowGap: '8px',
      alignSelf: props.centred ? 'center' : 'stretch',
      maxWidth: '100%',
      fontSize,
    }}>
      {starts.map(start => {
        const cells = Math.min(count - start, COLUMNS_PER_ROW);
        return <Box key={start} sx={{
          ...gridFrameSx,
          gridTemplateColumns: 'subgrid',
          gridColumn: `1 / span ${cells + 1}`,
          '@supports not (grid-template-columns: subgrid)': { gridTemplateColumns: template(cells) },
        }}>
          {rows.map((row, rowIdx) => <Fragment key={rowIdx}>
            <CellBox cell={{ content: row.label, sx: labelSx }}/>
            {row.cells.slice(start, start + COLUMNS_PER_ROW).map((cell, idx) => <CellBox key={idx} cell={cell}/>)}
          </Fragment>)}
        </Box>;
      })}
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
 * A relay's points per problem, coloured by how each problem ended. With
 * `details` it also has a time row and the details on hover, and with
 * `answers` the admin's row of every answer given. A match still running
 * names its `current` problem, which has not ended yet, nor have those after it.
 */
export function RelayResultsTable(props: {
  problems: RelayProblemResult[],
  details?: boolean,
  answers?: number[][],
  current?: number,
  transposeOnPhone?: boolean,
}) {
  const { t } = useTranslation();
  // A problem's points: still in play, not reached yet, solved on some try,
  // every try wrong, or never answered.
  const pointsCell = (problem: RelayProblemResult, idx: number): Cell => {
    const tries = problem.trySeconds.length;
    if (props.current !== undefined && idx >= props.current) {
      return idx === props.current
        ? { content: `–/${problem.maxPoints}`, sx: { fontWeight: 700 }, details: props.details ? t('relay.endTable.inProgress') : undefined }
        : { content: `–/${problem.maxPoints}`, sx: { color: '#aaa' } };
    }
    if (tries === 0) {
      return {
        content: `0/${problem.maxPoints}`,
        sx: { background: UNANSWERED, color: '#888' },
        details: props.details ? t('relay.endTable.unanswered') : undefined,
      };
    }
    const solved = problem.points > 0;
    // A last try worth nothing scores 0 whether it was right or not (the relay
    // practice site has 2-point problems), so the details do not say which.
    const outcome = solved
      ? t('relay.endTable.solvedOnTry', { try: tries })
      : problem.maxPoints <= tries - 1
        ? t('relay.endTable.tries', { count: tries })
        : t('relay.endTable.wrongTries', { count: tries });
    return {
      content: <span><b>{problem.points}</b>/{problem.maxPoints}</span>,
      sx: { backgroundColor: solved ? SOLVED_ON_TRY[tries - 1] : WRONG },
      details: props.details
        ? `${t('relay.endTable.pointsOf', { points: problem.points, max: problem.maxPoints })}: ${outcome}`
        : undefined,
    };
  };
  const timeCell = (problem: RelayProblemResult, idx: number): Cell => problem.trySeconds.length === 0
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
  }
  const answers = props.answers;
  if (answers) {
    rows.push({
      label: t('relay.endTable.answers'),
      cells: props.problems.map((_, idx) => ({ content: answers[idx]?.join(', ') ?? '' })),
    });
  }
  return <ResultTable headerLabel={t('relay.endTable.task')} rows={rows} transposeOnPhone={props.transposeOnPhone}/>;
}

/**
 * The relay's progress while it runs: deliberately plain, beside the problem
 * that holds the team's attention. Problems not reached show what they are worth.
 */
export function RelayProgressTable(props: { problems: RelayProblemResult[], current: number }) {
  // Each cell draws its own lines in the gaps around it, the margin leaving
  // room for the outer ones, so a short last row draws nothing past its last cell.
  return <Box sx={{
    display: 'grid',
    gap: '1px',
    margin: '1px',
    textAlign: 'center',
    gridTemplateColumns: `repeat(${Math.min(props.problems.length, COLUMNS_PER_ROW)}, minmax(0, 1fr))`,
    fontSize: '12px',
    color: '#444',
  }}>
    {props.problems.map((problem, idx) => <Box key={idx} sx={[
      { backgroundColor: '#fff', padding: '3px 0', boxShadow: `0 0 0 1px ${LINE}` },
      idx === props.current && { fontWeight: 700, color: '#1a1a1a' },
      idx > props.current && { color: '#aaa' },
    ]}>
      <Box sx={{ color: '#888', fontWeight: 400 }}>{idx + 1}.</Box>
      <Box>{idx < props.current ? problem.points : '–'}/{problem.maxPoints}</Box>
    </Box>)}
  </Box>;
}

/// One live game as the strategy screens show it: a ✓, ✗ or – square, or a
/// dashed one for a game still to play. `label` names it for a screen reader.
export function LiveGameCell(props: { kind: LiveGameResult | 'next', n: number, label: string }) {
  const { kind, n, label } = props;
  return (
    <Box role="img" aria-label={label} title={label} sx={{
      width: '28px', height: '28px', borderRadius: '7px', boxSizing: 'border-box', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700,
      ...(kind === 'won' ? { backgroundColor: '#dcefd6', color: '#1b5e20' }
        : kind === 'lost' ? { backgroundColor: '#f6dcd8', color: '#8e1b10' }
        : kind === 'unfinished' ? { backgroundColor: '#eaeef2', color: '#57606a' }
        : { border: '2px dashed #8c959f', color: '#8c959f' }),
    }}>
      {kind === 'won' ? '✓' : kind === 'lost' ? '✗' : kind === 'unfinished' ? '–' : `${n}.`}
    </Box>
  );
}

/// The run of wins a strategy screen groups with its points, framed in green.
/// `numbered` when its games carry their numbers above them (`Numbered`), so
/// the points line up with the squares, not the numbers.
export function LiveGameRun(props: { points: string, numbered?: boolean, children: ReactNode }) {
  const points = <Box sx={{ marginLeft: '6px', fontSize: '15px', fontWeight: 700, color: '#1b5e20', whiteSpace: 'nowrap' }}>{props.points}</Box>;
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', padding: '3px 8px 3px 4px',
      borderRadius: '10px', backgroundColor: '#eef6ea', border: '1px solid #cfe3c6',
    }}>
      {props.children}
      {props.numbered ? <Numbered n={null}>{points}</Numbered> : points}
    </Box>
  );
}

/// A game's number over its square, or with `n` null the same room left empty,
/// so what stands beside the squares lines up with them.
function Numbered(props: { n: number | null, children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <Box aria-hidden sx={{ height: '14px', fontSize: '11px', lineHeight: '14px', color: '#57606a' }}>{props.n === null ? '' : `${props.n}.`}</Box>
      <Box sx={{ minHeight: '28px', display: 'flex', alignItems: 'center' }}>{props.children}</Box>
    </Box>
  );
}

/**
 * The latest live strategy games, in the order played, as a row of squares
 * each numbered above: earlier ones are counted behind a … marker, and with `points` a match that scored has the two wins that earned
 * them grouped with the points.
 */
export function StrategyGamesTable(props: { results: LiveGameResult[], points?: number }) {
  const { t } = useTranslation();
  const { results } = props;
  if (results.length === 0) {
    return null;
  }
  const hidden = Math.max(0, results.length - SHOWN_GAMES);
  const run = props.points !== undefined && props.points > 0 ? 2 : 0;
  const runStart = Math.max(hidden, results.length - run);
  // Spelled out key by key: the i18n check finds a key only as a literal.
  const label: Record<LiveGameResult, string> = {
    won: t('strategy.endTable.won'),
    lost: t('strategy.endTable.lost'),
    unfinished: t('strategy.endTable.unfinished'),
  };
  const cell = (result: LiveGameResult, i: number) =>
    <Numbered key={i} n={i + 1}><LiveGameCell kind={result} n={i + 1} label={label[result]} /></Numbered>;
  return (
    <Box role="group" aria-label={t('strategy.series.label')} sx={{
      display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '4px',
    }}>
      <Numbered n={null}><Box sx={{ fontSize: '13px', color: '#57606a', marginRight: '6px' }}>{t('strategy.series.label')}</Box></Numbered>
      {hidden > 0 && <Numbered n={null}><Box role="img" aria-label={t('strategy.series.earlier', { count: hidden })}
        title={t('strategy.series.earlier', { count: hidden })} sx={{ fontWeight: 700, color: '#57606a', padding: '0 4px' }}>…</Box></Numbered>}
      {results.slice(hidden, runStart).map((result, i) => cell(result, hidden + i))}
      {run > 0 && <LiveGameRun numbered points={t('strategy.series.total', { points: t('general.points', { count: props.points }) })}>
        {results.slice(runStart).map((result, i) => cell(result, runStart + i))}
      </LiveGameRun>}
    </Box>
  );
}

/**
 * How the strategy points follow from the live games, in words: the home
 * card's tooltip and the end screen say it alike. Before the match two example
 * runs show it; after it, `results` and `points` show it on the team's own run
 * instead. The numbers come from the scale the game scores by.
 */
export function StrategyPointsRule(props: { results?: LiveGameResult[], points?: number }) {
  const { t } = useTranslation();
  const [clean, afterOneLoss] = STRATEGY_POINTS_BY_LOSSES;
  const rule = t('strategy.points.text', { max: clean, min: STRATEGY_POINTS_BY_LOSSES.at(-1), scale: STRATEGY_POINTS_BY_LOSSES.join(' → ') });
  if (props.results === undefined || props.points === undefined) {
    return <Box sx={{ fontSize: '14px', lineHeight: 1.45, textAlign: 'left' }}>
      {rule}
      <Box sx={{ marginTop: '6px' }}>{t('strategy.points.examples')}</Box>
      <Box component="ul" sx={{ margin: '2px 0 0', paddingLeft: '18px' }}>
        <li>{t('strategy.points.cleanRun')}: <b>{t('general.points', { count: clean })}</b></li>
        <li>{t('strategy.points.afterLoss')}: <b>{t('general.points', { count: afterOneLoss })}</b></li>
      </Box>
    </Box>;
  }
  // Points come only with two live wins in a row, and then they are the ones
  // the live losses before them left.
  const losses = props.results.filter(result => result === 'lost').length;
  const points = t('general.points', { count: props.points });
  const outcome = props.points === 0 ? t('strategy.points.outcomeNone')
    : losses === 0 ? t('strategy.points.outcomeClean', { points })
    : t('strategy.points.outcomeAfterLosses', { count: losses, points });
  return <Box sx={{ fontSize: '14px', lineHeight: 1.45, textAlign: 'left' }}>
    {rule}
    <Box sx={{ marginTop: '6px', fontWeight: 600 }}>{outcome}</Box>
  </Box>;
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
      {t('general.pointsUnit', { count: props.max ?? props.points })}
    </Box>
  </Box>;
}
