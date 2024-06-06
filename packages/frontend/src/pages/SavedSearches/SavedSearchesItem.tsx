import { DropdownMenu } from '@digdir/designsystemet-react';
import { ChevronRightIcon, EllipsisHorizontalIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PencilIcon } from '@navikt/aksel-icons';
import { SavedSearchesFieldsFragment } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { compressQueryParams } from '../Inbox/Inbox';
import styles from './savedSearches.module.css';

interface SavedSearchesItemProps {
  savedSearch?: SavedSearchesFieldsFragment;
  onDelete?: (id: number) => void;
  setSelectedSavedSearch?: (savedSearch: SavedSearchesFieldsFragment) => void;
}

const RenderButtons = ({ savedSearch, onDelete, setSelectedSavedSearch }: SavedSearchesItemProps) => {
  const { t } = useTranslation();
  if (!savedSearch?.data) return null;
  const handleOpenEditModal = () => {
    console.log('Opening edit modal...', { savedSearch, onDelete, setSelectedSavedSearch });
    setSelectedSavedSearch?.(savedSearch);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <DropdownMenu>
        <DropdownMenu.Trigger className={styles.linkButton}>
          <EllipsisHorizontalIcon className={styles.icon} />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Group>
            <DropdownMenu.Item onClick={handleOpenEditModal}>
              <PencilIcon fontSize="1.5rem" aria-hidden="true" /> {t('savedSearches.change_name')}
            </DropdownMenu.Item>
            <DropdownMenu.Item onClick={() => onDelete?.(savedSearch.id)}>
              <TrashIcon className={styles.icon} aria-hidden="true" />
              {t('savedSearches.delete_search')}
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu>
      <a href={`inbox?data=${compressQueryParams(savedSearch.data)}`}>
        <ChevronRightIcon className={styles.icon} />
      </a>
    </div>
  );
};

export const SavedSearchesItem = ({ savedSearch, onDelete, setSelectedSavedSearch }: SavedSearchesItemProps) => {
  if (!savedSearch?.data) return null;
  const searchData = savedSearch.data;

  if (savedSearch.name)
    return (
      <>
        <div className={styles.savedSearchItem} key={savedSearch.id}>
          <div className={styles.searchDetails}>{savedSearch.name}</div>
          <RenderButtons
            setSelectedSavedSearch={setSelectedSavedSearch}
            savedSearch={savedSearch}
            onDelete={onDelete}
          />
        </div>
        <hr />
      </>
    );

  console.log(savedSearch);

  return (
    <>
      <div className={styles.savedSearchItem} key={savedSearch.id}>
        <div className={styles.searchDetails}>
          <span className={styles.searchString}>{searchData?.searchString && `«${searchData.searchString}»`}</span>
          {searchData?.searchString && `${searchData.filters?.length ? ' + ' : ''}`}
          {searchData?.filters?.map((search, index) => {
            const id = search?.id;
            return (
              <span key={`${id}${index}`} className={styles.filterElement}>{`${index === 0 ? '' : ' +'} ${
                search?.value
              }`}</span>
            );
          })}
        </div>
        <RenderButtons
          key={savedSearch.id}
          setSelectedSavedSearch={setSelectedSavedSearch}
          savedSearch={savedSearch}
          onDelete={onDelete}
        />
      </div>
      <hr />
    </>
  );
};
