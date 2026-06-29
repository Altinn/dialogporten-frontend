import {
  Button,
  ButtonGroup,
  Field,
  Input,
  Label,
  SnackbarDuration,
  Typography,
  DsValidationMessage as ValidationMessage,
  useSnackbar,
} from '@altinn/altinn-components';
import { FilesIcon } from '@navikt/aksel-icons';
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUsername } from './useUsername.tsx';
import styles from './usernameSetting.module.css';

const USERNAME_MAX_LENGTH = 64;
const USERNAME_REGEX = /^[a-z][a-z0-9._@-]{5,63}$/i;

interface UsernameSettingProps {
  partyUuid?: string;
}

export const UsernameSetting = ({ partyUuid }: UsernameSettingProps) => {
  const { t } = useTranslation();
  const { username, isSaving, saveUsername } = useUsername(partyUuid);
  const { openSnackbar } = useSnackbar();

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(username ?? '');
  const [touched, setTouched] = useState(false);
  const [taken, setTaken] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(username ?? '');
      setTouched(false);
      setTaken(false);
    }
  }, [open, username]);

  const trimmed = value.trim();
  const formatValid = USERNAME_REGEX.test(trimmed);
  const isChanged = trimmed !== (username ?? '');
  const canSave = formatValid && isChanged && !taken && !isSaving;

  const validation = taken
    ? { color: 'danger' as const, message: t('profile.username.taken') }
    : !trimmed || !touched
      ? { color: 'info' as const, message: t('profile.username.hint') }
      : !formatValid
        ? { color: 'danger' as const, message: t('profile.username.format_error') }
        : isChanged
          ? { color: 'success' as const, message: t('profile.username.available') }
          : { color: 'info' as const, message: t('profile.username.hint') };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    setTaken(false);
  };

  const handleCopy = () => {
    if (!value) return;
    void navigator.clipboard.writeText(value).then(() => {
      openSnackbar({ message: t('word.copied'), color: 'company', duration: SnackbarDuration.short });
    });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (!canSave) {
      event.currentTarget.querySelector<HTMLInputElement>('input[name="username"]')?.focus();
      return;
    }
    const result = await saveUsername(trimmed);
    if (result.success) {
      openSnackbar({ message: t('profile.username.saved'), color: 'company', duration: SnackbarDuration.normal });
      setOpen(false);
      return;
    }
    // TODO: Implement this based on feedback
    setTaken(true);
  };

  return (
    <>
      <Typography>
        <p>{t('profile.username.modal_description')}</p>
      </Typography>
      <form onSubmit={handleSave} className={styles.form}>
        <Field>
          <Label size="sm">{t('profile.username.input_label')}</Label>
          <Input
            name="username"
            size="sm"
            value={value}
            maxLength={USERNAME_MAX_LENGTH}
            autoComplete="off"
            aria-invalid={validation.color === 'danger'}
            onChange={handleChange}
            onBlur={() => setTouched(true)}
          />
          <ValidationMessage data-size="sm" data-color={validation.color}>
            {validation.message}
          </ValidationMessage>
        </Field>
        <ButtonGroup>
          <Button type="submit" variant="primary">
            {t('word.save')}
          </Button>
          <Button type="button" variant="outline" onClick={handleCopy}>
            <FilesIcon />
            <span>{t('word.copy')}</span>
          </Button>
        </ButtonGroup>
      </form>
    </>
  );
};
