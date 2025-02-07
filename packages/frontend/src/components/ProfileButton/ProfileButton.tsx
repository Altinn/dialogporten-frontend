import { Button, type ButtonProps, Spinner } from '@digdir/designsystemet-react';
import cx from 'classnames';

import { useTranslation } from 'react-i18next';
import styles from './profileButton.module.css';

type ProfileButtonProps = {
  isLoading?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
} & Omit<ButtonProps, 'size'>;

export const ProfileButton = (props: ProfileButtonProps) => {
  const { t } = useTranslation();
  const { className, isLoading, children, variant = 'tertiary', size, ...restProps } = props;
  const classes = cx(className, styles.profileButton, {
    [styles.tertiary]: variant === 'tertiary',
    [styles.xs]: size === 'xs',
  });

  if (isLoading) {
    return (
      <Button className={classes} {...restProps} aria-disabled>
        <Spinner title="loading" size="sm" />
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
