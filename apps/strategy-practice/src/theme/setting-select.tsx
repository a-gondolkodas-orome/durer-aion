import type { ReactNode } from 'react';
import { MenuItem, Select } from '@mui/material';

export interface SettingOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

// The compact select the header and footer settings share. It takes the text
// colour around it, so it reads on the coloured header and the plain footer
// alike, in both themes. `icon` stands before the closed select's label in
// place of the chosen option's own.
export const SettingSelect = <T extends string>({ value, onChange, options, label, icon }: {
  value: T
  onChange: (value: T) => void
  options: SettingOption<T>[]
  label: string
  icon?: ReactNode
}) => (
  <Select<T>
    value={value}
    onChange={e => onChange(e.target.value as T)}
    variant="standard"
    disableUnderline
    inputProps={{ 'aria-label': label }}
    renderValue={chosen => {
      const option = options.find(o => o.value === chosen);
      return <span className="flex items-center gap-1">{icon ?? option?.icon}{option?.label}</span>;
    }}
    sx={{ color: 'inherit', fontSize: 'inherit', '& .MuiSvgIcon-root': { color: 'inherit' } }}
  >
    {options.map(o => (
      <MenuItem key={o.value} value={o.value}>
        <span className="flex items-center gap-2">{o.icon}{o.label}</span>
      </MenuItem>
    ))}
  </Select>
);
