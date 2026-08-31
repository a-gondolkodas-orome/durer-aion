import { useLanguage } from 'engine/react';
import { LanguageDropdown } from 'common-frontend';

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <LanguageDropdown
      language={language}
      onLanguageChange={setLanguage}
      fontColor="white"
      borderColor="transparent"
      size="small"
    />
  );
};
