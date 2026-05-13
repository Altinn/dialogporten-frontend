import { Fieldset, Legend, Radio } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';

const LANGUAGES = ['nb', 'nn', 'en'];

interface LanguageSettingsContentProps {
  selectedLanguage: string;
  onSelect: (language: string) => void;
}

export const LanguageSettingsContent = ({ selectedLanguage, onSelect }: LanguageSettingsContentProps) => {
  const { t } = useTranslation();
  return (
    <Fieldset size="sm">
      <Legend>{t('profile.settings.language_change_legend')}</Legend>
      {LANGUAGES.map((value) => (
        <Radio
          key={value}
          name="locale"
          label={t('word.locale.' + value)}
          value={value}
          checked={value === selectedLanguage}
          onChange={() => onSelect(value)}
        />
      ))}
    </Fieldset>
  );
};
