import { Button, type ButtonProps, Spinner } from '@digdir/designsystemet-react';
import cx from 'classnames';

import { useTranslation } from 'react-i18next';
import styles from './profileButton.module.css';

type ProfileButtonProps = {
  isLoading?: boolean;
} & Omit<ButtonProps, 'size'>;

export const ProfileButton = (props: ProfileButtonProps) => {
  const { t } = useTranslation();
  const { className, isLoading, children, variant = 'tertiary', ...restProps } = props;
  const classes = cx(className, styles.profileButton, {
    [styles.tertiary]: variant === 'tertiary',
  });

  if (isLoading) {
    return (
      <Button className={classes} {...restProps} aria-disabled data-size="sm">
        <Spinner aria-label="loading" fontSize="0.875rem" />
        {t('word.loading')}
      </Button>
    );
  }

  return (
    <Button className={classes} {...restProps}>
      {children}
    </Button>
  );
};
