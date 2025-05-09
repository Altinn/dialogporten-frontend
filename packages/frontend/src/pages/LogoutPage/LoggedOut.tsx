import { useTranslation } from 'react-i18next';
import styles from './logout.module.css';

export const LoggedOut = () => {
  const { t } = useTranslation();
  return (
    <main className={styles.logout}>
      <h1>{t('logout.title')}</h1>
    </main>
  );
};
