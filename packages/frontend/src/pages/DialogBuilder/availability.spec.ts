import { afterEach, describe, expect, it, vi } from 'vitest';
import { isDialogPreviewAvailable } from './availability.ts';

const setHostname = (hostname: string) => vi.stubGlobal('location', { hostname });

describe('isDialogPreviewAvailable', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['af.at23.altinn.cloud', 'af.tt02.altinn.no', 'app.localhost', 'localhost'])('is on for %s', (hostname) => {
    setHostname(hostname);
    expect(isDialogPreviewAvailable()).toBe(true);
  });

  it.each(['af.altinn.no', 'altinn.no', 'www.altinn.no', 'af.yt01.altinn.cloud', 'unknown.example.com', ''])(
    'is off for %s',
    (hostname) => {
      setHostname(hostname);
      expect(isDialogPreviewAvailable()).toBe(false);
    },
  );

  it.each([
    'af.tt02.altinn.no.evil.example',
    'evil-af.tt02.altinn.no',
    'x.af.tt02.altinn.no',
    'af.at23.altinn.cloud.evil.example',
    'localhost.evil.example',
    'tt.altinn.no',
    'at.altinn.cloud',
    'AF.ALTINN.NO',
  ])('does not accept the look-alike %s', (hostname) => {
    setHostname(hostname);
    expect(isDialogPreviewAvailable()).toBe(false);
  });
});
