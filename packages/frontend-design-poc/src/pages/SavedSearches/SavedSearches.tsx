import { useTranslation } from 'react-i18next';
import styles from './savedSearches.module.css';
import { useQuery, useQueryClient } from 'react-query';
import { getSavedSearches } from '../../api/queries';
import { Filter } from '../../components/FilterBar';
import { SavedSearchesItem } from './SavedSearchesItem';
import axios from 'axios';

export const useSavedSearches = () => useQuery('savedSearches', getSavedSearches);

interface LastUpdatedProps {
  searches: SavedSearchDTO[] | undefined;
}

const autoFormatRelativeTime = (date: Date, locale = 'nb-NO'): string => {
  try {
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
    const absDiffInSeconds = Math.abs(diffInSeconds);

    let value: number;
    let unit: Intl.RelativeTimeFormatUnit;

    if (absDiffInSeconds < 60) {
      value = -Math.round(diffInSeconds);
      unit = 'second';
    } else if (absDiffInSeconds < 3600) {
      value = -Math.round(diffInSeconds / 60);
      unit = 'minute';
    } else if (absDiffInSeconds < 86400) {
      value = -Math.round(diffInSeconds / 3600);
      unit = 'hour';
    } else if (absDiffInSeconds < 2629800) {
      value = -Math.round(diffInSeconds / 86400);
      unit = 'day';
    } else if (absDiffInSeconds < 31557600) {
      value = -Math.round(diffInSeconds / 2629800);
      unit = 'month';
    } else {
      value = -Math.round(diffInSeconds / 31557600);
      unit = 'year';
    }

    const rtf = new Intl.RelativeTimeFormat(locale, {
      numeric: 'auto',
    });

    return rtf.format(value, unit);
  } catch (error) {
    console.error('autoFormatRelativeTime Error: ', error);
    return '';
  }
};

function getMostRecentSearchDate(searches: SavedSearchDTO[]): Date | null {
  if (searches.length === 0) {
    return null;
  }

  const timestamp = searches.reduce((latest, search) => {
    return search.updatedAt > latest.updatedAt ? search : latest;
  }).updatedAt;

  return new Date(timestamp);
}

const LastUpdated = ({ searches }: LastUpdatedProps) => {
  const { t } = useTranslation();
  if (!searches || !searches?.length) return null;
  const lastUpdated = getMostRecentSearchDate(searches) as Date;

  return (
    <div className={styles.lastUpdated}>
      {t('savedSearches.lastUpdated')}
      {autoFormatRelativeTime(lastUpdated)}
    </div>
  );
};

export interface SavedSearch {
  name: string;
  data?: SavedSearchData;
  searchString?: string;
}

export interface SavedSearchDTO {
  id: number;
  name: string;
  data?: SavedSearchData;
  searchString?: string;
  updatedAt: string;
  createdAt: string;
}

export interface SavedSearchData {
  filters?: Filter[];
  searchString?: string;
}

export const SavedSearches = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data: savedSearches } = useSavedSearches();

  const handleDeleteSearch = (id: number) => {
    if (!savedSearches) return;

    axios
      .delete('/api/saved-search', {
        headers: { savedsearchid: id },
      })
      .then((r) => {
        queryClient.invalidateQueries('savedSearches');
      });
  };

  return (
    <main>
      <section className={styles.savedSearchesWrapper}>
        <div className={styles.title}>{t('savedSearches.title', { count: savedSearches?.length || 0 })}</div>
        <div className={styles.savedSearchesContainer}>
          {savedSearches?.map((search) => (
            <SavedSearchesItem key={search.id} savedSearch={search} onDelete={handleDeleteSearch} />
          ))}
        </div>
        <LastUpdated searches={savedSearches} />
      </section>
    </main>
  );
};
