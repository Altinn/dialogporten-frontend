import { Button } from '@digdir/designsystemet-react';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from '@navikt/aksel-icons';
import { useTranslation } from 'react-i18next';
import { DropdownList, DropdownListItem } from '../../DropdownMenu';
import type { Filter, FilterSetting, FilterValueType } from '../FilterBar.tsx';

import { DropdownMobileHeader } from '../../DropdownMenu';
import styles from './addFilterButton.module.css';

type AddFilterButtonProps = {
  settings: FilterSetting[];
  selectedFilters: Filter[];
  onListItemClick: (id: string, value: FilterValueType) => void;
  onAddBtnClick: () => void;
  onClose: () => void;
  isMenuOpen: boolean;
  disabled?: boolean;
};
export const AddFilterButton = ({
  settings,
  onListItemClick,
  disabled,
  selectedFilters,
  onAddBtnClick,
  isMenuOpen,
  onClose,
}: AddFilterButtonProps) => {
  const { t } = useTranslation();
  return (
    <div>
      <Button
        size="small"
        onClick={onAddBtnClick}
        disabled={disabled}
        variant="secondary"
        color="first"
        className={styles.addFilterButton}
      >
        <PlusIcon fontSize="1.5rem" /> {t('filter_bar.add_filter')}
      </Button>
      {isMenuOpen && (
        <DropdownList>
          <DropdownMobileHeader
            buttonIcon={<ChevronDownIcon fontSize="1.5rem" />}
            onClickButton={onClose}
            buttonText={t('filter_bar.add_filter')}
          />
          {settings.map((setting: FilterSetting) => {
            const filterActive = !!selectedFilters.find(
              (filter) => filter.id === setting.id && filter.value !== undefined,
            );
            return (
              <DropdownListItem
                key={setting.id}
                onClick={() => {
                  onListItemClick(setting.id, undefined);
                }}
                leftContent={<span className={styles.addFilterItemLabel}>{setting.label}</span>}
                rightContent={<ChevronRightIcon fontSize="1.5rem" />}
                hasHorizontalRule={setting.horizontalRule}
                isActive={filterActive}
              />
            );
          })}
        </DropdownList>
      )}
    </div>
  );
};
