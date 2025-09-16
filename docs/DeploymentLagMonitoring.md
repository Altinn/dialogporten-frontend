# Deployment Lag Monitoring

This document describes the deployment lag monitoring system that helps track when production deployments are falling behind staging deployments.

## Overview

The deployment lag monitoring system automatically checks the difference between staging and production deployments and sends Slack notifications when production is significantly behind staging. This helps ensure timely production deployments and maintains deployment cadence.

## How It Works

### Monitoring Schedule
- **Automatic**: Runs daily at 9:00 AM UTC (11:00 AM CET)
- **Manual**: Can be triggered manually via GitHub Actions workflow dispatch

### Detection Logic

The system compares the latest deployed versions in staging and production environments and calculates:

1. **Release Count Difference**: Number of releases between production and staging versions
2. **Time Since Last Production Deploy**: Days since the last production deployment
3. **Notification Threshold**: Determines if a notification should be sent

### Notification Triggers

A Slack notification is sent when any of these conditions are met:

- **Medium Priority**: More than 2 days since last production deployment AND more than 1 release behind
- **High Priority**: More than 7 days since last production deployment (regardless of release count)
- **Critical Priority**: More than 5 releases behind (regardless of time)

### Severity Levels

| Severity | Conditions | Color | Description |
|----------|------------|-------|-------------|
| 🟢 LOW | < 7 days AND < 5 releases | Green | Minor lag, within acceptable limits |
| 🟡 MEDIUM | 7-14 days OR 5-10 releases | Orange | Moderate lag, attention recommended |
| 🔴 HIGH | > 14 days OR > 10 releases | Red | Significant lag, immediate attention required |

## Slack Notification Details

### Information Included
- Current staging and production versions
- Number of releases production is behind
- Days since last production deployment
- List of recent commits not yet in production (up to 10)
- Authors with pending changes (for tagging/mentions)
- Quick action buttons for viewing differences and deploying

### Action Buttons
- **View Differences**: Links to GitHub compare view between production and staging versions
- **Deploy to Production**: Links to the production deployment workflow

## Configuration

### Required Secrets
- `SLACK_BOT_TOKEN`: Bot token for posting to Slack
- `SLACK_CHANNEL_ID_FOR_RELEASES`: Channel ID where notifications should be posted

### Environment Variables
The system reads deployment versions from GitHub environment variables:
- `LATEST_DEPLOYED_APPS_VERSION` (staging environment)
- `LATEST_DEPLOYED_APPS_VERSION` (prod environment)

## Workflows

### Main Workflow: `ci-cd-deployment-lag-monitor.yml`
- **Trigger**: Daily schedule + manual dispatch
- **Jobs**:
  1. `compare-deployments`: Compares versions and calculates lag
  2. `get-commit-details`: Retrieves commit information between versions
  3. `send-slack-notification`: Sends notification if thresholds are met

### Supporting Workflow: `workflow-send-deployment-lag-slack-message.yml`
- **Type**: Reusable workflow
- **Purpose**: Formats and sends Slack messages
- **Features**: Dynamic severity calculation, commit formatting, author mentions

## Files Structure

```
.github/
├── workflows/
│   ├── ci-cd-deployment-lag-monitor.yml          # Main monitoring workflow
│   └── workflow-send-deployment-lag-slack-message.yml  # Slack sender workflow
└── slack-templates/
    └── deployment-lag-notification.json          # Slack message template
```

## Customization

### Adjusting Thresholds
Edit the notification logic in `ci-cd-deployment-lag-monitor.yml`:

```yaml
# Current thresholds
if ([ "$days_since_prod_deploy" -gt 2 ] && [ "$release_count_diff" -gt 1 ]) || \
   [ "$days_since_prod_deploy" -gt 7 ] || \
   [ "$release_count_diff" -gt 5 ]; then
  should_notify="true"
fi
```

### Modifying Schedule
Change the cron expression in the main workflow:

```yaml
schedule:
  # Current: Daily at 9 AM UTC
  - cron: '0 9 * * *'
  
  # Example: Twice daily at 9 AM and 5 PM UTC
  - cron: '0 9,17 * * *'
```

### Customizing Slack Message
Modify the template in `.github/slack-templates/deployment-lag-notification.json` to change:
- Message format and styling
- Information displayed
- Action buttons
- Color scheme

## Troubleshooting

### Common Issues

1. **"Unknown" versions detected**
   - Verify that deployment workflows are properly storing version information
   - Check that `LATEST_DEPLOYED_APPS_VERSION` variables exist in both environments

2. **No notifications sent despite lag**
   - Verify notification thresholds are met
   - Check workflow logs for calculation details
   - Ensure Slack secrets are properly configured

3. **Slack message formatting issues**
   - Validate JSON syntax in the Slack template
   - Check that all environment variables are properly set
   - Test with workflow dispatch to debug

### Debugging

To debug the monitoring system:

1. **Manual Trigger**: Use workflow dispatch to run immediately
2. **Check Logs**: Review workflow logs for calculation details
3. **Verify Versions**: Confirm environment variables contain expected values
4. **Test Slack Integration**: Ensure bot token and channel ID are correct

## Security Considerations

- Uses `step-security/harden-runner` for enhanced security
- Follows least-privilege principle with specific GitHub token permissions
- Validates input data before processing
- Uses pinned action versions for supply chain security

## Future Enhancements

Potential improvements to consider:

1. **Multiple Environment Support**: Extend to monitor other environment pairs
2. **Webhook Integration**: Support for other notification channels (Teams, Discord, etc.)
3. **Historical Tracking**: Store lag metrics for trend analysis
4. **Auto-deployment**: Optional automatic deployment when conditions are met
5. **Custom Rules**: Per-project or per-team notification rules
