# Deployment Lag Monitoring

Automatically monitors when production deployments fall behind staging and sends Slack notifications.

## How It Works

**Schedule**: Runs daily at 9:00 AM UTC (11:00 AM CET)

**Notification Logic**:
- If production is ≥ 3 days behind **AND** there are releases waiting → Notify
- If production is ≥ 3 releases behind (regardless of time) → Notify

**Severity Levels**:
- **FYI**: ≤ 3 days AND ≤ 3 releases behind
- **Worth noting**: > 3 days OR > 3 releases behind
- **Attention needed**: > 7 days OR > 5 releases behind

## Configuration

**Required Secrets**:
- `SLACK_BOT_TOKEN`: Bot token for posting to Slack
- `SLACK_CHANNEL_ID_FOR_RELEASES`: Channel ID for notifications

**Configurable Thresholds** (in `ci-cd-deployment-lag-monitor.yml`):
```yaml
env:
  DEFAULT_DAYS_THRESHOLD: 3        # Days after which to notify (if there are releases)
  DEFAULT_RELEASES_THRESHOLD: 3    # Releases behind which always triggers notification
```

## Slack Notification

**Includes**:
- Current staging and production versions
- Number of releases behind and days since last deployment
- Recent commits not yet in production
- Authors with pending changes
- Action buttons: "View Differences" and "Deploy to Production"

## Files

```
.github/
├── workflows/
│   ├── ci-cd-deployment-lag-monitor.yml          # Main monitoring workflow
│   └── workflow-send-deployment-lag-slack-message.yml  # Slack sender workflow
└── slack-templates/
    └── deployment-lag-notification.json          # Slack message template
```

## Customization

**Adjust Thresholds**: Change `DEFAULT_DAYS_THRESHOLD` and `DEFAULT_RELEASES_THRESHOLD` values

**Change Schedule**: Modify the cron expression:
```yaml
schedule:
  - cron: '0 9 * * *'  # Daily at 9 AM UTC
```
