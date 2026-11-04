/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set by the telemetry mock plugin (vite/telemetryMock.ts) on the dev server only */
  readonly TELEMETRY_MOCK_ENDPOINT?: string;
}
