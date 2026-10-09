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
import { Analytics } from '../../analytics/analytics.ts';
import { ANALYTICS_EVENTS } from '../../analytics/analyticsEvents.ts';
import { forwardCorrespondence } from '../../api/forwardCorrespondence.ts';
import { useCorrespondenceForwardingCheck } from '../../api/hooks/useCorrespondenceForwardingCheck.ts';
import { getInvalidRecipients, parseRecipients } from './recipients.ts';

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
  const { t, i18n } = useTranslation();
  const { openSnackbar } = useSnackbar();
  const formId = useId();
  const { isLoading, allowed, correspondenceId } = useCorrespondenceForwardingCheck(dialogId, { enabled: isOpen });
  const [forwardTo, setForwardTo] = useState('');
  const [forwardingText, setForwardingText] = useState('');
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canForward = !isLoading && allowed && !!correspondenceId;
  const isNotAllowed = !isLoading && !canForward;
  const recipients = parseRecipients(forwardTo);
  const invalidRecipients = getInvalidRecipients(recipients);
  const formatList = (items: string[]) =>
    new Intl.ListFormat(i18n.language, { style: 'long', type: 'conjunction' }).format(items);

  const emailError = !isEmailTouched
    ? undefined
    : recipients.length === 0
      ? t('dialog.forward.email_required')
      : invalidRecipients.length > 0
        ? t('dialog.forward.email_invalid', {
            count: invalidRecipients.length,
            recipients: formatList(invalidRecipients),
          })
        : undefined;

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
    if (recipients.length === 0 || invalidRecipients.length > 0) {
      setIsEmailTouched(true);
      event.currentTarget.querySelector<HTMLInputElement>('input[name="forwardTo"]')?.focus();
      return;
    }

    setIsSubmitting(true);
    Analytics.trackEvent(ANALYTICS_EVENTS.DIALOG_FORWARD_SUBMIT, {
      'dialog.id': dialogId ?? '',
      'forward.recipientCount': recipients.length,
    });
    const results = await forwardCorrespondence(
      { correspondenceId, forwardTo: recipients, forwardingText: forwardingText.trim() || undefined },
      dialogToken,
      refreshDialogToken,
    );
    setIsSubmitting(false);

    const forwarded = results.filter((result) => result.ok).map((result) => result.forwardTo);
    if (forwarded.length > 0) {
      openSnackbar({
        message: t('dialog.forward.success', { count: forwarded.length, recipient: forwarded[0] }),
        color: 'company',
        duration: SnackbarDuration.normal,
      });
    }

    const failedByMessageKey = new Map<string, string[]>();
    for (const result of results) {
      if (!result.ok) {
        const messageKey = getForwardErrorMessageKey(result.errorCode);
        failedByMessageKey.set(messageKey, [...(failedByMessageKey.get(messageKey) ?? []), result.forwardTo]);
      }
    }
    for (const [messageKey, failed] of failedByMessageKey) {
      openSnackbar({
        message: t(messageKey, { count: failed.length, recipient: failed[0] }),
        color: 'danger',
        duration: SnackbarDuration.normal,
      });
    }

    if (failedByMessageKey.size === 0) {
      handleClose();
      return;
    }
    setForwardTo(
      results
        .filter((result) => !result.ok)
        .map((result) => result.forwardTo)
        .join('; '),
    );
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
                type="text"
                inputMode="email"
                size="sm"
                value={forwardTo}
                autoComplete="email"
                autoCapitalize="off"
                spellCheck={false}
                aria-invalid={!!emailError}
                onChange={(e) => {
                  setForwardTo(e.target.value);
                  setIsEmailTouched(false);
                }}
                onBlur={() => setIsEmailTouched(!!forwardTo.trim())}
              />
              <ValidationMessage data-size="sm" data-color={emailError ? 'danger' : 'info'}>
                {emailError ?? t('dialog.forward.email_hint')}
              </ValidationMessage>
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
