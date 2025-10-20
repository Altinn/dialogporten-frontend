import { describe, expect, it } from 'vitest';
import { PageRoutes } from '../../../pages/routes';
import { isRouteSelected } from './shared.tsx';

describe('useGlobalMenu', () => {
  describe('is route selected', () => {
    it('should return true when currentRoute exactly matches targetRoute', () => {
      expect(isRouteSelected(PageRoutes.inbox, PageRoutes.inbox)).toBe(true);
      expect(isRouteSelected(PageRoutes.drafts, PageRoutes.drafts)).toBe(true);
      expect(isRouteSelected(PageRoutes.profile, PageRoutes.profile)).toBe(true);
    });

    it('should return false when currentRoute does not match targetRoute', () => {
      expect(isRouteSelected(PageRoutes.inbox, PageRoutes.drafts)).toBe(false);
      expect(isRouteSelected(PageRoutes.sent, PageRoutes.archive)).toBe(false);
      expect(isRouteSelected(PageRoutes.profile, PageRoutes.inbox)).toBe(false);
    });

    it('should return true when fromView matches targetRoute', () => {
      expect(isRouteSelected(PageRoutes.profile, PageRoutes.inbox, PageRoutes.inbox)).toBe(true);
      expect(isRouteSelected('/some/other/route', PageRoutes.drafts, PageRoutes.drafts)).toBe(true);
    });

    it('should return false when fromView does not match targetRoute', () => {
      expect(isRouteSelected(PageRoutes.profile, PageRoutes.inbox, PageRoutes.drafts)).toBe(false);
      expect(isRouteSelected('/random', PageRoutes.sent, PageRoutes.archive)).toBe(false);
    });

    it('should ignore fromView when it is undefined', () => {
      expect(isRouteSelected(PageRoutes.drafts, PageRoutes.inbox, undefined)).toBe(false);
      expect(isRouteSelected(PageRoutes.inbox, PageRoutes.inbox, undefined)).toBe(true);
    });

    it('should return true for inbox when currentRoute is not a valid PageRoute and no fromView', () => {
      expect(isRouteSelected('/inbox/123', PageRoutes.inbox)).toBe(true);
      expect(isRouteSelected('/unknown/path', PageRoutes.inbox)).toBe(true);
    });

    it('should return false for non-inbox routes when currentRoute is invalid and no fromView', () => {
      expect(isRouteSelected('/inbox/123', PageRoutes.drafts)).toBe(false);
      expect(isRouteSelected('/unknown/path', PageRoutes.sent)).toBe(false);
      expect(isRouteSelected('/dialog/abc-def', PageRoutes.profile)).toBe(false);
    });

    it('should not apply inbox fallback when fromView is provided', () => {
      expect(isRouteSelected('/inbox/123', PageRoutes.inbox, PageRoutes.drafts)).toBe(false);
      expect(isRouteSelected('/unknown', PageRoutes.inbox, PageRoutes.sent)).toBe(false);
    });

    it('should not apply inbox fallback when currentRoute is a valid PageRoute', () => {
      expect(isRouteSelected(PageRoutes.drafts, PageRoutes.inbox)).toBe(false);
      expect(isRouteSelected(PageRoutes.profile, PageRoutes.inbox)).toBe(false);
      expect(isRouteSelected(PageRoutes.archive, PageRoutes.inbox)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isRouteSelected('', PageRoutes.inbox)).toBe(true); // Empty string is not a valid route, defaults to inbox
      expect(isRouteSelected('', PageRoutes.drafts)).toBe(false);
      expect(isRouteSelected(PageRoutes.inbox, PageRoutes.inbox, '')).toBe(true);
    });
  });
});
