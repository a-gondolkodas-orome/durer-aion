import { Box, Tooltip } from '@mui/material';
import type { SystemStyleObject, Theme } from '@mui/system';
import { Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { STRATEGY_POINTS_BY_LOSSES } from 'game';
import type { LiveGameResult, RelayProblemResult } from 'schemas';
import { formatDuration } from './relay-results';
import { InfoTip } from './InfoTip';

// A long problem set continues in further rows of this many columns, each
// column under the one above it.
const COLUMNS_PER_ROW = 10;

// The games table shows only the latest live games, numbered as played, so it
// fits the strategy board's narrow panel however many games a team plays.
const SHOWN_GAMES = 6;

const LINE = '#cccccc';
const MUTED = '#57606a';
const RULE = '#eaeef2';
const TILE_BORDER = '#d0d7de';
// Paler with each try, so the order reads by lightness alone, without
// telling hues apart.
const SOLVED_ON_TRY = ['#4caf50', '#a5d6a7', '#d0ebcb'];
const WRONG = '#f4b4ae';
// A problem's points as a tile, set off from the plain cells around it. A
// problem never answered is an empty tile: outlined, so it still reads as one.
// Times are the detail of a row of points, so they are set smaller.
const timeSx = { fontSize: '0.8em' };
const tileSx = { borderRadius: '6px', margin: '2px' };
const unansweredSx = { ...tileSx, backgroundColor: '#fff', boxShadow: `inset 0 0 0 1px ${TILE_BORDER}`, color: '#888' };

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

// Headers are told apart by colour and size alone: the tables draw no lines
// between cells and fill no header.
const headerSx = { color: MUTED, fontSize: '0.8em' };

function CellBox(props: { cell: Cell }) {
  const { cell } = props;
  const box = <Box sx={[
    { padding: '6px 2px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cell.sx ?? {},
    cell.details !== undefined && { cursor: 'help' },
  ]}>
    {cell.details === undefined
      ? cell.content
      : <Box component="span" sx={{ textDecoration: 'underline dotted', textUnderlineOffset: '3px' }}>{cell.content}</Box>}
  </Box>;
  return cell.details === undefined ? box : <Tooltip title={cell.details} enterTouchDelay={0} arrow>{box}</Tooltip>;
}

const gridFrameSx = {
  display: 'grid',
  textAlign: 'center',
} as const;

// A hairline above every row after the first under the header, so a time or
// an answer is not read as belonging to the points above it.
const ruledSx = { borderTop: `1px solid ${RULE}` };

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
            <CellBox cell={{ content: row.label, sx: rowIdx < 2 ? labelSx : { ...labelSx, ...ruledSx } }}/>
            {row.cells.slice(start, start + COLUMNS_PER_ROW).map((cell, idx) =>
              <CellBox key={idx} cell={rowIdx < 2 ? cell : { ...cell, sx: { ...ruledSx, ...cell.sx } }}/>)}
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

// A problem's points out of its max, the max smaller: in a narrow card a row
// of full-size fractions crowds the colours that matter.
function PointsOf(props: { points: ReactNode, max: number }) {
  return <span>{props.points}<Box component="span" sx={{ fontSize: '0.75em' }}>/{props.max}</Box></span>;
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
        ? { content: <PointsOf points="–" max={problem.maxPoints}/>, sx: { fontWeight: 700 }, details: props.details ? t('relay.endTable.inProgress') : undefined }
        : { content: <PointsOf points="–" max={problem.maxPoints}/>, sx: { color: '#aaa' } };
    }
    if (tries === 0) {
      return {
        content: <PointsOf points={0} max={problem.maxPoints}/>,
        sx: unansweredSx,
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
      content: <PointsOf points={<b>{problem.points}</b>} max={problem.maxPoints}/>,
      sx: { ...tileSx, backgroundColor: solved ? SOLVED_ON_TRY[tries - 1] : WRONG },
      details: props.details
        ? `${t('relay.endTable.pointsOf', { points: problem.points, max: problem.maxPoints })}: ${outcome}`
        : undefined,
    };
  };
  const timeCell = (problem: RelayProblemResult, idx: number): Cell => problem.trySeconds.length === 0
    ? { content: '–', sx: { ...timeSx, color: '#888' } }
    : {
      content: formatDuration(problem.trySeconds.reduce((sum, it) => sum + it, 0)),
      sx: timeSx,
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
 * What the colours of RelayResultsTable mean, one swatch each, in a small grey
 * line to go right under the table.
 */
export function RelayKey(props: { centred?: boolean }) {
  const { t } = useTranslation();
  const items: { label: string, sx: SystemStyleObject<Theme> }[] = [
    // A key per try, since a Hungarian suffix depends on the number. Spelled
    // out key by key: the i18n check finds a key only as a literal.
    ...[t('relay.key.try1'), t('relay.key.try2'), t('relay.key.try3')]
      .map((label, idx) => ({ label, sx: { backgroundColor: SOLVED_ON_TRY[idx] } })),
    { label: t('relay.key.wrong'), sx: { backgroundColor: WRONG } },
    { label: t('relay.key.unanswered'), sx: unansweredSx },
  ];
  return <Box component="ul" aria-label={t('relay.key.label')} sx={{
    display: 'flex', flexWrap: 'wrap', gap: '6px 14px', margin: 0, padding: 0, listStyle: 'none',
    justifyContent: props.centred ? 'center' : 'flex-start', fontSize: '12px', color: MUTED,
  }}>
    {items.map((it, idx) => <Box component="li" key={idx} sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Box sx={[{ width: '14px', height: '14px' }, it.sx, { margin: 0, borderRadius: '4px' }]}/>
      {it.label}
    </Box>)}
  </Box>;
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
/// dashed one for a game still to play. Only a win that `scored` is coloured;
/// every other game is a plain square, its glyph saying what it was. `label`
/// names it for a screen reader.
export function LiveGameCell(props: { kind: LiveGameResult | 'next', n: number, label: string, scored?: boolean }) {
  const { kind, n, label } = props;
  return (
    <Box role="img" aria-label={label} title={label} sx={{
      width: '28px', height: '28px', borderRadius: '7px', boxSizing: 'border-box', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700,
      ...(props.scored ? { backgroundColor: '#dcefd6', color: '#1b5e20' }
        : kind === 'next' ? { border: '2px dashed #8c959f', color: '#8c959f' }
        : { backgroundColor: '#fff', border: '1px solid #d0d7de', color: '#57606a' }),
    }}>
      {kind === 'won' ? '✓' : kind === 'lost' ? '✗' : kind === 'unfinished' ? '–' : `${n}.`}
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
 * each numbered above: earlier ones are counted behind a … marker. With
 * `points`, a match that scored has the two wins that earned them coloured;
 * the points themselves are the headline's.
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
    <Numbered key={i} n={i + 1}><LiveGameCell kind={result} n={i + 1} label={label[result]} scored={i >= runStart && run > 0} /></Numbered>;
  return (
    <Box role="group" aria-label={t('strategy.series.label')} sx={{
      display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '4px',
    }}>
      <Numbered n={null}><Box sx={{ fontSize: '13px', color: '#57606a', marginRight: '6px' }}>{t('strategy.series.label')}</Box></Numbered>
      {hidden > 0 && <Numbered n={null}><Box role="img" aria-label={t('strategy.series.earlier', { count: hidden })}
        title={t('strategy.series.earlier', { count: hidden })} sx={{ fontWeight: 700, color: '#57606a', padding: '0 4px' }}>…</Box></Numbered>}
      {results.slice(hidden).map((result, i) => cell(result, hidden + i))}
    </Box>
  );
}

/**
 * How the strategy points follow from the live games, in words, with two
 * example runs: the home card's tooltip. The numbers come from the scale the
 * game scores by.
 */
export function StrategyPointsRule() {
  const { t } = useTranslation();
  const [clean, afterOneLoss] = STRATEGY_POINTS_BY_LOSSES;
  return <Box sx={{ fontSize: '14px', lineHeight: 1.45, textAlign: 'left' }}>
    <PointsRuleText />
    <Box sx={{ marginTop: '6px' }}>{t('strategy.points.examples')}</Box>
    <Box component="ul" sx={{ margin: '2px 0 0', paddingLeft: '18px' }}>
      <li>{t('strategy.points.cleanRun')}: <b>{t('general.points', { count: clean })}</b></li>
      <li>{t('strategy.points.afterLoss')}: <b>{t('general.points', { count: afterOneLoss })}</b></li>
    </Box>
  </Box>;
}

function PointsRuleText() {
  const { t } = useTranslation();
  return <>{t('strategy.points.text', { max: STRATEGY_POINTS_BY_LOSSES[0], min: STRATEGY_POINTS_BY_LOSSES.at(-1), scale: STRATEGY_POINTS_BY_LOSSES.join(' → ') })}</>;
}

/**
 * A finished match's points told on its own run, in one sentence, with the
 * rule behind an ⓘ: after the match the team's own case is what it reads.
 */
export function StrategyOutcome(props: { results: LiveGameResult[], points: number }) {
  const { t } = useTranslation();
  // Points come only with two live wins in a row, and then they are the ones
  // the live losses before them left.
  const losses = props.results.filter(result => result === 'lost').length;
  const points = t('general.points', { count: props.points });
  const outcome = props.results.length === 0 ? t('strategy.points.outcomeNoGames')
    : props.points === 0 ? t('strategy.points.outcomeNone')
    : losses === 0 ? t('strategy.points.outcomeClean', { points })
    : t('strategy.points.outcomeAfterLosses', { count: losses, points });
  return <Box sx={{ fontSize: '15px', lineHeight: 1.45, textAlign: 'center' }}>
    {outcome}
    <InfoTip label={t('strategy.points.label')}><PointsRuleText /></InfoTip>
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
