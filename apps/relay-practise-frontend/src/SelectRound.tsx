import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useState } from 'react';
import { Button, Stack } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useLogin } from 'common-frontend';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useStartRelay } from 'common-frontend';
import { hasProblemSet } from './problems';

export enum Category {
  A = 'A', B = 'B', C = 'C', D = 'D', E = 'E', Ep = 'E+', Cp = 'C+', Dp = 'D+'
}

// C+ and D+ (years 9–11) match E and E+ in difficulty, so the selector lists
// them under those; the join code and the header keep the real category.
export const listedAs = (cat: Category): Category =>
  cat === Category.Cp ? Category.E : cat === Category.Dp ? Category.Ep : cat;

interface TestListElement {
  local?: Category[],
  final?: Category[],
  online?: Category[]
}
export type RoundType = 'local' | 'final' | 'online';

// Join code (= teamName) of a test, e.g. "12_D_C+": year, final(D)/local(H) round, category
export const relayTestCode = (yearIdx: number, round: RoundType, category: Category | string) =>
  `${yearIdx + 1}_${round === 'final' ? 'D' : (round === 'online' ? 'O' : 'H')}_${category}`;

export const availableRelayTests: TestListElement[] = [
    { final: [Category.B, Category.C, Category.D] },
    { final: [Category.B, Category.C, Category.D] },
    { final: [Category.B, Category.C, Category.D] },
    { final: [Category.B, Category.C, Category.D] },
    { final: [Category.A, Category.B, Category.C, Category.D] },
    { final: [Category.A, Category.B, Category.C, Category.D] },
    { local: [Category.A, Category.B], final: [Category.A, Category.B, Category.C] },
    { local: [Category.A, Category.B], final: [Category.A, Category.B, Category.C, Category.D] },
    { local: [Category.A, Category.B], final: [Category.A, Category.B, Category.C, Category.Cp, Category.D, Category.Dp] },
    { local: [Category.A, Category.B], final: [Category.A, Category.B, Category.C, Category.Cp, Category.D, Category.Dp] },
    { local: [Category.A, Category.B], final: [Category.A, Category.B, Category.C, Category.Cp, Category.D, Category.Dp] },
    { local: [Category.A, Category.B], final: [Category.A, Category.B, Category.C, Category.D, Category.E, Category.Ep] },
    {},
    {},
    {},
    {},
    {},
    {},
    { online: [Category.C, Category.D, Category.E] },
]

const roundTypes: RoundType[] = ['local', 'final', 'online'];

interface PlayableTest {
  yearIdx: number,
  category: Category,
}

// The tests offered under a listed category in a round, one per year. A test is
// only offered if its problem set is already bundled with the app.
export const playableTests = (listed: Category, round: RoundType): PlayableTest[] =>
  availableRelayTests.flatMap((test, yearIdx) =>
    (test[round] ?? [])
      .filter(cat => listedAs(cat) === listed && hasProblemSet(relayTestCode(yearIdx, round, cat)))
      .map(cat => ({ yearIdx, category: cat }))
  );

export default function SelectRelayRound() {
  const [year, setYear] = useState('');
  const [round, setRound] = useState('');
  const [category, setCategory] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const login = useLogin();
  const theme = useTheme();
  const { t } = useTranslation();
  const startRelay = useStartRelay();

  const availableCategories: Category[] = Object.values(Category).filter(cat =>
    listedAs(cat) === cat && roundTypes.some(roundType => playableTests(cat, roundType).length > 0)
  );

  const availableRounds: RoundType[] =
    category === ''
      ? []
      : roundTypes.filter(roundType => playableTests(category as Category, roundType).length > 0);

  const availableYears: PlayableTest[] =
    category === '' || round === ''
      ? []
      : playableTests(category as Category, round as RoundType);

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
    setRound('');
    setYear('');
  };

  const handleRoundChange = (event: SelectChangeEvent) => {
    setRound(event.target.value);
    setYear('');
  };

  const handleYearChange = (event: SelectChangeEvent) => {
    setYear(event.target.value);
  };

  // t('login.roundType.local'), t('login.roundType.final'), t('login.roundType.online');
  const categoryLabel = t('login.categorySelector');
  const roundLabel = t('login.roundTypeSelector');
  const yearLabel = t('login.yearSelector');

  // Fit width to absolutely positioned input label
  const minWidthForLabel = (label: string) => `calc(${label.length}ch + 3em)`;

  const handleProceed = async () => {
    if (year === '' || round === '' || category === '') {
      enqueueSnackbar(t('login.error.noRound'), { variant: 'error' });
      return;
    }
    const test = availableYears.find(({ yearIdx }) => String(yearIdx) === year);
    if (!test) {
      enqueueSnackbar(t('login.error.noRound'), { variant: 'error' });
      return;
    }
    const code = relayTestCode(test.yearIdx, round as RoundType, test.category);
    try {
      await login(code);
      await startRelay();
    } catch (err) {
      enqueueSnackbar((err as Error)?.message, { variant: 'error' });
    }
  };

  return (
    <Box sx={{ minWidth: 300, marginTop: 3 }}>
      <Stack sx={{
        display: "flex",
        flexDirection: "row",
        gap: "15px",
        flexWrap: "wrap"
      }}>
        <FormControl sx={{ minWidth: minWidthForLabel(categoryLabel) }}>
          <InputLabel id="category-select-label">{categoryLabel}</InputLabel>
          <Select
            labelId="category-select-label"
            id="category-select"
            value={category}
            label={t('login.categorySelector')}
            onChange={handleCategoryChange}
          >
            {availableCategories.map(cat =>
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: minWidthForLabel(roundLabel) }} disabled={category === ''}>
          <InputLabel id="round-select-label">{roundLabel}</InputLabel>
          <Select
            labelId="round-select-label"
            id="round-select"
            value={round}
            label={t('login.roundTypeSelector')}
            onChange={handleRoundChange}
          >
            {availableRounds.map(roundType =>
              <MenuItem key={roundType} value={roundType}>
                {t(`login.roundType.${roundType}`)}
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <FormControl sx={{ flex: 1, minWidth: minWidthForLabel(yearLabel) }} disabled={round === ''}>
          <InputLabel id="year-select-label">{yearLabel}</InputLabel>
          <Select
            labelId="year-select-label"
            id="year-select"
            value={year}
            label={t('login.yearSelector')}
            onChange={handleYearChange}
          >
            {availableYears.map(({ yearIdx, category: testCategory }) =>
              <MenuItem key={yearIdx} value={String(yearIdx)}>
                {testCategory === category
                  ? t('login.yearOption', { num: yearIdx + 1 })
                  : t('login.yearOptionLegacy', { num: yearIdx + 1, category: testCategory })}
              </MenuItem>
            )}
          </Select>
        </FormControl>
      </Stack>

      <Button type="submit" variant="contained" sx={{
                marginTop: "20px",
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                fontSize: "20px",
                width: "100%",
                height: "60px",
                borderRadius: "10px",
                textTransform: "none",
              }}
              onClick={() => void handleProceed()}>
                {t('login.proceedButton')}
        </Button>
    </Box>
  );
}
