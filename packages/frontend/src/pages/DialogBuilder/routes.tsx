import { lazy, Suspense } from 'react';
import { isDialogPreviewAvailable } from './availability.ts';

const DialogBuilderPage = lazy(() =>
  import('./DialogBuilderPage.tsx').then(({ DialogBuilderPage }) => ({ default: DialogBuilderPage })),
);

const DialogPreviewPage = lazy(() =>
  import('./DialogPreviewPage.tsx').then(({ DialogPreviewPage }) => ({ default: DialogPreviewPage })),
);

export const DialogBuilderRoute = () =>
  isDialogPreviewAvailable() ? (
    <Suspense fallback={null}>
      <DialogBuilderPage />
    </Suspense>
  ) : null;

export const DialogPreviewRoute = () =>
  isDialogPreviewAvailable() ? (
    <Suspense fallback={null}>
      <DialogPreviewPage />
    </Suspense>
  ) : null;
