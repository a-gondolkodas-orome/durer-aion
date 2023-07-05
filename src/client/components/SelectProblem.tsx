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
          <MenuItem value={"16D-D"}>16. Döntő D</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
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