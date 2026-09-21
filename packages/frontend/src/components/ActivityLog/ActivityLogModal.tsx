import {
  ActivityLog,
  type ActivityLogSegmentProps,
  activityLogKinds,
  type FilterGroups,
  type MenuItemProps,
  Modal,
  ModalBody,
  ModalHeader,
  Toolbar,
  ToolbarFilterMenu,
  ToolbarSearch,
  Typography,
} from '@altinn/altinn-components';
import { type ChangeEvent, type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFeatureFlag } from '../../featureFlags';
import type { ActivityLogEntryType } from '../../utils/activities.tsx';

const filterName = 'kind';
const allKinds = 'ALL_KINDS';

const kindOrder: ActivityLogEntryType[] = ['activity', 'transmission', 'notification', 'label'];

const kindLabelKeys: Record<ActivityLogEntryType, string> = {
  activity: 'dialog.activity_log.filter.activity',
  transmission: 'dialog.activity_log.filter.transmission',
  notification: 'dialog.activity_log.filter.notification',
  label: 'dialog.activity_log.filter.label',
};

const EmptyState = ({ children }: { children: ReactNode }) => (
  <Typography variant="subtle" size="sm">
    <p>{children}</p>
  </Typography>
);

export interface ActivityLogModalProps {
  title: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  items: ActivityLogSegmentProps[];
  id?: string;
}

export const ActivityLogModal = ({ title, items, isOpen, setIsOpen }: ActivityLogModalProps) => {
  const { t } = useTranslation();
  const enableFilter = useFeatureFlag<boolean>('dialogDetails.enableActivityLogFilter');
  const [selectedKinds, setSelectedKinds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');

  const availableKinds = useMemo(() => {
    const present = new Set(activityLogKinds(items));
    return kindOrder.filter((kind) => present.has(kind));
  }, [items]);

  const filterLabel =
    selectedKinds.length === 0
      ? t('dialog.activity_log.filter.all')
      : selectedKinds.length === 1
        ? t(kindLabelKeys[selectedKinds[0] as ActivityLogEntryType])
        : t('dialog.activity_log.filter.count', { count: selectedKinds.length });

  const filterGroups: FilterGroups = useMemo(
    () => ({
      all: { title: t('dialog.activity_log.filter.group') },
      kinds: {},
    }),
    [t],
  );

  const filterItems: MenuItemProps[] = useMemo(
    () => [
      {
        id: allKinds,
        groupId: 'all',
        name: filterName,
        role: 'radio',
        value: allKinds,
        title: t('dialog.activity_log.filter.all'),
        checked: selectedKinds.length === 0,
      },
      ...availableKinds.map((kind) => ({
        id: kind,
        groupId: 'kinds',
        name: filterName,
        role: 'checkbox',
        value: kind,
        title: t(kindLabelKeys[kind]),
        count: items.filter((item) => item.kind === kind).length,
        checked: selectedKinds.includes(kind),
      })),
    ],
    [availableKinds, items, selectedKinds, t],
  );

  const onReset = () => {
    setSelectedKinds([]);
    setQuery('');
  };

  const onClose = () => {
    onReset();
    setFilterOpen(false);
    setIsOpen(false);
  };

  return (
    <Modal padding={0} spacing={0} open={isOpen} onClose={onClose} variant="content">
      <ModalHeader title={title} onClose={onClose} closeTitle={t('word.close')} sticky={false} />
      <ModalBody>
        {enableFilter && items.length > 0 && (
          <Toolbar>
            <ToolbarSearch
              name="activity-log-search"
              label={t('dialog.activity_log.search.label')}
              hideLabel
              placeholder={t('dialog.activity_log.search.placeholder')}
              clearButtonAltText={t('dialog.activity_log.search.clear')}
              value={query}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
              onClear={() => setQuery('')}
            />
            {availableKinds.length > 1 && (
              <ToolbarFilterMenu
                name={filterName}
                items={filterItems}
                groups={filterGroups}
                label={filterLabel}
                title={t('dialog.activity_log.filter.title')}
                open={filterOpen}
                onToggle={() => setFilterOpen((open) => !open)}
                onClose={() => setFilterOpen(false)}
                onFilterChange={(type, _name, value) => {
                  if (type === 'radio') {
                    setSelectedKinds([]);
                    return;
                  }
                  setSelectedKinds((prev) => {
                    const next = prev.includes(value) ? prev.filter((k) => k !== value) : [...prev, value];
                    return next.length === availableKinds.length ? [] : next;
                  });
                }}
              />
            )}
          </Toolbar>
        )}
        <ActivityLog
          items={items}
          kind={selectedKinds}
          query={query}
          emptyState={<EmptyState>{t('dialog.activity_log.empty')}</EmptyState>}
          noResultsState={<EmptyState>{t('dialog.activity_log.no_results')}</EmptyState>}
          style={{ maxHeight: '60vh', overflowY: 'auto' }}
        />
      </ModalBody>
    </Modal>
  );
};
