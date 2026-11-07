import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { useTranslation } from 'react-i18next';
import { useTheme } from './theme-context';
import { SettingSelect } from '../components/setting-select/setting-select';

export const ThemeSwitcher = () => {
  const { t } = useTranslation('settings');
  const { theme, setTheme } = useTheme();
  return (
    <SettingSelect
      value={theme}
      onChange={setTheme}
      label={t('theme.label')}
      options={[
        { value: 'light', label: t('theme.light'), icon: <LightModeOutlinedIcon fontSize="small" /> },
        { value: 'system', label: t('theme.system'), icon: <SettingsBrightnessOutlinedIcon fontSize="small" /> },
        { value: 'dark', label: t('theme.dark'), icon: <DarkModeOutlinedIcon fontSize="small" /> }
      ]}
    />
  );
};
