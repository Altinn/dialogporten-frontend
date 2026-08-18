import { Button } from '@altinn/altinn-components';
import { DownloadIcon } from '@navikt/aksel-icons';
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
} & ButtonHTMLAttributes<HTMLButtonElement> &
  RefAttributes<HTMLButtonElement>;

export const ExportSearchResultsButton = ({
  hidden,
  className,
  items,
  fileNameBase,
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
        size="sm"
        className={className}
        onClick={onExport}
        variant="ghost"
        aria-label={t('inbox.export.button_aria', { count: items.length })}
      >
        <DownloadIcon />
        {t('inbox.export.button')}
      </Button>
    </div>
  );
};
