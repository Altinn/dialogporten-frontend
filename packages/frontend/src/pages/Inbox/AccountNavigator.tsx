import { Button, type ButtonSize, type MenuItemProps, Pagination, Typography } from '@altinn/altinn-components';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { MAX_DIALOG_PARTY_SIZE } from '../../api/hooks/useDialogs.tsx';
import { encodeSubAccountIds, FixedGlobalQueryParams } from './queryParams.ts';

type PaginationVariant = 'list' | 'pagination';

interface AccountNavigatorProps {
  hidden?: boolean;
  subAccounts: MenuItemProps[];
  partyIdsOverride: string[];
}
export const AccountNavigator = ({ hidden, subAccounts, partyIdsOverride }: AccountNavigatorProps) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const variant: PaginationVariant = useMemo(() => {
    return partyIdsOverride.length === 0 || partyIdsOverride?.length > MAX_DIALOG_PARTY_SIZE ? 'list' : 'pagination';
  }, [partyIdsOverride]);

  const onSelectPage = useCallback(
    (ids: string[]) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      const encoded = encodeSubAccountIds(ids);
      if (encoded) {
        nextParams.set(FixedGlobalQueryParams.subAccounts, encoded);
      } else {
        nextParams.delete(FixedGlobalQueryParams.subAccounts);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const slicedSubAccounts = useMemo(() => {
    const pages: (typeof subAccounts)[] = [];
    for (let i = 1; i < subAccounts.length; i += MAX_DIALOG_PARTY_SIZE) {
      pages.push(subAccounts.slice(i, i + MAX_DIALOG_PARTY_SIZE));
    }
    return pages;
  }, [subAccounts]);

  const sliceIds = useMemo(
    () =>
      slicedSubAccounts.map((slice) =>
        slice.map((item) => item.value).filter((v): v is string => typeof v === 'string'),
      ),
    [slicedSubAccounts],
  );

  const currentPageIndex = useMemo(() => {
    if (!partyIdsOverride.length) return -1;
    const selected = new Set(partyIdsOverride);
    return sliceIds.findIndex((ids) => ids.length === selected.size && ids.every((id) => selected.has(id)));
  }, [sliceIds, partyIdsOverride]);

  const pagination = useMemo(() => {
    const total = sliceIds.length;
    const visible = new Set<number>();
    if (total > 0) {
      visible.add(0);
      visible.add(total - 1);
      if (currentPageIndex >= 0) {
        for (const offset of [-1, 0, 1]) {
          const idx = currentPageIndex + offset;
          if (idx >= 0 && idx < total) visible.add(idx);
        }
      } else {
        if (total > 1) visible.add(1);
      }
    }

    const sorted = [...visible].sort((a, b) => a - b);
    const items: Array<Record<string, unknown>> = [];
    let prev = -1;
    for (const idx of sorted) {
      if (prev >= 0 && idx - prev > 1) {
        items.push({ hidden: true });
      }
      const slice = slicedSubAccounts[idx];
      const first = slice?.[0]?.title;
      const last = slice?.[slice.length - 1]?.title;
      const title =
        first && last && first !== last
          ? t('account_navigator.page_title_range', { number: idx + 1, first, last })
          : first
            ? t('account_navigator.page_title_single', { number: idx + 1, first })
            : t('parties.labels.page', { number: idx + 1 });
      items.push({
        id: String(idx + 1),
        label: String(idx + 1),
        title,
        'aria-label': t('parties.labels.page', { number: idx + 1 }),
        selected: idx === currentPageIndex,
        onClick: () => onSelectPage(sliceIds[idx]),
      });
      prev = idx;
    }

    return {
      'aria-label': t('account_navigator.select_page'),
      size: 'mini' as ButtonSize,
      items,
    };
  }, [sliceIds, slicedSubAccounts, currentPageIndex, onSelectPage, t]);

  if (hidden) return null;

  if (variant === 'list') {
    return (
      <Typography size="sm" variant="subtle">
        <span>{t('account_navigator.list_intro', { max: MAX_DIALOG_PARTY_SIZE })}</span>
        <ul>
          {slicedSubAccounts.map((slice, index) => {
            const first = slice[0]?.title;
            const last = slice[slice.length - 1]?.title;
            return (
              <li key={index}>
                <Button
                  variant="tinted"
                  size="mini"
                  onClick={() =>
                    onSelectPage(slice.map((item) => item.value).filter((v): v is string => typeof v === 'string'))
                  }
                >
                  {t('parties.labels.page', { number: index + 1 })}
                </Button>
                {' – '}
                <span>
                  {first}
                  {' – '}
                  {last}
                </span>
              </li>
            );
          })}
        </ul>
      </Typography>
    );
  }

  if (variant === 'pagination') {
    const slice = slicedSubAccounts?.[currentPageIndex];
    const first = slice?.[0]?.title;
    const last = slice?.[slice.length - 1]?.title;
    const singleSelectedTitle =
      partyIdsOverride.length === 1 ? subAccounts.find((item) => item.value === partyIdsOverride[0])?.title : undefined;
    return (
      <Typography size="sm" variant="subtle">
        <Pagination {...pagination} />
        {singleSelectedTitle ? (
          <>
            {' – '}
            {t('account_navigator.showing_content_from')} {singleSelectedTitle}
          </>
        ) : first ? (
          <>
            {' – '}
            {t('account_navigator.showing_content_from')} {first}
            {first !== last && (
              <>
                {' – '}
                {last}
              </>
            )}
          </>
        ) : (
          <>
            {' – '}
            {t('account_navigator.showing_content_from_count', {
              selected: partyIdsOverride.length,
              total: subAccounts.length,
            })}
          </>
        )}
      </Typography>
    );
  }
};
