import { Button, ButtonGroup } from '@altinn/altinn-components';
import { PadlockLockedIcon } from '@navikt/aksel-icons';
import { useTranslation } from 'react-i18next';
import { Analytics } from '../../analytics/analytics.ts';
import { ANALYTICS_EVENTS } from '../../analytics/analyticsEvents.ts';
import type { TransmissionNavigationalActionProps } from '../../utils/transmissions.ts';
import styles from './dialogDetails.module.css';

interface TransmissionNavigationalActionsProps {
  items?: TransmissionNavigationalActionProps[];
}

export const TransmissionNavigationalActions = ({ items }: TransmissionNavigationalActionsProps) => {
  const { t } = useTranslation();

  if (!items?.length) {
    return null;
  }

  const trackClick = (label: string) => {
    Analytics.trackEvent(ANALYTICS_EVENTS.DIALOG_TRANSMISSION_NAVIGATIONAL_ACTION_CLICK, {
      'action.title': label,
      'navigationalActions.totalCount': items.length,
    });
    Analytics.flush();
  };

  return (
    <div className={styles.transmissionNavigationalActions}>
      <ButtonGroup wrap>
        {items.map(({ id, label, href, disabledReason }) => (
          <Button
            key={id}
            size="sm"
            variant="outline"
            as={disabledReason ? 'button' : 'a'}
            href={disabledReason ? undefined : href}
            aria-disabled={!!disabledReason}
            data-tooltip={disabledReason && t(`transmission.navigational_action.${disabledReason}`)}
            onClick={disabledReason ? undefined : () => trackClick(label)}
            className={styles.dialogActionButton}
          >
            {disabledReason === 'unauthorized' && <PadlockLockedIcon aria-hidden />}
            {label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
};
