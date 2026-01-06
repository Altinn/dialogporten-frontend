import { useTranslation } from 'react-i18next';
import { useAuthenticatedQuery } from '../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../constants/queryKeys.ts';
import type { AlertBannerContent, AlertBannerResponse } from '../types/alertBanner.ts';

async function fetchAlertBannerContent(): Promise<AlertBannerResponse> {
  const res = await fetch('/api/alert-banner');
  if (!res.ok) {
    return {};
  }
  return res.json();
}

/**
 * Hook to fetch and use dynamic alert banner content from Azure App Configuration.
 *
 * The alert banner content is stored in Azure App Configuration as JSON strings
 * under the following keys:
 * - `alertBanner.content.nb` (Norwegian Bokmål)
 * - `alertBanner.content.nn` (Norwegian Nynorsk)
 * - `alertBanner.content.en` (English)
 *
 * ## Azure App Configuration Setup
 *
 * 1. Navigate to Azure Portal → App Configuration → Configuration Explorer
 * 2. Create key-value pairs with the keys listed above
 * 3. Set the value as a JSON string with the following structure:
 *
 * ### JSON Structure
 *
 * ```json
 * {
 *   "title": "Alert title",
 *   "description": "Alert description text",
 *   "link": {
 *     "url": "/path/to/link",
 *     "text": "Link text"
 *   }
 * }
 * ```
 *
 * - If `link` is not provided, the component will use default values:
 *
 * @returns The alert banner content for the current language, or `null` if not available or still loading
 *
 * @example
 * ```tsx
 * const alertBannerContent = useAlertBanner();
 *
 * if (alertBannerContent) {
 *   return (
 *     <Alert>
 *       <Heading>{alertBannerContent.title}</Heading>
 *       <p>{alertBannerContent.description}</p>
 *       {alertBannerContent.link && (
 *         <Link to={alertBannerContent.link.url}>
 *           {alertBannerContent.link.text}
 *         </Link>
 *       )}
 *     </Alert>
 *   );
 * }
 * ```
 */

export function useAlertBanner(): AlertBannerContent | null {
  const { i18n } = useTranslation();

  const { data } = useAuthenticatedQuery<AlertBannerResponse>({
    queryKey: [QUERY_KEYS.ALERT_BANNER],
    queryFn: fetchAlertBannerContent,
    refetchInterval: 1_200_000,
    staleTime: 10 * 60 * 1000,
  });

  if (!data) {
    return null;
  }

  const language = (i18n.language as 'nb' | 'nn' | 'en') || 'nb';
  return data[language] || data.nb || null;
}
