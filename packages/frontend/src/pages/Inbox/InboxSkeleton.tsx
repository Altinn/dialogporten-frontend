import cx from 'classnames';
import { useRef } from 'react';
import Skeleton from 'react-loading-skeleton';
import { InboxItems } from '../../components';
import 'react-loading-skeleton/dist/skeleton.css';
import styles from './inboxSkeleton.module.css';

interface InboxSkeletonProps {
  numberOfItems: number;
  withHeader?: boolean;
  noBorder?: boolean;
}

export const InboxSkeleton: React.FC<InboxSkeletonProps> = ({
  numberOfItems,
  withHeader = false,
  noBorder = false,
}) => {
  const key = useRef<string>('inbox-skeleton' + Math.random());

  return (
    <>
      <InboxItems key={key.current}>
        {withHeader && (
          <header className={styles.inboxItemsHeader}>
            <h2>
              <Skeleton width="80px" />
            </h2>
          </header>
        )}
        {Array.from({ length: numberOfItems }).map((_, index) => (
          <li
            key={index}
            className={cx(styles.inboxItemWrapper, { [styles.noBorder]: noBorder })}
            style={{ minHeight: 196 }}
          >
            <section className={styles.inboxItem}>
              <header className={styles.header}>
                <h2 className={styles.title}>
                  <Skeleton width="400px" height="24px" />
                </h2>
              </header>
              <Skeleton width="40%" height="36px" className={styles.summary} />
              <Skeleton width="100%" className={styles.summary} />
              <div className={styles.participants}>
                <div className={styles.sender}>
                  <span>
                    <Skeleton width="80px" />
                  </span>
                </div>
                <span>
                  <Skeleton width="80px" />
                </span>
                <div className={styles.receiver}>
                  <span>
                    <Skeleton width="80px" />
                  </span>
                </div>
              </div>
            </section>
          </li>
        ))}
      </InboxItems>
    </>
  );
};
