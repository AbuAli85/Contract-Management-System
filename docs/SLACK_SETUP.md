# 🚨 Slack Notifications Setup

## Quick Setup

### 1. Create Slack Webhook
1. Go to your Slack workspace
2. Create a new app or use existing one
3. Enable "Incoming Webhooks"
4. Create a webhook for your channel (e.g., `#rbac-alerts`)
5. Copy the webhook URL

### 2. Add GitHub Secret
1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add new secret: `SLACK_WEBHOOK_URL`
3. Paste your Slack webhook URL

### 3. Install Dependencies
```bash
npm install
```

## What You'll Get

### 🟢 Green Status (All Good)
```
🟢 RBAC check (main): Drift P0: 0
- Guard Lint: ✅ PASS
- Tests: ✅ PASS
```

### 🔴 Red Status (Issues Detected)
```
🔴 RBAC check (main): Drift P0: ⚠️ check list
- Guard Lint: ❌ FAIL
- Tests: ❌ FAIL
```

## Test It

### Manual Test
```bash
SLACK_WEBHOOK_URL=your_webhook_url node scripts/rbac_slack_notify.ts
```

### Via GitHub Actions
- The workflow runs weekly on Mondays at 9 AM UTC
- Or trigger manually via "workflow_dispatch"
- Slack notifications are sent regardless of success/failure

## Customization

### Change Channel
- Update the webhook URL in GitHub secrets
- Or create multiple webhooks for different channels

### Modify Message Format
- Edit `scripts/rbac_slack_notify.ts`
- Change emojis, text, or add more details

### Add More Checks
- Extend the script to include other metrics
- Add database health checks
- Include performance metrics

## Troubleshooting

### "SLACK_WEBHOOK_URL missing"
- Check GitHub secrets are set correctly
- Verify the secret name matches exactly

### No notifications
- Check Slack app permissions
- Verify webhook URL is valid
- Check GitHub Actions logs for errors

### Test locally
```bash
# Set env var and test
export SLACK_WEBHOOK_URL=your_url
node scripts/rbac_slack_notify.ts
```

## Next Steps

Once this is working, consider adding:
1. **Webhook signatures** for security
2. **Upload hardening** for file uploads
3. **Rate limiting** for notifications
4. **Different channels** for different severity levels
