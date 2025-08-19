# Optimized Article Generation & Translation System

## Overview

The system has been completely redesigned to address your requirements:

- ✅ **Optimal Timing**: Generates articles at 10 AM sharp (Tuesday-Thursday) for maximum SEO impact
- ✅ **2 Articles per Category per Day**: Ensures balanced content across all categories
- ✅ **Sequential Translation**: Waits for all translations to complete before moving to next category
- ✅ **Error Handling**: Stops process on errors to prevent token waste
- ✅ **Comprehensive Logging**: Detailed logs with automatic 10-day cleanup

## Key Improvements

### 🕐 Optimal Scheduling
- **Frequency**: Once daily at the perfect time
- **Best Time**: 10 AM sharp (optimal SEO and engagement hour)
- **Schedule**: `0 10 * * *` (10 AM every single day)
- **Clean System**: Removed all unused scheduling complexity

### 📊 Category-Based Generation
- **Target**: 2 articles per category per day
- **Process**: Sequential category processing (complete all translations before next category)
- **Priority**: Uses existing category priority weights
- **Limit**: Maximum 3 categories per run to prevent overload

### 🌍 Translation Optimization
- **Strategy**: Generate 2 articles for category → translate all → move to next category
- **Languages**: Supports all configured languages (en, de, fr, es, pt, ar, hi)
- **Priority**: Uses language market priorities for optimal targeting
- **Wait Logic**: Ensures all translations complete before proceeding

### 🚨 Error Handling
- **Stop on Error**: Process stops immediately on critical errors
- **Token Protection**: Prevents continued processing when errors occur
- **Detailed Logging**: All errors logged with context and stack traces
- **Recovery**: System can resume on next scheduled run

### 📝 Enhanced Logging
- **Structured Logs**: JSON format with timestamps and metadata
- **File Output**: Daily log files in `/logs` directory
- **Automatic Cleanup**: Removes logs older than 10 days
- **Error Separation**: Separate error log files
- **Real-time**: Both console and file output

## Configuration

### Environment Variables

```bash
# Essential Generation Settings (cleaned up!)
ENABLE_GENERATION=true             # Enable auto-generation
ARTICLES_PER_CATEGORY_PER_DAY=2    # Articles per category per day
MAX_CATEGORIES_PER_RUN=3           # Categories processed per run

# Error Handling & Logging
STOP_ON_ERROR=true                 # Stop process on errors
LOG_RETENTION_DAYS=10              # Days to keep logs
DEBUG_GENERATION=true              # Enable detailed logging
```

### Config File Updates

The `src/config.js` file now includes:

```javascript
generation: {
  enabled: true,                         // Enable auto-generation
  articlesPerCategoryPerDay: 2,          // Category quota
  maxCategoriesPerRun: 3,                // Prevent overload
  stopOnError: true,                     // Token protection
  logRetentionDays: 10,                  // Log cleanup
  // ... existing settings
}
```

## API Endpoints

### Generation Health Check
```http
GET /generation/health
```
Returns system health status and current metrics.

### Generation Status
```http
GET /generation/status
```
Returns detailed status including:
- Categories needing articles
- Today's progress by category
- Optimal timing information

### Manual Generation
```http
POST /generation/run
```
Manually triggers the optimized generation process.

### View Logs
```http
GET /generation/logs?lines=100
```
Returns recent generation logs for monitoring.

## Process Flow

### 1. Daily Generation Cycle

```
6 AM - 12 PM, Tuesday-Thursday:
├── Check if optimal time ✓
├── Get categories needing articles ✓
├── Process categories sequentially:
│   ├── Generate 2 articles for category
│   ├── Translate all articles to target languages
│   ├── Wait for all translations to complete
│   └── Move to next category
├── Log all activities with details ✓
└── Clean up old logs (daily at 2 AM) ✓
```

### 2. Error Handling Flow

```
Generation Process:
├── Article Generation
│   ├── Success → Continue to translations
│   └── Error → Log + Stop process
├── Translation Process
│   ├── Success → Continue to next language
│   └── Error → Log + Skip language (continue process)
└── Critical Errors → Stop entire process
```

### 3. Logging Structure

```
logs/
├── generation-2024-01-15.log    # Daily generation logs
├── errors-2024-01-15.log        # Daily error logs
└── [automatically cleaned after 10 days]
```

## Monitoring

### Log Format
```json
{
  "component": "generation",
  "timestamp": "2024-01-15T08:30:00.000Z",
  "message": "Article completed",
  "category": "technology",
  "type": "master",
  "status": "completed",
  "slug": "ai-revolution-2024",
  "wordCount": 750
}
```

### Key Metrics to Monitor
- Articles generated per category per day
- Translation completion rates
- Error frequency and types
- Token usage efficiency
- Optimal timing adherence

## Usage Examples

### Check System Status
```bash
curl http://localhost:3000/generation/status
```

### View Recent Logs
```bash
curl http://localhost:3000/generation/logs?lines=50
```

### Manually Trigger Generation
```bash
curl -X POST http://localhost:3000/generation/run
```

### Check Health
```bash
curl http://localhost:3000/generation/health
```

## Benefits

### 🎯 SEO Optimization
- **Timing**: Publishes during peak engagement hours
- **Consistency**: 2 articles per category ensures balanced content
- **Quality**: Sequential processing ensures complete translations

### 💰 Cost Efficiency
- **Error Prevention**: Stops on errors to prevent token waste
- **Smart Scheduling**: Only runs during optimal hours
- **Resource Management**: Limits concurrent processing

### 📈 Scalability
- **Category Management**: Automatically scales with category count
- **Language Support**: Handles all configured languages
- **Load Balancing**: Sequential processing prevents overload

### 🔍 Visibility
- **Detailed Logs**: Complete audit trail of all activities
- **Real-time Monitoring**: API endpoints for status checking
- **Error Tracking**: Comprehensive error logging and recovery

## Migration

The new system is backward compatible with existing data and configuration. Simply restart the service to begin using the optimized generation system.

### Quick Start
1. Update environment variables if needed
2. Restart the service: `pm2 restart auto-article`
3. Monitor logs: `pm2 logs auto-article`
4. Check status: `curl http://localhost:3000/generation/status`

## Troubleshooting

### Common Issues

**Generation not running:**
- Check if current time is optimal: `GET /generation/status`
- Verify `ENABLE_GENERATION=true` in environment
- Check logs for errors: `GET /generation/logs`

**Too many/few articles:**
- Adjust `ARTICLES_PER_CATEGORY_PER_DAY`
- Check category priorities in config
- Monitor per-category progress

**Translation issues:**
- Check language configuration
- Verify translation API keys
- Review error logs for specific failures

**High token usage:**
- Verify error handling is working
- Check for unnecessary retries
- Monitor error rates and fix issues

## Support

- **Logs Location**: `/var/www/html/auto-article/logs/`
- **Status Endpoint**: `/generation/status`
- **Health Check**: `/generation/health`
- **Manual Trigger**: `POST /generation/run`
