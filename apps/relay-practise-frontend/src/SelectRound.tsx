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
import { editionSchoolYear, isLanguage } from 'schemas';
import type { Round } from 'schemas';
import { practiceSets } from './practice-sets';
import { categoryOptionLabel, menuCategories, menuEditions, menuRounds, otherSets, pastRounds } from './menu';

const rounds = pastRounds(practiceSets);
const categories = menuCategories(rounds);

export default function SelectRelayRound() {
  // `year` and `other` hold a competition id: the past round picked by its
  // edition, or another set picked by its label. Picking one clears the other.
  const [year, setYear] = useState('');
  const [round, setRound] = useState('');
  const [category, setCategory] = useState('');
  const [other, setOther] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const login = useLogin();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const startRelay = useStartRelay();

  const language = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'hu';
  const others = otherSets(practiceSets, language);

  const availableRounds: Round[] = category === '' ? [] : menuRounds(rounds, category);

  const availableYears =
    category === '' || round === ''
      ? []
      : menuEditions(rounds, category, round as Round);

  // An edition twice under one listed category (C+ and E, say) is told apart
  // by its real category.
  const yearOptionLabel = ({ edition, category: real }: { edition: number, category: string }) => {
    const label = t('login.yearOption', { num: edition, schoolYear: editionSchoolYear(edition) });
    return availableYears.filter(each => each.edition === edition).length > 1 ? `${label} (${real})` : label;
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
    setRound('');
    setYear('');
    setOther('');
  };

  const handleRoundChange = (event: SelectChangeEvent) => {
    setRound(event.target.value);
    setYear('');
  };

  const handleYearChange = (event: SelectChangeEvent) => {
    setYear(event.target.value);
  };

  const handleOtherChange = (event: SelectChangeEvent) => {
    setOther(event.target.value);
    setCategory('');
    setRound('');
    setYear('');
  };

  // t('login.roundType.local'), t('login.roundType.final'), t('login.roundType.online');
  const categoryLabel = t('login.categorySelector');
  const roundLabel = t('login.roundTypeSelector');
  const yearLabel = t('login.yearSelector');
  const otherLabel = t('login.otherSetSelector');

  // Fit width to absolutely positioned input label
  const minWidthForLabel = (label: string) => `calc(${label.length}ch + 3em)`;

  const handleProceed = async () => {
    const id = other !== '' ? other : year;
    if (id === '') {
      enqueueSnackbar(t('login.error.noRound'), { variant: 'error' });
      return;
    }
    try {
      await login(id);
      await startRelay();
    } catch (err) {
      enqueueSnackbar((err as Error)?.message, { variant: 'error' });
    }
  };

  return (
    <Box sx={{ marginTop: 3 }}>
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
            {categories.map(cat =>
              <MenuItem key={cat} value={cat}>
                {categoryOptionLabel(cat)}
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
            {availableYears.map(each =>
              <MenuItem key={each.id} value={each.id}>
                {yearOptionLabel(each)}
              </MenuItem>
            )}
          </Select>
        </FormControl>
      </Stack>

      {others.length > 0 &&
        <FormControl fullWidth sx={{ marginTop: "15px", minWidth: minWidthForLabel(otherLabel) }}>
          <InputLabel id="other-select-label">{otherLabel}</InputLabel>
          <Select
            labelId="other-select-label"
            id="other-select"
            value={other}
            label={otherLabel}
            onChange={handleOtherChange}
          >
            {others.map(({ id, label }) =>
              <MenuItem key={id} value={id}>
                {label}
              </MenuItem>
            )}
          </Select>
        </FormControl>
      }

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
