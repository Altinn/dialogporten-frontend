import { Button } from '@altinn/altinn-components';
import { FileCsvIcon } from '@navikt/aksel-icons';
import type { ButtonHTMLAttributes, RefAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import { buildDialogCsvRows, downloadCsv, serializeCsv, toCsvFileName } from '../../pages/Inbox/exportDialogsCsv.ts';
import type { InboxItemInput } from '../../pages/Inbox/InboxItemInput.ts';
import styles from './exportSearchResultsButton.module.css';

export type ExportSearchResultsButtonProps = {
  hidden?: boolean;
  items: InboxItemInput[];
  fileNameBase: string;
  variant?: 'ghost' | 'outline';
} & ButtonHTMLAttributes<HTMLButtonElement> &
  RefAttributes<HTMLButtonElement>;

export const ExportSearchResultsButton = ({
  hidden,
  className,
  items,
  fileNameBase,
  variant = 'ghost',
}: ExportSearchResultsButtonProps) => {
  const { t } = useTranslation();
  const format = useFormat();

  if (hidden || items.length === 0) {
    return null;
  }

  const onExport = () => {
    const rows = buildDialogCsvRows(items, {
      t,
      formatDateTime: (date) => format(date, 'Pp'),
      formatDate: (date) => format(date, 'P'),
    });
    downloadCsv(toCsvFileName(fileNameBase, format(new Date(), 'yyyy-MM-dd')), serializeCsv(rows));
  };

  return (
    <div className={styles.wrapper}>
      <Button
        size="xs"
        className={className}
        onClick={onExport}
        variant={variant}
        aria-label={t('filter_bar.export_results_aria', { count: items.length })}
      >
        <FileCsvIcon />
        <span>{t('filter_bar.export_results')}</span>
      </Button>
    </div>
  );
};
