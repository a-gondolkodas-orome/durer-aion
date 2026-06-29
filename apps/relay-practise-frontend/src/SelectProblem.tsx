import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useState } from 'react';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useLogin } from 'common-frontend';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

enum Category {
  A = 'A', B = 'B', C = 'C', D = 'D', E = 'E', Cp = 'C+', Dp = 'D+', Ep = 'E+'
}

interface TestListElement {
  local?: Category[],
  final: Category[],
}
interface TestItem {
  year: number,
  finalround: boolean,
  category: Category
}

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

export default function SelectProblem() {
  const [age, setAge] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const login = useLogin();
  const theme = useTheme();
  const { t } = useTranslation();

  const handleChange = (event: SelectChangeEvent) => {
    setAge(event.target.value as string);
  };

  const allTests: TestItem[] = [];
  availableRelayTests.forEach((testsForAYear, yearidx) => {
    if (testsForAYear.local) {
      allTests.push(...testsForAYear.local.map(test => ({ year: yearidx, finalround: false, category: test })));
    }
    if (testsForAYear.final) {
      allTests.push(...testsForAYear.final.map(test => ({ year: yearidx, finalround: true, category: test })));
    }
  });

  return (
    <Box sx={{ minWidth: 300, marginTop: 3 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">{t('login.roundSelector')}</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={age}
          label="Forduló"
          onChange={handleChange}
        >
          {allTests.map(testItem => 
            <MenuItem
              value={`${testItem.year + 1}_${testItem.finalround ? 'D' : 'H'}_${testItem.category}`}>
                {testItem.finalround 
                  ? t('login.competitionType.final', {num: testItem.year + 1, category: testItem.category})
                  : t('login.competitionType.local', {num: testItem.year + 1, category: testItem.category})
                }
            </MenuItem>
          )}
        </Select>
      </FormControl>
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
              onClick={() => {
                if(!age) {
                  enqueueSnackbar(t('login.error.noRound'), { variant: 'error' });
                  return;
                }
                const res = login(age).catch(err => {
                  enqueueSnackbar(err?.message, { variant: 'error' });
                })}}>
                {t('login.proceedButton')}
        </Button>

    </Box>
  );
}