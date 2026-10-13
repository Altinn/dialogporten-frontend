// Registers the SWC TypeScript hook for graphql-codegen (loaded with --require).
// Codegen resolves --require with require.resolve, and this subpath is import-only,
// so it can't be passed to --require directly.
import '@swc-node/register/esm-register';
