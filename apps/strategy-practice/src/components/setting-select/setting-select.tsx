import type { ReactNode } from 'react';
import { MenuItem, Select } from '@mui/material';

export interface SettingOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
  // The language the label is written in, when it is not the page's.
  lang?: string
}

// The compact select the header and footer settings share. It takes the text
// colour around it, so it reads on the coloured header and the plain footer
// alike, in both themes. `icon` stands before the closed select's label in
// place of the chosen option's own.
//
// The size is set here, not inherited: the bars around it do not all set one.
// With the underline gone, the outline is what shows keyboard focus.
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
      // Where the option's own icon names it, the label is left to screen
      // readers on the narrowest phones, whose footer cannot fit it beside the
      // other select and the bug-report link.
      const labelClass = !icon && option?.icon ? 'max-[359px]:sr-only' : undefined;
      return (
        <span className="flex items-center gap-1">
          {icon ?? option?.icon}<span lang={option?.lang} className={labelClass}>{option?.label}</span>
        </span>
      );
    }}
    sx={{
      color: 'inherit',
      fontSize: '0.875rem',
      '& .MuiSvgIcon-root': { color: 'inherit' },
      '& .MuiSelect-select:focus': { backgroundColor: 'transparent' },
      '&.Mui-focused:has(:focus-visible)': {
        outline: '2px solid currentColor',
        outlineOffset: '2px',
        borderRadius: '4px'
      }
    }}
  >
    {options.map(o => (
      <MenuItem key={o.value} value={o.value}>
        <span className="flex items-center gap-2">{o.icon}<span lang={o.lang}>{o.label}</span></span>
      </MenuItem>
    ))}
  </Select>
);
