/// <reference types="vite/client" />

declare const __APP_VERSION__: string | undefined;

interface ImportMetaEnv {
  /** Set by the telemetry mock plugin (vite/telemetryMock.ts) on the dev server only */
  readonly TELEMETRY_MOCK_ENDPOINT?: string;
}
