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

export enum Category {
  A = 'A', B = 'B', C = 'C', D = 'D', E = 'E', Cp = 'C+', Dp = 'D+', Ep = 'E+'
}

interface TestListElement {
  local?: Category[],
  final: Category[],
}
type RoundType = 'local' | 'final';

export const availableRelayTests: TestListElement[] = [
    {final: [Category.B, Category.C, Category.D]},
    {final: [Category.B, Category.C, Category.D]},
    {final: [Category.B, Category.C, Category.D]},
    {final: [Category.B, Category.C, Category.D]},
    {final: [Category.A, Category.B, Category.C, Category.D]},
    {final: [Category.A, Category.B, Category.C, Category.D]},
    {local: [Category.A, Category.B], final: [Category.A, Category.B, Category.C]},
    {local: [Category.A, Category.B], final: [Category.A, Category.B, Category.C, Category.D]},
    {local: [Category.A, Category.B], final: [Category.A, Category.B, Category.C, Category.Cp, Category.D, Category.Dp]},
    {local: [Category.A, Category.B], final: [Category.A, Category.B, Category.C, Category.Cp, Category.D, Category.Dp]},
    {local: [Category.A, Category.B], final: [Category.A, Category.B, Category.C, Category.Cp, Category.D, Category.Dp]},
    {local: [Category.A, Category.B], final: [Category.A, Category.B, Category.C, Category.D, Category.E, Category.Ep]},
]

export default function SelectRelayRound() {
  const [year, setYear] = useState('');
  const [round, setRound] = useState('');
  const [category, setCategory] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const login = useLogin();
  const theme = useTheme();
  const { t } = useTranslation();
  const startRelay = useStartRelay();

  const testHasCategory = (test: TestListElement, round: RoundType, cat: Category) =>
    (round === 'local' ? test.local : test.final)?.includes(cat) ?? false;

  const availableCategories: Category[] = Object.values(Category).filter(cat =>
    availableRelayTests.some(test =>
      testHasCategory(test, 'local', cat) || testHasCategory(test, 'final', cat)
    )
  );

  const availableRounds: RoundType[] =
    category === ''
      ? []
      : (['local', 'final'] as RoundType[]).filter(roundType =>
          availableRelayTests.some(test => testHasCategory(test, roundType, category as Category))
        );

  const availableYears: number[] =
    category === '' || round === ''
      ? []
      : availableRelayTests.reduce<number[]>((years, test, idx) => {
          if (testHasCategory(test, round as RoundType, category as Category)) years.push(idx);
          return years;
        }, []);

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

  const categoryLabel = t('login.categorySelector');
  const roundLabel = t('login.roundTypeSelector');
  const yearLabel = t('login.yearSelector');

  // Fit width to absolutely positioned input label
  const minWidthForLabel = (label: string) => `calc(${label.length}ch + 3em)`;

  const handleProceed = () => {
    if (year === '' || round === '' || category === '') {
      enqueueSnackbar(t('login.error.noRound'), { variant: 'error' });
      return;
    }
    const code = `${Number(year) + 1}_${round === 'final' ? 'D' : 'H'}_${category}`;
    login(code).catch(err => {
      enqueueSnackbar(err?.message, { variant: 'error' });
    });
    startRelay();
  };

  return (
    <Box sx={{ minWidth: 300, marginTop: 3 }}>
      <Stack sx={{
        display: "flex",
        flexDirection: "row",
        gap: "5%"
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
            {availableYears.map(yearidx =>
              <MenuItem key={yearidx} value={String(yearidx)}>
                {t('login.yearOption', { num: yearidx + 1 })}
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
              onClick={handleProceed}>
                {t('login.proceedButton')}
        </Button>
    </Box>
  );
}