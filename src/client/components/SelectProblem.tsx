import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useState } from 'react';
import { Button } from '@mui/material';
import theme from './theme';
import { useSnackbar } from 'notistack';
import { useLogin } from '../hooks/user-hooks';




export default function SelectProblem() {
  const [age, setAge] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const login = useLogin()

  const handleChange = (event: SelectChangeEvent) => {
    setAge(event.target.value as string);
  };

  return (
    <Box sx={{ minWidth: 300, marginTop: 3 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Forduló</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={age}
          label="Forduló"
          onChange={handleChange}
        >
          <MenuItem value={"1_D_B"}>1. Döntő B</MenuItem>
          <MenuItem value={"1_D_C"}>1. Döntő C</MenuItem>
          <MenuItem value={"1_D_D"}>1. Döntő D</MenuItem>
          <MenuItem value={"2_D_B"}>2. Döntő B</MenuItem>
          <MenuItem value={"2_D_C"}>2. Döntő C</MenuItem>
          <MenuItem value={"2_D_D"}>2. Döntő D</MenuItem>
          <MenuItem value={"3_D_B"}>3. Döntő B</MenuItem>
          <MenuItem value={"3_D_C"}>3. Döntő C</MenuItem>
          <MenuItem value={"3_D_D"}>3. Döntő D</MenuItem>
          <MenuItem value={"4_D_B"}>4. Döntő B</MenuItem>
          <MenuItem value={"4_D_C"}>4. Döntő C</MenuItem>
          <MenuItem value={"4_D_D"}>4. Döntő D</MenuItem>
          <MenuItem value={"5_D_A"}>5. Döntő A</MenuItem>
          <MenuItem value={"5_D_B"}>5. Döntő B</MenuItem>
          <MenuItem value={"5_D_C"}>5. Döntő C</MenuItem>
          <MenuItem value={"5_D_D"}>5. Döntő D</MenuItem>
          <MenuItem value={"6_D_A"}>6. Döntő A</MenuItem>
          <MenuItem value={"6_D_B"}>6. Döntő B</MenuItem>
          <MenuItem value={"6_D_C"}>6. Döntő C</MenuItem>
          <MenuItem value={"6_D_D"}>6. Döntő D</MenuItem>
          <MenuItem value={"7_D_A"}>7. Döntő A</MenuItem>
          <MenuItem value={"7_D_B"}>7. Döntő B</MenuItem>
          <MenuItem value={"7_D_C"}>7. Döntő C</MenuItem>
          <MenuItem value={"7_H_A"}>7. Helyi A</MenuItem>
          <MenuItem value={"7_H_B"}>7. Helyi B</MenuItem>
          <MenuItem value={"8_D_A"}>8. Döntő A</MenuItem>
          <MenuItem value={"8_D_B"}>8. Döntő B</MenuItem>
          <MenuItem value={"8_D_C"}>8. Döntő C</MenuItem>
          <MenuItem value={"8_D_D"}>8. Döntő D</MenuItem>
          <MenuItem value={"8_H_A"}>8. Helyi A</MenuItem>
          <MenuItem value={"8_H_B"}>8. Helyi B</MenuItem>
          <MenuItem value={"9_D_A"}>9. Döntő A</MenuItem>
          <MenuItem value={"9_D_B"}>9. Döntő B</MenuItem>
          <MenuItem value={"9_D_C"}>9. Döntő C</MenuItem>
          <MenuItem value={"9_D_Cp"}>9. Döntő Cp</MenuItem>
          <MenuItem value={"9_D_D"}>9. Döntő D</MenuItem>
          <MenuItem value={"9_D_Dp"}>9. Döntő Dp</MenuItem>
          <MenuItem value={"9_H_A"}>9. Helyi A</MenuItem>
          <MenuItem value={"9_H_B"}>9. Helyi B</MenuItem>
          <MenuItem value={"10_D_A"}>10. Döntő A</MenuItem>
          <MenuItem value={"10_D_B"}>10. Döntő B</MenuItem>
          <MenuItem value={"10_D_C"}>10. Döntő C</MenuItem>
          <MenuItem value={"10_D_Cp"}>10. Döntő Cp</MenuItem>
          <MenuItem value={"10_D_D"}>10. Döntő D</MenuItem>
          <MenuItem value={"10_D_Dp"}>10. Döntő Dp</MenuItem>
          <MenuItem value={"10_H_A"}>10. Helyi A</MenuItem>
          <MenuItem value={"10_H_B"}>10. Helyi B</MenuItem>
          <MenuItem value={"11_D_A"}>11. Döntő A</MenuItem>
          <MenuItem value={"11_D_B"}>11. Döntő B</MenuItem>
          <MenuItem value={"11_D_C"}>11. Döntő C</MenuItem>
          <MenuItem value={"11_D_Cp"}>11. Döntő Cp</MenuItem>
          <MenuItem value={"11_D_D"}>11. Döntő D</MenuItem>
          <MenuItem value={"11_D_Dp"}>11. Döntő Dp</MenuItem>
          <MenuItem value={"11_H_A"}>11. Helyi A</MenuItem>
          <MenuItem value={"11_H_B"}>11. Helyi B</MenuItem>
          <MenuItem value={"12_D_A"}>12. Döntő A</MenuItem>
          <MenuItem value={"12_D_B"}>12. Döntő B</MenuItem>
          <MenuItem value={"12_D_C"}>12. Döntő C</MenuItem>
          <MenuItem value={"12_D_D"}>12. Döntő D</MenuItem>
          <MenuItem value={"12_D_E"}>12. Döntő E</MenuItem>
          <MenuItem value={"12_D_Ep"}>12. Döntő Ep</MenuItem>
          <MenuItem value={"12_H_A"}>12. Helyi A</MenuItem>
          <MenuItem value={"12_H_B"}>12. Helyi B</MenuItem>
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
                  enqueueSnackbar("Nem választottál még fordulót", { variant: 'error' });
                  return;
                }
                const res = login(age).catch(err => {
                  enqueueSnackbar(err?.message, { variant: 'error' });
                })}}>
                Tovább
        </Button>

    </Box>
  );
}