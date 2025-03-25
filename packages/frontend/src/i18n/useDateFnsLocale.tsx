import { format, formatDistance } from 'date-fns';
import { type Locale, enGB, nb } from 'date-fns/locale';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
export type { Locale } from 'date-fns/locale';

export const defaultLocale = nb;

export const useDateFnsLocale = () => {
  const { i18n } = useTranslation();

  const locale = useMemo<Locale>(() => {
    switch (i18n.language) {
      case 'en':
        return enGB;
      case 'nb':
        return nb;
      default:
        return defaultLocale;
    }
  }, [i18n.language]);

  return { locale };
};

export type FormatFunction = (date: Date | string, formatStr: string) => string;

export const useFormat = (): FormatFunction => {
  const { locale } = useDateFnsLocale();

  return useCallback(
    (date: Parameters<FormatFunction>[0], formatStr: Parameters<FormatFunction>[1]) => {
      return format(date, formatStr, { locale });
    },
    [locale],
  );
};

export type FormatDistanceFunction = typeof formatDistance;

export const useFormatDistance = () => {
  const { locale } = useDateFnsLocale();

  return useCallback(
    (
      date: Parameters<FormatDistanceFunction>[0],
      baseDate: Parameters<FormatDistanceFunction>[1],
      options: Parameters<FormatDistanceFunction>[2],
    ) => {
      return formatDistance(date, baseDate, { ...options, locale });
    },
    [locale],
  );
};
