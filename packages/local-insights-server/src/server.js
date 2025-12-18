import cors from 'cors';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins (for local development)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Application Insights telemetry ingestion endpoint
app.post('/v2/track', (req, res) => {
  console.log('\n=== Application Insights Telemetry ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('=====================================\n');

  // Respond with success (mimic Application Insights response)
  res.status(200).json({
    itemsReceived: Array.isArray(req.body) ? req.body.length : 1,
    itemsAccepted: Array.isArray(req.body) ? req.body.length : 1,
    errors: [],
  });
});

/*
          /*"data": {
      "baseType": "ExceptionData",
      "baseData": {
        "ver": 2,
        "exceptions": [
          {
            "typeName": "Error",
            "message": "Test error",
            "hasFullStack": true,
            "stack": "Error: Test error\n    at http://localhost:5174/src/App.tsx?t=1766048264473:59:19",
            "parsedStack": [
              {
                "level": 0,
                "method": "<no_method>",
                "assembly": "at http://localhost:5174/src/App.tsx?t=1766048264473:59:19",
                "fileName": "http://localhost:5174/src/App.tsx?t=1766048264473",
                "line": 59
              }
            ]
          }
        ],
        "properties": {
          "message": "Uncaught Error: Test error",
          "filename": "http://localhost:5174/src/App.tsx?t=1766048264473",
          "lineno": "59",
          "colno": "19",
          "typeName": "Error"
        }
      }
    }
  }*/

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'local-insights-server',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Local Application Insights Server',
    version: '1.0.0',
    endpoints: {
      telemetry: 'POST /v2/track',
      health: 'GET /health',
    },
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Local Application Insights Server running on port ${PORT}`);
  console.log(`📊 Telemetry endpoint: http://localhost:${PORT}/v2/track`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`📝 All telemetry data will be logged to console`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});
