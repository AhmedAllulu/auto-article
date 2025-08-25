# SEO Notification Setup Guide

This guide explains how to set up automated SEO notifications for instant search engine indexing when new content is published.

## Features Implemented

### 1. Google Sitemap Ping
- Automatically pings Google when new articles are published
- Uses: `https://www.google.com/ping?sitemap=https://megaquantum.net/api/sitemap.xml`

### 2. Bing Sitemap Ping  
- Automatically pings Bing when new articles are published
- Uses: `https://www.bing.com/ping?sitemap=https://megaquantum.net/api/sitemap.xml`

### 3. IndexNow API (Bing + Yandex + Others)
- Instantly submits new URLs to IndexNow API
- Supports batch submissions up to 10,000 URLs
- Uses: `https://api.indexnow.org/indexnow`

## Environment Variables

Add these to your `.env` file in the `auto-article` folder:

```bash
# SEO Notification Settings
CANONICAL_BASE_URL=https://megaquantum.net
INDEXNOW_API_KEY=your-32-character-hex-key-here

# Enable/Disable Notifications (default: true)
ENABLE_GOOGLE_PING=true
ENABLE_BING_PING=true
ENABLE_INDEXNOW=true

# Performance Settings
SEO_PING_TIMEOUT=10000        # Request timeout in milliseconds (default: 10s)
MIN_PING_INTERVAL=60000       # Minimum time between pings in milliseconds (default: 1min)
```

## IndexNow Setup

### Step 1: Generate API Key
1. Visit https://www.indexnow.org/
2. Generate a random 32-character hexadecimal string
3. Example: `a1b2c3d4e5f6789012345678901234567890abcd`

### Step 2: Create Key File
1. Replace the content in `globeluxe-scribe/public/indexnow-key.txt` with just your key
2. Replace the content in `globeluxe-scribe/dist/indexnow-key.txt` with just your key
3. The file should contain ONLY the key, no comments

### Step 3: Set Environment Variable
```bash
INDEXNOW_API_KEY=a1b2c3d4e5f6789012345678901234567890abcd
```

### Step 4: Verify Key File Access
The key file must be accessible at: `https://megaquantum.net/[your-key].txt`

## How It Works

### Automatic Notifications
When a new article is published, the system automatically:

1. **Inserts article** into database
2. **Triggers SEO notifications** (async, non-blocking):
   - Pings Google sitemap
   - Pings Bing sitemap  
   - Submits URL to IndexNow API
3. **Logs results** for monitoring

### Rate Limiting
- Minimum 1-minute interval between pings to prevent spam
- Configurable via `MIN_PING_INTERVAL` environment variable

### Error Handling
- All notifications run asynchronously (don't block article creation)
- Failures are logged but don't affect article publishing
- Automatic retry logic with exponential backoff

## Monitoring

### Log Messages
The system logs all SEO notification attempts:

```
[generation] Starting SEO notifications for new article
[generation] Google sitemap ping successful
[generation] Bing sitemap ping successful  
[generation] IndexNow submission successful
[generation] SEO notifications completed
```

### Error Logs
Failed notifications are logged with details:

```
[generation] Google sitemap ping failed: timeout
[generation] IndexNow submission failed: invalid key
```

## Manual Testing

### Test Single Article Notification
```javascript
import { notifySearchEnginesNewArticle } from './src/services/seoNotificationService.js';

const testArticle = {
  slug: 'test-article',
  language_code: 'en',
  title: 'Test Article'
};

const result = await notifySearchEnginesNewArticle(testArticle);
console.log(result);
```

### Test Sitemap Ping
```javascript
import { notifySearchEnginesSitemapUpdate } from './src/services/seoNotificationService.js';

const result = await notifySearchEnginesSitemapUpdate();
console.log(result);
```

## Benefits

### Speed
- **Instant indexing** instead of waiting for crawlers
- **Parallel notifications** to all search engines
- **Non-blocking** - doesn't slow down article creation

### Coverage
- **Google** - Primary search engine
- **Bing** - Microsoft search + powers other engines
- **Yandex** - Russian search engine via IndexNow
- **Other engines** - Many support IndexNow protocol

### Reliability
- **Rate limiting** prevents being blocked
- **Error handling** ensures system stability
- **Logging** for monitoring and debugging

## Troubleshooting

### Common Issues

1. **IndexNow "Invalid Key" Error**
   - Verify key file is accessible at `https://megaquantum.net/[key].txt`
   - Ensure key file contains only the key (no comments)
   - Check `INDEXNOW_API_KEY` environment variable matches file

2. **Timeout Errors**
   - Increase `SEO_PING_TIMEOUT` value
   - Check network connectivity from server

3. **Rate Limited**
   - Notifications are automatically rate limited
   - Adjust `MIN_PING_INTERVAL` if needed

### Verification

1. **Check logs** for notification success/failure
2. **Monitor search console** for faster indexing
3. **Test manually** with the provided test functions

## Production Deployment

1. Set all environment variables
2. Upload IndexNow key file to static hosting
3. Verify key file accessibility
4. Monitor logs for successful notifications
5. Check search console for improved indexing speed

The system is now ready to automatically notify search engines whenever new content is published!
