import type { DialogStatusProps, DialogStatusValue } from '@altinn/altinn-components';
import type { DialogStatus } from 'bff-types-generated';
import type { TFunction } from 'i18next';

export const getDialogStatus = (
  status: DialogStatus,
  t: TFunction<'translation', undefined>,
): DialogStatusProps | undefined => {
  if (status === 'NEW') {
    return undefined;
  }
  const statusValue = status.replace(/_/g, '-').toLowerCase() as unknown as DialogStatusValue;
  return {
    label: t(`filter.query.${status.toLowerCase()}`),
    value: statusValue,
  };
};
