import { DsButton, type DsButtonProps, DsSpinner } from '@altinn/altinn-components';
import cx from 'classnames';

import { useTranslation } from 'react-i18next';
import styles from './profileButton.module.css';

type ProfileButtonProps = {
  isLoading?: boolean;
} & Omit<DsButtonProps, 'size'>;

export const ProfileButton = (props: ProfileButtonProps) => {
  const { t } = useTranslation();
  const { className, isLoading, children, variant = 'tertiary', ...restProps } = props;
  const classes = cx(className, styles.profileButton, {
    [styles.tertiary]: variant === 'tertiary',
  });

  if (isLoading) {
    return (
      <DsButton className={classes} {...restProps} aria-disabled data-size="sm" variant="tertiary">
        <DsSpinner aria-label="loading" fontSize="0.875rem" />
        {t('word.loading')}
      </DsButton>
    );
  }

  return (
    <DsButton className={classes} {...restProps} variant="tertiary">
      {children}
    </DsButton>
  );
};
