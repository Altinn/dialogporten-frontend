export const DIALOG_BUILDER_ROUTE = '/dialog-builder';
export const DIALOG_PREVIEW_ROUTE = '/inbox/preview';
export const DIALOG_PREVIEW_QUERY_PARAM = 'dialog';

const AVAILABLE_HOSTNAMES = ['localhost', 'app.localhost', 'af.at23.altinn.cloud', 'af.tt02.altinn.no'];

export const isDialogPreviewAvailable = (): boolean => AVAILABLE_HOSTNAMES.includes(location.hostname);
