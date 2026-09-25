import {
  DsSpinner,
  Field,
  Input,
  Label,
  Section,
  SettingsModal,
  type SettingsModalButtonProps,
  SnackbarDuration,
  Textarea,
  Typography,
  useSnackbar,
  DsValidationMessage as ValidationMessage,
} from '@altinn/altinn-components';
import { type FormEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { forwardCorrespondence } from '../../api/forwardCorrespondence.ts';
import { useCorrespondenceForwardingCheck } from '../../api/hooks/useCorrespondenceForwardingCheck.ts';
import { isValidEmail } from '../../pages/Profile/AccountAlerts/email.ts';

const FORWARDING_TEXT_MAX_LENGTH = 200;

interface ForwardDialogModalProps {
  dialogId: string | undefined;
  dialogToken: string | undefined;
  refreshDialogToken: () => Promise<string | undefined>;
  isOpen: boolean;
  onClose: () => void;
}

export const getForwardErrorMessageKey = (errorCode?: number): string => {
  switch (errorCode) {
    case 1064:
      return 'dialog.forward.error.already_forwarded';
    case 1065:
      return 'dialog.forward.error.not_read';
    case 1066:
    case 1067:
      return 'dialog.forward.error.invalid_message';
    case 3011:
    case 3027:
      return 'dialog.forward.error.invalid_email';
    default:
      return 'dialog.forward.error.generic';
  }
};

export const ForwardDialogModal = ({
  dialogId,
  dialogToken,
  refreshDialogToken,
  isOpen,
  onClose,
}: ForwardDialogModalProps) => {
  const { t } = useTranslation();
  const { openSnackbar } = useSnackbar();
  const formId = useId();
  const { isLoading, allowed, correspondenceId } = useCorrespondenceForwardingCheck(dialogId, { enabled: isOpen });
  const [forwardTo, setForwardTo] = useState('');
  const [forwardingText, setForwardingText] = useState('');
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canForward = !isLoading && allowed && !!correspondenceId;
  const isNotAllowed = !isLoading && !canForward;
  const isEmailInvalid = isEmailTouched && !isValidEmail(forwardTo);

  const handleClose = () => {
    setForwardTo('');
    setForwardingText('');
    setIsEmailTouched(false);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!correspondenceId || isSubmitting) {
      return;
    }
    if (!isValidEmail(forwardTo)) {
      setIsEmailTouched(true);
      event.currentTarget.querySelector<HTMLInputElement>('input[name="forwardTo"]')?.focus();
      return;
    }

    setIsSubmitting(true);
    const email = forwardTo.trim();
    const result = await forwardCorrespondence(
      { correspondenceId, forwardTo: email, forwardingText: forwardingText.trim() || undefined },
      dialogToken,
      refreshDialogToken,
    );
    setIsSubmitting(false);

    if (result.ok) {
      openSnackbar({
        message: t('dialog.forward.success', { email }),
        color: 'company',
        duration: SnackbarDuration.normal,
      });
      handleClose();
      return;
    }

    openSnackbar({
      message: t(getForwardErrorMessageKey(result.errorCode)),
      color: 'danger',
      duration: SnackbarDuration.normal,
    });
  };

  const buttons: SettingsModalButtonProps[] = canForward
    ? [
        {
          label: t('dialog.forward.submit'),
          type: 'submit',
          form: formId,
          loading: isSubmitting,
          disabled: isSubmitting,
        },
        {
          label: t('word.cancel'),
          variant: 'outline',
          close: true,
        },
      ]
    : [
        {
          label: t('word.close'),
          variant: 'outline',
          close: true,
        },
      ];

  return (
    <SettingsModal
      variant="content"
      title={isNotAllowed ? t('dialog.forward.not_allowed.title') : t('dialog.forward.title')}
      open={isOpen}
      onClose={handleClose}
      buttons={buttons}
    >
      {isLoading ? (
        <DsSpinner aria-label={t('word.loading')} />
      ) : canForward ? (
        <form id={formId} onSubmit={handleSubmit} noValidate>
          <Section spacing={6}>
            <Field>
              <Label size="sm">{t('dialog.forward.email_label')}</Label>
              <Input
                name="forwardTo"
                type="email"
                size="sm"
                value={forwardTo}
                autoComplete="email"
                aria-invalid={isEmailInvalid}
                onChange={(e) => {
                  setForwardTo(e.target.value);
                  setIsEmailTouched(false);
                }}
                onBlur={() => setIsEmailTouched(!!forwardTo)}
              />
              {isEmailInvalid && (
                <ValidationMessage data-size="sm" data-color="danger">
                  {t('dialog.forward.email_invalid')}
                </ValidationMessage>
              )}
            </Field>
            <Field>
              <Label size="sm">{t('dialog.forward.message_label')}</Label>
              <Textarea
                name="forwardingText"
                size="sm"
                rows={4}
                value={forwardingText}
                maxLength={FORWARDING_TEXT_MAX_LENGTH}
                aria-invalid={false}
                onChange={(e) => setForwardingText(e.target.value)}
              />
              <ValidationMessage data-size="sm" data-color="info">
                {t('dialog.forward.message_hint', {
                  count: FORWARDING_TEXT_MAX_LENGTH - forwardingText.length,
                })}
              </ValidationMessage>
            </Field>
          </Section>
        </form>
      ) : (
        <Typography>
          <p>{t('dialog.forward.not_allowed.body', { menuItem: t('altinn.delegate_access') })}</p>
        </Typography>
      )}
    </SettingsModal>
  );
};
