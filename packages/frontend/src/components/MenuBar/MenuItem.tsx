import { ChevronRightIcon, ExternalLinkIcon } from '@navikt/aksel-icons';
import cx from 'classnames';
import classNames from 'classnames';
import type { HTMLProps } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../Badge';
import styles from './menuItem.module.css';

interface MenuItem {
  displayText?: string;
  toolTipText?: string;
  leftIcon?: React.ReactNode;
  path?: string;
  onClick?: () => void;
  count?: number;
  isExternalLink?: boolean;
  isActive?: boolean;
  isInbox?: boolean;
  isWhiteBackground?: boolean;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  useProfiledHover?: boolean;
  largeText?: boolean;
  className?: string;
  disabled?: boolean;
}

const MenuItem = (props: MenuItem) => {
  const { path, onClick, isExternalLink, leftContent, rightContent, className } = props;
  const content = <MenuItemContent {...props} />;

  if (path) {
    return (
      <Link className={styles.isLink} to={path} onClick={onClick} target={isExternalLink ? '_blank' : '_self'}>
        <li className={cx(styles.liItem, className)}>{content}</li>
      </Link>
    );
  }

  if (onClick) {
    return (
      <li className={cx(styles.isLink, styles.liItem, className)} onClick={onClick} onKeyUp={onClick}>
        {content}
      </li>
    );
  }

  if (leftContent || rightContent) {
    return <li className={styles.liItem}>{content}</li>;
  }

  return null;
};

const MenuItemContent = ({
  displayText,
  toolTipText,
  leftIcon,
  path,
  onClick,
  count,
  isExternalLink,
  isActive,
  isInbox,
  isWhiteBackground,
  leftContent,
  rightContent,
  largeText,
  useProfiledHover,
  disabled,
}: MenuItem) => {
  const hoverEnabled = typeof (path || onClick) !== 'undefined' && !isActive && !disabled;
  const hasProfiledHover = hoverEnabled && useProfiledHover;
  return (
    <div
      className={cx(styles.menuItem, classNames, {
        [styles.greyBackgroundWhenActive]: isActive && !isWhiteBackground,
        [styles.whiteBackgroundWhenActive]: isActive && isWhiteBackground,
        [styles.hasHover]: hoverEnabled,
        [styles.hasProfiledHover]: hasProfiledHover,
        [styles.disabled]: disabled,
      })}
      title={toolTipText}
    >
      <div className={cx(styles.leftContent)}>
        {leftContent}
        {(path || onClick) && (
          <>
            <div
              className={cx(styles.icon, {
                [styles.isWhiteBackground]: isWhiteBackground,
                [styles.isTransparentBackground]: !isWhiteBackground,
                [styles.isInbox]: isInbox,
              })}
              aria-hidden="true"
            >
              {leftIcon}
            </div>
            <div className={cx(styles.displayText, { [styles.largeText]: largeText })}>{displayText}</div>
          </>
        )}
      </div>
      {rightContent}
      {(path || onClick) && (
        <div>
          {isExternalLink ? (
            <ExternalLinkIcon className={styles.arrowIcon} />
          ) : count ? (
            <div className={styles.badgeWrapper}>
              <Badge label={count} variant={isInbox ? 'strong' : 'neutral'} />
            </div>
          ) : (
            count !== 0 && <ChevronRightIcon className={styles.arrowIcon} />
          )}
        </div>
      )}
    </div>
  );
};

MenuItem.LeftContent = ({
  children,
  className,
  ...restProps
}: { children: React.ReactNode } & HTMLProps<HTMLDivElement>) => (
  <div className={cx(styles.leftContent, className)} {...restProps}>
    {children}
  </div>
);

MenuItem.RightContent = ({
  children,
  className,
  ...restProps
}: { children: React.ReactNode } & HTMLProps<HTMLDivElement>) => (
  <div className={cx(styles.rightContent, className)} {...restProps}>
    {children}
  </div>
);

export default MenuItem;
