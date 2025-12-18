# Local Application Insights Server

A local development server that mimics Microsoft Application Insights telemetry ingestion for local development and testing.

## Overview

This server allows you to run Application Insights locally during development, capturing and logging all telemetry data that would normally be sent to Azure Application Insights. This is useful for:

- Testing analytics implementation without sending data to production
- Debugging telemetry data during development
- Working offline or in environments without Azure access
- Understanding what data is being collected

## Features

- **Telemetry Ingestion**: Receives Application Insights telemetry data on `/v2/track`
- **Console Logging**: All received telemetry is logged to the console in a readable format
- **Health Check**: Health endpoint at `/health` for monitoring
- **CORS Enabled**: Allows cross-origin requests for local development
- **Hot Reload**: Supports Node.js `--watch` flag for development

## Quick Start

### 1. Start the Local Insights Server

From the project root:

```bash
# Start in development mode (with hot reload)
pnpm insights:dev

# Or start in production mode
pnpm insights:start
```

The server will start on `http://localhost:3001` by default.

### 2. Run the Frontend in Development Mode

The frontend is already configured to use the local server when running in development mode:

```bash
# In another terminal
pnpm --filter frontend dev
```

### 3. View Telemetry Data

All Application Insights telemetry will be logged to the console where the local insights server is running. You'll see:

- Page view tracking
- User action events
- Dialog-specific events
- Custom properties and metadata

## Configuration

The server can be configured using environment variables:

- `PORT`: Server port (default: 3001)

## Endpoints

### POST /v2/track
Receives Application Insights telemetry data. Mimics the Azure Application Insights ingestion endpoint.

**Request**: JSON array of telemetry items
**Response**: Application Insights-compatible response with item counts

### GET /health
Health check endpoint.

**Response**: 
```json
{
  "status": "healthy",
  "timestamp": "2025-12-18T07:09:47.652Z",
  "service": "local-insights-server"
}
```

### GET /
Root endpoint with server information and available endpoints.

## Frontend Integration

The frontend automatically detects development mode and:

1. Uses a local instrumentation key: `local-dev-key-12345678-1234-1234-1234-123456789012`
2. Points to the local server endpoint: `http://localhost:3001/v2/track`
3. Enables Application Insights (normally disabled in development)

No additional configuration is needed - just start both servers and the integration works automatically.

## Example Telemetry Output

When the frontend sends telemetry, you'll see output like this in the server console:

```
=== Application Insights Telemetry ===
Timestamp: 2025-12-18T07:10:06.088Z
Headers: {
  "host": "localhost:3001",
  "user-agent": "Mozilla/5.0...",
  "content-type": "application/json"
}
Body: [
  {
    "name": "Microsoft.ApplicationInsights.Event",
    "time": "2025-12-18T07:09:47.652Z",
    "iKey": "local-dev-key-12345678-1234-1234-1234-123456789012",
    "tags": {
      "ai.cloud.role": "frontend"
    },
    "data": {
      "baseType": "EventData",
      "baseData": {
        "name": "User.Dialog.Open",
        "properties": {
          "dialog.id": "12345",
          "page.current": "Inbox"
        }
      }
    }
  }
]
=====================================
```

## Development

The server is built with:
- **Express.js**: Web framework
- **CORS**: Cross-origin resource sharing
- **Node.js 22+**: Runtime environment

To modify the server:

1. Edit `src/server.js`
2. The server will automatically reload if started with `pnpm insights:dev`

## Troubleshooting

### Server won't start
- Check if port 3001 is already in use
- Ensure Node.js 22+ is installed
- Run `pnpm install` to ensure dependencies are installed

### No telemetry data appearing
- Ensure the frontend is running in development mode
- Check browser console for any CORS or network errors
- Verify the server is running on `http://localhost:3001`

### Frontend not sending data
- Check that `import.meta.env.DEV` is true in the browser
- Verify the analytics configuration in `packages/frontend/src/config.ts`
- Look for Application Insights initialization messages in browser console
