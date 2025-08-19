# Article Generation System - Timing Behavior

## Overview

The article generation system has two distinct timing behaviors depending on how generation is triggered:

1. **Automated Generation** - Respects optimal timing windows
2. **Manual Generation** - Bypasses all time restrictions

## 🤖 Automated Generation (Time-Restricted)

### **When it runs:**
- **Cron Job**: Daily at 10:00 AM
- **Server Startup**: Conservative startup generation
- **Delayed Startup**: 2 minutes after server start

### **Timing Constraints:**
- **Optimal Hours**: 6 AM - 12 PM (6, 7, 8, 9, 10, 11)
- **Optimal Days**: Tuesday, Wednesday, Thursday (2, 3, 4)
- **Override**: Set `FORCE_GENERATION=true` to bypass timing

### **Behavior:**
```javascript
// Automated generation checks timing
if (!isOptimalTime() && process.env.FORCE_GENERATION !== 'true') {
  return { status: 'skipped', reason: 'not_optimal_time' };
}
```

### **Functions Used:**
- `runDailyGeneration()` - Respects timing constraints
- `runStartupGeneration()` - Conservative with timing checks

## 🚀 Manual Generation (Time-Unrestricted)

### **Available Endpoints:**
All manual Swagger endpoints bypass time restrictions:

#### **1. POST /generate/article**
- **Purpose**: Generate individual articles
- **Timing**: ✅ **Always available** - bypasses time restrictions
- **Quota**: Respects daily limit (2 English articles per category per day)
- **Usage**: Direct article generation through Swagger UI

#### **2. POST /generate/translate**
- **Purpose**: Translate existing English articles
- **Timing**: ✅ **Always available** - bypasses time restrictions
- **Quota**: No quota limits (translations are unlimited)
- **Usage**: Direct translation through Swagger UI

#### **3. POST /generation/run**
- **Purpose**: Manual daily generation trigger
- **Timing**: ✅ **Always available** - bypasses time restrictions
- **Quota**: Respects daily limits while ignoring timing
- **Usage**: Full generation process through Swagger UI

### **Behavior:**
```javascript
// Manual generation always runs
export async function runManualGeneration() {
  genLog('🚀 Manual generation started - BYPASSING ALL TIME RESTRICTIONS');
  // No timing checks - always proceeds
}
```

### **Functions Used:**
- `runManualGeneration()` - No timing constraints
- Direct generation functions - No timing checks

## 📊 Quota System (Always Enforced)

Both automated and manual generation respect the same quota limits:

### **English Articles:**
- **Limit**: 2 articles per category per day
- **Counting**: `SELECT COUNT(*) FROM articles_en WHERE category_id = $1 AND published_at::date = CURRENT_DATE`
- **Enforcement**: Atomic database transactions prevent violations

### **Translations:**
- **Limit**: Unlimited (6 translations per English article)
- **Languages**: de, fr, es, pt, ar, hi
- **Behavior**: Each English article automatically generates 6 translations

## 🕐 Timing Configuration

### **Optimal Generation Windows:**
```javascript
const OPTIMAL_GENERATION_HOURS = [6, 7, 8, 9, 10, 11]; // 6 AM - 12 PM
const OPTIMAL_DAYS = [2, 3, 4]; // Tuesday, Wednesday, Thursday
```

### **Current Time Checking:**
```javascript
function isOptimalTime() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const isOptimalHour = OPTIMAL_GENERATION_HOURS.includes(hour);
  const isOptimalDay = OPTIMAL_DAYS.includes(day);
  
  return isOptimalHour && isOptimalDay;
}
```

## 🔄 System Flow

### **Automated Daily Generation:**
```
Cron Job (10 AM) → runDailyGeneration() → Check timing → Skip if not optimal
                                       → Proceed if optimal → runManualGeneration()
```

### **Manual Swagger Generation:**
```
Swagger UI → POST /generate/article → Direct generation (no timing check)
          → POST /generate/translate → Direct translation (no timing check)
          → POST /generation/run → runManualGeneration() (no timing check)
```

## 📝 Logging Behavior

### **Automated Generation Logs:**
```
📅 Daily auto-generation started - RESPECTING TIME RESTRICTIONS
⏰ Daily generation SKIPPED due to timing constraints (if outside window)
✅ Daily generation proceeding - optimal time confirmed (if in window)
```

### **Manual Generation Logs:**
```
🚀 Manual generation started - BYPASSING ALL TIME RESTRICTIONS
🚀 Manual article generation started - BYPASSING TIME RESTRICTIONS
🚀 Manual translation started - BYPASSING TIME RESTRICTIONS
```

## 🎯 Use Cases

### **For Automated Operations:**
- **Production scheduling**: Respects optimal timing for server load
- **SEO optimization**: Publishes during peak engagement hours
- **Resource management**: Avoids generation during high-traffic periods

### **For Manual Operations:**
- **Testing and debugging**: Always available through Swagger UI
- **Emergency content**: Can generate articles outside normal hours
- **Development workflow**: No timing restrictions for developers
- **Content management**: Manual control when needed

## 🛡️ Safety Features

### **Process Locking:**
- Prevents concurrent generation processes
- Both automated and manual respect the same lock

### **Atomic Quota Checking:**
- Database transactions ensure quota accuracy
- Race condition prevention

### **Error Handling:**
- Comprehensive error logging and recovery
- Graceful degradation on failures

## 🔧 Configuration Override

### **Force Generation (Automated):**
```bash
# Override timing constraints for automated generation
export FORCE_GENERATION=true
```

### **Manual Generation:**
```bash
# Manual endpoints always work - no configuration needed
# Always bypasses timing regardless of environment variables
```

## 📋 Summary

| Generation Type | Timing Behavior | Quota Enforcement | Use Case |
|----------------|----------------|-------------------|----------|
| **Automated** | ⏰ Respects optimal windows | ✅ 2 English/category/day | Production scheduling |
| **Manual Swagger** | 🚀 Always available | ✅ 2 English/category/day | Testing, emergency, development |
| **Translations** | Same as trigger | ❌ Unlimited | Automatic with English articles |

The system provides the perfect balance between automated efficiency and manual flexibility, ensuring optimal resource usage while maintaining complete control when needed.
