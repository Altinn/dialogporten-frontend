import { TextareaField, TextField } from '@altinn/altinn-components';
import type { ChangeEvent } from 'react';
import { setLocalization } from './builderDraft.ts';
import type { Language, Localization } from './dialogSchema.ts';

interface LocalizedFieldProps {
  label: string;
  path: string;
  helperText?: string;
  values: Localization[] | null | undefined;
  languages: Language[];
  onChange: (values: Localization[]) => void;
  multiline?: boolean;
  required?: boolean;
  type?: 'text' | 'url';
}

export const LocalizedField = ({
  label,
  path,
  helperText,
  values,
  languages,
  onChange,
  multiline,
  required,
  type = 'text',
}: LocalizedFieldProps) => (
  <>
    {languages.map((language) => {
      const props = {
        label: languages.length > 1 ? `${label} (${language})` : label,
        value: values?.find(({ languageCode }) => languageCode === language)?.value ?? '',
        required,
        helperText,
        size: 'sm' as const,
        'data-path': path,
        onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onChange(setLocalization(values, language, event.target.value)),
      };
      return multiline ? (
        <TextareaField key={language} rows={3} {...props} />
      ) : (
        <TextField key={language} type={type} {...props} />
      );
    })}
  </>
);
