import type { DialogStatusProps, DialogStatusValue } from '@altinn/altinn-components';
import {
  type DialogByIdFieldsFragment,
  type DialogStatus,
  type SearchDialogFieldsFragment,
  SystemLabel,
} from 'bff-types-generated';
import type { TFunction } from 'i18next';
import { ServiceResourceType } from '../../constants/serviceResourceType.ts';

export const getDialogStatus = (
  status: DialogStatus,
  t: TFunction<'translation', undefined>,
): DialogStatusProps | undefined => {
  const statusValue = status.replace(/_/g, '-').toLowerCase() as unknown as DialogStatusValue;
  return {
    label: t(`filter.query.${status.toLowerCase()}`),
    value: statusValue,
  };
};

export const getIsUnread = (item: SearchDialogFieldsFragment | DialogByIdFieldsFragment) => {
  if (item?.endUserContext?.systemLabels.includes(SystemLabel.MarkedAsUnopened)) {
    return true;
  }
  if (item.serviceResourceType === ServiceResourceType.Correspondence) {
    return item.seenSinceLastContentUpdate.length === 0 && item.hasUnopenedContent;
  }
  return item.seenSinceLastContentUpdate.length === 0;
};
