import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';
import { SettingSelect } from '../theme';
import { useLanguage } from './language-context';

export const LanguageSelector = () => {
  const { t } = useTranslation('settings');
  const { language, setLanguage } = useLanguage();
  return (
    <SettingSelect
      value={language}
      onChange={setLanguage}
      label={t('language')}
      icon={<LanguageIcon fontSize="small" />}
      // Each in its own language, so a reader of the other one finds theirs.
      options={[{ value: 'hu', label: 'Magyar' }, { value: 'en', label: 'English' }]}
    />
  );
};
