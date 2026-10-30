/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set by the telemetry mock plugin (vite/telemetryMock.ts) on the dev server only */
  readonly VITE_TELEMETRY_MOCK_ENDPOINT?: string;
}
