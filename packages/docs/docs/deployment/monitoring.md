# Monitoring

## Overview Dashboard

Arbeidsflate's monitoring dashboards are hosted in Grafana and provide comprehensive insights into system performance, health metrics, and operational status. The dashboards are accessible at [Grafana Altinn Cloud](https://grafana.altinn.cloud/dashboards/f/ce99lm57b1gcgd/).

### Main Metrics
- **System Health**: Availability, request stats, latency
- **Container Apps**: CPU, memory, requests (GraphQL, app gateway)
- **Infrastructure**: PostgreSQL, Redis

### Usage
- Select environment (test, yt01, staging, prod)
- Default view: Last 24 hours
- Start with system health, then drill down as needed

## Telemetry Collection

Arbeidsflate uses OpenTelemetry for collecting and routing telemetry data:

### OpenTelemetry Integration
- Utilizes Azure Container Apps' managed OpenTelemetry agent
- Automatically collects traces and logs from container apps
- Routes telemetry data to Azure Application Insights
- Configured through Container Apps Environment settings

### Data Flow
1. Applications emit OpenTelemetry-compliant telemetry
2. Container Apps OpenTelemetry agent collects the data
3. Data is sent to Azure Application Insights
4. Grafana visualizes the data through Azure Monitor data source

### Implementation Details
- Traces and logs are configured to use Application Insights as destination
- Uses standard OpenTelemetry instrumentation for .NET
- Automatic correlation of distributed traces across services
- Custom metrics and traces can be added through the OpenTelemetry SDK

## Redis Dashboard

Detailed monitoring of Redis cache performance and health:

### Key Metrics
- **Memory Usage**: Total and percentage used memory
- **Operations**: Commands executed, cache hits/misses
- **Keys**: Total keys, expired vs evicted keys
- **Connections**: Connected clients, server load
- **Performance**: Cache hit ratio, command processing rate

### Usage
- Select subscription, environment, and Redis resource
- Default view: Last 24 hours
- Refresh interval: 30 seconds

## Container Apps Dashboard

Monitoring of Azure Container Apps deployments and performance:

### Key Metrics
- **System Logs**: Container app system events and logs
- **Application Logs**: Service-specific application traces
- **Deployment Status**: Revision tracking and deployment logs

### Usage
- Filter by service name and revision
- View logs by deployment or system events
- Track service-specific metrics and traces

## Application Gateway Dashboard

Comprehensive monitoring of Azure Application Gateway performance and WAF metrics:

### Key Metrics
- **System Health**
  - Compute Units and Capacity Units
  - Healthy Host Count
  - Current Connections
  - TLS Protocol Distribution

- **Performance**
  - Request Throughput
  - Network Transfer (Bytes Sent/Received)
  - Response Times (Total, Backend Connect, First/Last Byte)
  - New Connections per Second

- **WAF Security**
  - WAF Log Analysis
  - Blocked Request Statistics
  - Rule Violation Distribution
  - Detailed Block List with Client IPs

### Usage
- Select subscription and environment (test, yt01, staging, prod)
- Monitor real-time metrics with auto-refresh (1 minute default)
- View historical data with customizable time ranges
- Analyze WAF security events and blocked requests

### Dashboard Features
- Real-time performance monitoring
- Security threat visualization
- Network traffic analysis
- Response time breakdown
- Resource utilization tracking

### Access
The Application Gateway dashboard is available in the same Grafana instance at [Grafana Altinn Cloud](https://grafana.altinn.cloud/dashboards/f/ce99lm57b1gcgd/).

