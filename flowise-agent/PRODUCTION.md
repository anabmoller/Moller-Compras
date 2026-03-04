# Production Hardening — Head of Product AI

## Deployment Options

### Option A: Railway / Render (Easiest)
- Push docker-compose to Railway
- Set env vars in dashboard
- Auto-SSL, auto-scaling
- Cost: ~$5-20/mo

### Option B: VPS (Hetzner, DigitalOcean)
- Run docker compose on a VPS
- Put behind Caddy or nginx for SSL
- More control, fixed cost ~$5-10/mo

### Option C: Cloud Run / ECS
- Containerized, auto-scaling
- Best for high-volume production
- More setup, pay-per-use

---

## Security Checklist

- [ ] **FLOWISE_PASSWORD**: Strong, unique password (not "admin")
- [ ] **Chatflow API Key**: Always set one per chatflow — never expose without auth
- [ ] **HTTPS**: Always use HTTPS in production (Caddy auto-SSL is easiest)
- [ ] **Anthropic Key**: Stored in Flowise credentials, never in env files or repos
- [ ] **Docker**: Pin image version in production (`flowiseai/flowise:2.x.x` not `latest`)
- [ ] **Network**: Flowise should not be on public internet without auth

---

## Rate Limiting

Already configured in docker-compose.yml:

```yaml
RATE_LIMIT_WINDOW_MS=60000    # 1 minute window
RATE_LIMIT_MAX_REQUESTS=30    # 30 requests per minute
```

For Zapier usage, 30/min is generous. Adjust down if needed.

---

## Request Size Limits

Transcripts can be long. Flowise uses express with default limits.

For very long transcripts (> 1 hour calls), consider:
1. Pre-processing in Zapier: truncate to first 15,000 characters
2. Or add nginx in front with `client_max_body_size 5m`

Claude's context window handles long transcripts well, but token costs scale linearly.

---

## Timeouts

- Flowise default timeout: 60 seconds (sufficient for most transcripts)
- Claude processing: typically 5-15 seconds for transcript analysis
- Zapier webhook timeout: 30 seconds (may need premium Zapier for longer waits)

If you hit Zapier's 30s timeout:
1. Use Zapier's "Webhooks by Zapier" with async mode
2. Or switch to a queue: Zapier → Supabase queue → Flowise polls

---

## Retry Strategy

### Zapier Side
- Enable "Auto-replay" in Zapier for failed zaps
- Set retry count: 3, with exponential backoff

### Application Side
- Flowise's Structured Output Parser has `autoFix: true`
- If Claude returns malformed JSON, it automatically asks Claude to fix it (1 retry)
- If still malformed after fix, Flowise returns an error JSON

---

## Logging

### Flowise Logs
```bash
# Follow logs
docker compose logs -f flowise

# Set log level in docker-compose.yml
LOG_LEVEL=debug  # Options: error, warn, info, debug
```

### Structured Logging for Analytics
For tracking insights volume and quality:
1. Zapier logs all runs (visible in Zap History)
2. Add a Notion "Log" database for every API call
3. Track: timestamp, customer, success/error, token count

### Monitoring
- Uptime: UptimeRobot (free) pinging `http://your-server:3000`
- Cost: Anthropic usage dashboard at `console.anthropic.com`
- Errors: Zapier error notifications → Slack/email

---

## Cost Estimation

| Component | Cost/call | Monthly (50 calls) |
|-----------|-----------|---------------------|
| Claude Sonnet (input) | ~$0.003/1K tokens | ~$3-5 |
| Claude Sonnet (output) | ~$0.015/1K tokens | ~$2-3 |
| Flowise (self-hosted) | $0 | VPS: $5-10 |
| Zapier | $0 (free tier: 100 tasks/mo) | $0-20 |
| **Total** | | **~$10-35/mo** |

Upgrade to Claude Opus for deeper analysis at ~3x cost.

---

## Nginx Reverse Proxy (Production)

```nginx
server {
    listen 443 ssl;
    server_name product-ai.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/product-ai.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/product-ai.yourdomain.com/privkey.pem;

    client_max_body_size 5m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

Or use Caddy (simpler — auto-SSL):
```
product-ai.yourdomain.com {
    reverse_proxy localhost:3000
}
```

---

## Backup

```bash
# Backup Flowise data (chatflows, credentials, API keys)
docker compose exec flowise tar czf /tmp/flowise-backup.tar.gz /root/.flowise
docker compose cp flowise:/tmp/flowise-backup.tar.gz ./backups/

# Restore
docker compose cp ./backups/flowise-backup.tar.gz flowise:/tmp/
docker compose exec flowise tar xzf /tmp/flowise-backup.tar.gz -C /
```

Schedule weekly backups via cron.
