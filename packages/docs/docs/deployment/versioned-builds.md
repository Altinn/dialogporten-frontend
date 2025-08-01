# Versioned Builds for Source Map Mapping

This document explains the versioned build system implemented to solve source map mapping issues in Application Insights.

## Problem

Previously, Vite generated files with hash-based names (e.g., `index.a1b2c3d4.js`), which caused issues when mapping source maps in Application Insights. The deployed files had different hash names than the source maps uploaded to blob storage.

## Solution

The build system now uses version-based file naming instead of hash-based naming. Files are named with the format: `[name].[version].[ext]` (e.g., `index.1.49.0-a1b2c3d.js`).

## How it works

### Environment Variable
The `BUILD_VERSION` environment variable controls the version used in file names:

- **CI/CD**: Set to `version-gitSha` (e.g., `1.49.0-a1b2c3d`)
- **Local development**: Uses Vite's built-in `[hash]` placeholder for cache busting

### File Naming Examples

Before:
```
assets/index.a1b2c3d4.js
assets/index.a1b2c3d4.js.map
assets/vendor.e5f6g7h8.js
assets/vendor.e5f6g7h8.js.map
```

After (CI/CD with BUILD_VERSION set):
```
assets/index.1.49.0-a1b2c3d.js
assets/index.1.49.0-a1b2c3d.js.map
assets/vendor.1.49.0-a1b2c3d.js
assets/vendor.1.49.0-a1b2c3d.js.map
```

After (Local development without BUILD_VERSION):
```
assets/index.a1b2c3d4.js
assets/index.a1b2c3d4.js.map
assets/vendor.e5f6g7h8.js
assets/vendor.e5f6g7h8.js.map
```

## Usage

### Local Development

For all development builds:
```bash
pnpm build
```

The build will use Vite's built-in hash-based naming for cache busting during development.

### CI/CD

The version is automatically set in CI/CD workflows:
- `BUILD_VERSION` is set to `{package-version}-{git-short-sha}`
- Source maps are uploaded to blob storage with the same version prefix
- Application Insights can now correctly map source maps to deployed files

## Configuration

The versioning is configured in `vite.config.ts`:

```typescript
const buildVersion = process.env.BUILD_VERSION || pkg.version;

// Use version-based naming instead of hash-based naming
entryFileNames: `assets/[name].${buildVersion}.js`,
chunkFileNames: `assets/[name].${buildVersion}.js`,
assetFileNames: (assetInfo) => {
  // ... version-based naming for all assets
}
```

## Benefits

1. **Consistent file names**: Deployed files and source maps have matching names
2. **Better debugging**: Application Insights can correctly map stack traces to source code
3. **Version tracking**: File names include version information for easier debugging
4. **Smart fallback**: Uses Vite's built-in hash system for local development 